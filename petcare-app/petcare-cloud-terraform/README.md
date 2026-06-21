# PetCare Cloud - Terraform AWS

Este projeto contém a estrutura Terraform para provisionar a infraestrutura base do trabalho semestral **PetCare Cloud**, uma plataforma distribuída para gestão de pet shop na AWS.

## O que será criado

A infraestrutura cria:

- VPC;
- Sub-rede pública;
- Internet Gateway;
- Route Table;
- Security Group;
- 1 EC2 para master K3s;
- 2 EC2 para workers K3s;
- Fila SQS;
- Tópico SNS;
- Assinatura SNS para SQS;
- Política permitindo SNS enviar mensagens para SQS;
- Função Lambda em Python;
- IAM Role para Lambda;
- Bucket S3 privado para imagens dos pets.

## Estrutura

```text
petcare-cloud-terraform/
├── README.md
└── infra/
    ├── provider.tf
    ├── variables.tf
    ├── main.tf
    ├── network.tf
    ├── security-groups.tf
    ├── ec2-k3s.tf
    ├── sqs-sns.tf
    ├── lambda.tf
    ├── s3.tf
    ├── outputs.tf
    ├── terraform.tfvars.example
    └── lambda/
        └── index.py
```

## Pré-requisitos

Antes de rodar, você precisa ter instalado:

- Terraform;
- AWS CLI;
- uma conta AWS configurada;
- uma Key Pair criada na AWS para acessar as EC2 via SSH.

Configure suas credenciais AWS com:

```bash
aws configure
```

## Como usar

Entre na pasta da infraestrutura:

```bash
cd infra
```

Inicialize o Terraform:

```bash
terraform init
```

Copie o arquivo de exemplo:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edite o arquivo `terraform.tfvars` e coloque o nome da sua Key Pair da AWS:

```hcl
key_name = "nome-da-sua-chave"
```

Depois rode:

```bash
terraform plan
```

Se estiver tudo certo, aplique:

```bash
terraform apply
```

Digite `yes` quando o Terraform pedir confirmação.

## Como acessar a EC2 master

Após o `terraform apply`, o Terraform exibirá um output parecido com:

```text
master_ssh_command = "ssh -i sua-chave.pem ubuntu@IP_PUBLICO"
```

Use esse comando ajustando o caminho da sua chave `.pem`.

Exemplo:

```bash
ssh -i ~/Downloads/petcare-key.pem ubuntu@IP_PUBLICO
```

## Instalação manual do K3s

Este Terraform cria as máquinas EC2, mas não instala o K3s automaticamente.

No master:

```bash
curl -sfL https://get.k3s.io | sh -
```

Pegue o token:

```bash
sudo cat /var/lib/rancher/k3s/server/node-token
```

Pegue o IP privado do master:

```bash
hostname -I
```

Nos workers, execute:

```bash
curl -sfL https://get.k3s.io | K3S_URL=https://IP_PRIVADO_DO_MASTER:6443 K3S_TOKEN=TOKEN_DO_MASTER sh -
```

No master, confira os nodes:

```bash
sudo kubectl get nodes
```

## Recursos de mensageria

O projeto cria este fluxo:

```text
Backend → SNS Topic → SQS Queue → Worker/Kubernetes → Lambda/CloudWatch
```

Na aplicação, o backend pode publicar eventos de novo agendamento no SNS. O SNS encaminha a mensagem para a fila SQS. Um worker rodando no Kubernetes pode consumir essa fila.

## Como apagar tudo

Depois da apresentação, para evitar custos na AWS, rode:

```bash
terraform destroy
```

Digite `yes` para confirmar.

## Observação importante

Este projeto foi pensado para fins acadêmicos. Para um ambiente de produção, seria recomendado:

- restringir o SSH ao seu IP público;
- usar sub-redes privadas para workers e bancos;
- usar IAM com permissões mínimas;
- usar Load Balancer;
- usar backend remoto para o Terraform State;
- configurar observabilidade completa com CloudWatch, Prometheus e Grafana.
