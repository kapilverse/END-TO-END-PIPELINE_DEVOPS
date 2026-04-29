# Setup Script for End-to-End CI/CD Pipeline Demo

Write-Host "Starting Local Setup for CI/CD Pipeline Demo" -ForegroundColor Cyan

# 1. Check for Prerequisites
$tools = @("docker", "kubectl", "helm")
foreach ($tool in $tools) {
    if (Get-Command $tool -ErrorAction SilentlyContinue) {
        Write-Host "$tool is installed" -ForegroundColor Green
    } else {
        Write-Host "$tool is not installed. Please install it to proceed." -ForegroundColor Red
        exit
    }
}

# 2. Build local docker image
Write-Host "Building Docker image..." -ForegroundColor Yellow
cd app
docker build -t k8s-cicd-demo-app:local .
cd ..

# 3. Setup Monitoring Namespace
Write-Host "Setting up Monitoring Namespace..." -ForegroundColor Yellow
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

# 4. Install Prometheus
Write-Host "Installing Prometheus..." -ForegroundColor Yellow
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm upgrade --install prometheus prometheus-community/prometheus `
    -f kubernetes/monitoring/prometheus-values.yaml `
    --namespace monitoring

# 5. Install Grafana
Write-Host "Installing Grafana..." -ForegroundColor Yellow
helm repo add grafana https://grafana.github.io/helm-charts
helm upgrade --install grafana grafana/grafana `
    -f kubernetes/monitoring/grafana-values.yaml `
    --namespace monitoring

# 6. Deploy Application
Write-Host "Deploying Application..." -ForegroundColor Yellow
kubectl create namespace production --dry-run=client -o yaml | kubectl apply -f -
helm upgrade --install web-app ./charts/web-app `
    --set image.repository=k8s-cicd-demo-app `
    --set image.tag=local `
    --set image.pullPolicy=Never `
    --namespace production

Write-Host "Setup Complete!" -ForegroundColor Cyan
Write-Host "Access Application: kubectl port-forward svc/web-app 8080:80 -n production"
Write-Host "Access Grafana: kubectl port-forward svc/grafana 3000:80 -n monitoring"
Write-Host "(User: admin, Pass: admin)"
