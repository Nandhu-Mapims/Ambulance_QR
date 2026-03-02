const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not set in server/.env (e.g. mongodb://localhost:27017/ambulance_qr for Docker).');
  }
  const conn = await mongoose.connect(uri);
  logger.info(`MongoDB connected: ${conn.connection.host}`);
};

module.exports = connectDB;
