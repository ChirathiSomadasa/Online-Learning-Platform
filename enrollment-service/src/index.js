const app = require('./app');
const mongoose = require('mongoose');
require('dotenv').config();

const PORT = process.env.PORT || 3003;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected — Enrollment Service');
    app.listen(PORT, () => console.log(`Enrollment Service on port ${PORT}`));
  })
  .catch(err => { console.error('DB Error:', err); process.exit(1); });
