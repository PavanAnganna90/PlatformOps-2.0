<div align="center">
<img width="1200" height="475" alt="OpsSight Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# OpsSight

**DevOps Visibility Platform for Home Labs & Enterprise**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Ready-326CE5?logo=kubernetes)](https://kubernetes.io/)

</div>

---

## 🚀 Quick Start

### Option 1: Local Development (Recommended for Learning)

```bash
# 1. Clone the repository
git clone https://github.com/PavanAnganna90/PlatformOps-2.0.git
cd PlatformOps-2.0

# 2. Setup (installs dependencies + creates .env)
make setup

# 3. Start development servers
make dev
```

**That's it!** Open http://localhost:5173 in your browser.

> 💡 **No configuration needed!** The app runs in demo mode with simulated data until you connect real integrations.

### Option 2: Docker (Recommended for Home Lab)

```bash
# 1. Clone and configure
git clone https://github.com/PavanAnganna90/PlatformOps-2.0.git
cd PlatformOps-2.0
cp .env.example .env
# Edit .env with your configuration

# 2. Start with Docker Compose
docker-compose up
```

Open http://localhost:5173 (frontend) and http://localhost:8000/docs (API docs).

### Option 3: Kubernetes (Production-like)

```bash
# Deploy with Helm
helm upgrade --install opssight ./charts/opssight \
  --namespace opssight \
  --create-namespace
```

---

## 📁 Project Structure

```
opssight/
├── apps/
│   ├── api/                 # FastAPI Backend
│   │   ├── app/
│   │   │   ├── api/v1/      # API routes
│   │   │   ├── core/        # Configuration
│   │   │   ├── services/    # Business logic
│   │   │   └── schemas/     # Pydantic models
│   │   ├── Dockerfile
│   │   └── pyproject.toml
│   └── web/                 # (Frontend files at root for now)
│       └── Dockerfile
├── components/              # React components
│   ├── ui/                  # Reusable UI components
│   └── views/               # Page views
├── services/                # Frontend services
│   ├── api/                 # API client
│   └── ...                  # Other services
├── charts/                  # Helm charts
│   └── opssight/
├── docker-compose.yml       # Docker Compose config
├── Makefile                 # Development commands
├── .env.example             # Environment template
└── README.md
```

---

## ⚙️ Configuration

Copy `.env.example` to `.env` and configure:

### Required for Demo Mode
```bash
# Nothing! Demo mode works out of the box
```

### Optional Integrations

```bash
# Backend API (auto-detected)
VITE_API_URL=http://localhost:8000

# Supabase (for authentication)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Gemini AI (for AI assistant)
VITE_GEMINI_API_KEY=your-gemini-api-key

# Kubernetes (uses ~/.kube/config by default)
KUBECONFIG_DEFAULT=/path/to/kubeconfig

# Prometheus
PROMETHEUS_URL=http://prometheus:9090

# ArgoCD
ARGOCD_URL=https://argocd.example.com
ARGOCD_TOKEN=your-token

# GitHub
GITHUB_TOKEN=your-github-token
GITHUB_ORG=your-org
```

---

## 🎯 Features

| Feature | Status | Description |
|---------|--------|-------------|
| **Dashboard** | ✅ | DORA metrics, cluster performance |
| **Infrastructure** | ✅ | K8s nodes, pods, services visualization |
| **CI/CD Pipelines** | ✅ | Pipeline status and stages |
| **Observability** | ✅ | Logs, metrics, traces |
| **Security** | ✅ | Vulnerability scanning |
| **Terraform** | ✅ | IaC workspace management |
| **AI Assistant** | ✅ | Gemini-powered debugging |
| **Multi-Cluster** | ✅ | Switch between K8s clusters |
| **Demo Mode** | ✅ | Works without any backend |

---

## 🛠️ Development Commands

```bash
# Show all available commands
make help

# Development
make dev          # Start frontend + backend
make dev-web      # Start frontend only
make dev-api      # Start backend only

# Docker
make docker       # Build and start containers
make docker-down  # Stop containers

# Testing
make test         # Run all tests
make test-api     # Run backend tests

# Code Quality
make lint         # Run linters
make format       # Format code

# Kubernetes
make k8s-deploy   # Deploy to K8s with Helm
make k8s-delete   # Delete K8s deployment
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     OpsSight Frontend                        │
│                    (React + Vite + Tailwind)                 │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     OpsSight API                             │
│                    (FastAPI + Python)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Kubernetes  │  │ Prometheus  │  │   ArgoCD    │         │
│  │   Client    │  │   Client    │  │   Client    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   GitHub    │  │  Terraform  │  │   Supabase  │         │
│  │   Client    │  │   Cloud     │  │   Client    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Your Infrastructure                       │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │   K8s   │  │  Cloud  │  │  CI/CD  │  │  DBs    │        │
│  │ Cluster │  │   APIs  │  │ Systems │  │         │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ for the DevOps Community**

[Report Bug](https://github.com/PavanAnganna90/PlatformOps-2.0/issues) · [Request Feature](https://github.com/PavanAnganna90/PlatformOps-2.0/issues)

</div>
