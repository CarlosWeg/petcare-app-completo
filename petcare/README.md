# 🐾 PetCare Cloud — Sistema Distribuído na AWS

Plataforma de gestão de pet shop desenvolvida como trabalho semestral de Sistemas Distribuídos. A aplicação roda em um cluster Kubernetes (K3s) em EC2 na AWS, com mensageria via SNS/SQS, processamento serverless via Lambda, cache com Redis e banco de dados MongoDB.

---

## Arquitetura

```
┌────────────────────────────────────────────────────────────────┐
│                         AWS Academy (us-east-1)                │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               VPC  10.10.0.0/16                          │  │
│  │                                                          │  │
│  │   ┌─────────────────────────────────────────────────┐   │  │
│  │   │          K3s Cluster (3x EC2 t3.medium)         │   │  │
│  │   │                                                 │   │  │
│  │   │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │   │  │
│  │   │  │ Frontend │  │ Backend  │  │  MongoDB     │  │   │  │
│  │   │  │  React   │  │   Go     │  │  Redis       │  │   │  │
│  │   │  │  :30081  │  │  :30080  │  │  (interno)   │  │   │  │
│  │   │  └──────────┘  └────┬─────┘  └──────────────┘  │   │  │
│  │   └────────────────────-│────────────────────────────┘   │  │
│  │                         │                                 │  │
│  │      ┌──────────────────┼──────────────────┐             │  │
│  │      ▼                  ▼                  ▼             │  │
│  │  ┌───────┐         ┌────────┐         ┌────────┐        │  │
│  │  │  SNS  │────────▶│  SQS  │────────▶│Lambda  │        │  │
│  │  │ Topic │         │ Queue │         │ Python │        │  │
│  │  └───────┘         └────────┘         └────────┘        │  │
│  │                                                          │  │
│  │                    ┌────────┐                            │  │
│  │                    │   S3   │  (imagens dos pets)        │  │
│  │                    └────────┘                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

**Fluxo de mensageria:**
```
Backend (Go) → SNS Topic → SQS Queue → Lambda (Python) → CloudWatch Logs
```

---

## Stack de Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite + React Router |
| Backend | Go 1.21 + Gin + AWS SDK v2 |
| Banco de Dados | MongoDB 7 (distribuído, no cluster) |
| Cache | Redis 7 (integrado ao backend) |
| Mensageria | AWS SNS + SQS |
| Serverless | AWS Lambda (Python 3.11) |
| Containers | Docker + Kubernetes (K3s) |
| Infraestrutura | Terraform + AWS EC2 |
| Observabilidade | kubectl logs + CloudWatch |

---

## Estrutura do Projeto

```
petcare/
├── backend/                  # API Go
│   ├── main.go
│   ├── config/config.go
│   ├── handlers/
│   │   ├── handler.go
│   │   ├── pets.go
│   │   ├── agendamentos.go   # Integra SNS, SQS e Lambda
│   │   └── clientes.go       # Inclui stats com cache Redis
│   ├── middleware/logger.go
│   ├── models/models.go
│   ├── go.mod
│   └── Dockerfile
├── frontend/                 # React + Vite
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Pets.jsx
│   │   │   ├── Clientes.jsx
│   │   │   └── Agendamentos.jsx
│   │   └── services/api.js
│   ├── nginx.conf
│   └── Dockerfile
├── lambda/
│   └── index.py              # Lambda aprimorada (direta + SQS trigger)
├── k8s/                      # Manifests Kubernetes
│   ├── 00-namespace.yaml
│   ├── 01-configmap.yaml
│   ├── 02-secrets.yaml       # ⚠️ Preencher com credenciais AWS
│   ├── 03-mongodb.yaml
│   ├── 04-redis.yaml
│   ├── 05-backend.yaml
│   ├── 06-frontend.yaml
│   └── 08-observability.yaml
├── docker-compose.yml        # Para desenvolvimento local
└── README.md
```

---

## Pré-Requisitos

- Conta AWS Academy ativa
- AWS CLI instalado e configurado
- Terraform >= 1.6
- Docker e Docker Hub (conta gratuita)
- kubectl

---

## PARTE 1 — Infraestrutura com Terraform

### 1.1 Provisionar a infraestrutura

```bash
cd petcare-cloud-terraform/infra

# Copie e configure as variáveis
cp terraform.tfvars.example terraform.tfvars
```

Edite `terraform.tfvars`:
```hcl
key_name = "nome-da-sua-chave-aws"  # Key Pair criada na AWS
```

```bash
terraform init
terraform plan
terraform apply
```

Anote os outputs — você precisará deles:
```bash
terraform output
# master_public_ip = "X.X.X.X"
# sqs_queue_url = "https://sqs.us-east-1.amazonaws.com/..."
# sns_topic_arn = "arn:aws:sns:us-east-1:..."
# lambda_function_name = "petcare-cloud-processar-agendamento"
```

---

## PARTE 2 — Build e Push das Imagens Docker

### 2.1 Backend (Go)

```bash
cd petcare/backend

