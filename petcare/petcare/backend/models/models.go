package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Pet struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Nome      string             `bson:"nome" json:"nome" binding:"required"`
	Especie   string             `bson:"especie" json:"especie" binding:"required"` // cão, gato, etc
	Raca      string             `bson:"raca" json:"raca"`
	Peso      float64            `bson:"peso" json:"peso"`
	ClienteID primitive.ObjectID `bson:"cliente_id" json:"cliente_id"`
	Foto      string             `bson:"foto" json:"foto"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time          `bson:"updated_at" json:"updated_at"`
}

type Cliente struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Nome      string             `bson:"nome" json:"nome" binding:"required"`
	Email     string             `bson:"email" json:"email" binding:"required"`
	Telefone  string             `bson:"telefone" json:"telefone"`
	Endereco  string             `bson:"endereco" json:"endereco"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
}

type Agendamento struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	PetID       primitive.ObjectID `bson:"pet_id" json:"pet_id"`
	PetNome     string             `bson:"pet_nome" json:"pet_nome"`
	ClienteID   primitive.ObjectID `bson:"cliente_id" json:"cliente_id"`
	ClienteNome string             `bson:"cliente_nome" json:"cliente_nome"`
	Servico     string             `bson:"servico" json:"servico" binding:"required"` // banho, tosa, consulta, etc
	DataHora    time.Time          `bson:"data_hora" json:"data_hora" binding:"required"`
	Status      string             `bson:"status" json:"status"` // pendente, confirmado, concluido, cancelado
	Observacoes string             `bson:"observacoes" json:"observacoes"`
	Preco       float64            `bson:"preco" json:"preco"`
	CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updated_at"`
}

type Servico struct {
	ID    string  `json:"id"`
	Nome  string  `json:"nome"`
	Preco float64 `json:"preco"`
	Icone string  `json:"icone"`
}

func ServicosDisponiveis() []Servico {
	return []Servico{
		{ID: "banho", Nome: "Banho", Preco: 50.00, Icone: "🛁"},
		{ID: "tosa", Nome: "Tosa", Preco: 80.00, Icone: "✂️"},
		{ID: "banho_tosa", Nome: "Banho + Tosa", Preco: 120.00, Icone: "✨"},
		{ID: "consulta", Nome: "Consulta Veterinária", Preco: 150.00, Icone: "🩺"},
		{ID: "vacina", Nome: "Vacinação", Preco: 90.00, Icone: "💉"},
		{ID: "hotel", Nome: "Hotel Pet", Preco: 70.00, Icone: "🏨"},
	}
}

type Stats struct {
	TotalPets          int64   `json:"total_pets"`
	TotalClientes      int64   `json:"total_clientes"`
	TotalAgendamentos  int64   `json:"total_agendamentos"`
	AgendamentosHoje   int64   `json:"agendamentos_hoje"`
	ReceitaMes         float64 `json:"receita_mes"`
	CacheHit           bool    `json:"cache_hit"`
}
