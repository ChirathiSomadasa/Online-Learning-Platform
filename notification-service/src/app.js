const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const notificationRoutes = require('./routes/notificationRoutes');
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Swagger UI
const swaggerDoc = yaml.load(
  fs.readFileSync(path.join(__dirname, '../swagger.yaml'), 'utf8')
);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));


app.use('/api/notifications', notificationRoutes);
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'notificationservice' }));

module.exports = app;