package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
)

type Project struct {
	ID             int    `json:"id"`
	UserID         int    `json:"user_id"`
	Name           string `json:"name"`
	GDriveFolderID string `json:"gdrive_folder_id"`
	CreatedAt      string `json:"created_at"`
}

type Folder struct {
	ID             int    `json:"id"`
	ProjectID      int    `json:"project_id"`
	ParentFolderID *int   `json:"parent_folder_id"`
	Name           string `json:"name"`
	CreatedAt      string `json:"created_at"`
}

type Asset struct {
	ID        int    `json:"id"`
	ProjectID int    `json:"project_id"`
	FolderID  *int   `json:"folder_id"`
	UserID    int    `json:"user_id"`
	Type      string `json:"type"` // 'document', 'diagram', 'file', 'html'
	Title     string `json:"title"`
	FileName  string `json:"file_name,omitempty"`
	Content   string `json:"content,omitempty"`
	IsPublic  bool   `json:"is_public"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

type contextKey string
const userContextKey contextKey = "user_id"

func getUserID(r *http.Request) int {
	return r.Context().Value(userContextKey).(int)
}

func handleProjects(w http.ResponseWriter, r *http.Request) {
	userID := getUserID(r)

	if r.Method == http.MethodGet {
		rows, err := db.Query("SELECT id, name, gdrive_folder_id, created_at FROM projects ORDER BY id DESC")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var projects []Project
		for rows.Next() {
			var p Project
			if err := rows.Scan(&p.ID, &p.Name, &p.GDriveFolderID, &p.CreatedAt); err != nil {
				continue
			}
			p.UserID = userID
			projects = append(projects, p)
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

		res, err := db.Exec("INSERT INTO projects (user_id, name) VALUES (?, ?)", userID, req.Name)
		if err != nil {
			http.Error(w, "internal error", http.StatusInternalServerError)
			return
		}

		id, _ := res.LastInsertId()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"id": id,
			"name": req.Name,
		})
		return
	}

	http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
}

func handleFolders(w http.ResponseWriter, r *http.Request) {
	_ = getUserID(r)
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		ProjectID      int    `json:"project_id"`
		ParentFolderID *int   `json:"parent_folder_id"`
		Name           string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Name == "" || req.ProjectID == 0 {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
		
	}

	// Verify project belongs to user
	var dummy int
	err := db.QueryRow("SELECT id FROM projects WHERE id = ?", req.ProjectID).Scan(&dummy)
	if err == sql.ErrNoRows {
		http.Error(w, "project not found", http.StatusNotFound)
		return
	}

	res, err := db.Exec("INSERT INTO folders (project_id, parent_folder_id, name) VALUES (?, ?, ?)", req.ProjectID, req.ParentFolderID, req.Name)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	id, _ := res.LastInsertId()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"id": id, "name": req.Name})
}

// handleDirectory lists contents (folders and assets) of a specific project and optional folder
func handleDirectory(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	_ = getUserID(r)
	projectIDStr := r.URL.Query().Get("project_id")
	folderIDStr := r.URL.Query().Get("folder_id")

	if projectIDStr == "" {
		http.Error(w, "project_id required", http.StatusBadRequest)
		return
	}

	// verify owner
	var dummy int
	if err := db.QueryRow("SELECT id FROM projects WHERE id = ?", projectIDStr).Scan(&dummy); err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}

	var folders []Folder
	var assets []Asset

	var folderQuery string
	var args []interface{}
	args = append(args, projectIDStr)
	if folderIDStr != "" {
		folderQuery = "SELECT id, project_id, parent_folder_id, name, created_at FROM folders WHERE project_id = ? AND parent_folder_id = ?"
		args = append(args, folderIDStr)
	} else {
		folderQuery = "SELECT id, project_id, parent_folder_id, name, created_at FROM folders WHERE project_id = ? AND parent_folder_id IS NULL"
	}

	rows, _ := db.Query(folderQuery, args...)
	if rows != nil {
		for rows.Next() {
			var f Folder
			rows.Scan(&f.ID, &f.ProjectID, &f.ParentFolderID, &f.Name, &f.CreatedAt)
			folders = append(folders, f)
		}
		rows.Close()
	}

	var assetQuery string
	if folderIDStr != "" {
		assetQuery = "SELECT id, type, title, file_name, is_public, created_at, updated_at FROM assets WHERE project_id = ? AND folder_id = ?"
	} else {
		assetQuery = "SELECT id, type, title, file_name, is_public, created_at, updated_at FROM assets WHERE project_id = ? AND folder_id IS NULL"
	}

	rows2, _ := db.Query(assetQuery, args...)
	if rows2 != nil {
		for rows2.Next() {
			var a Asset
			rows2.Scan(&a.ID, &a.Type, &a.Title, &a.FileName, &a.IsPublic, &a.CreatedAt, &a.UpdatedAt)
			assets = append(assets, a)
		}
		rows2.Close()
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
		id := r.URL.Query().Get("id")
		if id == "" {
			http.Error(w, "id required", http.StatusBadRequest)
			return
		}
		var a Asset
		err := db.QueryRow("SELECT id, project_id, folder_id, type, title, content, is_public FROM assets WHERE id = ?", id).
			Scan(&a.ID, &a.ProjectID, &a.FolderID, &a.Type, &a.Title, &a.Content, &a.IsPublic)
		if err == sql.ErrNoRows {
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
			ID        *int   `json:"id"`
			ProjectID int    `json:"project_id"`
			FolderID  *int   `json:"folder_id"`
			Type      string `json:"type"` // 'document' or 'diagram' or 'html'
			Title     string `json:"title"`
			Content   string `json:"content"`
			IsPublic  bool   `json:"is_public"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "bad request", http.StatusBadRequest)
			return
		}

		if req.ID != nil {
			// Update
			_, err := db.Exec("UPDATE assets SET title = ?, content = ?, is_public = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
				req.Title, req.Content, req.IsPublic, *req.ID)
			if err != nil {
				http.Error(w, "internal error", http.StatusInternalServerError)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{"id": *req.ID, "status": "updated"})
			return
		}

		// Create
		res, err := db.Exec("INSERT INTO assets (project_id, folder_id, user_id, type, title, content, is_public) VALUES (?, ?, ?, ?, ?, ?, ?)",
			req.ProjectID, req.FolderID, userID, req.Type, req.Title, req.Content, req.IsPublic)
		if err != nil {
			http.Error(w, "internal error", http.StatusInternalServerError)
			return
		}
		id, _ := res.LastInsertId()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"id": id, "status": "created"})
		return
	}
}

func handleProjectDrive(w http.ResponseWriter, r *http.Request) {
	_ = getUserID(r)

	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		ProjectID      int    `json:"project_id"`
		GDriveFolderID string `json:"gdrive_folder_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	// Verify ownership
	var dummy int
	err := db.QueryRow("SELECT id FROM projects WHERE id = ?", req.ProjectID).Scan(&dummy)
	if err == sql.ErrNoRows {
		http.Error(w, "project not found", http.StatusNotFound)
		return
	}

	_, err = db.Exec("UPDATE projects SET gdrive_folder_id = ? WHERE id = ?", req.GDriveFolderID, req.ProjectID)
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
	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "id required", http.StatusBadRequest)
		return
	}
	var content string
	var isPublic bool
	var assetType string
	err := db.QueryRow("SELECT content, is_public, type FROM assets WHERE id = ?", id).
		Scan(&content, &isPublic, &assetType)
	if err == sql.ErrNoRows {
		http.Error(w, "not found", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	if !isPublic || assetType != "html" {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write([]byte(content))
}
