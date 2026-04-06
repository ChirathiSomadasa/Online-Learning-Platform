const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const morgan       = require('morgan');
const swaggerUi    = require('swagger-ui-express');
const yaml         = require('js-yaml');
const fs           = require('fs');
const path         = require('path');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Swagger UI
const swaggerDoc = yaml.load(
  fs.readFileSync(path.join(__dirname, '../swagger.yaml'), 'utf8'),
);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

app.use('/api/payments', paymentRoutes);

app.get('/health', (req, res) =>
  res.json({ status: 'ok', service: 'payment-service' }),
);

module.exports = app;