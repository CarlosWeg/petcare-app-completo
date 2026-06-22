import json
import os
import logging
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def handler(event, context):
    """
    Lambda PetCare — Processa eventos de agendamento.

    Invocada pelo backend Go ao criar um novo agendamento.
    Também pode ser acionada via SQS (trigger automático).
    """
    project_name = os.environ.get("PROJECT_NAME", "petcare-cloud")
    timestamp = datetime.utcnow().isoformat()

    logger.info(f"[{project_name}] Lambda invocada em {timestamp}")
    logger.info(f"Evento recebido: {json.dumps(event, ensure_ascii=False)}")

    # Detecta se veio do SQS (trigger automático) ou invocação direta
    if "Records" in event:
        return _processar_fila_sqs(event["Records"], project_name, timestamp)
    else:
        return _processar_agendamento_direto(event, project_name, timestamp)


def _processar_agendamento_direto(event, project_name, timestamp):
    """Processa agendamento invocado diretamente pelo backend."""
    agendamento_id = event.get("agendamento_id", "desconhecido")
    servico = event.get("servico", "")
    pet_nome = event.get("pet_nome", "")
    cliente_nome = event.get("cliente_nome", "")
    data_hora = event.get("data_hora", "")

    logger.info(
        f"Processando agendamento: id={agendamento_id} "
        f"pet={pet_nome} servico={servico} cliente={cliente_nome}"
    )

    # Aqui poderia: enviar e-mail via SES, registrar no DynamoDB, etc.
    resposta = {
        "agendamento_id": agendamento_id,
        "status": "processado",
        "mensagem": f"Agendamento de {servico} para {pet_nome} processado com sucesso!",
        "projeto": project_name,
        "processado_em": timestamp,
    }

    logger.info(f"Agendamento {agendamento_id} processado: {json.dumps(resposta)}")

    return {
        "statusCode": 200,
        "body": json.dumps(resposta, ensure_ascii=False),
    }


def _processar_fila_sqs(records, project_name, timestamp):
    """Processa mensagens da fila SQS (trigger automático)."""
    processados = []

    for record in records:
        try:
            body = json.loads(record.get("body", "{}"))

            # Mensagens do SNS chegam com envelope
            if "Message" in body:
                mensagem = json.loads(body["Message"])
            else:
                mensagem = body

            logger.info(f"Mensagem SQS processada: {json.dumps(mensagem)}")

            processados.append({
                "messageId": record.get("messageId"),
                "status": "processado",
                "evento": mensagem.get("evento", "desconhecido"),
            })

        except Exception as e:
            logger.error(f"Erro ao processar mensagem SQS: {e}")
            processados.append({
                "messageId": record.get("messageId"),
                "status": "erro",
                "erro": str(e),
            })

    return {
        "statusCode": 200,
        "body": json.dumps({
            "processados": len(processados),
            "resultados": processados,
            "projeto": project_name,
            "timestamp": timestamp,
        }, ensure_ascii=False),
    }
