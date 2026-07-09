'use strict';

const mongoose = require('mongoose');
const logger = require('./logger');

const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 5000;

let retryCount = 0;

const connectDB = async () => {
  const uri =
    process.env.NODE_ENV === 'production'
      ? (process.env.MONGO_URI_PROD || process.env.MONGO_URI)
      : process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MongoDB URI is not defined in environment variables.');
  }

  const options = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4, // Use IPv4
  };

  const attemptConnection = async () => {
    try {
      const conn = await mongoose.connect(uri, options);
      retryCount = 0;
      logger.info(`MongoDB connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
    } catch (err) {
      retryCount += 1;
      logger.error(`MongoDB connection attempt ${retryCount} failed: ${err.message}`);

      if (retryCount < MAX_RETRIES) {
        logger.info(`Retrying in ${RETRY_INTERVAL_MS / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
        return attemptConnection();
      } else {
        logger.error('Max MongoDB connection retries reached. Exiting.');
        process.exit(1);
      }
    }
  };

  await attemptConnection();

  // ─── Connection Event Handlers ───────────────────────────────────────────
  mongoose.connection.on('connected', () => {
    logger.info('Mongoose connection established.');
  });

  mongoose.connection.on('error', (err) => {
    logger.error(`Mongoose connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('Mongoose disconnected. Attempting to reconnect...');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('Mongoose reconnected.');
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed on app termination (SIGINT).');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed on app termination (SIGTERM).');
    process.exit(0);
  });
};

module.exports = connectDB;
