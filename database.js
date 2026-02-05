const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/appointly';

const connectDB = async () => {
  try {
    // If running tests, skip auto-connecting here so tests can control the connection
    if (process.env.NODE_ENV === 'test') {
      if (mongoose.connection.readyState === 0) {
        console.log('Test environment: skipping connectDB (tests manage connections)');
      }
      return;
    }

    // Avoid connecting if already connected
    if (mongoose.connection.readyState !== 0) return;

    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
