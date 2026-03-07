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