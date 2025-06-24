#!/bin/bash

# Cronos Health Deployment Script - Bash (Linux)

# Default values
CLEAN=false
HELP=false
ENVIRONMENT="development"

# Configuration
FRONTEND_REPO="https://github.com/tiago-appdev/cronos-health-frontend"
BACKEND_REPO="https://github.com/tiago-appdev/cronos-health-backend"
FRONTEND_DIR="frontend"
BACKEND_DIR="backend"
COMPOSE_FILE="docker-compose.yml"

# Parse command-line arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        -c|--clean)
            CLEAN=true
            shift
            ;;
        -h|--help)
            HELP=true
            shift
            ;;
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

show_help() {
    cat << EOF
Cronos Health Deployment Script

USAGE:
    ./deploy.sh [OPTIONS]

OPTIONS:
    -c, --clean       Clean up containers, images, and repositories before deploying
    -h, --help        Show this help message
    -e, --environment Set environment (default: development)

EXAMPLES:
    ./deploy.sh                     # Normal deployment
    ./deploy.sh --clean             # Clean deployment
    ./deploy.sh --environment prod  # Production deployment

REQUIREMENTS:
    - Git installed
    - Docker and Docker Compose installed
    - Internet connection for cloning repos

EOF
}

test_prerequisites() {
    echo -e "\033[33mChecking prerequisites...\033[0m"
    
    # Check Git
    if command -v git &> /dev/null; then
        git_version=$(git --version 2>/dev/null)
        echo -e "\033[32mGit found: $git_version\033[0m"
    else
        echo -e "\033[31mGit not found. Please install Git.\033[0m" >&2
        return 1
    fi
    
    # Check Docker
    if command -v docker &> /dev/null; then
        docker_version=$(docker --version 2>/dev/null)
        echo -e "\033[32mDocker found: $docker_version\033[0m"
    else
        echo -e "\033[31mDocker not found. Please install Docker.\033[0m" >&2
        return 1
    fi
    
    # Check Docker Compose
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
        compose_version=$(docker-compose --version 2>/dev/null)
        echo -e "\033[32mDocker Compose found: $compose_version\033[0m"
    elif docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
        compose_version=$(docker compose version 2>/dev/null)
        echo -e "\033[32mDocker Compose (v2) found: $compose_version\033[0m"
    else
        echo -e "\033[31mDocker Compose not found. Please install Docker Compose.\033[0m" >&2
        return 1
    fi
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        echo -e "\033[31mDocker daemon not running. Please start Docker.\033[0m" >&2
        return 1
    fi
    
    # Check Node.js
    if command -v node &> /dev/null; then
        node_version=$(node --version 2>/dev/null)
        echo -e "\033[32mNode.js found: $node_version\033[0m"
        return 0  # Node.js available
    else
        echo -e "\033[33m⚠ Node.js not found locally. Will handle lock files in Docker.\033[0m" >&2
        return 2  # Prerequisites OK but Node.js not available
    fi
}

get_or_update_repo() {
    local repo_url="$1"
    local target_dir="$2"
    
    if [ -d "$target_dir" ]; then
        echo -e "\033[34mUpdating existing repository: $target_dir\033[0m"
        cd "$target_dir" || return 1
        
        if ! git fetch origin; then
            echo -e "\033[31mFailed to fetch updates for repository\033[0m" >&2
            cd ..
            return 1
        fi
        
        # Try resetting to main first, then try master
        if ! git reset --hard origin/main 2>/dev/null; then
            if ! git reset --hard origin/master 2>/dev/null; then
                echo -e "\033[31mFailed to reset repository to main/master\033[0m" >&2
                cd ..
                return 1
            fi
        fi
        
        echo -e "\033[32mRepository updated successfully\033[0m"
        cd ..
    else
        echo -e "\033[34mCloning repository: $repo_url\033[0m"
        if ! git clone "$repo_url" "$target_dir"; then
            echo -e "\033[31mFailed to clone repository\033[0m" >&2
            return 1
        fi
        echo -e "\033[32mRepository cloned successfully\033[0m"
    fi
    
    return 0
}

fix_dockerfiles() {
    echo -e "\033[34mEnsuring Dockerfiles handle missing lock files...\033[0m"
    
    # Fix frontend Dockerfile if needed
    if [ -f "$FRONTEND_DIR/Dockerfile" ]; then
        if grep -q "npm ci.*exit 1" "$FRONTEND_DIR/Dockerfile"; then
            echo -e "\033[33mUpdating frontend Dockerfile to handle missing lock file...\033[0m"
            sed -i 's/RUN \\[\s\n]*if \[ -f package-lock\.json \]; then npm ci; \\[\s\n]*else echo "Lockfile not found\." && exit 1; \\[\s\n]*fi/RUN if [ -f package-lock.json ]; then npm ci; elif [ -f yarn.lock ]; then yarn --frozen-lockfile; else npm install; fi/' "$FRONTEND_DIR/Dockerfile"
            echo -e "\033[32mFrontend Dockerfile updated\033[0m"
        fi
    fi
    
    # Fix backend Dockerfile if needed
    if [ -f "$BACKEND_DIR/Dockerfile" ]; then
        if grep -q "npm ci --only=production" "$BACKEND_DIR/Dockerfile"; then
            echo -e "\033[33mUpdating backend Dockerfile to handle missing lock file...\033[0m"
            sed -i 's/RUN npm ci --only=production && npm cache clean --force/RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi \&\& npm cache clean --force/' "$BACKEND_DIR/Dockerfile"
            echo -e "\033[32mBackend Dockerfile updated\033[0m"
        fi
    fi
}

