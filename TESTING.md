# OpsSight End-to-End Testing Guide

This guide details how to test the full deployment pipeline locally within your IDE using Docker, Helm, and a local Kubernetes cluster (Minikube, Kind, or Docker Desktop).

---

## 1. Prerequisites

Ensure you have the following installed in your CLI/IDE:
- **Node.js** v18+
- **Docker** (Running)
- **Helm** (v3+)
- **Kubectl** (Configured to a local context like `docker-desktop` or `minikube`)

---

## 2. Phase 1: Local Application Testing

Before containerizing, ensure the app runs with the correct environment variables.

1. **Create a local `.env` file** in the root directory:
   ```bash
   # .env
   VITE_API_KEY=your_gemini_api_key_here
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_key_here
   ```

2. **Run Development Server**:
   ```bash
   npm install
   npm run dev
   ```

3. **Verify**:
   - Open `http://localhost:5173`.
   - **Login**: Click "Launch Home Lab Demo".
   - **AI Chat**: Open the bot (bottom right) and type "Hello". It should respond using the API Key.
   - **Refresh**: Refresh the page while on `/dashboard`. If it loads, routing is working.

---

## 3. Phase 2: Docker Container Testing

Test if the multi-stage build correctly bakes in environment variables and if Nginx handles the SPA routing.

1. **Build the Image** (Injecting secrets as build-args):
   ```bash
   docker build \
     --build-arg VITE_API_KEY=test_key \
     --build-arg VITE_SUPABASE_URL=https://test.supabase.co \
     --build-arg VITE_SUPABASE_ANON_KEY=test_key \
     -t opssight:local .
   ```
   *> Note: You can use real keys if you want to test actual functionality, or dummy keys to test the build process.*

2. **Run the Container**:
   ```bash
   docker run --rm -p 8080:80 --name opssight-test opssight:local
   ```

3. **Verify**:
   - Open `http://localhost:8080`.
   - **Check Routing**: Navigate to the "Infrastructure" tab. Refresh the browser.
     - ✅ **Pass**: Page reloads correctly (Nginx `try_files` working).
     - ❌ **Fail**: 404 Not Found (Nginx config issue).

---

## 4. Phase 3: Helm & Kubernetes Testing

Test if the Helm chart renders correctly and deploys to a local cluster.

### A. Linting & Dry Run
Check for syntax errors in your templates without deploying.

1. **Lint the Chart**:
   ```bash
   helm lint ./charts/opssight
   ```
   *> Expect: "1 chart(s) linted, 0 chart(s) failed"*

2. **Dry Run (Render Templates)**:
   ```bash
   helm install --dry-run --debug opssight-test ./charts/opssight
   ```
   *> Expect: Full YAML output of Deployment and Service.*

### B. Local Deployment
Deploy to your local Kubernetes cluster (Docker Desktop / Minikube).

1. **Load Image (Optional)**:
   If using Minikube or Kind, load the docker image so K8s can find it without pulling from GHCR:
   ```bash
   # If using Minikube
   minikube image load opssight:local
   
   # If using Docker Desktop K8s, it shares the local image cache automatically.
   ```

2. **Install Chart**:
   Override the image to use your local build.
   ```bash
   helm upgrade --install opssight-local ./charts/opssight \
     --set image.repository=opssight \
     --set image.tag=local \
     --set image.pullPolicy=Never \
     --create-namespace \
     --namespace opssight-test
   ```

3. **Verify Pods**:
   ```bash
   kubectl get pods -n opssight-test
   ```
   *> Wait until STATUS is `Running`.*

4. **Port Forward** (to access the service locally):
   ```bash
   kubectl port-forward svc/opssight-local 9090:80 -n opssight-test
   ```
   - Open `http://localhost:9090`.

---

## 5. Phase 4: CI/CD Pipeline (GitHub Actions)

Since we cannot run GitHub Actions locally without specific tools (like `nektos/act`), we verify by pushing.

1. **Check Workflow Syntax**:
   Ensure `.github/workflows/ci-cd.yaml` references the correct secrets.

2. **Trigger Pipeline**:
   ```bash
   git add .
   git commit -m "chore: trigger ci pipeline"
   git push origin main
   ```

3. **Monitor**:
   - Go to your GitHub Repository -> **Actions** tab.
   - Watch the `build-and-push` job.
   - **Verify**:
     1. Docker build succeeds.
     2. Image is pushed to `ghcr.io`.

---

## 6. Troubleshooting Common Issues

| Issue | Check |
|-------|-------|
| **Blank Screen** | Usually caused by missing VITE env vars during `docker build`. Check `--build-arg`. |
| **404 on Refresh** | Nginx config missing `try_files $uri $uri/ /index.html;`. |
| **ImagePullBackOff** | K8s cannot find the image. Ensure you ran `minikube image load` or set `pullPolicy=Never` for local tests. |
| **Helm Error: nil pointer** | Often due to missing values in `values.yaml` or incorrect template logic in `_helpers.tpl`. |
