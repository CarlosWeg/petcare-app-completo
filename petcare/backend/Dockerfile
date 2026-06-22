FROM golang:1.21-alpine AS builder

WORKDIR /app

COPY go.mod ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o petcare-backend .

FROM alpine:3.19
RUN apk --no-cache add ca-certificates tzdata
ENV TZ=America/Sao_Paulo

WORKDIR /root/
COPY --from=builder /app/petcare-backend .

EXPOSE 8080

CMD ["./petcare-backend"]
