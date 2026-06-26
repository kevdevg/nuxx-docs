package main

import (
	"embed"
	"flag"
	"io/fs"
	"log"
	"net/http"
	"os"
	"strings"
)

//go:embed all:landing/dist
var landingDist embed.FS

//go:embed all:ui/dist
var uiDist embed.FS

var (
	dataDir    string
	listenAddr string
)

func envOr(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func main() {
	flag.StringVar(&dataDir, "data", envOr("DATA_DIR", "./data"), "directory to store db and files")
	flag.StringVar(&listenAddr, "addr", envOr("ADDR", ":8080"), "address to listen on")
	flag.Parse()

	if err := os.MkdirAll(dataDir, 0o755); err != nil {
		log.Fatalf("create data dir: %v", err)
	}

	mongoURI := envOr("MONGO_URI", "mongodb://localhost:27017")
	initDB(mongoURI)

	mux := http.NewServeMux()

	// Healthcheck
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// API Routes
	mux.HandleFunc("/api/auth/register", handleRegister)
	mux.HandleFunc("/api/auth/login", handleLogin)
	mux.HandleFunc("/api/auth/me", authMiddleware(handleMe))
	mux.HandleFunc("/api/auth/logout", handleLogout)

	mux.HandleFunc("/api/projects", authMiddleware(handleProjects))
	mux.HandleFunc("/api/public/projects", handlePublicProjects) // Public project creation from landing
	mux.HandleFunc("/api/projects/drive", authMiddleware(handleProjectDrive))
	mux.HandleFunc("/api/drive", authMiddleware(handleDriveFiles))
	mux.HandleFunc("/api/folders", authMiddleware(handleFolders))
	mux.HandleFunc("/api/directory", authMiddleware(handleDirectory))
	mux.HandleFunc("/api/documents", authMiddleware(handleDocuments))
	mux.HandleFunc("/public/html", handlePublicHtml)

	// Serve Frontend React App (/app)
	distSubFrontend, errFrontend := fs.Sub(uiDist, "ui/dist")
	if errFrontend != nil {
		log.Printf("Warning: ui/dist not found")
	} else {
		staticHandlerFrontend := http.StripPrefix("/app", http.FileServer(http.FS(distSubFrontend)))
		mux.HandleFunc("/app/", func(w http.ResponseWriter, r *http.Request) {
			path := r.URL.Path
			if path == "/app" || path == "/app/" {
				path = "/index.html"
			} else {
				path = strings.TrimPrefix(path, "/app")
			}
			f, err := distSubFrontend.Open(path[1:])
			if err != nil {
				r.URL.Path = "/app/"
			} else {
				f.Close()
			}
			staticHandlerFrontend.ServeHTTP(w, r)
		})
	}

	// Serve Landing React App (Root /)
	distSubLanding, errLanding := fs.Sub(landingDist, "landing/dist")
	if errLanding != nil {
		log.Printf("Warning: landing/dist not found")
	} else {
		staticHandlerLanding := http.FileServer(http.FS(distSubLanding))
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			// Avoid intercepting /api or /app
			if strings.HasPrefix(r.URL.Path, "/api") || strings.HasPrefix(r.URL.Path, "/app") {
				http.NotFound(w, r)
				return
			}
			path := r.URL.Path
			if path == "/" {
				path = "/index.html"
			}
			f, err := distSubLanding.Open(path[1:])
			if err != nil {
				r.URL.Path = "/"
			} else {
				f.Close()
			}
			staticHandlerLanding.ServeHTTP(w, r)
		})
	}

	log.Printf("Starting backend on %s", listenAddr)
	if err := http.ListenAndServe(listenAddr, mux); err != nil {
		log.Fatal(err)
	}
}
