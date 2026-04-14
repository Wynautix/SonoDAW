#!/bin/bash
set -e

# Configuration
PROJECT_ID="talos-dev-480518"
SERVICE_NAME="sonodaw-v1"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "🚀 Starting SonoDAW Cloud Run Deployment..."
echo "Project: ${PROJECT_ID}"
echo "Service: ${SERVICE_NAME}"

# 1. Build and push image using Cloud Build
echo "📦 Building container image with Cloud Build..."
gcloud builds submit --tag ${IMAGE_NAME} . --project ${PROJECT_ID}

# 2. Deploy to Cloud Run
echo "🌍 Deploying to Cloud Run (Region: ${REGION})..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 10 \
  --memory 512Mi \
  --cpu 1 \
  --project ${PROJECT_ID}

echo "✅ Deployment complete!"
gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)' --project ${PROJECT_ID}
