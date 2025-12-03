# OpsSight API

FastAPI backend for the OpsSight DevOps Visibility Platform.

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Or with dev dependencies
pip install -e ".[dev]"

# Run the server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

When running in debug mode, API docs are available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Endpoints

### Health
- `GET /api/v1/health` - Health check
- `GET /api/v1/health/live` - Kubernetes liveness probe
- `GET /api/v1/health/ready` - Kubernetes readiness probe

### Configuration
- `GET /api/v1/config/status` - Get configuration status
- `GET /api/v1/config/integrations` - Get integration details

### Kubernetes
- `GET /api/v1/kubernetes/clusters` - List clusters
- `GET /api/v1/kubernetes/clusters/{name}` - Get cluster details
- `GET /api/v1/kubernetes/nodes` - List nodes
- `GET /api/v1/kubernetes/namespaces` - List namespaces
- `GET /api/v1/kubernetes/pods` - List pods

## Environment Variables

See `.env.example` in the project root for all configuration options.

## Testing

```bash
# Run tests
pytest -v

# With coverage
pytest -v --cov=app --cov-report=term-missing
```

## Docker

```bash
# Build
docker build -t opssight-api .

# Run
docker run -p 8000:8000 opssight-api
```

