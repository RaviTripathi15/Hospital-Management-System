'use strict';

// ─── Load environment variables first, before anything else ─────────────────
require('dotenv').config();

// ─── Set Google DNS to reliably resolve MongoDB Atlas hostnames in local dev ──
if (process.env.NODE_ENV !== 'production') {
  const dns = require('dns');
  dns.setServers(['8.8.8.8', '8.8.4.4']);
}

const express = require('express');
const http = require('http');
const { Server: SocketIOServer } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');

const connectDB = require('./config/database');
const logger = require('./config/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const { initCronJobs } = require('./jobs/cronJobs');

// Security middleware imports
const nosqlSanitizer = require('./middleware/nosqlSanitizer');
const { protect } = require('./middleware/auth');
const uploadAccessControl = require('./middleware/uploadAccessControl');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const healthCenterRoutes = require('./routes/healthCenters');
const patientRoutes = require('./routes/patients');
const inventoryRoutes = require('./routes/inventory');
const appointmentRoutes = require('./routes/appointments');
const reportRoutes = require('./routes/reports');
const analyticsRoutes = require('./routes/analytics');
const aiRoutes = require('./routes/ai');
const notificationRoutes = require('./routes/notifications');
const footfallRoutes = require('./routes/footfall');
const bedRoutes = require('./routes/beds');
const attendanceRoutes = require('./routes/attendance');
const predictionRoutes = require('./routes/predictions');
const roleRequestRoutes = require('./routes/roleRequests');

// ─── App Init ────────────────────────────────────────────────────────────────
const app = express();

// ─── CRITICAL: Trust Render's load-balancer proxy ────────────────────────────
// Render routes all traffic through a reverse proxy that sets X-Forwarded-For.
// Without this Express rejects the header → ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
// and express-rate-limit cannot determine the real client IP.
// '1' means we trust exactly one hop of proxy (Render's edge layer).
app.set('trust proxy', 1);

const server = http.createServer(app);

// ─── Build the CORS origin whitelist ─────────────────────────────────────────
// CLIENT_URL is set in Render's environment dashboard to your Render frontend URL
// e.g. https://health-platform-frontend.onrender.com
const rawClientUrl = (process.env.CLIENT_URL || '').trim().replace(/^["']|["']$/g, '').replace(/\/$/, '');

// Always include localhost URLs so local dev still works without changing .env
const allowedOrigins = new Set([
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:4173',    // vite preview
]);

// Add the production frontend URL if it is defined and non-empty
if (rawClientUrl) {
  allowedOrigins.add(rawClientUrl.toLowerCase());
}

// Support multiple comma-separated URLs in CLIENT_URL
// e.g. CLIENT_URL=https://app.onrender.com,https://custom-domain.com
rawClientUrl.split(',').forEach((url) => {
  const trimmed = url.trim().replace(/\/$/, '').toLowerCase();
  if (trimmed) allowedOrigins.add(trimmed);
});

/**
 * CORS origin resolver.
 * - Requests with no Origin header (server-to-server, curl, Postman) → allow.
 * - Any *.onrender.com subdomain is automatically whitelisted so staging
 *   preview URLs work without changing env vars.
 * - Everything else must be in the explicit allowedOrigins set.
 */
const corsOriginResolver = (origin, callback) => {
  // No origin = non-browser request (Postman, server-to-server, curl) → allow
  if (!origin) return callback(null, true);

  const normalised = origin.trim().toLowerCase().replace(/\/$/, '');

  if (
    allowedOrigins.has(normalised) ||
    /^https:\/\/[a-zA-Z0-9.-]+\.onrender\.com$/i.test(normalised)
  ) {
    return callback(null, true);
  }

  // Origin is not allowed
  logger.warn(`CORS blocked origin: ${origin}`);
  return callback(new Error(`CORS: origin ${origin} is not allowed`));
};

const corsOptions = {
  origin: corsOriginResolver,
  credentials: true,                                         // allow cookies / Authorization header
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  optionsSuccessStatus: 200,                                 // IE11 compatibility
};

// ─── Socket.io Setup ─────────────────────────────────────────────────────────
const io = new SocketIOServer(server, {
  cors: {
    origin: corsOriginResolver,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // On Render, connections pass through a load balancer.
  // Prefer polling first so the upgrade to WebSocket happens correctly.
  transports: ['polling', 'websocket'],
});

app.set('io', io);

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('join_room', (room) => {
    socket.join(room);
    logger.info(`Socket ${socket.id} joined room: ${room}`);
  });

  socket.on('leave_room', (room) => {
    socket.leave(room);
  });

  socket.on('disconnect', (reason) => {
    logger.info(`Socket disconnected: ${socket.id} — reason: ${reason}`);
  });
});

// ─── Security Middleware ──────────────────────────────────────────────────────
// Helmet sets security-relevant HTTP headers.
// On Render (HTTPS only) we can be stricter with Content-Security-Policy.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow CDN fonts / images
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  })
);

