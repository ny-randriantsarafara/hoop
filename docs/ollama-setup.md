# Ollama Setup Guide

HoopAdmin uses [Ollama](https://ollama.com) to extract player and license data from document photos (birth certificates, license cards, ID cards). This guide covers installation, model setup, and configuration.

## Requirements

- 8 GB RAM minimum (for a 7B+ vision model)
- ~5 GB disk space for the model weights
- Linux, macOS, or Windows (WSL2)

## 1. Install Ollama

### macOS

```bash
brew install ollama
```

### Linux (Ubuntu/Debian)

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Docker (VPS / production)

```bash
docker run -d \
  --name ollama \
  -p 11434:11434 \
  -v ollama_data:/root/.ollama \
  --restart unless-stopped \
  ollama/ollama
```

## 2. Pull a Vision Model

The default model is `gemma3`. Pull it after installing Ollama:

```bash
ollama pull gemma3
```

This downloads ~5 GB. The model supports image understanding and structured JSON output.

### Alternative models

Any Ollama-compatible vision model works. Set `OLLAMA_MODEL` in your `.env` to switch:

| Model | Size | Notes |
|-------|------|-------|
| `gemma3` | ~5 GB | Default. Good balance of speed and accuracy. |
| `llama3.2-vision` | ~8 GB | Larger, potentially more accurate. Needs 8+ GB RAM. |
| `llava` | ~5 GB | Older but well-tested vision model. |
| `moondream` | ~2 GB | Lightweight, faster, less accurate. Good for low-RAM setups. |

## 3. Start Ollama

### Locally (development)

```bash
ollama serve
```

Ollama listens on `http://localhost:11434` by default. Verify it's running:

```bash
curl http://localhost:11434/api/tags
```

### Docker (production)

If you used the Docker command above, Ollama is already running. To pull a model inside the container:

```bash
docker exec ollama ollama pull gemma3
```

## 4. Configure HoopAdmin

Add these environment variables to `apps/api/.env`:

```bash
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma3
```

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | URL where Ollama is running |
| `OLLAMA_MODEL` | `gemma3` | Vision model to use for OCR extraction |

Both variables have defaults, so the OCR feature works without setting them as long as Ollama is running on localhost.

## 5. Verify the Setup

Start the API and send a test request:

```bash
# Start the API
pnpm dev:api

# Test OCR extraction (requires auth token)
curl -X POST http://localhost:3001/api/ocr/extract \
  -H "Authorization: Bearer <your-jwt-token>" \
  -F "file=@/path/to/document.jpg"
```

A successful response looks like:

```json
{
  "extractionId": "uuid-here",
  "confidence": "high",
  "player": {
    "firstName": "Jean",
    "lastName": "Dupont",
    "birthDate": "2010-05-15",
    "gender": "G",
    "address": "12 Rue de Paris",
    "phone": null,
    "email": null
  },
  "license": {
    "number": null,
    "category": null,
    "startDate": null,
    "endDate": null
  }
}
```

## Troubleshooting

### 503 — "OCR service is unreachable"

Ollama is not running or the URL is wrong.

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If using Docker, check the container
docker ps | grep ollama
docker logs ollama
```

### 422 — "Ollama returned 404: model not found"

The model hasn't been pulled yet.

```bash
ollama pull gemma3
```

### Slow first request

The first request after starting Ollama loads the model into memory (~10-20s). Subsequent requests are faster (~5-15s depending on document complexity and hardware).

### Out of memory

The model doesn't fit in RAM. Try a smaller model:

```bash
ollama pull moondream
```

Then set `OLLAMA_MODEL=moondream` in your `.env`.

## Production (VPS with Docker Compose)

To add Ollama alongside the existing services in `docker-compose.yml`:

```yaml
services:
  ollama:
    image: ollama/ollama
    restart: always
    ports:
      - '127.0.0.1:11434:11434'
    volumes:
      - ollama_data:/root/.ollama

  api:
    environment:
      OLLAMA_BASE_URL: http://ollama:11434
      OLLAMA_MODEL: ${OLLAMA_MODEL:-gemma3}
    depends_on:
      - ollama

volumes:
  ollama_data:
```

After `docker compose up -d`, pull the model:

```bash
docker compose exec ollama ollama pull gemma3
```
