---
description: "Activate Dr.AI-ML for machine learning and AI work"
argument-hint: "[task description]"
model: "claude-sonnet-4-5"
allowed-tools:
  - "mcp__claude-opera__versatil_activate_agent"
  - "Read"
  - "Write"
  - "Edit"
  - "Grep"
  - "Glob"
  - "Bash"
---

# Activate Dr.AI-ML - Machine Learning & AI Specialist

Invoke the Dr.AI-ML agent via VERSATIL MCP for machine learning, AI development, and data science work.

## User Request

$ARGUMENTS

## Agent Invocation

Invoke the VERSATIL MCP tool to activate Dr.AI-ML:

!mcp__claude-opera__versatil_activate_agent agentId=dr-ai-ml filePath=$CURSOR_FILE

## Dr.AI-ML Capabilities

Dr.AI-ML is the Machine Learning and AI Specialist for VERSATIL OPERA. Their expertise includes:

- **ML Development**: TensorFlow, PyTorch, scikit-learn, JAX
- **Model Training**: Supervised, unsupervised, reinforcement learning
- **Deep Learning**: CNNs, RNNs, Transformers, attention mechanisms
- **NLP**: Text classification, NER, sentiment analysis, LLMs
- **Computer Vision**: Object detection, segmentation, image classification
- **Feature Engineering**: Data preprocessing, feature selection, dimensionality reduction
- **MLOps**: Model versioning, CI/CD pipelines, deployment automation
- **Production ML**: Model serving, scaling, monitoring, drift detection
- **Vector Databases**: Embeddings, similarity search via Vertex AI MCP
- **Explainability**: SHAP, LIME, model interpretability

## ML Stack

- Python: NumPy, pandas, scikit-learn, scipy
- Deep Learning: TensorFlow, PyTorch, JAX, Keras
- Notebooks: Jupyter, JupyterLab for experimentation
- Deployment: Docker, Kubernetes, model serving
- Vertex AI MCP: Google Cloud AI services integration

## Example Usage

```bash
/dr-ai-ml Train classification model for churn prediction
/dr-ai-ml Optimize model performance for production
/dr-ai-ml Deploy trained model to production API
/dr-ai-ml Analyze model drift and retrain if needed
/dr-ai-ml Create vector embeddings for semantic search
```