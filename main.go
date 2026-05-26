// htmlpaste is a tiny self-hosted "pastebin for HTML" service.
//
// POST /api/publish  -> save HTML, return slug + public URL
// GET  /p/{slug}     -> serve stored HTML rendered (text/html)
// GET  /e/{slug}     -> open editor pre-loaded with that paste
// GET  /api/raw/{slug} -> return raw HTML (used by editor on load)
// GET  /              -> editor UI
//
// Storage is flat files under -data. No external dependencies.
package main

import (
	"crypto/rand"
	"embed"
	"encoding/hex"
	"encoding/json"
	"errors"
	"flag"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

//go:embed editor.html
var staticFS embed.FS

var (
	dataDir      string
	maxSize      int64
	listenAddr   string
	publicURL    string
	publishToken string

	slugRegex = regexp.MustCompile(`^[a-zA-Z0-9_-]{1,32}$`)
)

func main() {
	flag.StringVar(&dataDir, "data", envOr("DATA_DIR", "./data"), "directory to store pastes")
	flag.Int64Var(&maxSize, "max-size", 1<<20, "max paste size in bytes (default 1 MiB)")
	flag.StringVar(&listenAddr, "addr", envOr("ADDR", ":8080"), "address to listen on")
	flag.StringVar(&publicURL, "url", os.Getenv("PUBLIC_URL"), "public base URL for generated links (optional; auto-detected from request)")
	flag.StringVar(&publishToken, "token", os.Getenv("PUBLISH_TOKEN"), "if set, requires Authorization: Bearer <token> on /api/publish")
	flag.Parse()

	if err := os.MkdirAll(dataDir, 0o755); err != nil {
		log.Fatalf("create data dir: %v", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/", handleRoot)
	mux.HandleFunc("/p/", handleServe)
	mux.HandleFunc("/e/", handleEditExisting)
	mux.HandleFunc("/api/publish", handlePublish)
	mux.HandleFunc("/api/raw/", handleRaw)
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) { _, _ = w.Write([]byte("ok")) })

	authed := publishToken != ""
	log.Printf("htmlpaste listening on %s | data=%s | max-size=%d | auth=%t", listenAddr, dataDir, maxSize, authed)
	if err := http.ListenAndServe(listenAddr, mux); err != nil {
		log.Fatal(err)
	}
}

func envOr(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func handleRoot(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	writeEditor(w)
}

func handleEditExisting(w http.ResponseWriter, r *http.Request) {
	slug := strings.TrimPrefix(r.URL.Path, "/e/")
	if !slugRegex.MatchString(slug) {
		http.NotFound(w, r)
		return
	}
	// We don't 404 here even if slug missing — the editor JS will fetch /api/raw
	// and gracefully fall back to a blank draft. This lets people share /e/slug
	// links even before they exist (useful for "claim this slug" UX).
	writeEditor(w)
}

func writeEditor(w http.ResponseWriter) {
	b, err := staticFS.ReadFile("editor.html")
	if err != nil {
		http.Error(w, "editor not embedded", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	_, _ = w.Write(b)
}

func handleServe(w http.ResponseWriter, r *http.Request) {
	slug := strings.TrimPrefix(r.URL.Path, "/p/")
	if !slugRegex.MatchString(slug) {
		http.NotFound(w, r)
		return
	}
	data, err := os.ReadFile(pasteFile(slug))
	if err != nil {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	// Pastes are immutable per slug (unless re-published), so allow short caching.
	w.Header().Set("Cache-Control", "public, max-age=60")
	_, _ = w.Write(data)
}

func handleRaw(w http.ResponseWriter, r *http.Request) {
	slug := strings.TrimPrefix(r.URL.Path, "/api/raw/")
	if !slugRegex.MatchString(slug) {
		http.NotFound(w, r)
		return
	}
	data, err := os.ReadFile(pasteFile(slug))
	if err != nil {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	_, _ = w.Write(data)
}

type publishReq struct {
	HTML string `json:"html"`
	Slug string `json:"slug,omitempty"` // optional: re-publish to existing slug
}

type publishResp struct {
	Slug string `json:"slug"`
	URL  string `json:"url"`
}

func handlePublish(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if publishToken != "" {
		auth := r.Header.Get("Authorization")
		if auth != "Bearer "+publishToken {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxSize+4096)
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "body too large or read error", http.StatusBadRequest)
		return
	}
	var req publishReq
	if err := json.Unmarshal(body, &req); err != nil {
		http.Error(w, "bad json", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(req.HTML) == "" {
		http.Error(w, "empty html", http.StatusBadRequest)
		return
	}
	if int64(len(req.HTML)) > maxSize {
		http.Error(w, "paste too large", http.StatusRequestEntityTooLarge)
		return
	}

	slug := req.Slug
	if slug != "" {
		if !slugRegex.MatchString(slug) {
			http.Error(w, "bad slug", http.StatusBadRequest)
			return
		}
	} else {
		slug, err = newSlug()
		if err != nil {
			http.Error(w, "internal error", http.StatusInternalServerError)
			return
		}
	}
	if err := os.WriteFile(pasteFile(slug), []byte(req.HTML), 0o644); err != nil {
		log.Printf("write %s: %v", slug, err)
		http.Error(w, "write error", http.StatusInternalServerError)
		return
	}

	base := publicURL
	if base == "" {
		scheme := "http"
		if r.TLS != nil || strings.EqualFold(r.Header.Get("X-Forwarded-Proto"), "https") {
			scheme = "https"
		}
		base = scheme + "://" + r.Host
	}
	base = strings.TrimRight(base, "/")
	resp := publishResp{Slug: slug, URL: base + "/p/" + slug}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}

func pasteFile(slug string) string {
	return filepath.Join(dataDir, slug+".html")
}

func newSlug() (string, error) {
	for i := 0; i < 16; i++ {
		b := make([]byte, 4)
		if _, err := rand.Read(b); err != nil {
			return "", err
		}
		slug := hex.EncodeToString(b)
		if _, err := os.Stat(pasteFile(slug)); errors.Is(err, os.ErrNotExist) {
			return slug, nil
		}
	}
	return "", errors.New("could not generate unique slug")
}