// Apply CORS before any route is matched
app.use(cors(corsOptions));

// Explicitly handle preflight OPTIONS for all routes
app.options('*', cors(corsOptions));

// ─── General Middleware ───────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(nosqlSanitizer);

// HTTP request logging  (skip in test mode to keep jest output clean)
if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      stream: { write: (msg) => logger.http(msg.trim()) },
    })
  );
}

// ─── Static Files ─────────────────────────────────────────────────────────────
// Serve public uploads statically
app.use('/uploads/profiles', express.static(path.join(__dirname, 'uploads/profiles')));
app.use('/uploads/inventory', express.static(path.join(__dirname, 'uploads/inventory')));

// Protect sensitive uploads via middleware route
app.use('/uploads/verifications', protect, uploadAccessControl('verifications'), express.static(path.join(__dirname, 'uploads/verifications')));
app.use('/uploads/reports', protect, uploadAccessControl('reports'), express.static(path.join(__dirname, 'uploads/reports')));
app.use('/uploads/patients', protect, uploadAccessControl('patients'), express.static(path.join(__dirname, 'uploads/patients')));

// ─── Global Rate Limiting ─────────────────────────────────────────────────────
// Applied to all /api/* paths.  The limiter itself also has trustProxy configured.
app.use('/api', apiLimiter);

// ─── Base & Health-check Endpoints ───────────────────────────────────────────
// Render's health-check probe hits GET / by default.
// Returning 200 JSON here stops the "Route not found: /" 404 errors in logs.
app.get('/', (_req, res) => {
  res.status(200).json({
    message: 'Health Platform API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    docs: '/api/v1/health',
  });
});

// /health — Render can be configured to check this path
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// /api/v1 base — stops the "Route not found: /api/v1" 404
app.get('/api/v1', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Health Platform API v1',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      healthCenters: '/api/v1/health-centers',
      patients: '/api/v1/patients',
      inventory: '/api/v1/inventory',
      appointments: '/api/v1/appointments',
      reports: '/api/v1/reports',
      analytics: '/api/v1/analytics',
      ai: '/api/v1/ai',
      notifications: '/api/v1/notifications',
      footfall: '/api/v1/footfall',
      beds: '/api/v1/beds',
      attendance: '/api/v1/attendance',
      predictions: '/api/v1/predictions',
    },
  });
});

// /api/v1/health — explicit versioned health check endpoint
app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
const API = '/api/v1';
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/users`, userRoutes);
app.use(`${API}/health-centers`, healthCenterRoutes);
app.use(`${API}/patients`, patientRoutes);
app.use(`${API}/inventory`, inventoryRoutes);
app.use(`${API}/appointments`, appointmentRoutes);
app.use(`${API}/reports`, reportRoutes);
app.use(`${API}/analytics`, analyticsRoutes);
app.use(`${API}/ai`, aiRoutes);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/footfall`, footfallRoutes);
app.use(`${API}/beds`, bedRoutes);
app.use(`${API}/attendance`, attendanceRoutes);
app.use(`${API}/predictions`, predictionRoutes);
app.use(`${API}/role-requests`, roleRequestRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────────
// 404 catcher — must come after all routes
app.use(notFound);
// Global error handler — must have 4 params to be treated as error middleware
app.use(errorHandler);

// ─── Server Bootstrap ─────────────────────────────────────────────────────────
// Render injects PORT automatically; always bind to 0.0.0.0 (not 127.0.0.1)
const PORT = parseInt(process.env.PORT, 10) || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Bind to 0.0.0.0 so Render's router can reach the process
    server.listen(PORT, '0.0.0.0', () => {
      const baseUrl =
        process.env.RENDER_EXTERNAL_URL ||
        `http://localhost:${PORT}`;
      logger.info(`✅ Server running in [${process.env.NODE_ENV}] mode`);
      logger.info(`✅ Listening on port ${PORT} (0.0.0.0)`);
      logger.info(`✅ API base: ${baseUrl}${API}`);
      logger.info(`✅ Health: ${baseUrl}/health`);
      logger.info(`✅ Allowed CORS origins: ${[...allowedOrigins].join(', ')}`);
    });

    // Start cron jobs after the server is listening
    initCronJobs();
  } catch (err) {
    logger.error(`❌ Failed to start server: ${err.message}`);
    process.exit(1);
  }
};

startServer();

// ─── Process-level error guards ───────────────────────────────────────────────
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  // Gracefully close the server before exiting
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

module.exports = { app, server, io };
