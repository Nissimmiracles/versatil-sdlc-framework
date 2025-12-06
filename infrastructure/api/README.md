# VERSATIL Contextual Engineering API

Multi-platform API for IDE integration (VS Code, Windsurf, Replit, Neovim, JetBrains, etc.)

## Features

- **Agent Detection**: Automatically detects the appropriate VERSATIL agent based on query keywords
- **Emotional Intelligence**: Adapts response style based on user frustration/confusion levels
- **Contextual Engineering**: Provides patterns based on language, framework, and code context
- **Multi-Platform**: Works with any IDE that supports custom AI backends

## Quick Start

### Local Development

```bash
cd infrastructure/api
npm install
npm run dev
```

### Deploy to Cloud Run

```bash
npm run build
npm run deploy
```

Or manually:

```bash
gcloud run deploy versatil-api \
  --source . \
  --region us-central1 \
  --project centering-vine-454613-b3 \
  --allow-unauthenticated
```

## API Endpoints

### Health Check
```
GET /health
```

### List Agents
```
GET /v1/agents
```

### Contextual Assist (Main Endpoint)
```
POST /v1/contextual-assist
Content-Type: application/json

{
  "query": "How do I implement JWT authentication?",
  "context": {
    "language": "typescript",
    "framework": "express",
    "currentFile": "src/api/auth.ts"
  },
  "platform": "vscode",
  "preferences": {
    "verbosity": "detailed",
    "includeTests": true
  }
}
```

### Response Format

```json
{
  "answer": "To implement JWT authentication...",
  "code": "import jwt from 'jsonwebtoken';...",
  "agent_used": "marcus-backend",
  "agent_confidence": 85,
  "pattern": {
    "name": "marcus-backend-pattern",
    "keywords": ["authentication", "jwt"],
    "confidence": 85
  },
  "emotional_context": {
    "detected_state": "normal",
    "adaptations": ["verbosity: detailed", "tone: professional"]
  },
  "suggestions": []
}
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Claude API key | Yes |
| `PORT` | Server port (default: 8080) | No |
| `NODE_ENV` | Environment (development/production) | No |

## Integration Examples

### VS Code (tasks.json)
See `.vscode/tasks.json` in the main project.

### Windsurf
```javascript
// windsurf.config.js
module.exports = {
  ai: {
    provider: 'custom',
    endpoint: 'https://versatil-api-xxx.run.app/v1/contextual-assist'
  }
};
```

### cURL
```bash
curl -X POST https://versatil-api-xxx.run.app/v1/contextual-assist \
  -H "Content-Type: application/json" \
  -d '{"query": "write unit tests", "platform": "curl"}'
```

## Architecture

```
Request → Agent Detection → Emotional Analysis → Claude API → Formatted Response
             ↓                    ↓
        Keywords Match      Frustration/Confusion
             ↓                    ↓
        maria-qa/            Response Style
        james-frontend/      (concise/detailed/
        marcus-backend/       empathetic)
        etc.
```

## License

MIT - Part of VERSATIL SDLC Framework
