# 🚀 OpsSight Quick Start Guide

Welcome to OpsSight! This guide will help you get started in minutes.

## 📋 Table of Contents

1. [First Time Setup](#first-time-setup)
2. [Local Development](#local-development)
3. [Cloud Setup (Supabase)](#cloud-setup-supabase)
4. [Configuring Integrations](#configuring-integrations)
5. [Using the App](#using-the-app)

---

## 🎯 First Time Setup

### Option 1: Local Development (Recommended for Testing)

**Perfect for:** Local development, testing, homelab users

1. **Clone and Install**
   ```bash
   git clone <your-repo>
   cd opssight
   npm install
   ```

2. **Start the Backend**
   ```bash
   cd apps/api
   pip install -r requirements.txt
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

3. **Start the Frontend**
   ```bash
   # In project root
   npm run dev
   ```

4. **Access the App**
   - Open `http://localhost:5173`
   - Click "Launch Home Lab Demo" (no account needed)
   - The onboarding modal will appear automatically

### Option 2: Cloud Setup with Supabase (Production)

**Perfect for:** Team collaboration, persistent storage, production use

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Copy your project URL and anon key

2. **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   
   Add to `.env`:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Start the App**
   ```bash
   make dev  # Or use docker-compose up
   ```

4. **Sign Up/Login**
   - Open the app
   - Sign up with email or Google
   - Complete onboarding

---

## ⚙️ Configuring Integrations

### Using the Settings Modal

**The easiest way:** Click the **Settings** icon (⚙️) in the header.

The Settings modal provides a centralized place to configure all integrations:

#### 1. **Cloud Providers Tab**

**AWS:**
- Access Key ID
- Secret Access Key
- Region (default: us-east-1)

**GCP:**
- Project ID
- Credentials Path (optional, for service account JSON)

**Azure:**
- Subscription ID
- Client ID
- Client Secret
- Tenant ID

#### 2. **Integrations Tab**

**GitHub Actions:**
- GitHub Token (Personal Access Token)
- Organization (optional)

**ArgoCD:**
- ArgoCD URL
- ArgoCD Token

**Prometheus:**
- Prometheus URL

**Datadog:**
- API Key
- Application Key
- Site (default: datadoghq.com)

**Terraform Cloud:**
- Terraform Cloud Token
- Organization

### For Local Development

After entering credentials in the Settings modal, **add them to your `.env` file**:

```bash
# Cloud Providers
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1

GCP_PROJECT_ID=your-project-id
GCP_CREDENTIALS_PATH=/path/to/credentials.json

AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-secret
AZURE_TENANT_ID=your-tenant-id

# Integrations
GITHUB_TOKEN=ghp_your-token
ARGOCD_URL=https://argocd.example.com
ARGOCD_TOKEN=your-token
PROMETHEUS_URL=http://prometheus:9090
DATADOG_API_KEY=your-api-key
DATADOG_APP_KEY=your-app-key
TFC_TOKEN=your-tfc-token
TFC_ORG=your-org
```

**Then restart the backend** for changes to take effect.

### For Production (Supabase)

Credentials are stored securely in Supabase. The Settings modal will save them automatically.

---

## 🎮 Using the App

### First Time Experience

1. **Onboarding Flow**
   - Welcome screen appears automatically
   - Click "Get Started"
   - Configure integrations (or skip for now)
   - Complete onboarding

2. **Dashboard**
   - View cluster overview
   - See node and pod counts
   - Monitor real-time metrics

3. **Infrastructure View**
   - Browse all Kubernetes resources
   - Filter by namespace
   - Search resources
   - Click pods for details

4. **Cloud Visibility**
   - View resources from AWS, GCP, Azure
   - Filter by provider, type, region
   - See cost estimates

5. **CI/CD Pipelines**
   - View GitHub Actions workflows
   - Filter by branch/status
   - Click to view on GitHub

6. **GitOps**
   - Monitor ArgoCD applications
   - Check sync status
   - View resource progress

7. **Deployments**
   - Manage Kubernetes deployments
   - Scale replicas
   - Restart deployments

### Key Features

- **Multi-Cluster Support**: Switch between Kubernetes clusters
- **Real-time Updates**: Data refreshes every 30 seconds
- **Demo Mode**: Works without credentials (shows mock data)
- **Settings**: Configure everything in one place
- **Dark Mode**: Toggle theme from header

---

## 🔧 Troubleshooting

### Backend Not Connecting

1. Check if backend is running:
   ```bash
   curl http://localhost:8000/api/v1/health
   ```

2. Check CORS settings in `apps/api/app/core/config.py`

3. Verify `VITE_API_URL` in frontend `.env`

### Credentials Not Working

1. Check `.env` file has correct values
2. Restart backend after changing `.env`
3. Verify credentials in Settings modal
4. Check backend logs for errors

### Onboarding Not Showing

1. Clear localStorage:
   ```javascript
   localStorage.removeItem('opssight_onboarding_complete')
   ```

2. Refresh the page

---

## 📚 Next Steps

- **Explore Views**: Navigate through Dashboard, Infrastructure, Cloud, CI/CD, GitOps
- **Configure Integrations**: Use Settings modal to connect your services
- **Customize**: Adjust theme, cluster selection, filters
- **Monitor**: Watch real-time metrics and resource status

---

## 💡 Tips

1. **Start with Demo Mode**: No setup required, explore all features
2. **Configure Gradually**: Add integrations one at a time
3. **Use Filters**: Narrow down resources by namespace, type, region
4. **Check Status**: Settings modal shows which integrations are configured
5. **Keyboard Shortcuts**: Use ⌘K (Mac) or Ctrl+K (Windows) to search

---

## 🆘 Need Help?

- Check the Settings modal for integration status
- Review backend logs for errors
- Verify credentials are correct
- Ensure ports 8000 (backend) and 5173 (frontend) are available

---

**Happy Monitoring! 🎉**

