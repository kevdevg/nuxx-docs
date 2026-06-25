package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"google.golang.org/api/drive/v3"
	"google.golang.org/api/option"
)

type DriveFile struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	MimeType string `json:"mimeType"`
	IconLink string `json:"iconLink"`
	WebViewLink string `json:"webViewLink"`
}

func getDriveClient() (*drive.Service, error) {
	ctx := context.Background()
	// Uses the GOOGLE_APPLICATION_CREDENTIALS environment variable
	// Or falls back to other auth methods if configured
	credentialsFile := os.Getenv("GOOGLE_APPLICATION_CREDENTIALS")
	if credentialsFile == "" {
		// Fallback to checking a local file just in case
		if _, err := os.Stat("google-credentials.json"); err == nil {
			return drive.NewService(ctx, option.WithCredentialsFile("google-credentials.json"))
		}
		return nil, fmt.Errorf("no credentials found")
	}
	return drive.NewService(ctx)
}

func handleDriveFiles(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)

	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	projectID := r.URL.Query().Get("project_id")
	if projectID == "" {
		http.Error(w, "project_id required", http.StatusBadRequest)
		return
	}

	var gdriveFolderID string
	err := db.QueryRow("SELECT gdrive_folder_id FROM projects WHERE id = ?", projectID).Scan(&gdriveFolderID)
	if err == sql.ErrNoRows {
		http.Error(w, "project not found", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	if gdriveFolderID == "" {
		// No folder linked, return empty list
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode([]DriveFile{})
		return
	}

	srv, err := getDriveClient()
	if err != nil {
		http.Error(w, "google drive not configured: "+err.Error(), http.StatusInternalServerError)
		return
	}

	query := fmt.Sprintf("'%s' in parents and trashed = false", gdriveFolderID)
	rList, err := srv.Files.List().Q(query).Fields("files(id, name, mimeType, iconLink, webViewLink)").Do()
	if err != nil {
		http.Error(w, "failed to fetch drive files: "+err.Error(), http.StatusInternalServerError)
		return
	}

	var files []DriveFile
	for _, i := range rList.Files {
		files = append(files, DriveFile{
			ID:          i.Id,
			Name:        i.Name,
			MimeType:    i.MimeType,
			IconLink:    i.IconLink,
			WebViewLink: i.WebViewLink,
		})
	}

	if files == nil {
		files = []DriveFile{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(files)
}
