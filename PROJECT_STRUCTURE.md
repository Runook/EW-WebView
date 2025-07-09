# EW Logistics Project Structure

## Overview
This document describes the cleaned and organized structure of the EW Logistics AWS-deployed web application.

## Project Status
- **Deployment Status**: ✅ Successfully deployed to AWS
- **Frontend URL**: http://ew-logistics-alb-1527520693.us-east-1.elb.amazonaws.com
- **Backend API**: Healthy and operational
- **Infrastructure**: ECS services, ALB, and RDS all running

## Directory Structure

```
EW-WebView/
├── README.md                           # Main project documentation
├── AWS_DEPLOYMENT_GUIDE.md            # Complete AWS deployment guide
├── PROJECT_STRUCTURE.md               # This file - project organization
├── docker-compose.yml                 # Development environment setup
├── ecs-backend-task-final.json        # ECS task definition for backend
├── ecs-frontend-task-final.json       # ECS task definition for frontend
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
- `AWS_DEPLOYMENT_GUIDE.md`: Complete guide for AWS deployment
- `ecs-*-task-final.json`: Production ECS task definitions

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

### AWS Infrastructure
- **ECS Cluster**: Container orchestration
- **Application Load Balancer**: Traffic distribution and SSL termination
- **RDS PostgreSQL**: Managed database service
- **ECR**: Container image registry
- **CloudWatch**: Logging and monitoring

### Container Configuration
- **Frontend**: React app served by Nginx (port 80)
- **Backend**: Node.js Express API (port 3001)
- **Database**: PostgreSQL RDS instance

## Development Workflow

### Local Development
```bash
# Start development environment
./scripts/dev-start.sh

# Stop development environment  
./scripts/dev-stop.sh
```

### Production Deployment
- Images built and pushed to ECR
- ECS services updated with new task definitions
- Load balancer routes traffic to healthy containers

## Removed Files (Cleanup History)
The following redundant/obsolete files were removed during cleanup:
- `docker-compose.ecr-test.yml` - ECR test configuration
- `docker-compose.prod.yml` - Redundant production compose
- `complete-deployment.sh` - Redundant deployment script
- `deploy-ecs-final.sh` - Redundant deployment script
- `trust-policy.json` - No longer needed
- `frontend/Dockerfile.aws` - Redundant Dockerfile
- `frontend/Dockerfile.simple` - Redundant Dockerfile
- `frontend/nginx.prod.conf` - Merged into main nginx.conf
- Test report files (can be regenerated if needed)

## Configuration Updates
- Updated `nginx.conf` with correct ALB URL: `ew-logistics-alb-1527520693.us-east-1.elb.amazonaws.com`
- Enhanced nginx configuration with CORS headers and better caching
- Organized scripts into dedicated `/scripts` directory

## Next Steps
- Monitor application performance in production
- Set up automated CI/CD pipeline if needed
- Consider implementing automated testing
- Regular security updates and dependency maintenance
