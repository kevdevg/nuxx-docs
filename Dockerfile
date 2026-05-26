# syntax=docker/dockerfile:1.7

FROM golang:1.22-alpine AS builder
WORKDIR /src
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build \
    -trimpath -ldflags="-s -w" \
    -o /htmlpaste ./...

FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata && \
    addgroup -S app && adduser -S -G app app && \
    mkdir -p /data && chown app:app /data
COPY --from=builder /htmlpaste /usr/local/bin/htmlpaste
USER app
VOLUME ["/data"]
EXPOSE 8080
ENV DATA_DIR=/data \
    ADDR=:8080
ENTRYPOINT ["/usr/local/bin/htmlpaste"]
