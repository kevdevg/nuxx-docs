# htmlpaste

Self-hosted "pastebin para HTML". Escribes HTML en el editor, le das publicar,
obtienes un link público que sirve la página renderizada. Sin redesplegar nada.

- **Backend**: Go puro, sin dependencias externas, binario único (~6 MB)
- **Storage**: archivos planos en disco (`{slug}.html`)
- **Editor**: split-pane + iframe preview en vivo, atajo `Ctrl/⌘+Enter`
- **Auth**: opcional via bearer token

## Endpoints

| método | ruta                | qué hace                                 |
|--------|---------------------|------------------------------------------|
| GET    | `/`                 | UI del editor                            |
| GET    | `/e/{slug}`         | UI del editor precargada con ese paste   |
| GET    | `/p/{slug}`         | sirve el HTML renderizado (`text/html`)  |
| GET    | `/api/raw/{slug}`   | devuelve el HTML crudo (lo usa el editor)|
| POST   | `/api/publish`      | `{html, slug?}` → `{slug, url}`          |
| GET    | `/healthz`          | `ok`                                     |

## Desarrollo

```bash
go run . -addr :8080 -data ./data
# http://localhost:8080
```

Flags (o variables de entorno equivalentes):

```
-addr        :8080            (ADDR)
-data        ./data           (DATA_DIR)
-url         ""               (PUBLIC_URL)         ej: https://paste.tu.dev
-token       ""               (PUBLISH_TOKEN)      requiere bearer si está set
-max-size    1048576                               bytes (1 MiB por default)
```

## Docker

```bash
docker compose up -d --build
```

O standalone:

```bash
docker build -t htmlpaste .
docker run -d --name htmlpaste -p 8080:8080 \
  -v $(pwd)/data:/data \
  -e PUBLISH_TOKEN=tu-token-secreto \
  htmlpaste
```

## Desplegar en Coolify

1. Apunta Coolify al repo, tipo "Docker Compose"
2. Variables de entorno: `PUBLIC_URL=https://paste.tudominio.com`, opcionalmente `PUBLISH_TOKEN=...`
3. Persiste el volumen `./data` (en Coolify: "Persistent Storage" → `/data`)

## Seguridad — léelo

Este servicio **sirve HTML arbitrario de cualquier persona que pueda publicar**.
Eso es exactamente el punto, pero implica dos cosas:

1. **Sirve los pastes en un dominio distinto al editor.** Si publicas en
   `paste.tudominio.com` y el editor también vive ahí, un paste malicioso
   podría leer las cookies/localStorage del editor. La forma sana:
   - editor en `paste.tudominio.com` (UI + `/api/*`)
   - contenido renderizado en `*.userpaste.tudominio.com` o `pasteusercontent.tudominio.com`
   - GitHub hace exactamente esto con `*.githubusercontent.com`.

   Si no puedes separar dominios, al menos pon `PUBLISH_TOKEN` para que no
   sea publicación abierta.

2. **El iframe del editor usa `sandbox="allow-scripts allow-forms"`** —
   no permite `allow-same-origin`, así el preview no puede leer el contexto del
   editor. La página servida en `/p/{slug}` directamente no es sandboxed
   (no podría serlo, es la página misma), de ahí el punto 1.

3. **Slugs son aleatorios de 8 caracteres hex** (32 bits). Para protección
   real ante adivinación, pon `PUBLISH_TOKEN` o mete autenticación en
   tu reverse proxy.

## Estructura

```
.
├── main.go          # servidor HTTP (sin deps externas)
├── editor.html      # UI embebida via go:embed
├── go.mod
├── Dockerfile
├── docker-compose.yml
└── data/            # pastes guardados (slug.html)
```

## Licencia

MIT.
