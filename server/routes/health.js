import express from 'express';
import memoryCache from '../utils/cache.js';
import { getSupabaseClient } from '../config/supabase.js';

const router = express.Router();

/**
 * Health Check Endpoint
 * GET /api/health or GET /health
 * Returns service status, uptime, memory usage, cache statistics, and service readiness.
 */
router.get('/', (req, res) => {
  const supabase = getSupabaseClient();
  const hasDriveAuth = Boolean(
    process.env.GOOGLE_DRIVE_API_KEY || 
    process.env.GOOGLE_APPLICATION_CREDENTIALS || 
    (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY)
  );

  const memoryUsage = process.memoryUsage();

  res.status(200).json({
    status: 'ok',
    service: 'wedding-gallery-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    services: {
      supabase: supabase ? 'configured' : 'mock_or_unconfigured',
      googleDrive: hasDriveAuth ? 'configured' : 'unconfigured'
    },
    cacheStats: memoryCache.stats(),
    memory: {
      rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
      heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024)
    }
  });
});

export default router;
