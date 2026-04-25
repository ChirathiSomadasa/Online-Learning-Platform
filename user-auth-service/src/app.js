// app.js
const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const authRoutes = require('./routes/authRoutes');
const swaggerUi  = require('swagger-ui-express');
const yaml       = require('js-yaml');
const fs         = require('node:fs');
const path       = require('node:path');

const app = express();

app.use(helmet());

// Restrict CORS to API Gateway and internal services only
app.use(cors({
  origin: [
    'http://localhost:5000',  // API Gateway — forwards all frontend requests
    'http://localhost:3002',  // Course Catalog Service — calls /validate
    'http://localhost:3003',  // Enrollment Service — calls /validate
    'http://localhost:3004',  // Notification Service — calls /validate
    'http://localhost:3006',  // Payment Service — calls /validate
    process.env.FRONTEND_URL  // Production frontend URL from .env
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Swagger UI
const swaggerDoc = yaml.load(
  fs.readFileSync(path.join(__dirname, '../swagger.yaml'), 'utf8')
);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'user-auth-service' }));

module.exports = app;