package handlers

import (
	"petcare-backend/config"

	"go.mongodb.org/mongo-driver/mongo"
)

type Handler struct {
	db           *mongo.Database
	aws          *config.AWSClients
	cfg          *config.Config
	pets         *mongo.Collection
	clientes     *mongo.Collection
	agendamentos *mongo.Collection
}

func New(db *mongo.Database, aws *config.AWSClients, cfg *config.Config) *Handler {
	return &Handler{
		db:           db,
		aws:          aws,
		cfg:          cfg,
		pets:         db.Collection("pets"),
		clientes:     db.Collection("clientes"),
		agendamentos: db.Collection("agendamentos"),
	}
}
