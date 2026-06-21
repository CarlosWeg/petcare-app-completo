"""
PetCare Lambda - processar-agendamento
Invocada pelo Worker K8s após consumir mensagem da SQS.
Registra o evento no CloudWatch e pode ser expandida para:
  - enviar email via SES
  - acionar notificações push
  - atualizar banco de dados
"""
import json
import os
import logging
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

PROJECT_NAME = os.environ.get("PROJECT_NAME", "petcare-cloud")


def handler(event, context):
    logger.info("=" * 60)
    logger.info("🐾 PetCare Lambda — Processamento de Agendamento")
    logger.info("Projeto  : %s", PROJECT_NAME)
    logger.info("RequestId: %s", context.aws_request_id)
    logger.info("Timestamp: %s", datetime.utcnow().isoformat())
    logger.info("=" * 60)

    # O evento pode vir direto do worker ou via SQS event source mapping
    records = event.get("Records", [])
    if records:
        # Acionada via SQS event source mapping
        for record in records:
            try:
                body = json.loads(record.get("body", "{}"))
                # SNS envelope
                if "Message" in body:
                    body = json.loads(body["Message"])
                processar(body)
            except Exception as e:
                logger.error("Erro ao processar record: %s", e)
    else:
        # Acionada diretamente pelo worker
        processar(event)

    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "Agendamento processado com sucesso",
            "project": PROJECT_NAME,
            "requestId": context.aws_request_id,
        }, ensure_ascii=False)
    }


def processar(dados: dict):
    agendamento_id = dados.get("agendamentoId", "desconhecido")
    pet = dados.get("pet", {})
    cliente = dados.get("cliente", {})
    servico = dados.get("servico", "—")
    data_ag = dados.get("data", "—")
    evento = dados.get("evento", "DESCONHECIDO")

    logger.info("Evento        : %s", evento)
    logger.info("Agendamento ID: %s", agendamento_id)
    logger.info("Pet           : %s (%s)", pet.get("nome"), pet.get("tipo"))
    logger.info("Tutor         : %s <%s>", cliente.get("nome"), cliente.get("email"))
    logger.info("Serviço       : %s", servico)
    logger.info("Data          : %s", data_ag)

    # Aqui você pode expandir:
    # - ses.send_email(...)        → notificar tutor por email
    # - dynamodb.put_item(...)     → gravar histórico
    # - cloudwatch.put_metric_data → métricas customizadas
    logger.info("✅ Agendamento %s registrado com sucesso", agendamento_id)
