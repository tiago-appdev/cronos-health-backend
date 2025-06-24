# Cronos Health Deployment Script - PowerShell

param(
    [switch]$Clean = $false,
    [switch]$Help = $false,
    [string]$Environment = "development"
)

# Configuration
$FRONTEND_REPO = "https://github.com/tiago-appdev/cronos-health-frontend"
$BACKEND_REPO = "https://github.com/tiago-appdev/cronos-health-backend"
$FRONTEND_DIR = "frontend"
$BACKEND_DIR = "backend"
$COMPOSE_FILE = "docker-compose.yml"

function Show-Help {
    Write-Host @"
Cronos Health Deployment Script

USAGE:
    .\deploy.ps1 [OPTIONS]

OPTIONS:
    -Clean          Clean up containers, images, and repositories before deploying
    -Help           Show this help message
    -Environment    Set environment (default: development)

EXAMPLES:
    .\deploy.ps1                    # Normal deployment
    .\deploy.ps1 -Clean             # Clean deployment
    .\deploy.ps1 -Environment prod  # Production deployment

REQUIREMENTS:
    - Git installed and in PATH
    - Docker Desktop running
    - Internet connection for cloning repos

"@ -ForegroundColor Green
}

function Test-Prerequisites {
    Write-Host "Checking prerequisites..." -ForegroundColor Yellow
    
    # Check Git
    try {
        $gitVersion = git --version 2>$null
        Write-Host "Git found: $gitVersion" -ForegroundColor Green
    }
    catch {
        Write-Error "Git not found. Please install Git and add it to PATH."
        return $false
    }
    
    # Check Docker client
    try {
        $dockerVersion = docker --version 2>$null
        Write-Host "Docker found: $dockerVersion" -ForegroundColor Green
    }
    catch {
        Write-Error "Docker not found. Please install Docker Desktop."
        return $false
    }
    
    # Check Docker daemon
    if (-not (Test-DockerDaemon)) {
        Write-Error "Docker daemon is not running. Please start Docker Desktop."
        return $false
    }
    
    # Detect compose command variant
    $script:composeCommand = $null
    if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
        $script:composeCommand = @("docker-compose")
        $composeVersion = docker-compose --version
        Write-Host "Docker Compose found: $composeVersion" -ForegroundColor Green
    }
    elseif (docker compose version 2>$null) {
        $script:composeCommand = @("docker", "compose")
        $composeVersion = docker compose version
        Write-Host "Docker Compose (v2) found: $composeVersion" -ForegroundColor Green
    }
    else {
        Write-Error "docker-compose not found. Please install Docker Compose."
        return $false
    }
    
    # Check Node.js
    try {
        $nodeVersion = node --version 2>$null
        Write-Host "Node.js found: $nodeVersion" -ForegroundColor Green
        return $true, $true
    }
    catch {
        Write-Host "⚠ Node.js not found locally. Will handle lock files in Docker." -ForegroundColor Yellow
        return $true, $false
    }
}

function Test-DockerDaemon {
    try {
        docker info 2>$null | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Docker daemon not running (exit code: $LASTEXITCODE)" -ForegroundColor Red
            return $false
        }
        return $true
    }
    catch {
        Write-Host "Docker daemon check failed: $_" -ForegroundColor Red
        return $false
    }
}

function Get-OrUpdateRepo {
    param(
        [string]$RepoUrl,
        [string]$TargetDir
    )
    
    if (Test-Path $TargetDir) {
        Write-Host "Updating existing repository: $TargetDir" -ForegroundColor Blue
        Set-Location $TargetDir
        
        try {
            git fetch origin
            git reset --hard origin/main 2>$null
            if ($LASTEXITCODE -ne 0) {
                git reset --hard origin/master
            }
            Write-Host "Repository updated successfully" -ForegroundColor Green
        }
        catch {
            Write-Error "Failed to update repository: $_"
            Set-Location ..
            return $false
        }
        
        Set-Location ..
    }
    else {
        Write-Host "Cloning repository: $RepoUrl" -ForegroundColor Blue
        
        try {
            git clone $RepoUrl $TargetDir
            Write-Host "Repository cloned successfully" -ForegroundColor Green
        }
        catch {
            Write-Error "Failed to clone repository: $_"
            return $false
        }
    }
    
    return $true
}

