package config

import (
	"context"
	"log"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/lambda"
	"github.com/aws/aws-sdk-go-v2/service/sns"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
)

type Config struct {
	Port              string
	MongoURI          string
	MongoDatabase     string
	AWSRegion         string
	SQSQueueURL       string
	SNSTopicARN       string
	LambdaFunctionName string
	AWSAccessKeyID    string
	AWSSecretKey      string
	AWSSessionToken   string
}

type AWSClients struct {
	SQS    *sqs.Client
	SNS    *sns.Client
	Lambda *lambda.Client
}

func Load() *Config {
	return &Config{
		Port:              getEnv("APP_PORT", "8080"),
		MongoURI:          getEnv("MONGO_URI", "mongodb://mongodb:27017/petcare"),
		MongoDatabase:     getEnv("MONGO_DATABASE", "petcare"),
		AWSRegion:         getEnv("AWS_REGION", "us-east-1"),
		SQSQueueURL:       getEnv("SQS_QUEUE_URL", ""),
		SNSTopicARN:       getEnv("SNS_TOPIC_ARN", ""),
		LambdaFunctionName: getEnv("LAMBDA_FUNCTION_NAME", "petcare-cloud-processar-agendamento"),
		AWSAccessKeyID:    getEnv("AWS_ACCESS_KEY_ID", ""),
		AWSSecretKey:      getEnv("AWS_SECRET_ACCESS_KEY", ""),
		AWSSessionToken:   getEnv("AWS_SESSION_TOKEN", ""),
	}
}


func NewAWSClients(cfg *Config) *AWSClients {
	var awsCfg aws.Config
	var err error

	if cfg.AWSAccessKeyID != "" && cfg.AWSSecretKey != "" {
		awsCfg, err = awsconfig.LoadDefaultConfig(context.Background(),
			awsconfig.WithRegion(cfg.AWSRegion),
			awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
				cfg.AWSAccessKeyID,
				cfg.AWSSecretKey,
				cfg.AWSSessionToken,
			)),
		)
	} else {
		awsCfg, err = awsconfig.LoadDefaultConfig(context.Background(),
			awsconfig.WithRegion(cfg.AWSRegion),
		)
	}

	if err != nil {
		log.Printf("Aviso: falha ao carregar configuração AWS: %v", err)
		return &AWSClients{}
	}

	return &AWSClients{
		SQS:    sqs.NewFromConfig(awsCfg),
		SNS:    sns.NewFromConfig(awsCfg),
		Lambda: lambda.NewFromConfig(awsCfg),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
