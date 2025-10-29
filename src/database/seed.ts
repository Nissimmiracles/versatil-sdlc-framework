/**
 * Database Seeding Script
 * Populates database with sample data for development/testing
 */

import { PrismaClient, WorkflowStatus, DatasetType, ModelType, TrainingJobStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data (development only!)
  if (process.env.NODE_ENV === 'development') {
    console.log('🗑️  Clearing existing data...');
    await prisma.prediction.deleteMany();
    await prisma.deployment.deleteMany();
    await prisma.endpoint.deleteMany();
    await prisma.serviceDeployment.deleteMany();
    await prisma.cloudRunService.deleteMany();
    await prisma.patternRecognitionJob.deleteMany();
    await prisma.modelVersion.deleteMany();
    await prisma.trainingJob.deleteMany();
    await prisma.experiment.deleteMany();
    await prisma.model.deleteMany();
    await prisma.datasetVersion.deleteMany();
    await prisma.dataset.deleteMany();
    await prisma.workflow.deleteMany();
  }

  // Seed Workflow
  console.log('📋 Creating sample workflow...');
  const workflow = await prisma.workflow.create({
    data: {
      name: 'Image Classification Pipeline',
      description: 'End-to-end workflow for image classification using Vertex AI',
      status: WorkflowStatus.ACTIVE,
      createdBy: 'system',
      config: {
        nodes: [
          { id: 'dataset', type: 'dataset-loader' },
          { id: 'preprocess', type: 'preprocessor' },
          { id: 'train', type: 'trainer' },
          { id: 'deploy', type: 'deployer' },
        ],
        edges: [
          { source: 'dataset', target: 'preprocess' },
          { source: 'preprocess', target: 'train' },
          { source: 'train', target: 'deploy' },
        ],
      },
    },
  });

  // Seed Dataset
  console.log('📊 Creating sample dataset...');
  const dataset = await prisma.dataset.create({
    data: {
      name: 'CIFAR-10 Sample',
      description: '1000 images from CIFAR-10 dataset',
      type: DatasetType.IMAGE,
      size: BigInt(52428800), // 50MB
      rowCount: 1000,
      storagePath: 'gs://YOUR_PROJECT-ml-datasets-dev/cifar10-sample',
      format: 'tfrecord',
      schema: {
        features: {
          image: { type: 'image', shape: [32, 32, 3] },
          label: { type: 'int', classes: 10 },
        },
      },
      stats: {
        mean: [0.4914, 0.4822, 0.4465],
        std: [0.2470, 0.2435, 0.2616],
      },
      tags: ['cifar10', 'classification', 'sample'],
      workflowId: workflow.id,
      versions: {
        create: [
          {
            version: 1,
            description: 'Initial version',
            storagePath: 'gs://YOUR_PROJECT-ml-datasets-dev/cifar10-sample/v1',
            size: BigInt(52428800),
            checksum: 'abc123def456',
            changes: { initial: true },
          },
        ],
      },
    },
  });

  // Seed Model
  console.log('🤖 Creating sample model...');
  const model = await prisma.model.create({
    data: {
      name: 'CIFAR-10 CNN Classifier',
      description: 'Convolutional neural network for CIFAR-10 classification',
      type: ModelType.CLASSIFICATION,
      framework: 'TensorFlow',
      architecture: {
        layers: [
          { type: 'Conv2D', filters: 32, kernel_size: 3 },
          { type: 'MaxPooling2D', pool_size: 2 },
          { type: 'Conv2D', filters: 64, kernel_size: 3 },
          { type: 'MaxPooling2D', pool_size: 2 },
          { type: 'Flatten' },
          { type: 'Dense', units: 128, activation: 'relu' },
          { type: 'Dense', units: 10, activation: 'softmax' },
        ],
      },
      hyperparameters: {
        learning_rate: 0.001,
        batch_size: 32,
        epochs: 10,
        optimizer: 'adam',
      },
      tags: ['cnn', 'classification', 'cifar10'],
      workflowId: workflow.id,
    },
  });

  // Seed Experiment
  console.log('🧪 Creating sample experiment...');
  const experiment = await prisma.experiment.create({
    data: {
      name: 'Hyperparameter Tuning - Learning Rate',
      description: 'Testing different learning rates: 0.0001, 0.001, 0.01',
      status: 'COMPLETED',
      config: {
        hyperparameters: {
          learning_rate: [0.0001, 0.001, 0.01],
        },
        metric: 'val_accuracy',
      },
      workflowId: workflow.id,
      completedAt: new Date(),
    },
  });

  // Seed Training Job
  console.log('🏋️ Creating sample training job...');
  const trainingJob = await prisma.trainingJob.create({
    data: {
      displayName: 'CIFAR-10 Training - LR 0.001',
      trainingInput: {
        hyperparameters: {
          learning_rate: 0.001,
          batch_size: 32,
          epochs: 10,
        },
      },
      containerSpec: {
        imageUri: 'gcr.io/YOUR_PROJECT/ml-training:latest',
        args: ['--model=cnn', '--dataset=cifar10'],
      },
      machineType: 'n1-standard-4',
      acceleratorType: 'NVIDIA_TESLA_T4',
      acceleratorCount: 1,
      status: TrainingJobStatus.SUCCEEDED,
      startTime: new Date(Date.now() - 3600000), // 1 hour ago
      endTime: new Date(Date.now() - 1800000), // 30 minutes ago
      duration: 1800, // 30 minutes
      vertexJobId: 'projects/123/locations/us-central1/customJobs/456',
      vertexJobName: 'cifar10-training-001',
      logsPath: 'gs://YOUR_PROJECT-ml-training-dev/logs/cifar10-001',
      artifactsPath: 'gs://YOUR_PROJECT-ml-models-dev/cifar10-cnn/v1',
      experimentId: experiment.id,
      datasetId: dataset.id,
    },
  });

  // Seed Model Version
  console.log('📦 Creating sample model version...');
  const modelVersion = await prisma.modelVersion.create({
    data: {
      version: 1,
      description: 'First production model',
      storagePath: 'gs://YOUR_PROJECT-ml-models-dev/cifar10-cnn/v1',
      artifactUri: 'projects/123/locations/us-central1/models/456',
      size: BigInt(104857600), // 100MB
      checksum: 'def789ghi012',
      metrics: {
        accuracy: 0.89,
        precision: 0.87,
        recall: 0.88,
        f1_score: 0.875,
        val_accuracy: 0.85,
      },
      trainingDuration: 1800,
      status: 'DEPLOYED',
      deployedAt: new Date(),
      modelId: model.id,
      trainingJobId: trainingJob.id,
    },
  });

  // Seed Endpoint
  console.log('🔌 Creating sample endpoint...');
  const endpoint = await prisma.endpoint.create({
    data: {
      name: 'CIFAR-10 Production Endpoint',
      description: 'Production endpoint for CIFAR-10 classification',
      vertexEndpointId: 'projects/123/locations/us-central1/endpoints/789',
      vertexEndpointName: 'cifar10-prod',
      region: 'us-central1',
      status: 'ACTIVE',
      modelId: model.id,
    },
  });

  // Seed Deployment
  console.log('🚀 Creating sample deployment...');
  const deployment = await prisma.deployment.create({
    data: {
      trafficSplit: 100,
      minReplicas: 1,
      maxReplicas: 5,
      machineType: 'n1-standard-2',
      acceleratorType: 'NVIDIA_TESLA_T4',
      acceleratorCount: 1,
      status: 'DEPLOYED',
      endpointId: endpoint.id,
      modelVersionId: modelVersion.id,
    },
  });

  // Seed Predictions
  console.log('🔮 Creating sample predictions...');
  await prisma.prediction.createMany({
    data: [
      {
        input: { image_base64: 'iVBORw0KGgoAAAANSUhEUgAA...' },
        output: { class: 'dog', confidence: 0.92, probabilities: [0.01, 0.02, 0.92, 0.03, 0.01, 0.005, 0.005, 0.0, 0.0, 0.0] },
        latency: 45,
        confidence: 0.92,
        status: 'COMPLETED',
        completedAt: new Date(),
        endpointId: endpoint.id,
        modelVersionId: modelVersion.id,
      },
      {
        input: { image_base64: 'iVBORw0KGgoAAAANSUhEUgBB...' },
        output: { class: 'cat', confidence: 0.88, probabilities: [0.02, 0.88, 0.05, 0.02, 0.01, 0.01, 0.01, 0.0, 0.0, 0.0] },
        latency: 42,
        confidence: 0.88,
        status: 'COMPLETED',
        completedAt: new Date(),
        endpointId: endpoint.id,
        modelVersionId: modelVersion.id,
      },
    ],
  });

  // Seed Pattern Recognition Job
  console.log('🔍 Creating sample pattern recognition job...');
  await prisma.patternRecognitionJob.create({
    data: {
      name: 'Anomaly Detection - Production Data',
      type: 'ANOMALY',
      config: {
        algorithm: 'isolation_forest',
        contamination: 0.1,
      },
      inputPath: 'gs://YOUR_PROJECT-ml-datasets-dev/production-logs',
      outputPath: 'gs://YOUR_PROJECT-ml-datasets-dev/anomalies',
      results: {
        anomalies_detected: 42,
        anomaly_rate: 0.084,
        confidence: 0.87,
      },
      status: 'COMPLETED',
      startTime: new Date(Date.now() - 600000), // 10 minutes ago
      endTime: new Date(Date.now() - 300000), // 5 minutes ago
      duration: 300, // 5 minutes
    },
  });

  // Seed Cloud Run Service
  console.log('☁️  Creating sample Cloud Run service...');
  const cloudRunService = await prisma.cloudRunService.create({
    data: {
      name: 'ml-prediction-api',
      description: 'REST API for ML predictions',
      image: 'gcr.io/YOUR_PROJECT/ml-api:latest',
      region: 'us-central1',
      cpu: '1000m',
      memory: '512Mi',
      envVars: {
        MODEL_PATH: 'gs://YOUR_PROJECT-ml-models-dev/cifar10-cnn/v1',
        BATCH_SIZE: '32',
      },
      secrets: {
        GCP_SA_KEY: 'projects/123/secrets/ml-api-key/versions/latest',
      },
      status: 'ACTIVE',
      url: 'https://ml-prediction-api-abcdefg-uc.a.run.app',
    },
  });

  // Seed Service Deployment
  console.log('📤 Creating sample service deployment...');
  await prisma.serviceDeployment.create({
    data: {
      revision: 'ml-prediction-api-00001-abc',
      trafficPercent: 100,
      image: 'gcr.io/YOUR_PROJECT/ml-api:v1.0.0',
      tag: 'v1.0.0',
      status: 'DEPLOYED',
      deployedAt: new Date(),
      serviceId: cloudRunService.id,
    },
  });

  console.log('✅ Database seeding complete!');
  console.log('\n📊 Summary:');
  console.log('   - 1 Workflow');
  console.log('   - 1 Dataset (with 1 version)');
  console.log('   - 1 Model (with 1 version)');
  console.log('   - 1 Experiment');
  console.log('   - 1 Training Job');
  console.log('   - 1 Endpoint');
  console.log('   - 1 Deployment');
  console.log('   - 2 Predictions');
  console.log('   - 1 Pattern Recognition Job');
  console.log('   - 1 Cloud Run Service (with 1 deployment)');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
