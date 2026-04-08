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

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

try {
  const swaggerDoc = yaml.load(
    fs.readFileSync(path.join(__dirname, '../swagger.yaml'), 'utf8'),
  );
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
} catch {
  console.warn('swagger.yaml not found — /api-docs disabled');
}

app.use('/api/payments', paymentRoutes);

app.get('/health', (req, res) =>
  res.json({ status: 'ok', service: 'payment-service' }),
);

module.exports = app;