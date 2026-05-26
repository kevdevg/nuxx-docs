// nuxx-docs is a self-hosted HTML document editor and publisher.
//
// Routes:
//   GET  /               → editor UI (shows dashboard or login)
//   GET  /e/{slug}       → editor UI pre-loaded with document
//   GET  /p/{slug}       → serve stored HTML (public, no auth)
//   GET  /api/raw/{slug} → raw HTML source (used by editor)
//   GET  /api/doc/{slug} → document metadata JSON
//   GET  /api/list       → list all documents (auth required)
//   GET  /api/verify     → verify auth token
//   POST /api/publish    → create/update document (auth required)
//   DELETE /api/delete/{slug} → delete document (auth required)
//   GET  /healthz        → health check
//
// Storage: flat files under -data ({slug}.html + {slug}.json metadata).
// No external dependencies.
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
	"sort"
	"strings"
	"time"
)

//go:embed editor.html
var staticFS embed.FS

var (
	dataDir      string
	maxSize      int64
	listenAddr   string
	publicURL    string
	publishToken string

	slugRegex = regexp.MustCompile(`^[a-zA-Z0-9_-]{1,64}$`)
)

// DocMeta stores metadata for a published document.
type DocMeta struct {
	Slug      string `json:"slug"`
	Name      string `json:"name"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

func main() {
	flag.StringVar(&dataDir, "data", envOr("DATA_DIR", "./data"), "directory to store documents")
	flag.Int64Var(&maxSize, "max-size", 1<<20, "max document size in bytes (default 1 MiB)")
	flag.StringVar(&listenAddr, "addr", envOr("ADDR", ":8080"), "address to listen on")
	flag.StringVar(&publicURL, "url", os.Getenv("PUBLIC_URL"), "public base URL for generated links")
	flag.StringVar(&publishToken, "token", os.Getenv("PUBLISH_TOKEN"), "bearer token for write operations")
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
	mux.HandleFunc("/api/doc/", handleDoc)
	mux.HandleFunc("/api/list", handleList)
	mux.HandleFunc("/api/delete/", handleDelete)
	mux.HandleFunc("/api/verify", handleVerify)
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) { _, _ = w.Write([]byte("ok")) })

	authed := publishToken != ""
	log.Printf("nuxx-docs listening on %s | data=%s | max-size=%d | auth=%t", listenAddr, dataDir, maxSize, authed)
	if err := http.ListenAndServe(listenAddr, mux); err != nil {
		log.Fatal(err)
	}
}

// ── Helpers ─────────────────────────────────────

func envOr(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func requireAuth(w http.ResponseWriter, r *http.Request) bool {
	if publishToken == "" {
		return true
	}
	auth := r.Header.Get("Authorization")
	if auth != "Bearer "+publishToken {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return false
	}
	return true
}

func pasteFile(slug string) string {
	return filepath.Join(dataDir, slug+".html")
}

func metaFile(slug string) string {
	return filepath.Join(dataDir, slug+".json")
}

func readMeta(slug string) (DocMeta, error) {
	data, err := os.ReadFile(metaFile(slug))
	if err != nil {
		return DocMeta{}, err
	}
	var meta DocMeta
	if err := json.Unmarshal(data, &meta); err != nil {
		return DocMeta{}, err
	}
	return meta, nil
}

func writeMeta(meta DocMeta) error {
	data, err := json.MarshalIndent(meta, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(metaFile(meta.Slug), data, 0o644)
}

func listAllDocs() ([]DocMeta, error) {
	entries, err := os.ReadDir(dataDir)
	if err != nil {
		return nil, err
	}
	var docs []DocMeta
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".html") {
			continue
		}
		slug := strings.TrimSuffix(e.Name(), ".html")
		meta, err := readMeta(slug)
		if err != nil {
			// Legacy paste without metadata — create it
			info, _ := e.Info()
			modTime := time.Now()
			if info != nil {
				modTime = info.ModTime()
			}
			meta = DocMeta{
				Slug:      slug,
				Name:      slug,
				CreatedAt: modTime.Format(time.RFC3339),
				UpdatedAt: modTime.Format(time.RFC3339),
			}
			_ = writeMeta(meta) // persist for future
		}
		docs = append(docs, meta)
	}
	sort.Slice(docs, func(i, j int) bool {
		return docs[i].UpdatedAt > docs[j].UpdatedAt
	})
	return docs, nil
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

func randomHex(n int) string {
	b := make([]byte, n)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	rep := strings.NewReplacer(
		"á", "a", "é", "e", "í", "i", "ó", "o", "ú", "u",
		"ñ", "n", "ü", "u", "ä", "a", "ö", "o", "ë", "e",
		"à", "a", "è", "e", "ì", "i", "ò", "o", "ù", "u",
		"â", "a", "ê", "e", "î", "i", "ô", "o", "û", "u",
		"ç", "c",
	)
	s = rep.Replace(s)
	var buf strings.Builder
	for _, r := range s {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			buf.WriteRune(r)
		} else {
			buf.WriteByte('-')
		}
	}
	s = buf.String()
	for strings.Contains(s, "--") {
		s = strings.ReplaceAll(s, "--", "-")
	}
	s = strings.Trim(s, "-")
	if len(s) > 48 {
		s = s[:48]
		s = strings.TrimRight(s, "-")
	}
	return s
}

// ── Page Handlers ───────────────────────────────

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
	w.Header().Set("Cache-Control", "public, max-age=60")
	_, _ = w.Write(data)
}

// ── API Handlers ────────────────────────────────

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

func handleDoc(w http.ResponseWriter, r *http.Request) {
	slug := strings.TrimPrefix(r.URL.Path, "/api/doc/")
	if !slugRegex.MatchString(slug) {
		http.NotFound(w, r)
		return
	}
	meta, err := readMeta(slug)
	if err != nil {
		if _, statErr := os.Stat(pasteFile(slug)); statErr == nil {
			meta = DocMeta{Slug: slug, Name: slug}
		} else {
			http.NotFound(w, r)
			return
		}
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(meta)
}

func handleVerify(w http.ResponseWriter, r *http.Request) {
	if !requireAuth(w, r) {
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]bool{"valid": true})
}

func handleList(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if !requireAuth(w, r) {
		return
	}
	docs, err := listAllDocs()
	if err != nil {
		log.Printf("list docs: %v", err)
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	if docs == nil {
		docs = []DocMeta{}
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(docs)
}

func handleDelete(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if !requireAuth(w, r) {
		return
	}
	slug := strings.TrimPrefix(r.URL.Path, "/api/delete/")
	if !slugRegex.MatchString(slug) {
		http.NotFound(w, r)
		return
	}
	if _, err := os.Stat(pasteFile(slug)); errors.Is(err, os.ErrNotExist) {
		http.NotFound(w, r)
		return
	}
	os.Remove(pasteFile(slug))
	os.Remove(metaFile(slug))
	log.Printf("deleted document: %s", slug)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "deleted", "slug": slug})
}

type publishReq struct {
	HTML string `json:"html"`
	Name string `json:"name"`
	Slug string `json:"slug,omitempty"`
}

type publishResp struct {
	Slug string `json:"slug"`
	Name string `json:"name"`
	URL  string `json:"url"`
}

func handlePublish(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if !requireAuth(w, r) {
		return
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
	if strings.TrimSpace(req.Name) == "" {
		http.Error(w, "name required", http.StatusBadRequest)
		return
	}
	if int64(len(req.HTML)) > maxSize {
		http.Error(w, "paste too large", http.StatusRequestEntityTooLarge)
		return
	}

	slug := req.Slug
	isUpdate := false

	if slug != "" {
		if !slugRegex.MatchString(slug) {
			http.Error(w, "bad slug", http.StatusBadRequest)
			return
		}
		if _, err := os.Stat(pasteFile(slug)); err == nil {
			isUpdate = true
		}
	} else {
		// Auto-generate slug from name
		slug = slugify(req.Name)
		if slug == "" {
			slug, err = newSlug()
			if err != nil {
				http.Error(w, "internal error", http.StatusInternalServerError)
				return
			}
		} else if _, err := os.Stat(pasteFile(slug)); err == nil {
			// Slug taken — append random suffix
			slug = slug + "-" + randomHex(3)
		}
	}

	// Write HTML
	if err := os.WriteFile(pasteFile(slug), []byte(req.HTML), 0o644); err != nil {
		log.Printf("write %s: %v", slug, err)
		http.Error(w, "write error", http.StatusInternalServerError)
		return
	}

	// Write metadata
	now := time.Now().Format(time.RFC3339)
	meta := DocMeta{
		Slug:      slug,
		Name:      strings.TrimSpace(req.Name),
		UpdatedAt: now,
		CreatedAt: now,
	}
	if isUpdate {
		if existing, err := readMeta(slug); err == nil {
			meta.CreatedAt = existing.CreatedAt
		}
	}
	if err := writeMeta(meta); err != nil {
		log.Printf("write meta %s: %v", slug, err)
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

	resp := publishResp{Slug: slug, Name: meta.Name, URL: base + "/p/" + slug}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}
