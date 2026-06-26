# Stage 1: Build the React ui
FROM node:20-alpine AS ui-builder
WORKDIR /app
COPY ui/package*.json ./
RUN npm install
COPY ui/ ./
RUN npm run build

# Stage 2: Build the React landing
FROM node:20-alpine AS landing-builder
WORKDIR /app
COPY landing/package*.json ./
RUN npm install
COPY landing/ ./
RUN npm run build

# Stage 3: Build the Go backend
FROM golang:alpine AS backend-builder
WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
# Copy the built frontends into the go tree before building so go:embed picks it up
COPY --from=ui-builder /app/dist ./ui/dist
COPY --from=landing-builder /app/dist ./landing/dist
RUN CGO_ENABLED=0 GOOS=linux go build -o nuxx-docs .

# Stage 4: Final lightweight image
FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app
COPY --from=backend-builder /app/nuxx-docs .
EXPOSE 8080
CMD ["./nuxx-docs", "-addr", ":8080"]
