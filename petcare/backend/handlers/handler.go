package handlers

import (
	"petcare-backend/config"

	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/mongo"
)

type Handler struct {
	db         *mongo.Database
	rdb        *redis.Client
	aws        *config.AWSClients
	cfg        *config.Config
	pets       *mongo.Collection
	clientes   *mongo.Collection
	agendamentos *mongo.Collection
}

func New(db *mongo.Database, rdb *redis.Client, aws *config.AWSClients, cfg *config.Config) *Handler {
	return &Handler{
		db:           db,
		rdb:          rdb,
		aws:          aws,
		cfg:          cfg,
		pets:         db.Collection("pets"),
		clientes:     db.Collection("clientes"),
		agendamentos: db.Collection("agendamentos"),
	}
}
