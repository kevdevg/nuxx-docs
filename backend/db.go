package main

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	mongoClient        *mongo.Client
	mongoDB            *mongo.Database
	usersCollection    *mongo.Collection
	projectsCollection *mongo.Collection
	foldersCollection  *mongo.Collection
	assetsCollection   *mongo.Collection
)

// initDB initializes the MongoDB connection
func initDB(uri string) {
	if uri == "" {
		log.Fatal("MONGO_URI environment variable is required")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	clientOptions := options.Client().ApplyURI(uri)
	
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Fatalf("Error connecting to MongoDB: %v", err)
	}

	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatalf("Error pinging MongoDB: %v", err)
	}

	mongoClient = client
	mongoDB = client.Database("nuxxdocs")

	usersCollection = mongoDB.Collection("users")
	projectsCollection = mongoDB.Collection("projects")
	foldersCollection = mongoDB.Collection("folders")
	assetsCollection = mongoDB.Collection("assets")

	log.Println("MongoDB connected and collections initialized successfully.")
}
