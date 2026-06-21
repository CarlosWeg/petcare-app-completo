# infra-extra/lambda-trigger.tf
# Adicione este arquivo na pasta infra/ existente para conectar SQS → Lambda
# Permite que a Lambda seja acionada diretamente pela fila SQS (alternativa ao worker)

# Evento source mapping: SQS → Lambda
resource "aws_lambda_event_source_mapping" "sqs_para_lambda" {
  event_source_arn = aws_sqs_queue.agendamentos.arn
  function_name    = aws_lambda_function.processar_agendamento.arn
  batch_size       = 5
  enabled          = false   # Mantenha false se usar o Worker K8s; true para acionar Lambda diretamente

  depends_on = [
    aws_lambda_function.processar_agendamento,
    aws_sqs_queue.agendamentos,
  ]
}

# Variável de ambiente na Lambda com nome do projeto
resource "aws_lambda_function_event_invoke_config" "processar_agendamento" {
  function_name = aws_lambda_function.processar_agendamento.function_name

  maximum_retry_attempts = 2
}
