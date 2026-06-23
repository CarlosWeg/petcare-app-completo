import json
import os


def handler(event, context):
    project_name = os.environ.get("PROJECT_NAME", "petcare-cloud")

    print(f"Projeto: {project_name}")
    print("Evento recebido pela Lambda:")
    print(json.dumps(event, ensure_ascii=False))

    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "Agendamento processado com sucesso pela Lambda",
            "project": project_name
        }, ensure_ascii=False)
    }
