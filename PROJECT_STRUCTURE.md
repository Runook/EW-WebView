# EW Logistics Project Structure

## Overview
This document describes the cleaned and organized structure of the EW Logistics web application.

## Project Status
- **Deployment Status**: ✅ Successfully running locally
- **Frontend URL**: http://localhost:3000
- **Backend API**: Healthy and operational
- **Infrastructure**: Docker Compose services running

## Directory Structure

```
EW-WebView/
├── README.md                           # Main project documentation
├── PROJECT_STRUCTURE.md               # This file - project organization
├── docker-compose.yml                 # Development environment setup
├── GOOGLE_MAPS_ISSUE_RESOLUTION.md    # Google Maps integration fixes
├── GoogleMaps_Integration_Guide.md    # Google Maps setup guide
│
├── scripts/                           # Management scripts directory
│   ├── dev-start.sh                   # Start development environment
│   ├── dev-stop.sh                    # Stop development environment
│   └── start-prod.sh                  # Production backend startup
│
├── backend/                           # Node.js/Express backend
│   ├── Dockerfile                     # Backend container configuration
│   ├── package.json                   # Node.js dependencies
│   ├── knexfile.js                    # Database configuration
│   ├── init.sql/                      # Database initialization
│   ├── migrations/                    # Database migration files
│   └── src/                          # Backend source code
│       ├── app.js                     # Main application entry
│       ├── config/                    # Configuration files
│       ├── middleware/                # Express middleware
│       ├── models/                    # Data models
│       ├── routes/                    # API route handlers
│       └── utils/                     # Utility functions
│
└── frontend/                          # React frontend application
    ├── Dockerfile                     # Development container
    ├── Dockerfile.prod                # Production container
    ├── nginx.conf                     # Nginx configuration (updated with correct ALB)
    ├── package.json                   # React dependencies
    ├── public/                        # Static assets
    └── src/                          # React source code
        ├── App.js                     # Main React component
        ├── components/                # Reusable components
        ├── config/                    # Frontend configuration
        ├── contexts/                  # React contexts
        ├── hooks/                     # Custom React hooks
        ├── pages/                     # Page components
        ├── styles/                    # CSS styles
        └── utils/                     # Utility functions
```

## Key Files and Their Purpose

### Root Level
- `docker-compose.yml`: Development environment orchestration

### Scripts Directory
- `dev-start.sh`: Starts local development environment with Docker Compose
- `dev-stop.sh`: Stops and cleans up development environment
- `start-prod.sh`: Production startup script for backend service

### Backend (`/backend`)
- **Technology Stack**: Node.js, Express, Knex.js, PostgreSQL
- **Main Entry**: `src/app.js`
- **Database**: PostgreSQL with Knex migrations
- **API Routes**: RESTful APIs for freight management, user auth, jobs, etc.

### Frontend (`/frontend`)
- **Technology Stack**: React, React Router, Material-UI components
- **Build Tool**: Create React App (CRA)
- **Deployment**: Nginx-served static files with API proxy
- **Key Features**: Freight board, user management, Google Maps integration

## Deployment Architecture

### Docker Infrastructure
- **Docker Compose**: Container orchestration
- **Nginx**: Web server for frontend
- **PostgreSQL**: Database service
- **Redis**: Caching service (optional)

### Container Configuration
- **Frontend**: React app served by Nginx (port 3000)
- **Backend**: Node.js Express API (port 3001)
- **Database**: PostgreSQL Docker container

## Development Workflow

### Local Development
```bash
# Start development environment
./scripts/dev-start.sh

# Stop development environment  
./scripts/dev-stop.sh
```

### Production Deployment
- Images built using Docker
- Services managed via Docker Compose
- Load balancing handled by Nginx

## Removed Files (Cleanup History)
The following redundant/obsolete files were removed during cleanup:
- `docker-compose.ecr-test.yml` - ECR test configuration
- `docker-compose.prod.yml` - Redundant production compose
- `complete-deployment.sh` - Redundant deployment script
- `deploy-ecs-final.sh` - Redundant deployment script
- `trust-policy.json` - No longer needed
- `frontend/Dockerfile.aws` - Redundant Dockerfile
- `AWS_DEPLOYMENT_GUIDE.md` - AWS deployment guide
- `ecs-backend-task-final.json` - ECS backend task definition
- `ecs-frontend-task-final.json` - ECS frontend task definition
- `frontend/Dockerfile.simple` - Redundant Dockerfile
- `frontend/nginx.prod.conf` - Merged into main nginx.conf
- Test report files (can be regenerated if needed)

## Configuration Updates
- Updated `nginx.conf` to proxy to backend service in Docker Compose
- Enhanced nginx configuration with CORS headers and better caching
- Organized scripts into dedicated `/scripts` directory

## Next Steps
- Monitor application performance in production
- Set up automated CI/CD pipeline if needed
- Consider implementing automated testing
- Regular security updates and dependency maintenance
