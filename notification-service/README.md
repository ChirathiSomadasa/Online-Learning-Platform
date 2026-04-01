# Online-Learning-Platform - notification-service

## Setup Instructions
```bash
mkdir notification-service && cd notification-service
npm init -y
npm install express mongoose nodemailer helmet cors dotenv jsonwebtoken
npm install --save-dev nodemon
```

## .env file
```
PORT=3004
MONGO_URI='mongodb+srv://userDB:1234@ctsecluster.wifsid0.mongodb.net/notificationdb?retryWrites=true&w=majority&appName=CTSECluster'
# JWT_SECRET=

EMAIL_USER=thamindud009@gmail.com
EMAIL_PASS=trcvukfzyczlfdyn

# USER_AUTH_URL=http://user-auth-service:3004
USER_AUTH_URL=http://localhost:3001
```


## Dokcerfile
```
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/
COPY swagger.yaml ./swagger.yaml

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

USER appuser
EXPOSE 3002

CMD ["node", "src/index.js"]
```


## Notification CI/CD - notification-service.yml
```
name: Notification CI/CD

on:
  push:
    branches: [main]
    paths: ['notification-service/**']
  pull_request:
    branches: [main]
    paths: ['notification-service/**']
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: notification-service
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --forceExit

  sonarcloud:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      - uses: SonarSource/sonarqube-scan-action@v5.0.0
        with:
          projectBaseDir: notification-service
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

  build-and-push:
    runs-on: ubuntu-latest
    needs: sonarcloud
    steps:
      - uses: actions/checkout@v3
      - uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      - uses: docker/build-push-action@v4
        with:
          context: notification-service
          push: true
          tags: ${{ secrets.DOCKER_USERNAME }}/notification-service:latest

```


## CI/CD Pipeline - main branch
```
name: CI/CD Pipeline

# Triggers: runs on push to main and on pull requests to main
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
# Update
jobs:
  # Job 1: Run unit tests
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service:
          - user-auth-service
          - course-catalog-service
          - enrollment-service
          - notification-service
    defaults:
      run:
        working-directory: ${{ matrix.service }}
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      # Install dependencies
      - run: npm ci
      # Run tests
      - run: npm test --if-present

  # Job 2: SonarCloud code quality and security scan
  sonarcloud:
    runs-on: ubuntu-latest
    needs: test # Only runs if test job passes
    strategy:
      matrix:
        service:
          - user-auth-service
          - course-catalog-service
          - enrollment-service
          - notification-service
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0 # Full history needed for SonarCloud analysis
      - uses: SonarSource/sonarqube-scan-action@v5.0.0
        with:
          projectBaseDir: ${{ matrix.service }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }} # GitHub token for PR decoration
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }} # SonarCloud authentication token

  # Job 3: Build Docker image, push to ACR, and deploy to Azure Container Apps
  build-and-deploy:
    runs-on: ubuntu-latest
    needs: sonarcloud # Only runs if sonarcloud job passes
    strategy:
      matrix:
        include:
          - service: user-auth-service
            appName: user-auth-service
          - service: course-catalog-service
            appName: course-catalog-service
          - service: enrollment-service
            appName: enrollment-service
          - service: notification-service
            appName: notification-service
          - service: api-gateway
            appName: api-gateway
    steps:
      - uses: actions/checkout@v3
      # Login to Azure
      - uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
      # Login to ACR
      - run: az acr login -n ${{ secrets.AZURE_ACR_NAME }}
      # Build and push Docker image to ACR
      - run: |
          $acrServer = "${{ secrets.AZURE_ACR_NAME }}.azurecr.io"
          $image = "$acrServer/${{ matrix.service }}:latest"
          docker build -t $image ./${{ matrix.service }}
          docker push $image
        shell: pwsh
      # Deploy updated image to Azure Container Apps
      - run: |
          $acrServer = "${{ secrets.AZURE_ACR_NAME }}.azurecr.io"
          $image = "$acrServer/${{ matrix.service }}:latest"
          az containerapp update \
            -g ${{ secrets.AZURE_RESOURCE_GROUP }} \
            -n ${{ matrix.appName }} \
            --image $image
        shell: pwsh

```