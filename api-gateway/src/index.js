const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
app.use(helmet());
app.use(cors());

const AUTH_URL   = process.env.AUTH_SERVICE_URL         || 'http://localhost:3001';
const COURSE_URL = process.env.COURSE_SERVICE_URL       || 'http://localhost:3002';
const ENROLL_URL = process.env.ENROLLMENT_SERVICE_URL   || 'http://localhost:3003';
const NOTIFY_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004';
const PAYMENT_URL = process.env.PAYMENT_SERVICE_URL     || 'http://localhost:3006';

app.use('/api/auth', createProxyMiddleware({ 
  target: AUTH_URL, 
  changeOrigin: true,
  pathRewrite: (path) => '/api/auth' + path,  
}));
app.use('/api/courses', createProxyMiddleware({ 
  target: COURSE_URL, changeOrigin: true,
  pathRewrite: (path) => '/api/courses' + path
}));

app.use('/api/enrollment', createProxyMiddleware({ 
  target: ENROLL_URL, changeOrigin: true,
  pathRewrite: (path) => '/api/enrollment' + path
}));

app.use('/api/notifications', createProxyMiddleware({ 
  target: NOTIFY_URL, changeOrigin: true,
  pathRewrite: (path) => '/api/notifications' + path
}));

app.use('/api/payments', createProxyMiddleware({ 
  target: PAYMENT_URL, changeOrigin: true,
  pathRewrite: (path) => '/api/payments' + path
}));

app.get('/health', (req, res) => res.json({ status: 'API Gateway OK', port: 5000 }));

app.listen(5000, () => console.log('API Gateway running on port 5000'));
