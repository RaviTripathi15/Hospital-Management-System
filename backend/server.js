'use strict';

require('dotenv').config();

// Set Google DNS servers to resolve MongoDB Atlas DNS
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

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

// ─── App Init ───────────────────────────────────────────────────────────────
const app = express();
// Enable trust proxy so rate limiting works behind Render load balancer
app.set('trust proxy', 1);
const server = http.createServer(app);

// Sanitize CLIENT_URL to prevent header errors due to trailing spaces, newlines, or quotes
let clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
if (typeof clientUrl === 'string') {
  clientUrl = clientUrl.trim().replace(/^["']|["']$/g, '');
}

const allowedOrigins = [
  clientUrl,
  'http://localhost:3000',
  'http://localhost:5173',
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(
      (allowed) => allowed.replace(/\/$/, '') === origin.replace(/\/$/, '')
    );
    
    // Dynamically allow any Render subdomain for ease of blueprint deployments
    const isRenderSubdomain = /\.onrender\.com$/.test(origin);
    
    if (isAllowed || isRenderSubdomain) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// ─── Socket.io Setup ────────────────────────────────────────────────────────
const io = new SocketIOServer(server, {
  cors: {
    origin: corsOptions.origin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Attach io to every request so controllers can emit events
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

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// ─── Security Middleware ─────────────────────────────────────────────────────
app.use(helmet());
app.use(cors(corsOptions));

// ─── General Middleware ──────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging via morgan → winston
if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      stream: { write: (msg) => logger.http(msg.trim()) },
    })
  );
}

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Global Rate Limiting ────────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ─── Base & Health-check Routes ─────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.status(200).json({
    message: 'Welcome to the Hospital Management API',
    health: '/health',
    version: '1.0.0',
  });
});

app.get('/api/v1', (_req, res) => {
  res.status(200).json({
    message: 'Hospital Management API v1 Base Endpoint',
    status: 'active',
  });
});

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// ─── API Routes ──────────────────────────────────────────────────────────────
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

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Server Bootstrap ────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      logger.info(`API base: http://localhost:${PORT}${API}`);
    });

    // Start scheduled jobs
    initCronJobs();
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
};

startServer();

// ─── Unhandled Rejections / Exceptions ───────────────────────────────────────
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

module.exports = { app, server, io };
