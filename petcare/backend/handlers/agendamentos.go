package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/lambda"
	"github.com/aws/aws-sdk-go-v2/service/sns"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"

	"petcare-backend/models"
)

func (h *Handler) ListAgendamentos(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{}
	if status := c.Query("status"); status != "" {
		filter["status"] = status
	}

	opts := options.Find().SetSort(bson.D{{Key: "data_hora", Value: 1}})
	cursor, err := h.agendamentos.Find(ctx, filter, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer cursor.Close(ctx)

	var agendamentos []models.Agendamento
	if err = cursor.All(ctx, &agendamentos); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if agendamentos == nil {
		agendamentos = []models.Agendamento{}
	}
	c.JSON(http.StatusOK, agendamentos)
}

func (h *Handler) CreateAgendamento(c *gin.Context) {
	var ag models.Agendamento
	if err := c.ShouldBindJSON(&ag); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ag.ID = primitive.NewObjectID()
	ag.Status = "pendente"
	ag.CreatedAt = time.Now()
	ag.UpdatedAt = time.Now()

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	_, err := h.agendamentos.InsertOne(ctx, ag)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Publica evento no SNS (async, não bloqueia resposta)
	go h.publicarEventoSNS(ag)

	// Invoca Lambda para processar agendamento (async)
	go h.invocarLambda(ag)

	c.JSON(http.StatusCreated, ag)
}

func (h *Handler) GetAgendamento(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var ag models.Agendamento
	err = h.agendamentos.FindOne(ctx, bson.M{"_id": id}).Decode(&ag)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Agendamento não encontrado"})
		return
	}
	c.JSON(http.StatusOK, ag)
}

func (h *Handler) UpdateStatusAgendamento(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var body struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	statusValidos := map[string]bool{"pendente": true, "confirmado": true, "concluido": true, "cancelado": true}
	if !statusValidos[body.Status] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status inválido"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	update := bson.M{"$set": bson.M{"status": body.Status, "updated_at": time.Now()}}
	result, err := h.agendamentos.UpdateOne(ctx, bson.M{"_id": id}, update)
	if err != nil || result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Agendamento não encontrado"})
		return
	}

	// Se concluído, publica na fila SQS
	if body.Status == "concluido" {
		go h.publicarFilaSQS(id.Hex(), body.Status)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Status atualizado", "status": body.Status})
}

// publicarEventoSNS publica um evento de novo agendamento no tópico SNS
func (h *Handler) publicarEventoSNS(ag models.Agendamento) {
	if h.aws.SNS == nil || h.cfg.SNSTopicARN == "" {
		log.Println("SNS não configurado, pulando publicação")
		return
	}

	payload, _ := json.Marshal(map[string]interface{}{
		"evento":       "novo_agendamento",
		"id":           ag.ID.Hex(),
		"pet_nome":     ag.PetNome,
		"servico":      ag.Servico,
		"data_hora":    ag.DataHora.Format(time.RFC3339),
		"cliente_nome": ag.ClienteNome,
	})

	_, err := h.aws.SNS.Publish(context.Background(), &sns.PublishInput{
		TopicArn: aws.String(h.cfg.SNSTopicARN),
		Message:  aws.String(string(payload)),
		Subject:  aws.String("Novo Agendamento PetCare"),
	})
	if err != nil {
		log.Printf("Erro ao publicar no SNS: %v", err)
	} else {
		log.Printf("Evento publicado no SNS para agendamento %s", ag.ID.Hex())
	}
}

// publicarFilaSQS publica na fila SQS quando um serviço é concluído
func (h *Handler) publicarFilaSQS(agID, status string) {
	if h.aws.SQS == nil || h.cfg.SQSQueueURL == "" {
		log.Println("SQS não configurado, pulando publicação")
		return
	}

	payload, _ := json.Marshal(map[string]string{
		"agendamento_id": agID,
		"status":         status,
		"timestamp":      time.Now().Format(time.RFC3339),
	})

	_, err := h.aws.SQS.SendMessage(context.Background(), &sqs.SendMessageInput{
		QueueUrl:    aws.String(h.cfg.SQSQueueURL),
		MessageBody: aws.String(string(payload)),
	})
	if err != nil {
		log.Printf("Erro ao enviar para SQS: %v", err)
	} else {
		log.Printf("Mensagem enviada para SQS: agendamento %s concluído", agID)
	}
}

// invocarLambda invoca a função Lambda de forma síncrona para processar o agendamento
// e loga a resposta retornada pela função
func (h *Handler) invocarLambda(ag models.Agendamento) {
	if h.aws.Lambda == nil || h.cfg.LambdaFunctionName == "" {
		log.Println("Lambda não configurado, pulando invocação")
		return
	}

	payload, _ := json.Marshal(map[string]interface{}{
		"agendamento_id": ag.ID.Hex(),
		"servico":        ag.Servico,
		"pet_nome":       ag.PetNome,
		"cliente_nome":   ag.ClienteNome,
		"data_hora":      ag.DataHora.Format(time.RFC3339),
	})

	result, err := h.aws.Lambda.Invoke(context.Background(), &lambda.InvokeInput{
		FunctionName: aws.String(h.cfg.LambdaFunctionName),
		Payload:      payload,
	})
	if err != nil {
		log.Printf("Erro ao invocar Lambda: %v", err)
		return
	}

	// Loga o status HTTP retornado pela Lambda
	log.Printf("Lambda invocada para agendamento %s — StatusCode: %d", ag.ID.Hex(), result.StatusCode)

	// Loga a resposta da Lambda (body JSON)
	if len(result.Payload) > 0 {
		var resposta map[string]interface{}
		if err := json.Unmarshal(result.Payload, &resposta); err == nil {
			log.Printf("Resposta Lambda: %v", resposta)
		} else {
			log.Printf("Payload Lambda (raw): %s", string(result.Payload))
		}
	}

	// Se a Lambda reportou erro de função (FunctionError != nil), loga o detalhe
	if result.FunctionError != nil {
		log.Printf("Lambda FunctionError para agendamento %s: %s", ag.ID.Hex(), *result.FunctionError)
	}
}
