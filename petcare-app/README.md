# 🐾 PetCare Cloud — Aplicação Completa

Sistema distribuído de gestão de pet shop rodando na AWS com Kubernetes (K3s), mensageria SNS/SQS, Lambda, MongoDB e Redis.

## Estrutura da aplicação

```
petcare-app/
├── frontend/           → React + Vite (UI do pet shop)
├── backend/            → Node.js + Express + Mongoose (API REST)
├── worker/             → Python (consumidor SQS → invoca Lambda)
├── k8s/                → Manifestos Kubernetes
├── infra-extra/        → Terraform complementar
└── docker-compose.yml  → Desenvolvimento local
```

## Fluxo de mensageria

```
Frontend → POST /api/agendamentos
              ↓
         Backend (Node.js)
              ↓ PublishCommand
         SNS Topic (petcare-cloud-agendamentos-topic)
              ↓ Fan-out
         SQS Queue (petcare-cloud-agendamentos-queue)
              ↓ Poll (20s long polling)
         Worker Pod (K8s — Python)
              ↓ invoke (async)
         Lambda (petcare-cloud-processar-agendamento)
              ↓
         CloudWatch Logs
```

## Serviços e portas

| Serviço  | Porta interna | NodePort K8s |
|----------|---------------|--------------|
| Frontend | 80            | 30080        |
| Backend  | 4000          | —            |
| MongoDB  | 27017         | —            |
| Redis    | 6379          | —            |

## Deploy na AWS (K3s)

### 1. Provisionar infra com Terraform
```bash
cd petcare-cloud-terraform/infra
cp terraform.tfvars.example terraform.tfvars
# edite key_name
terraform init && terraform apply
```

### 2. Instalar K3s no master
```bash
ssh -i chave.pem ubuntu@IP_MASTER
curl -sfL https://get.k3s.io | sh -
sudo cat /var/lib/rancher/k3s/server/node-token
```

### 3. Instalar K3s nos workers
```bash
ssh -i chave.pem ubuntu@IP_WORKER_1
curl -sfL https://get.k3s.io | K3S_URL=https://IP_MASTER:6443 K3S_TOKEN=TOKEN sh -
```

### 4. Configurar kubeconfig local
```bash
scp -i chave.pem ubuntu@IP_MASTER:/etc/rancher/k3s/k3s.yaml ~/.kube/config
sed -i 's/127.0.0.1/IP_MASTER/g' ~/.kube/config
```

### 5. Build e push das imagens
```bash
# Substitua SEU_DOCKERHUB pelo seu usuário no Docker Hub
docker build -t SEU_DOCKERHUB/petcare-backend:latest ./backend
docker build -t SEU_DOCKERHUB/petcare-frontend:latest ./frontend
docker build -t SEU_DOCKERHUB/petcare-worker:latest ./worker
docker push SEU_DOCKERHUB/petcare-backend:latest
docker push SEU_DOCKERHUB/petcare-frontend:latest
docker push SEU_DOCKERHUB/petcare-worker:latest
```

### 6. Configurar K8s
```bash
# Edite k8s/configmap.yaml com ARNs reais do terraform output
terraform output  # copie sns_topic_arn, sqs_queue_url, s3_bucket_name

# Edite k8s/secrets.yaml com credenciais AWS (base64)
echo -n "SUA_KEY" | base64

# Edite backend-deployment.yaml, frontend-deployment.yaml, worker-deployment.yaml
# trocando SEU_DOCKERHUB pelo seu usuário
```

### 7. Aplicar manifestos
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/mongodb-statefulset.yaml
kubectl apply -f k8s/redis-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/worker-deployment.yaml
```

### 8. Verificar pods
```bash
kubectl get pods -n petcare
kubectl get svc -n petcare
kubectl logs -f deployment/petcare-worker -n petcare
```

### 9. Acessar a aplicação
```
http://IP_MASTER:30080
```

## Desenvolvimento local

```bash
# Copie variáveis de ambiente
cp backend/.env.example .env
# Edite .env com suas credenciais AWS

docker-compose up --build
# Acesse: http://localhost:3000
```

## Observabilidade

- **Health check**: `GET http://BACKEND:4000/api/health`
- **Logs K8s**: `kubectl logs -f deployment/petcare-backend -n petcare`
- **Logs Lambda**: CloudWatch → `/aws/lambda/petcare-cloud-processar-agendamento`
- **Métricas SQS**: CloudWatch → SQS → petcare-cloud-agendamentos-queue

## APIs disponíveis

| Método | Endpoint                    | Descrição                          |
|--------|-----------------------------|------------------------------------|
| GET    | /api/health                 | Health check dos serviços          |
| GET    | /api/clientes               | Listar clientes (cache Redis)      |
| POST   | /api/clientes               | Criar cliente                      |
| PUT    | /api/clientes/:id           | Atualizar cliente                  |
| DELETE | /api/clientes/:id           | Remover cliente                    |
| GET    | /api/pets                   | Listar pets                        |
| POST   | /api/pets                   | Criar pet                          |
| PUT    | /api/pets/:id               | Atualizar pet                      |
| DELETE | /api/pets/:id               | Remover pet                        |
| POST   | /api/pets/:id/imagem        | Upload imagem → S3                 |
| GET    | /api/agendamentos           | Listar agendamentos                |
| POST   | /api/agendamentos           | Criar + publicar SNS ← ⭐           |
| PUT    | /api/agendamentos/:id       | Atualizar agendamento              |
| DELETE | /api/agendamentos/:id       | Remover agendamento                |
| GET    | /api/dashboard/stats        | Estatísticas gerais                |
| GET    | /api/dashboard/recent       | Agendamentos recentes              |
