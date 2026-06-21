"""
PetCare - Worker SQS
Roda como Deployment no Kubernetes (K3s).
Consome mensagens da fila SQS, processa e invoca a Lambda.
"""
import json
import os
import time
import logging

import boto3
from botocore.exceptions import ClientError

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
log = logging.getLogger("petcare-worker")

# ── Configurações via variáveis de ambiente ────────────────────────────
AWS_REGION      = os.getenv("AWS_REGION", "us-east-1")
SQS_QUEUE_URL   = os.getenv("SQS_QUEUE_URL")
LAMBDA_FUNCTION = os.getenv("LAMBDA_FUNCTION_NAME", "petcare-cloud-processar-agendamento")
POLL_WAIT_SEC   = int(os.getenv("POLL_WAIT_SECONDS", "20"))   # long polling
MAX_MESSAGES    = int(os.getenv("MAX_MESSAGES", "10"))

# ── AWS clients ────────────────────────────────────────────────────────
sqs    = boto3.client("sqs",    region_name=AWS_REGION)
lambda_ = boto3.client("lambda", region_name=AWS_REGION)


def processar_mensagem(body: dict) -> dict:
    """
    Lógica de processamento do agendamento.
    Pode ser expandida para: notificar clientes, atualizar banco, etc.
    """
    evento = body.get("evento", "DESCONHECIDO")
    log.info("Processando evento: %s | agendamento: %s", evento, body.get("agendamentoId"))

    resultado = {
        "evento": evento,
        "agendamentoId": body.get("agendamentoId"),
        "pet": body.get("pet", {}),
        "cliente": body.get("cliente", {}),
        "servico": body.get("servico"),
        "data": body.get("data"),
        "processadoPor": "petcare-worker-k8s",
    }
    return resultado


def invocar_lambda(payload: dict) -> None:
    """Invoca a Lambda de forma assíncrona (Event) para não bloquear o worker."""
    try:
        resp = lambda_.invoke(
            FunctionName=LAMBDA_FUNCTION,
            InvocationType="Event",          # async
            Payload=json.dumps(payload).encode(),
        )
        status = resp.get("StatusCode")
        log.info("Lambda invocada — statusCode: %s", status)
    except ClientError as e:
        log.error("Erro ao invocar Lambda: %s", e.response["Error"]["Message"])


def consumir_fila() -> None:
    """Loop principal de consumo da fila SQS."""
    if not SQS_QUEUE_URL:
        log.error("SQS_QUEUE_URL não configurado. Encerrando worker.")
        raise SystemExit(1)

    log.info("🐾 PetCare Worker iniciado")
    log.info("Fila SQS  : %s", SQS_QUEUE_URL)
    log.info("Lambda    : %s", LAMBDA_FUNCTION)
    log.info("Região AWS: %s", AWS_REGION)

    while True:
        try:
            # Recebe mensagens com long polling
            resp = sqs.receive_message(
                QueueUrl=SQS_QUEUE_URL,
                MaxNumberOfMessages=MAX_MESSAGES,
                WaitTimeSeconds=POLL_WAIT_SEC,
                AttributeNames=["All"],
                MessageAttributeNames=["All"],
            )

            mensagens = resp.get("Messages", [])
            if not mensagens:
                log.debug("Fila vazia, aguardando…")
                continue

            log.info("%d mensagem(ns) recebida(s)", len(mensagens))

            for msg in mensagens:
                receipt = msg["ReceiptHandle"]
                raw_body = msg.get("Body", "{}")

                try:
                    # A mensagem do SNS chega encapsulada
                    outer = json.loads(raw_body)
                    # SNS envelopa como {"Message": "...", "Subject": "..."}
                    inner_str = outer.get("Message", raw_body)
                    body = json.loads(inner_str) if isinstance(inner_str, str) else inner_str

                    resultado = processar_mensagem(body)
                    invocar_lambda(resultado)

                    # Remove da fila após processamento bem-sucedido
                    sqs.delete_message(QueueUrl=SQS_QUEUE_URL, ReceiptHandle=receipt)
                    log.info("✅ Mensagem processada e removida da fila")

                except json.JSONDecodeError as e:
                    log.error("JSON inválido na mensagem: %s", e)
                    # Não remove — vai para DLQ após visibilidade expirar
                except Exception as e:
                    log.error("Erro ao processar mensagem: %s", e)

        except ClientError as e:
            log.error("Erro SQS: %s — aguardando 5s", e.response["Error"]["Message"])
            time.sleep(5)
        except KeyboardInterrupt:
            log.info("Worker encerrado pelo usuário.")
            break
        except Exception as e:
            log.error("Erro inesperado: %s — aguardando 5s", e)
            time.sleep(5)


if __name__ == "__main__":
    consumir_fila()
