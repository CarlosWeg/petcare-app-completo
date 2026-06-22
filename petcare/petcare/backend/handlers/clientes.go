package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"

	"petcare-backend/models"
)

func (h *Handler) ListClientes(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	opts := options.Find().SetSort(bson.D{{Key: "nome", Value: 1}})
	cursor, err := h.clientes.Find(ctx, bson.M{}, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer cursor.Close(ctx)

	var clientes []models.Cliente
	if err = cursor.All(ctx, &clientes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if clientes == nil {
		clientes = []models.Cliente{}
	}
	c.JSON(http.StatusOK, clientes)
}

func (h *Handler) CreateCliente(c *gin.Context) {
	var cliente models.Cliente
	if err := c.ShouldBindJSON(&cliente); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cliente.ID = primitive.NewObjectID()
	cliente.CreatedAt = time.Now()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := h.clientes.InsertOne(ctx, cliente)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, cliente)
}

func (h *Handler) ListServicos(c *gin.Context) {
	c.JSON(http.StatusOK, models.ServicosDisponiveis())
}

func (h *Handler) GetStats(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Tenta buscar do cache Redis
	// Calcula stats do MongoDB
	totalPets, _ := h.pets.CountDocuments(ctx, bson.M{})
	totalClientes, _ := h.clientes.CountDocuments(ctx, bson.M{})
	totalAg, _ := h.agendamentos.CountDocuments(ctx, bson.M{})

	hoje := time.Now().Truncate(24 * time.Hour)
	agHoje, _ := h.agendamentos.CountDocuments(ctx, bson.M{
		"data_hora": bson.M{"$gte": hoje, "$lt": hoje.Add(24 * time.Hour)},
	})

	// Receita do mês (agendamentos concluídos)
	inicioMes := time.Date(time.Now().Year(), time.Now().Month(), 1, 0, 0, 0, 0, time.UTC)
	pipeline := []bson.M{
		{"$match": bson.M{
			"status":    "concluido",
			"data_hora": bson.M{"$gte": inicioMes},
		}},
		{"$group": bson.M{"_id": nil, "total": bson.M{"$sum": "$preco"}}},
	}
	cursor, _ := h.agendamentos.Aggregate(ctx, pipeline)
	var resultado []struct{ Total float64 `bson:"total"` }
	cursor.All(ctx, &resultado)
	receita := 0.0
	if len(resultado) > 0 {
		receita = resultado[0].Total
	}

	stats := models.Stats{
		TotalPets:         totalPets,
		TotalClientes:     totalClientes,
		TotalAgendamentos: totalAg,
		AgendamentosHoje:  agHoje,
		ReceitaMes:        receita,
		CacheHit:          false,
	}

	// Salva no Redis por 60 segundos
	data, _ := json.Marshal(stats)

	c.JSON(http.StatusOK, stats)
}
