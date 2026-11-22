import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import healthRouter from './routes/health.js';
import eventsRouter from './routes/events.js';
import galleryRouter from './routes/gallery.js';
import photosRouter from './routes/photos.js';
import leadsRouter from './routes/leads.js';
import adminRouter from './routes/admin.js';
import { getStudioSettings } from './utils/studioSettings.js';
import { DriveError } from './utils/drive.js';

// Load both root .env and local server/.env
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// =============================================================================
// Middleware Setup
// =============================================================================

// CORS configuration (supports comma-separated origins)
const allowedOrigins = CLIENT_URL.split(',').map((url) => url.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in development
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })
);

// JSON body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[${req.method}] ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// =============================================================================
// API Routes
// =============================================================================

// Health Check Routes (both /health and /api/health)
app.use('/health', healthRouter);
app.use('/api/health', healthRouter);

// Domain Routes
app.use('/api/events', galleryRouter); // Feature 3: GET /:slug, GET /:slug/photos, POST /:slug/leads
app.use('/api/events', eventsRouter);  // Base: GET / (list), POST / (create)
app.use('/api/gallery', galleryRouter);
app.use('/api/photos', photosRouter);
app.use('/api/leads', leadsRouter);

// Studio Public Settings (Phone numbers, Email, Google Maps, Instagram, YouTube)
app.get('/api/studio', (req, res) => {
  res.json(getStudioSettings());
});

// Admin Routes (Feature 2: Event Creation, Link Generator, Leads Management)
app.use('/api/admin', adminRouter);

// Serve static client build in production if client/dist exists
const clientDistPath = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.resolve(clientDistPath, 'index.html'));
  });
}

// Fallback informational endpoint (when client/dist is not built)
app.get('/', (req, res) => {
  res.json({
    name: 'Wedding Photo Gallery API',
    version: '1.0.0',
    documentation: '/api/health',
    status: 'online'
  });
});

// 404 Route Not Found Handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist.`,
      statusCode: 404
    }
  });
});

// =============================================================================
// Centralized Error Handling Middleware
// =============================================================================
app.use((err, req, res, next) => {
  // If it's a known DriveError
  if (err instanceof DriveError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        statusCode: err.statusCode,
        details: err.details
      }
    });
  }

  // Supabase / PostgreSQL errors
  if (err.code && typeof err.code === 'string' && err.message) {
    return res.status(400).json({
      error: {
        code: `DB_ERROR_${err.code}`,
        message: err.message,
        statusCode: 400
      }
    });
  }

  // Default server error
  console.error('[ServerError]', err);
  const status = err.statusCode || err.status || 500;
  return res.status(status).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred.',
      statusCode: status
    }
  });
});

// =============================================================================
// Server Startup (only runs when executed directly, not when imported in tests)
// =============================================================================
const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` Wedding Photo Gallery Server Running`);
    console.log(` Port:    http://localhost:${PORT}`);
    console.log(` Health:  http://localhost:${PORT}/api/health`);
    console.log(` Admin:   http://localhost:${PORT}/api/admin/events`);
    console.log(` Env:     ${process.env.NODE_ENV || 'development'}`);
    console.log(`====================================================`);
  });
}

export default app;
