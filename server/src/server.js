const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

const start = async () => {
  // Connect to MongoDB before accepting traffic
  await connectDB();

  const server = app.listen(PORT, "0.0.0.0", () => {
    logger.info(
      `🚑  Server listening on port ${PORT}  [${process.env.NODE_ENV || 'development'}]`
    );
  });

  // ── Graceful shutdown ────────────────────────────────────────────────────
  const shutdown = (signal) => {
    logger.warn(`${signal} received — shutting down gracefully`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    // Force-kill if server doesn't close in 10 s
    setTimeout(() => {
      logger.error('Forcing shutdown after timeout');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // ── Unhandled errors ─────────────────────────────────────────────────────
  process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason }, 'Unhandled Promise Rejection — shutting down');
    server.close(() => process.exit(1));
  });

  process.on('uncaughtException', (err) => {
    logger.error({ err }, 'Uncaught Exception — shutting down');
    process.exit(1);
  });
};

start();