# Faça login no Docker Hub
docker login

# Build e push
docker build -t SEU_USUARIO/petcare-backend:latest .
docker push SEU_USUARIO/petcare-backend:latest
```

### 2.2 Frontend (React)

```bash
cd petcare/frontend

docker build \
  --build-arg VITE_API_URL=http://IP_DO_MASTER:30080 \
  -t SEU_USUARIO/petcare-frontend:latest .

docker push SEU_USUARIO/petcare-frontend:latest
```

> Substitua `IP_DO_MASTER` pelo IP público da EC2 master (output do Terraform).

---

## PARTE 3 — Configurar Kubernetes

### 3.1 Instalar K3s no Master

Acesse a EC2 master via SSH:
```bash
ssh -i sua-chave.pem ubuntu@IP_DO_MASTER
```

Instale o K3s:
```bash
curl -sfL https://get.k3s.io | sh -

# Verifique se está rodando
sudo kubectl get nodes

# Anote o token para os workers
sudo cat /var/lib/rancher/k3s/server/node-token

# Anote o IP privado
hostname -I | awk '{print $1}'
```

### 3.2 Instalar K3s nos Workers

Acesse cada worker e execute:
```bash
curl -sfL https://get.k3s.io | \
  K3S_URL=https://IP_PRIVADO_DO_MASTER:6443 \
  K3S_TOKEN=TOKEN_DO_MASTER \
  sh -
```

Confirme no master:
```bash
sudo kubectl get nodes
# NAME           STATUS   ROLES                  AGE
# ip-10-10-...   Ready    control-plane,master   2m
# ip-10-10-...   Ready    <none>                 1m
# ip-10-10-...   Ready    <none>                 1m
```

### 3.3 Preencher os Secrets

Edite o arquivo `petcare/k8s/02-secrets.yaml` com os valores do Terraform:

```yaml
# aws-credentials — credenciais do AWS Academy
AWS_ACCESS_KEY_ID: "ASIA..."      # AWS > Learner Lab > AWS Details
AWS_SECRET_ACCESS_KEY: "..."
AWS_SESSION_TOKEN: "..."

# petcare-secrets
SQS_QUEUE_URL: "https://sqs.us-east-1.amazonaws.com/..."  # terraform output sqs_queue_url
SNS_TOPIC_ARN: "arn:aws:sns:us-east-1:..."                # terraform output sns_topic_arn
MONGO_URI: "mongodb://mongodb:27017/petcare"
```

### 3.4 Atualizar imagens no manifest do frontend

Edite `k8s/06-frontend.yaml` e `k8s/05-backend.yaml`:
```yaml
image: SEU_USUARIO/petcare-backend:latest
image: SEU_USUARIO/petcare-frontend:latest
```

### 3.5 Copiar e aplicar os manifests no K3s

```bash
# Na sua máquina local — copie os arquivos para o master
scp -i sua-chave.pem -r petcare/k8s/ ubuntu@IP_DO_MASTER:~/petcare-k8s/

# No master K3s
cd ~/petcare-k8s

sudo kubectl apply -f 00-namespace.yaml
sudo kubectl apply -f 01-configmap.yaml
sudo kubectl apply -f 02-secrets.yaml
sudo kubectl apply -f 03-mongodb.yaml
sudo kubectl apply -f 04-redis.yaml
sudo kubectl apply -f 05-backend.yaml
sudo kubectl apply -f 06-frontend.yaml
sudo kubectl apply -f 08-observability.yaml
```

---

## PARTE 4 — Verificação e Acesso

### 4.1 Verificar se os pods estão rodando

```bash
sudo kubectl get pods -n petcare
# NAME                               READY   STATUS    RESTARTS   AGE
# mongodb-xxxxxxxxx-xxxxx            1/1     Running   0          2m
# redis-xxxxxxxxx-xxxxx              1/1     Running   0          2m
# petcare-backend-xxxxxxxxx-xxxxx    1/1     Running   0          1m
# petcare-backend-xxxxxxxxx-xxxxx    1/1     Running   0          1m
# frontend-xxxxxxxxx-xxxxx           1/1     Running   0          1m
# frontend-xxxxxxxxx-xxxxx           1/1     Running   0          1m
```

### 4.2 Acessar a aplicação

| Serviço | URL |
|---------|-----|
| **Frontend** | `http://IP_DO_MASTER:30081` |
| **Backend (health)** | `http://IP_DO_MASTER:30080/health` |
| **Backend (API)** | `http://IP_DO_MASTER:30080/api/...` |

> ⚠️ Certifique-se de que as portas `30080` e `30081` estejam liberadas no Security Group da EC2.

---

## PARTE 5 — Lambda (já criada pelo Terraform)

A Lambda foi criada automaticamente pelo Terraform. Para atualizar o código:

