# 🐾 PetCare Cloud

Sistema distribuído para gestão de pet shop com frontend React, backend Go, MongoDB, mensageria SNS/SQS e processamento serverless com AWS Lambda.

## Alterações realizadas

### 1. Remoção do Redis — somente MongoDB
- O Redis foi removido completamente. Não há mais container `redis` no `docker-compose.yml` nem manifesto `k8s/04-redis.yaml`.
- O backend usa exclusivamente o MongoDB para persistência e cálculo de estatísticas (stats calculadas via aggregation pipeline diretamente no MongoDB).

### 2. Integração Lambda funcionando
- O backend Go já invoca a função Lambda em dois momentos:
  - **Criação de agendamento** (`POST /api/agendamentos`): invoca a Lambda com evento `agendamento_criado`.
  - **Conclusão de agendamento** (`PUT /api/agendamentos/:id/status` com `status=concluido`): envia para a fila SQS e invoca a Lambda com evento `agendamento_concluido`.
- O código da Lambda (`lambda/index.py`) trata tanto invocações diretas quanto eventos via SQS.
- A função Lambda é configurada pela variável de ambiente `LAMBDA_FUNCTION_NAME` (padrão: `petcare-cloud-processar-agendamento`).
- Foi corrigida uma função `getEnv` duplicada no `main.go` que causava conflito de compilação.

### 3. Correção do TypeError: n.reduce is not a function (Dashboard)
- O erro ocorria no Recharts quando `chartData` continha entradas com `quantidade` indefinido ou quando `ag.servico` era `null/undefined`.
- Correções aplicadas em `frontend/src/pages/Dashboard.jsx`:
  - Todos os valores de `quantidade` são forçados para `Number(value) || 0`.
  - O nome do serviço é sanitizado com `String(name)` antes de ser usado.
  - Entradas com `quantidade === 0` são filtradas do array antes de passar ao Recharts.
  - A prop `isAnimationActive={false}` foi adicionada à `<Bar>` para evitar erros de animação com dados vazios.
  - A chave do `<Cell>` usa `key={\`cell-\${i}\`}` (evita conflito com `ag.id` que pode ser objeto MongoDB).
  - O `catch` no `Promise.all` garante que o estado `agendamentos` nunca fica como não-array.
  - `data_hora` é verificado antes de ser passado ao `format()` do date-fns.

---

## Arquitetura

```text
Frontend (React)
   ↓
Backend (Go + Gin)
   ↓
MongoDB
   ├─ Pets
   ├─ Clientes
   └─ Agendamentos

Backend → SNS (novo agendamento)
Backend → Lambda (criar/concluir agendamento)
Backend → SQS (agendamento concluído)
SQS → Lambda (trigger automático)
```

## Estrutura do projeto

```text
petcare/
├── backend/
│   ├── main.go
│   ├── go.mod
│   ├── Dockerfile
│   ├── config/config.go       # Config + AWS clients (SQS, SNS, Lambda)
│   ├── handlers/
│   │   ├── handler.go         # Struct Handler
│   │   ├── agendamentos.go    # CRUD + invocarLambda + publicarSNS/SQS
│   │   ├── clientes.go        # CRUD + GetStats (aggregation MongoDB)
│   │   └── pets.go            # CRUD
│   ├── middleware/logger.go
│   └── models/models.go
├── frontend/
│   ├── src/
│   │   ├── pages/Dashboard.jsx   ← corrigido
│   │   ├── pages/Agendamentos.jsx
│   │   ├── pages/Pets.jsx
│   │   ├── pages/Clientes.jsx
│   │   ├── services/api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── vite.config.js
│   └── package.json
├── lambda/
│   └── index.py               # Handler Python: invocação direta + SQS trigger
├── k8s/
│   ├── 00-namespace.yaml
│   ├── 01-configmap.yaml
│   ├── 02-secrets.yaml
│   ├── 03-mongodb.yaml
│   ├── 05-backend.yaml
│   ├── 06-frontend.yaml
│   └── 08-observability.yaml
├── scripts/
│   ├── deploy-k8s.sh
│   ├── delete-k8s.sh
│   └── status.sh
├── docker-compose.yml
└── README.md
```

---

## Rotas da API

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/health` | Health check |
| `GET` | `/api/pets` | Lista todos os pets |
| `POST` | `/api/pets` | Cria pet |
| `GET` | `/api/pets/:id` | Busca pet por ID |
| `PUT` | `/api/pets/:id` | Atualiza pet |
| `DELETE` | `/api/pets/:id` | Remove pet |
| `GET` | `/api/clientes` | Lista clientes |
| `POST` | `/api/clientes` | Cria cliente |
| `GET` | `/api/agendamentos` | Lista agendamentos |
| `POST` | `/api/agendamentos` | Cria agendamento → dispara Lambda + SNS |
| `GET` | `/api/agendamentos/:id` | Busca agendamento |
| `PUT` | `/api/agendamentos/:id/status` | Atualiza status → se `concluido`, dispara SQS + Lambda |
| `GET` | `/api/servicos` | Lista serviços disponíveis |
| `GET` | `/api/stats` | Estatísticas do dashboard (calculadas no MongoDB) |

---

## Variáveis de ambiente (backend)

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `APP_PORT` | `8080` | Porta do servidor |
| `MONGO_URI` | `mongodb://mongodb:27017/petcare` | URI do MongoDB |
| `MONGO_DATABASE` | `petcare` | Nome do banco |
| `AWS_REGION` | `us-east-1` | Região AWS |
| `AWS_ACCESS_KEY_ID` | — | Credencial AWS |
| `AWS_SECRET_ACCESS_KEY` | — | Credencial AWS |
| `AWS_SESSION_TOKEN` | — | Token de sessão (opcional) |
| `SQS_QUEUE_URL` | — | URL da fila SQS |
| `SNS_TOPIC_ARN` | — | ARN do tópico SNS |
| `LAMBDA_FUNCTION_NAME` | `petcare-cloud-processar-agendamento` | Nome da função Lambda |

---

## Executar localmente (Docker Compose)

```bash
# Copie e preencha as variáveis AWS (opcional — sem elas, SNS/SQS/Lambda são silenciados)
cp .env.example .env   # se existir, ou exporte manualmente

docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- MongoDB: localhost:27017

---

## Deploy no Kubernetes

```bash
# Preencha os secrets antes:
# k8s/02-secrets.yaml → MONGO_URI, SQS_QUEUE_URL, SNS_TOPIC_ARN, AWS credentials

bash scripts/deploy-k8s.sh
bash scripts/status.sh
```

---

## Lambda — fluxo de processamento

```
POST /api/agendamentos
  └─► backend salva no MongoDB
  └─► [goroutine] publicarEventoSNS   → SNS topic → SQS → Lambda (trigger automático)
  └─► [goroutine] invocarLambda("agendamento_criado", ...)  → Lambda direta

PUT /api/agendamentos/:id/status  { "status": "concluido" }
  └─► backend atualiza MongoDB
  └─► [goroutine] publicarFilaSQS → SQS → Lambda (trigger automático)
  └─► [goroutine] invocarLambda("agendamento_concluido", ...) → Lambda direta
```

A Lambda (`lambda/index.py`) detecta automaticamente se recebeu uma invocação direta ou um evento SQS via o campo `Records`.
