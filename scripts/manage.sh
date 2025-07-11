#!/bin/bash

# EW Logistics Project Management Script
# Quick reference for common development and deployment tasks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

print_header() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE} EW Logistics Project Management${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
}

print_usage() {
    echo -e "${YELLOW}Usage: $0 [command]${NC}"
    echo ""
    echo "Available commands:"
    echo "  dev-start     Start development environment"
    echo "  dev-stop      Stop development environment"
    echo "  dev-status    Check development environment status"
    echo "  prod-backend  Start production backend"
    echo "  logs          Show development logs"
    echo "  clean         Clean up Docker containers and images"
    echo "  help          Show this help message"
    echo ""
    echo -e "${YELLOW}Project Status:${NC}"
    echo "  Frontend URL: http://localhost:3000"
    echo "  Deployment: Docker Compose (Development)"
    echo ""
}

dev_start() {
    echo -e "${GREEN}Starting development environment...${NC}"
    cd "$PROJECT_ROOT"
    if [ -f "docker-compose.yml" ]; then
        docker-compose up -d
        echo -e "${GREEN}Development environment started!${NC}"
        echo "Frontend: http://localhost:3000"
        echo "Backend API: http://localhost:3001"
    else
        echo -e "${RED}Error: docker-compose.yml not found${NC}"
        exit 1
    fi
}

dev_stop() {
    echo -e "${YELLOW}Stopping development environment...${NC}"
    cd "$PROJECT_ROOT"
    if [ -f "docker-compose.yml" ]; then
        docker-compose down
        echo -e "${GREEN}Development environment stopped!${NC}"
    else
        echo -e "${RED}Error: docker-compose.yml not found${NC}"
        exit 1
    fi
}

dev_status() {
    echo -e "${BLUE}Development Environment Status:${NC}"
    cd "$PROJECT_ROOT"
    if [ -f "docker-compose.yml" ]; then
        docker-compose ps
    else
        echo -e "${RED}Error: docker-compose.yml not found${NC}"
        exit 1
    fi
}

show_logs() {
    echo -e "${BLUE}Development Environment Logs:${NC}"
    cd "$PROJECT_ROOT"
    if [ -f "docker-compose.yml" ]; then
        docker-compose logs -f
    else
        echo -e "${RED}Error: docker-compose.yml not found${NC}"
        exit 1
    fi
}

clean_docker() {
    echo -e "${YELLOW}Cleaning up Docker containers and images...${NC}"
    cd "$PROJECT_ROOT"
    
    # Stop and remove containers
    if [ -f "docker-compose.yml" ]; then
        docker-compose down --remove-orphans
    fi
    
    # Remove unused containers, networks, images
    docker system prune -f
    
    echo -e "${GREEN}Docker cleanup completed!${NC}"
}

prod_backend() {
    echo -e "${GREEN}Starting production backend...${NC}"
    if [ -f "$SCRIPT_DIR/start-prod.sh" ]; then
        "$SCRIPT_DIR/start-prod.sh"
    else
        echo -e "${RED}Error: start-prod.sh not found${NC}"
        exit 1
    fi
}

# Main script logic
case "${1:-help}" in
    "dev-start")
        print_header
        dev_start
        ;;
    "dev-stop")
        print_header
        dev_stop
        ;;
    "dev-status")
        print_header
        dev_status
        ;;
    "prod-backend")
        print_header
        prod_backend
        ;;
    "logs")
        print_header
        show_logs
        ;;
    "clean")
        print_header
        clean_docker
        ;;
    "help"|*)
        print_header
        print_usage
        ;;
esac
