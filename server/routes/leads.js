import express from 'express';
import { getSupabaseClient } from '../config/supabase.js';

const router = express.Router();

// Email validation regex (RFC 5322 compatible)
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/**
 * Submit a download lead
 * POST /api/leads
 * Body: { event_slug: string, visitor_name: string, visitor_email: string }
 */
router.post('/', async (req, res, next) => {
  try {
    const { event_slug, visitor_name, visitor_email } = req.body;

    // Validate fields
    if (!event_slug || typeof event_slug !== 'string') {
      return res.status(400).json({
        error: {
          code: 'INVALID_EVENT_SLUG',
          message: 'event_slug is required.',
          statusCode: 400
        }
      });
    }

    if (!visitor_name || typeof visitor_name !== 'string' || visitor_name.trim().length === 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_VISITOR_NAME',
          message: 'visitor_name is required.',
          statusCode: 400
        }
      });
    }

    if (!visitor_email || typeof visitor_email !== 'string' || !EMAIL_REGEX.test(visitor_email.trim())) {
      return res.status(400).json({
        error: {
          code: 'INVALID_EMAIL',
          message: 'A valid visitor_email is required to receive download links.',
          statusCode: 400
        }
      });
    }

    const cleanName = visitor_name.trim();
    const cleanEmail = visitor_email.trim().toLowerCase();
    const cleanSlug = event_slug.trim().toLowerCase();

    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('download_leads')
        .insert([
          {
            event_slug: cleanSlug,
            visitor_name: cleanName,
            visitor_email: cleanEmail
          }
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return res.status(201).json({
        success: true,
        message: 'Download lead captured successfully.',
        lead: data
      });
    }

    // In-development fallback when Supabase is not connected
    return res.status(201).json({
      success: true,
      message: 'Download lead captured (development mock mode).',
      lead: {
        id: 'mock-lead-' + Date.now(),
        event_slug: cleanSlug,
        visitor_name: cleanName,
        visitor_email: cleanEmail,
        created_at: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