function New-LockFiles {
    param([bool]$HasNodeJs)
    
    if ($HasNodeJs) {
        Write-Host "Generating package-lock.json files..." -ForegroundColor Blue
        
        # Generate lock file for frontend
        if (Test-Path "$FRONTEND_DIR/package.json") {
            if (-not (Test-Path "$FRONTEND_DIR/package-lock.json")) {
                Write-Host "Generating lock file for frontend..." -ForegroundColor Yellow
                Set-Location $FRONTEND_DIR
                try {
                    npm install --package-lock-only
                    Write-Host "Frontend lock file generated" -ForegroundColor Green
                }
                catch {
                    Write-Host "⚠ Failed to generate frontend lock file, will fix Dockerfile" -ForegroundColor Yellow
                }
                Set-Location ..
            }
        }
        
        # Generate lock file for backend
        if (Test-Path "$BACKEND_DIR/package.json") {
            if (-not (Test-Path "$BACKEND_DIR/package-lock.json")) {
                Write-Host "Generating lock file for backend..." -ForegroundColor Yellow
                Set-Location $BACKEND_DIR
                try {
                    npm install --package-lock-only
                    Write-Host "Backend lock file generated" -ForegroundColor Green
                }
                catch {
                    Write-Host "⚠ Failed to generate backend lock file, will fix Dockerfile" -ForegroundColor Yellow
                }
                Set-Location ..
            }
        }
    }
    
    # Fix Dockerfiles to handle missing lock files
    Fix-Dockerfiles
}

function Fix-Dockerfiles {
    Write-Host "Ensuring Dockerfiles handle missing lock files..." -ForegroundColor Blue
    
    # Fix frontend Dockerfile if needed
    if (Test-Path "$FRONTEND_DIR/Dockerfile") {
        $frontendDockerfile = Get-Content "$FRONTEND_DIR/Dockerfile" -Raw
        if ($frontendDockerfile -match "npm ci.*exit 1") {
            Write-Host "Updating frontend Dockerfile to handle missing lock file..." -ForegroundColor Yellow
            
            $fixedContent = $frontendDockerfile -replace `
                'RUN \\[\s\n]*if \[ -f package-lock\.json \]; then npm ci; \\[\s\n]*else echo "Lockfile not found\." && exit 1; \\[\s\n]*fi', `
                'RUN if [ -f package-lock.json ]; then npm ci; elif [ -f yarn.lock ]; then yarn --frozen-lockfile; else npm install; fi'
            
            $fixedContent | Out-File "$FRONTEND_DIR/Dockerfile" -Encoding UTF8
            Write-Host "Frontend Dockerfile updated" -ForegroundColor Green
        }
    }
    
    # Fix backend Dockerfile if needed
    if (Test-Path "$BACKEND_DIR/Dockerfile") {
        $backendDockerfile = Get-Content "$BACKEND_DIR/Dockerfile" -Raw
        if ($backendDockerfile -match "npm ci --only=production") {
            Write-Host "Updating backend Dockerfile to handle missing lock file..." -ForegroundColor Yellow
            
            $fixedContent = $backendDockerfile -replace `
                'RUN npm ci --only=production && npm cache clean --force', `
                'RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi && npm cache clean --force'
            
            $fixedContent | Out-File "$BACKEND_DIR/Dockerfile" -Encoding UTF8
            Write-Host "Backend Dockerfile updated" -ForegroundColor Green
        }
    }
}

