package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"petcare-backend/config"
	"petcare-backend/handlers"
	"petcare-backend/middleware"
)

func main() {
	cfg := config.Load()

	// MongoDB
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	mongoClient, err := mongo.Connect(ctx, options.Client().ApplyURI(cfg.MongoURI))
	if err != nil {
		log.Fatalf("Falha ao conectar ao MongoDB: %v", err)
	}
	defer mongoClient.Disconnect(context.Background())

	db := mongoClient.Database(cfg.MongoDatabase)

	// AWS clients
	awsClients := config.NewAWSClients(cfg)

	// Gin
	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: false,
		MaxAge:           12 * time.Hour,
	}))
	r.Use(middleware.Logger())

	// Health
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "petcare-backend"})
	})

	// Handlers
	h := handlers.New(db, awsClients, cfg)

	api := r.Group("/api")
	{
		// Pets
		api.GET("/pets", h.ListPets)
		api.POST("/pets", h.CreatePet)
		api.GET("/pets/:id", h.GetPet)
		api.PUT("/pets/:id", h.UpdatePet)
		api.DELETE("/pets/:id", h.DeletePet)

		// Agendamentos
		api.GET("/agendamentos", h.ListAgendamentos)
		api.POST("/agendamentos", h.CreateAgendamento)
		api.GET("/agendamentos/:id", h.GetAgendamento)
		api.PUT("/agendamentos/:id/status", h.UpdateStatusAgendamento)

		// Clientes
		api.GET("/clientes", h.ListClientes)
		api.POST("/clientes", h.CreateCliente)

		// Serviços
		api.GET("/servicos", h.ListServicos)

		// Stats (direto do MongoDB, sem cache Redis)
		api.GET("/stats", h.GetStats)
	}

	port := cfg.Port
	if port == "" {
		port = "8080"
	}

	log.Printf("PetCare Backend iniciando na porta %s", port)
	srv := &http.Server{
		Addr:    ":" + port,
		Handler: r,
	}

	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Erro ao iniciar servidor: %v", err)
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
