output "master_public_ip" {
  description = "IP público da EC2 master do K3s."
  value       = aws_instance.k3s_master.public_ip
}

output "worker_1_public_ip" {
  description = "IP público da EC2 worker 1."
  value       = aws_instance.k3s_worker_1.public_ip
}

output "worker_2_public_ip" {
  description = "IP público da EC2 worker 2."
  value       = aws_instance.k3s_worker_2.public_ip
}

output "master_ssh_command" {
  description = "Modelo de comando SSH para acessar o master. Ajuste o caminho da sua chave .pem."
  value       = "ssh -i sua-chave.pem ubuntu@${aws_instance.k3s_master.public_ip}"
}

output "sqs_queue_url" {
  description = "URL da fila SQS de agendamentos."
  value       = aws_sqs_queue.agendamentos.url
}

output "sqs_queue_arn" {
  description = "ARN da fila SQS de agendamentos."
  value       = aws_sqs_queue.agendamentos.arn
}

output "sns_topic_arn" {
  description = "ARN do tópico SNS de agendamentos."
  value       = aws_sns_topic.agendamentos.arn
}

output "lambda_function_name" {
  description = "Nome da função Lambda."
  value       = aws_lambda_function.processar_agendamento.function_name
}

output "s3_bucket_name" {
  description = "Nome do bucket S3 para imagens dos pets."
  value       = aws_s3_bucket.pet_images.bucket
}
