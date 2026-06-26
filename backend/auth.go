package main

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

var jwtSecret = []byte(envOr("JWT_SECRET", "super-secret-key-change-in-prod"))

type Credentials struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type Claims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

func handleRegister(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var creds Credentials
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	if creds.Email == "" || creds.Password == "" {
		http.Error(w, "email and password are required", http.StatusBadRequest)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(creds.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	// Check if email exists
	var existingUser User
	err = usersCollection.FindOne(context.Background(), bson.M{"email": creds.Email}).Decode(&existingUser)
	if err == nil {
		http.Error(w, "email already exists", http.StatusConflict)
		return
	}

	user := User{
		Email:        creds.Email,
		PasswordHash: string(hashedPassword),
		CreatedAt:    time.Now(),
	}

	res, err := usersCollection.InsertOne(context.Background(), user)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	userID := res.InsertedID.(primitive.ObjectID).Hex()
	sendToken(w, userID, creds.Email)
}

func handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var creds Credentials
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	var user User
	err := usersCollection.FindOne(context.Background(), bson.M{"email": creds.Email}).Decode(&user)
	if err == mongo.ErrNoDocuments {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	} else if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(creds.Password)); err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	sendToken(w, user.ID.Hex(), creds.Email)
}

func sendToken(w http.ResponseWriter, userID string, email string) {
	expirationTime := time.Now().Add(24 * 7 * time.Hour)
	claims := &Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "token",
		Value:    tokenString,
		Expires:  expirationTime,
		HttpOnly: true,
		Path:     "/",
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":    userID,
		"email": email,
	})
}

func handleMe(w http.ResponseWriter, r *http.Request) {
	claims, err := getClaims(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":    claims.UserID,
		"email": claims.Email,
	})
}

func handleLogout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     "token",
		Value:    "",
		Expires:  time.Now().Add(-1 * time.Hour),
		HttpOnly: true,
		Path:     "/",
	})
	w.WriteHeader(http.StatusOK)
}

type contextKey string
const userContextKey contextKey = "user_id"

// Middleware
func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, err := getClaims(r)
		if err != nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		
		objID, err := primitive.ObjectIDFromHex(claims.UserID)
		if err != nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		// Add primitive.ObjectID to context
		ctx := context.WithValue(r.Context(), userContextKey, objID)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}

func getClaims(r *http.Request) (*Claims, error) {
	c, err := r.Cookie("token")
	if err != nil {
		return nil, err
	}
	tokenStr := c.Value
	claims := &Claims{}
	tkn, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})
	if err != nil || !tkn.Valid {
		return nil, http.ErrNoCookie
	}
	return claims, nil
}