new_lock_files() {
    local has_node_js="$1"
    
    if $has_node_js; then
        echo -e "\033[34mGenerating package-lock.json files...\033[0m"
        
        # Generate lock file for frontend
        if [ -f "$FRONTEND_DIR/package.json" ] && [ ! -f "$FRONTEND_DIR/package-lock.json" ]; then
            echo -e "\033[33mGenerating lock file for frontend...\033[0m"
            cd "$FRONTEND_DIR" || return
            if npm install --package-lock-only; then
                echo -e "\033[32mFrontend lock file generated\033[0m"
            else
                echo -e "\033[33m⚠ Failed to generate frontend lock file, will fix Dockerfile\033[0m" >&2
            fi
            cd ..
        fi
        
        # Generate lock file for backend
        if [ -f "$BACKEND_DIR/package.json" ] && [ ! -f "$BACKEND_DIR/package-lock.json" ]; then
            echo -e "\033[33mGenerating lock file for backend...\033[0m"
            cd "$BACKEND_DIR" || return
            if npm install --package-lock-only; then
                echo -e "\033[32mBackend lock file generated\033[0m"
            else
                echo -e "\033[33m⚠ Failed to generate backend lock file, will fix Dockerfile\033[0m" >&2
            fi
            cd ..
        fi
    fi
    
    # Fix Dockerfiles to handle missing lock files
    fix_dockerfiles
}

new_docker_compose_file() {
    echo -e "\033[34mCreating main docker-compose.yml...\033[0m"
    
    cat << EOF > "$COMPOSE_FILE"
networks:
  cronos-network:
    driver: bridge

services:
  # Backend services
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=$ENVIRONMENT
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
      - NODE_ENV=$ENVIRONMENT
      - NEXT_PUBLIC_API_URL=http://backend:4000
    depends_on:
      - backend
    networks:
      - cronos-network
    restart: unless-stopped

volumes:
  postgres_data:
EOF

    if [ $? -eq 0 ]; then
        echo -e "\033[32mDocker Compose file created\033[0m"
        return 0
    else
        echo -e "\033[31mFailed to create Docker Compose file\033[0m" >&2
        return 1
    fi
}

start_services() {
    local clean="$1"
    
    # Revalidate Docker daemon
    if ! docker info &> /dev/null; then
        echo -e "\033[31mDocker daemon became unavailable during deployment\033[0m" >&2
        return 1
    fi
    
    if $clean; then
        echo -e "\033[33mCleaning up existing containers and images...\033[0m"
        
        # Stop and remove containers
        $COMPOSE_CMD -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null
        
        # Remove images
        $COMPOSE_CMD -f "$COMPOSE_FILE" down --rmi all --volumes 2>/dev/null
        
        # Prune unused images
        docker image prune -f 2>/dev/null
        
        echo -e "\033[32mCleanup completed\033[0m"
    fi
    
    echo -e "\033[34mBuilding and starting services...\033[0m"
    
    if $COMPOSE_CMD -f "$COMPOSE_FILE" up --build -d; then
        echo -e "\033[32mServices started successfully!\033[0m"
        echo ""
        echo -e "\033[36mServices are now running:\033[0m"
        echo -e "  Frontend: \033[37mhttp://localhost:3000\033[0m"
        echo -e "  Backend:  \033[37mhttp://localhost:4000\033[0m"
        echo -e "  Database: \033[37mlocalhost:5432\033[0m"
        echo ""
        echo -e "\033[90mTo view logs: $COMPOSE_CMD -f $COMPOSE_FILE logs -f\033[0m"
        echo -e "\033[90mTo stop:     $COMPOSE_CMD -f $COMPOSE_FILE down\033[0m"
        return 0
    else
        echo -e "\033[31mFailed to start services\033[0m" >&2
        return 1
    fi
}

# Main execution
main() {
    if $HELP; then
        show_help
        return
    fi
    
    echo -e "\033[35m=== Cronos Health Deployment Script ===\033[0m"
    echo -e "\033[36mEnvironment: $ENVIRONMENT\033[0m"
    
    # Check prerequisites
    test_prerequisites
    PREREQ_RESULT=$?
    if [ $PREREQ_RESULT -eq 1 ]; then
        exit 1
    fi
    HAS_NODE_JS=false
    if [ $PREREQ_RESULT -eq 0 ]; then
        HAS_NODE_JS=true
    fi
    
    # Get or update repositories
    if ! get_or_update_repo "$FRONTEND_REPO" "$FRONTEND_DIR"; then
        exit 1
    fi
    
    if ! get_or_update_repo "$BACKEND_REPO" "$BACKEND_DIR"; then
        exit 1
    fi
    
    # Generate lock files and fix Dockerfiles
    new_lock_files $HAS_NODE_JS
    
    # Create main docker-compose file
    if ! new_docker_compose_file; then
        exit 1
    fi
    
    # Start services
    if ! start_services $CLEAN; then
        exit 1
    fi
    
    echo ""
    echo -e "\033[32mDeployment completed successfully!\033[0m"
}

# Run main function
main
