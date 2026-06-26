package main

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo"
)

func getUserID(r *http.Request) primitive.ObjectID {
	return r.Context().Value(userContextKey).(primitive.ObjectID)
}

func handleProjects(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)

	if r.Method == http.MethodGet {
		opts := options.Find().SetSort(bson.D{{Key: "_id", Value: -1}})
		// Fetch all projects globally (shared workspace)
		cursor, err := projectsCollection.Find(context.Background(), bson.M{}, opts)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer cursor.Close(context.Background())

		var projects []Project
		if err = cursor.All(context.Background(), &projects); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		if projects == nil {
			projects = []Project{}
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(projects)
		return
	}

	if r.Method == http.MethodPost {
		var req struct {
			Name string `json:"name"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Name == "" {
			http.Error(w, "bad request", http.StatusBadRequest)
			return
		}

		project := Project{
			UserID:    &userID,
			Name:      req.Name,
			CreatedAt: time.Now(),
		}

		res, err := projectsCollection.InsertOne(context.Background(), project)
		if err != nil {
			http.Error(w, "internal error", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"id":   res.InsertedID,
			"name": req.Name,
		})
		return
	}

	if r.Method == http.MethodPut {
		var req struct {
			ID       string       `json:"id"`
			Briefing BriefingData `json:"briefing"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ID == "" {
			http.Error(w, "bad request", http.StatusBadRequest)
			return
		}

		objID, err := primitive.ObjectIDFromHex(req.ID)
		if err != nil {
			http.Error(w, "invalid id", http.StatusBadRequest)
			return
		}

		update := bson.M{
			"$set": bson.M{
				"briefing": req.Briefing,
			},
		}

		_, err = projectsCollection.UpdateOne(context.Background(), bson.M{"_id": objID}, update)
		if err != nil {
			http.Error(w, "internal error", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "updated"})
		return
	}

	http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
}

func handleFolders(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		ProjectID      string  `json:"project_id"`
		ParentFolderID *string `json:"parent_folder_id"`
		Name           string  `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Name == "" || req.ProjectID == "" {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	projectObjID, err := primitive.ObjectIDFromHex(req.ProjectID)
	if err != nil {
		http.Error(w, "invalid project_id", http.StatusBadRequest)
		return
	}

	// Verify project exists
	err = projectsCollection.FindOne(context.Background(), bson.M{"_id": projectObjID}).Err()
	if err == mongo.ErrNoDocuments {
		http.Error(w, "project not found", http.StatusNotFound)
		return
	}

	var parentFolderObjID *primitive.ObjectID
	if req.ParentFolderID != nil && *req.ParentFolderID != "" {
		id, err := primitive.ObjectIDFromHex(*req.ParentFolderID)
		if err == nil {
			parentFolderObjID = &id
		}
	}

	folder := Folder{
		ProjectID:      projectObjID,
		ParentFolderID: parentFolderObjID,
		Name:           req.Name,
		CreatedAt:      time.Now(),
	}

	res, err := foldersCollection.InsertOne(context.Background(), folder)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"id": res.InsertedID, "name": req.Name})
}

// handleDirectory lists contents (folders and assets) of a specific project and optional folder
func handleDirectory(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	projectIDStr := r.URL.Query().Get("project_id")
	folderIDStr := r.URL.Query().Get("folder_id")

	if projectIDStr == "" {
		http.Error(w, "project_id required", http.StatusBadRequest)
		return
	}

	projectObjID, err := primitive.ObjectIDFromHex(projectIDStr)
	if err != nil {
		http.Error(w, "invalid project_id", http.StatusBadRequest)
		return
	}

	// verify project exists
	err = projectsCollection.FindOne(context.Background(), bson.M{"_id": projectObjID}).Err()
	if err == mongo.ErrNoDocuments {
		http.Error(w, "project not found", http.StatusNotFound)
		return
	}

	var folders []Folder
	var assets []Asset

	folderFilter := bson.M{"project_id": projectObjID}
	assetFilter := bson.M{"project_id": projectObjID}

	if folderIDStr != "" {
		folderObjID, err := primitive.ObjectIDFromHex(folderIDStr)
		if err == nil {
			folderFilter["parent_folder_id"] = folderObjID
			assetFilter["folder_id"] = folderObjID
		}
	} else {
		folderFilter["parent_folder_id"] = nil
		assetFilter["folder_id"] = nil
	}

	// Fetch Folders
	folderCursor, err := foldersCollection.Find(context.Background(), folderFilter)
	if err == nil {
		folderCursor.All(context.Background(), &folders)
	}

	// Fetch Assets
	opts := options.Find().SetProjection(bson.M{"content": 0}) // Do not return content for directory listing
	assetCursor, err := assetsCollection.Find(context.Background(), assetFilter, opts)
	if err == nil {
		assetCursor.All(context.Background(), &assets)
	}

	if folders == nil {
		folders = []Folder{}
	}
	if assets == nil {
		assets = []Asset{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"folders": folders,
		"assets":  assets,
	})
}

func handleDocuments(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)

	if r.Method == http.MethodGet {
		idStr := r.URL.Query().Get("id")
		if idStr == "" {
			http.Error(w, "id required", http.StatusBadRequest)
			return
		}

		objID, err := primitive.ObjectIDFromHex(idStr)
		if err != nil {
			http.Error(w, "invalid id", http.StatusBadRequest)
			return
		}

		var a Asset
		err = assetsCollection.FindOne(context.Background(), bson.M{"_id": objID}).Decode(&a)
		if err == mongo.ErrNoDocuments {
			http.Error(w, "not found", http.StatusNotFound)
			return
		} else if err != nil {
			http.Error(w, "internal error", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(a)
		return
	}

	if r.Method == http.MethodPost {
		var req struct {
			ID        *string `json:"id"`
			ProjectID string  `json:"project_id"`
			FolderID  *string `json:"folder_id"`
			Type      string  `json:"type"`
			Title     string  `json:"title"`
			Content   string  `json:"content"`
			IsPublic  bool    `json:"is_public"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "bad request", http.StatusBadRequest)
			return
		}

		if req.ID != nil && *req.ID != "" {
			// Update
			objID, err := primitive.ObjectIDFromHex(*req.ID)
			if err != nil {
				http.Error(w, "invalid id", http.StatusBadRequest)
				return
			}

			update := bson.M{
				"$set": bson.M{
					"title":      req.Title,
					"content":    req.Content,
					"is_public":  req.IsPublic,
					"updated_at": time.Now(),
				},
			}
			_, err = assetsCollection.UpdateOne(context.Background(), bson.M{"_id": objID}, update)
			if err != nil {
				http.Error(w, "internal error", http.StatusInternalServerError)
				return
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{"id": *req.ID, "status": "updated"})
			return
		}

		// Create
		projectObjID, err := primitive.ObjectIDFromHex(req.ProjectID)
		if err != nil {
			http.Error(w, "invalid project_id", http.StatusBadRequest)
			return
		}

		var folderObjID *primitive.ObjectID
		if req.FolderID != nil && *req.FolderID != "" {
			id, err := primitive.ObjectIDFromHex(*req.FolderID)
			if err == nil {
				folderObjID = &id
			}
		}

		asset := Asset{
			ProjectID: projectObjID,
			FolderID:  folderObjID,
			UserID:    userID,
			Type:      req.Type,
			Title:     req.Title,
			Content:   req.Content,
			IsPublic:  req.IsPublic,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		res, err := assetsCollection.InsertOne(context.Background(), asset)
		if err != nil {
			http.Error(w, "internal error", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"id": res.InsertedID, "status": "created"})
		return
	}
}

