variable "aws_region" {
  description = "Região da AWS onde os recursos serão criados."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Nome base do projeto. Será usado para nomear recursos na AWS."
  type        = string
  default     = "petcare-cloud"
}

variable "instance_type" {
  description = "Tipo das instâncias EC2 utilizadas no cluster K3s."
  type        = string
  default     = "t3.micro"
}

variable "key_name" {
  description = "Nome da Key Pair já criada na AWS para acessar as EC2 via SSH."
  type        = string
}

variable "allowed_ssh_cidr" {
  description = "CIDR autorizado a acessar SSH. Para testes acadêmicos pode usar 0.0.0.0/0, mas o ideal é usar seu IP público /32."
  type        = string
  default     = "0.0.0.0/0"
}

variable "common_tags" {
  description = "Tags padrão aplicadas aos recursos."
  type        = map(string)
  default = {
    Project = "petcare-cloud"
    Purpose = "faculdade"
  }
}
