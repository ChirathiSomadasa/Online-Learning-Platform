const app = require('./app');
const mongoose = require('mongoose');
require('dotenv').config();

const PORT = process.env.PORT || 3001;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected — User Auth Service');
    app.listen(PORT, () => console.log(`User Auth Service on port ${PORT}`));
  })
  .catch(err => { console.error('DB Error:', err); process.exit(1); });
