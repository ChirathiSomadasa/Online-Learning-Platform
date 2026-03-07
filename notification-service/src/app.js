const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const notificationRoutes = require('./routes/notificationRoutes');
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api/notifications', notificationRoutes);
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'notificationservice' }));

module.exports = app;