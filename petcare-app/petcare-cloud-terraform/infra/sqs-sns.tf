resource "aws_sqs_queue" "agendamentos" {
  name                       = "${local.name_prefix}-agendamentos-queue"
  visibility_timeout_seconds = 30
  message_retention_seconds  = 345600

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-agendamentos-queue"
  })
}

resource "aws_sns_topic" "agendamentos" {
  name = "${local.name_prefix}-agendamentos-topic"

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-agendamentos-topic"
  })
}

resource "aws_sns_topic_subscription" "sns_para_sqs" {
  topic_arn = aws_sns_topic.agendamentos.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.agendamentos.arn
}

resource "aws_sqs_queue_policy" "allow_sns" {
  queue_url = aws_sqs_queue.agendamentos.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowSNSToSendMessage"
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.agendamentos.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.agendamentos.arn
          }
        }
      }
    ]
  })
}
