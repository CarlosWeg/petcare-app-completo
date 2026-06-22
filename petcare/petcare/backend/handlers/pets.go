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

func (h *Handler) ListPets(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})
	cursor, err := h.pets.Find(ctx, bson.M{}, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer cursor.Close(ctx)

	var pets []models.Pet
	if err = cursor.All(ctx, &pets); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if pets == nil {
		pets = []models.Pet{}
	}
	c.JSON(http.StatusOK, pets)
}

func (h *Handler) CreatePet(c *gin.Context) {
	var pet models.Pet
	if err := c.ShouldBindJSON(&pet); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	pet.ID = primitive.NewObjectID()
	pet.CreatedAt = time.Now()
	pet.UpdatedAt = time.Now()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := h.pets.InsertOne(ctx, pet)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Invalida cache de stats

	c.JSON(http.StatusCreated, pet)
}

func (h *Handler) GetPet(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var pet models.Pet
	err = h.pets.FindOne(ctx, bson.M{"_id": id}).Decode(&pet)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pet não encontrado"})
		return
	}
	c.JSON(http.StatusOK, pet)
}

func (h *Handler) UpdatePet(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var pet models.Pet
	if err := c.ShouldBindJSON(&pet); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	pet.UpdatedAt = time.Now()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	update := bson.M{"$set": bson.M{
		"nome":       pet.Nome,
		"especie":    pet.Especie,
		"raca":       pet.Raca,
		"peso":       pet.Peso,
		"updated_at": pet.UpdatedAt,
	}}

	result, err := h.pets.UpdateOne(ctx, bson.M{"_id": id}, update)
	if err != nil || result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pet não encontrado"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Pet atualizado"})
}

func (h *Handler) DeletePet(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	result, err := h.pets.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil || result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pet não encontrado"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Pet removido"})
}
