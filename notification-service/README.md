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