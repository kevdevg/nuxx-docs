# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build the Go backend
FROM golang:1.22-alpine AS backend-builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
# Copy the built frontend into the go tree before building so go:embed picks it up
COPY --from=frontend-builder /app/dist ./frontend/dist
RUN CGO_ENABLED=0 GOOS=linux go build -o nuxx-docs .

# Stage 3: Final lightweight image
FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app
COPY --from=backend-builder /app/nuxx-docs .
EXPOSE 8080
VOLUME ["/data"]
CMD ["./nuxx-docs", "-addr", ":8080", "-data", "/data"]
