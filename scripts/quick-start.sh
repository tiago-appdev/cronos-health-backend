#!/bin/bash

# Cronos Health Backend - Quick Start Script
# This script sets up the development environment quickly

set -e  # Exit on any error

echo "🏥 Cronos Health Backend - Quick Start"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    print_status "Checking Docker installation..."
    if command -v docker &> /dev/null; then
        print_success "Docker is installed: $(docker --version)"
    else
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if command -v docker-compose &> /dev/null; then
        print_success "Docker Compose is installed: $(docker-compose --version)"
    else
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
}

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js is installed: $NODE_VERSION"
        
        # Check if version is >= 18
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$NODE_MAJOR" -lt 18 ]; then
            print_error "Node.js version 18 or higher is required. Current version: $NODE_VERSION"
            exit 1
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi

    if command -v npm &> /dev/null; then
        print_success "npm is installed: $(npm --version)"
    else
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing Node.js dependencies..."
    npm ci
    print_success "Dependencies installed successfully"
}

# Setup environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env-template" ]; then
            cp .env-template .env
            print_success "Created .env from template"
            print_warning "Please review and update .env file with your configuration"
        else
            print_warning ".env-template not found, creating basic .env file"
            cat > .env << EOF
PORT=4000
DATABASE_URL="postgres://cronos_user:cronos_pass@localhost:5432/cronos_db"
JWT_SECRET=CRONOS_HEALTH_JWT_SECRET
JWT_EXPIRATION=1h
NODE_ENV=development
EOF
            print_success "Created basic .env file"
        fi
    else
        print_success ".env file already exists"
    fi

    if [ ! -f ".env.test" ]; then
        cat > .env.test << EOF
PORT=4001
DATABASE_URL="postgres://cronos_user:cronos_pass@localhost:5433/cronos_test_db"
JWT_SECRET=CRONOS_HEALTH_JWT_SECRET_TEST
JWT_EXPIRATION=1h
NODE_ENV=test
EOF
        print_success "Created .env.test file"
    else
        print_success ".env.test file already exists"
    fi
}

# Start Docker services
start_docker_services() {
    print_status "Starting Docker services..."
    
    # Stop any existing containers
    docker-compose down &> /dev/null || true
    
    # Start services
    docker-compose up -d
    
    print_status "Waiting for services to be ready..."
    
    # Wait for PostgreSQL to be ready
    print_status "Waiting for PostgreSQL..."
    timeout=60
    while ! docker exec cronos-db pg_isready -U cronos_user -d cronos_db &> /dev/null; do
        sleep 2
        timeout=$((timeout - 2))
        if [ $timeout -le 0 ]; then
            print_error "PostgreSQL did not start within expected time"
            exit 1
        fi
        echo -n "."
    done
    echo ""
    print_success "PostgreSQL is ready"

    # Wait for test database
    print_status "Waiting for test PostgreSQL..."
    timeout=60
    while ! docker exec cronos-test-db pg_isready -U cronos_user -d cronos_test_db &> /dev/null; do
        sleep 2
        timeout=$((timeout - 2))
        if [ $timeout -le 0 ]; then
            print_error "Test PostgreSQL did not start within expected time"
            exit 1
        fi
        echo -n "."
    done
    echo ""
    print_success "Test PostgreSQL is ready"
}

# Setup test database
setup_test_database() {
    print_status "Setting up test database schema..."
    npm run setup:test-db
    print_success "Test database schema set up"
}

# Seed database with sample data
seed_database() {
    print_status "Seeding database with sample data..."
    npm run seed
    print_success "Database seeded successfully"
}

# Run tests to verify setup
run_tests() {
    print_status "Running tests to verify setup..."
    npm test
    print_success "All tests passed!"
}

# Main execution
main() {
    echo ""
    print_status "Starting Cronos Health Backend setup..."
    echo ""

    # Pre-flight checks
    check_docker
    check_node
    
    echo ""
    print_status "Setting up project..."
    
    # Setup project
    install_dependencies
    setup_environment
    start_docker_services
    setup_test_database
    
    # Ask user if they want to seed data
    echo ""
    read -p "Do you want to seed the database with sample data? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        seed_database
    else
        print_status "Skipping database seeding"
    fi
    
    # Ask user if they want to run tests
    echo ""
    read -p "Do you want to run tests to verify the setup? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_tests
    else
        print_status "Skipping tests"
    fi
    
    echo ""
    print_success "🎉 Setup completed successfully!"
    echo ""
    echo "🚀 Next steps:"
    echo "  • API is running at: http://localhost:4000"
    echo "  • Health check: http://localhost:4000/api/health"
    echo "  • Database: localhost:5432 (user: cronos_user, db: cronos_db)"
    echo "  • Test database: localhost:5433 (user: cronos_user, db: cronos_test_db)"
    echo ""
    echo "📚 Available commands:"
    echo "  • npm run dev          - Start development server"
    echo "  • npm test             - Run tests"
    echo "  • npm run docker:logs  - View Docker logs"
    echo "  • npm run docker:down  - Stop services"
    echo ""
    echo "📖 Documentation:"
    echo "  • README.md       - Project overview"
    echo "  • TESTING.md      - Testing guide"
    echo "  • DEPLOYMENT.md   - Deployment guide"
    echo ""
    print_warning "Don't forget to review and update your .env file!"
}

# Handle script interruption
trap 'echo ""; print_error "Setup interrupted"; exit 1' INT

# Run main function
main "$@"