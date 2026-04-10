const express       = require('express');
const helmet        = require('helmet');
const cors          = require('cors');
const morgan        = require('morgan');
const swaggerUi     = require('swagger-ui-express');
const yaml          = require('js-yaml');
const fs            = require('node:fs');
const path          = require('node:path');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

//  Trusted origins whitelist 
// Add all frontend URLs that are allowed to call this service.
// Read from environment variable in production, fall back to localhost for dev.
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [
      'http://localhost:3000',  // React dev server
      'http://localhost:3007',  // Alternative dev port
    ];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, Postman, curl, server-to-server)
    if (!origin) return callback(null, true);

    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${origin}' is not allowed`));
    }
  },
  methods:          ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders:   ['Content-Type', 'Authorization'],
  credentials:      true,   // allow cookies / auth headers
  optionsSuccessStatus: 200,
};

// Middleware 
app.use(helmet());
app.use(cors(corsOptions));   // Compliant: explicit origin whitelist, not *
app.use(morgan('combined'));
app.use(express.json());

//  Swagger UI 
try {
  const swaggerDoc = yaml.load(
    fs.readFileSync(path.join(__dirname, '../swagger.yaml'), 'utf8'),
  );
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
} catch {
  console.warn('swagger.yaml not found — /api-docs disabled');
}

//  Routes 
app.use('/api/payments', paymentRoutes);

//  Health check 
app.get('/health', (req, res) =>
  res.json({ status: 'ok', service: 'payment-service' }),
);

module.exports = app;