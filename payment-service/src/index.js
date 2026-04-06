require('dotenv').config();
const mongoose = require('mongoose');
const app      = require('./app');

const PORT = process.env.PORT || 3006;
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected - Payment Service');
    app.listen(PORT, () =>
      console.log(`Payment service running on port ${PORT}`),
    );
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