```bash
cd petcare/lambda

# Zip e atualiza
zip lambda_function.zip index.py

aws lambda update-function-code \
  --function-name petcare-cloud-processar-agendamento \
  --zip-file fileb://lambda_function.zip
```

Para criar o trigger SQS na Lambda:
```bash
# Pega o ARN da fila
SQS_ARN=$(terraform output -raw sqs_queue_arn)
LAMBDA_NAME=$(terraform output -raw lambda_function_name)

aws lambda create-event-source-mapping \
  --function-name $LAMBDA_NAME \
  --event-source-arn $SQS_ARN \
  --batch-size 5 \
  --starting-position TRIM_HORIZON
```

---

## PARTE 6 — Observabilidade

### Logs do Kubernetes

```bash
# Todos os pods
sudo kubectl get pods -n petcare -w

# Logs do backend (inclui chamadas SNS, SQS, Lambda)
sudo kubectl logs -n petcare deployment/petcare-backend -f

# Logs do frontend
sudo kubectl logs -n petcare deployment/frontend -f

# Eventos do cluster
sudo kubectl get events -n petcare --sort-by=.metadata.creationTimestamp

# Uso de recursos
sudo kubectl top pods -n petcare
```

### Logs da Lambda no CloudWatch

1. Acesse AWS Console → CloudWatch → Log Groups
2. Procure `/aws/lambda/petcare-cloud-processar-agendamento`
3. Cada invocação gera uma entrada com o evento processado

### APIs de teste rápido

```bash
BASE=http://IP_DO_MASTER:30080/api

# Health check
curl $BASE/../health

# Stats (primeira chamada: MongoDB; segunda: Redis cache)
curl $BASE/stats

# Listar serviços disponíveis
curl $BASE/servicos

# Criar cliente
curl -X POST $BASE/clientes \
  -H "Content-Type: application/json" \
  -d '{"nome":"Maria Silva","email":"maria@email.com","telefone":"(49)99999-9999"}'

# Criar pet
curl -X POST $BASE/pets \
  -H "Content-Type: application/json" \
  -d '{"nome":"Bolinha","especie":"Cão","raca":"Labrador","peso":15.5}'

# Criar agendamento (dispara SNS + Lambda automaticamente)
curl -X POST $BASE/agendamentos \
  -H "Content-Type: application/json" \
  -d '{"pet_id":"ID_DO_PET","servico":"banho","data_hora":"2025-07-01T14:00:00Z","preco":50}'
```

---

## PARTE 7 — Atualizar credenciais AWS Academy

As credenciais do AWS Academy expiram a cada sessão. Ao reiniciar o laboratório:

```bash
# No master K3s — atualiza os secrets com novas credenciais
sudo kubectl delete secret aws-credentials -n petcare

sudo kubectl create secret generic aws-credentials \
  --namespace petcare \
  --from-literal=AWS_ACCESS_KEY_ID="NOVA_KEY" \
  --from-literal=AWS_SECRET_ACCESS_KEY="NOVO_SECRET" \
  --from-literal=AWS_SESSION_TOKEN="NOVO_TOKEN"

# Reinicia o backend para pegar as novas credenciais
sudo kubectl rollout restart deployment/petcare-backend -n petcare
```

---

## Desenvolvimento Local

Para testar localmente sem AWS:

```bash
cd petcare

# Sobe MongoDB + Redis + Backend + Frontend
docker compose up --build

# Frontend: http://localhost:3000
# Backend:  http://localhost:8080
# API:      http://localhost:8080/api/servicos
```

As integrações com SNS, SQS e Lambda são silenciosas quando as variáveis de ambiente estão vazias (o backend loga "não configurado, pulando").

---

## Limpeza (pós-apresentação)

```bash
# Remove a aplicação do K3s
sudo kubectl delete namespace petcare

# Destrói toda a infraestrutura AWS (evita cobranças)
cd petcare-cloud-terraform/infra
terraform destroy
```

---

## Critérios de Avaliação Atendidos

| Critério | Como foi implementado |
|----------|----------------------|
| Kubernetes | Cluster K3s com 1 master + 2 workers; 6 workloads no namespace `petcare` |
| Lambda | `petcare-cloud-processar-agendamento` — invocada pelo backend a cada agendamento |
| SQS/SNS | SNS publica evento de agendamento; SQS recebe via subscrição; Lambda processa |
| MongoDB | Banco distribuído rodando no cluster K3s |
| Redis | Cache de stats com TTL de 60s; integrado ao backend Go |
| Frontend | React 18 com dashboard, CRUD de pets/clientes/agendamentos |
| Backend | API REST em Go com Gin, health check, logs estruturados |
| Observabilidade | kubectl logs, CloudWatch (Lambda), kubectl get events |
| Distribuição | Frontend (2 réplicas), Backend (2 réplicas), MongoDB, Redis — todos isolados |

---

*PetCare Cloud — Trabalho Semestral de Sistemas Distribuídos*
