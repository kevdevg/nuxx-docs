package main

import (
	"embed"
	"flag"
	"io/fs"
	"log"
	"net/http"
	"os"
)

//go:embed all:frontend/dist
var frontendDist embed.FS

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

	dbPath := dataDir + "/database.sqlite"
	initDB(dbPath)

	mux := http.NewServeMux()

	// API Routes
	mux.HandleFunc("/api/auth/register", handleRegister)
	mux.HandleFunc("/api/auth/login", handleLogin)
	mux.HandleFunc("/api/auth/me", authMiddleware(handleMe))
	mux.HandleFunc("/api/auth/logout", handleLogout)

	mux.HandleFunc("/api/projects", authMiddleware(handleProjects))
	mux.HandleFunc("/api/folders", authMiddleware(handleFolders))
	mux.HandleFunc("/api/directory", authMiddleware(handleDirectory))
	mux.HandleFunc("/api/documents", authMiddleware(handleDocuments))
	mux.HandleFunc("/public/html", handlePublicHtml)

	// Serve Frontend React App
	distSub, err := fs.Sub(frontendDist, "frontend/dist")
	if err != nil {
		log.Printf("Warning: frontend/dist not found, React will not be served embedded (dev mode?)")
	} else {
		// Handled as a Single Page App (SPA), fallback to index.html for unknown routes
		staticHandler := http.FileServer(http.FS(distSub))
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			// Check if file exists in the embedded FS
			path := r.URL.Path
			if path == "/" {
				path = "/index.html"
			}
			f, err := distSub.Open(path[1:])
			if err != nil {
				// Fallback to index.html for client-side routing
				r.URL.Path = "/"
			} else {
				f.Close()
			}
			staticHandler.ServeHTTP(w, r)
		})
	}

	log.Printf("Starting nuxx-docs backend on %s (data: %s)", listenAddr, dataDir)
	if err := http.ListenAndServe(listenAddr, mux); err != nil {
		log.Fatal(err)
	}
}