function New-DockerComposeFile {
    Write-Host "Creating main docker-compose.yml..." -ForegroundColor Blue
    
    $composeContent = @"
networks:
  cronos-network:
    driver: bridge

services:
  # Backend services (from backend/docker-compose.yml)
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=$Environment
      - DATABASE_URL=postgresql://postgres:password@db:5432/cronos_health
      - JWT_SECRET=CRONOS_HEALTH_JWT_SECRET
      - JWT_EXPIRATION=1h
    depends_on:
      db:
        condition: service_healthy
    networks:
      - cronos-network
    restart: unless-stopped

  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: cronos_health
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/db:/docker-entrypoint-initdb.d
    networks:
      - cronos-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d cronos_health"]
      interval: 10s
      timeout: 5s
      retries: 5

  seed:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: production
    depends_on:
      db:
        condition: service_healthy
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/cronos_health
      - JWT_SECRET=CRONOS_HEALTH_JWT_SECRET
      - JWT_EXPIRATION=1h
    command: npm run seed
    networks:
      - cronos-network

  # Frontend service
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=$Environment
      - NEXT_PUBLIC_API_URL=http://backend:4000
    depends_on:
      - backend
    networks:
      - cronos-network
    restart: unless-stopped

volumes:
  postgres_data:
"@

    try {
        $composeContent | Out-File -FilePath $COMPOSE_FILE -Encoding UTF8
        Write-Host "Docker Compose file created" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Error "Failed to create Docker Compose file: $_"
        return $false
    }
}

function Start-Services {
    param([switch]$Clean)
    
    # Revalidate Docker daemon
    if (-not (Test-DockerDaemon)) {
        Write-Error "Docker daemon became unavailable during deployment"
        return $false
    }
    
    if ($Clean) {
        Write-Host "Cleaning up existing containers and images..." -ForegroundColor Yellow
        
        # Stop and remove containers
        & $script:composeCommand -f $COMPOSE_FILE down --remove-orphans 2>$null
        
        # Remove images
        & $script:composeCommand -f $COMPOSE_FILE down --rmi all --volumes 2>$null
        
        # Prune unused images
        docker image prune -f 2>$null
        
        Write-Host "Cleanup completed" -ForegroundColor Green
    }
    
    Write-Host "Building and starting services..." -ForegroundColor Blue
    
    try {
        & $script:composeCommand -f $COMPOSE_FILE up --build -d
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Services started successfully!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Services are now running:" -ForegroundColor Cyan
            Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
            Write-Host "  Backend:  http://localhost:4000" -ForegroundColor White
            Write-Host "  Database: localhost:5432" -ForegroundColor White
            Write-Host ""
            Write-Host "To view logs: docker-compose -f $COMPOSE_FILE logs -f" -ForegroundColor Gray
            Write-Host "To stop:     docker-compose -f $COMPOSE_FILE down" -ForegroundColor Gray
        }
        else {
            Write-Error "Failed to start services (exit code: $LASTEXITCODE)"
            return $false
        }
    }
    catch {
        Write-Error "Error starting services: $_"
        return $false
    }
    
    return $true
}

# Main execution
function Main {
    if ($Help) {
        Show-Help
        return
    }
    
    Write-Host "=== Cronos Health Deployment Script ===" -ForegroundColor Magenta
    Write-Host "Environment: $Environment" -ForegroundColor Cyan
    
    # Check prerequisites
    $checkResult = Test-Prerequisites
    if ($checkResult -is [array]) {
        $prerequisitesOk = $checkResult[0]
        $hasNodeJs = $checkResult[1]
    } else {
        $prerequisitesOk = $checkResult
        $hasNodeJs = $false
    }
    
    if (-not $prerequisitesOk) {
        exit 1
    }
    
    # Get or update repositories
    if (-not (Get-OrUpdateRepo -RepoUrl $FRONTEND_REPO -TargetDir $FRONTEND_DIR)) {
        exit 1
    }
    
    if (-not (Get-OrUpdateRepo -RepoUrl $BACKEND_REPO -TargetDir $BACKEND_DIR)) {
        exit 1
    }
    
    # Generate lock files and fix Dockerfiles
    New-LockFiles -HasNodeJs $hasNodeJs
    
    # Create main docker-compose file
    if (-not (New-DockerComposeFile)) {
        exit 1
    }
    
    # Start services
    if (-not (Start-Services -Clean:$Clean)) {
        exit 1
    }
    
    Write-Host ""
    Write-Host "Deployment completed successfully!" -ForegroundColor Green
}

# Run main function
Main