func handleProjectDrive(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		ProjectID      string `json:"project_id"`
		GDriveFolderID string `json:"gdrive_folder_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	projectObjID, err := primitive.ObjectIDFromHex(req.ProjectID)
	if err != nil {
		http.Error(w, "invalid project_id", http.StatusBadRequest)
		return
	}

	// Verify project exists
	err = projectsCollection.FindOne(context.Background(), bson.M{"_id": projectObjID}).Err()
	if err == mongo.ErrNoDocuments {
		http.Error(w, "project not found", http.StatusNotFound)
		return
	}

	update := bson.M{
		"$set": bson.M{
			"gdrive_folder_id": req.GDriveFolderID,
		},
	}
	_, err = projectsCollection.UpdateOne(context.Background(), bson.M{"_id": projectObjID}, update)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func handlePublicHtml(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, "id required", http.StatusBadRequest)
		return
	}

	objID, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	var a Asset
	err = assetsCollection.FindOne(context.Background(), bson.M{"_id": objID}).Decode(&a)
	if err == mongo.ErrNoDocuments {
		http.Error(w, "not found", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	if !a.IsPublic || a.Type != "html" {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write([]byte(a.Content))
}

func handlePublicProjects(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Name     string       `json:"name"`
		Briefing BriefingData `json:"briefing"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Name == "" {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	project := Project{
		UserID:    nil, // Anonymous
		Name:      req.Name,
		Briefing:  req.Briefing,
		CreatedAt: time.Now(),
	}

	res, err := projectsCollection.InsertOne(context.Background(), project)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":     res.InsertedID,
		"status": "created",
	})
}

