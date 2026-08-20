#!/bin/bash
# Copyright 2026 Google LLC
# Script to deploy the Vertex AI accessibility microservice Cloud Function to Google Cloud Platform

FUNCTION_NAME="generateAiSuggestions"
REGION="us-central1"
RUNTIME="nodejs20"

echo "Deploying ${FUNCTION_NAME} to GCP Vertex AI in region ${REGION}..."

gcloud functions deploy ${FUNCTION_NAME} \
  --gen2 \
  --region=${REGION} \
  --runtime=${RUNTIME} \
  --entry-point=${FUNCTION_NAME} \
  --trigger-http \
  --allow-unauthenticated \
  --max-instances=10

echo "Deployment finished. Use the printed HTTP Trigger URL in your Apps Script ScriptProperties as 'cloudFunctionUrl'."
