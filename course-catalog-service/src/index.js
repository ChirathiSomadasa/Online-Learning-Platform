const app = require('./app');
const mongoose = require('mongoose');
require('dotenv').config();

const PORT = process.env.PORT || 3002;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected — Course Catalog Service');
    app.listen(PORT, () => console.log(`Course Catalog Service on port ${PORT}`));
  })
  .catch(err => { console.error('DB Error:', err); process.exit(1); });
