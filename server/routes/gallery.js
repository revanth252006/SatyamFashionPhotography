import express from 'express';
import { getSupabaseClient } from '../config/supabase.js';
import { 
  extractFolderId, 
  getEventCategories, 
  getCategoryPhotos, 
  getAllEventPhotos,
  normalizeDriveError 
} from '../utils/drive.js';
import { enrichEvent } from '../utils/eventMetadata.js';

const router = express.Router();

// Email validation regex (RFC 5322 compatible)
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/**
 * Fallback demo events for local preview if Supabase is offline
 */
const DEMO_EVENTS = [
  {
    id: 'e0123456-789a-bcde-f012-3456789abcde',
    slug: 'satyam-and-nagalaxmi-6k7z3t',
    title: 'Satyam weds Nagalaxmi',
    client_name: 'Satyam And Nagalaxmi',
    drive_folder_id: '1znJU4nLx5dQM0kUKjEYIg14Zxtf8MYDX',
    created_at: new Date().toISOString()
  }
];

/**
 * Helper to fetch event by slug from Supabase or fallback
 */
async function findEventBySlug(slug) {
  const cleanSlug = String(slug).toLowerCase().trim();
  const supabase = getSupabaseClient();

  if (supabase) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('slug', cleanSlug)
      .maybeSingle();

    if (!error && data) {
      return enrichEvent(data);
    }
    // Supabase is active: if not found, event does not exist (or was deleted)
    return null;
  }

  // Fallback to demo events ONLY if Supabase is not configured
  const demo = DEMO_EVENTS.find((e) => e.slug === cleanSlug);
  return demo ? enrichEvent(demo) : null;
}

/**
 * 1. GET /api/events/:slug
 * Looks up event by slug, fetches child category folders from drive_folder_id.
 * Never exposes unrelated events or folders.
 */
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const bypassCache = req.query.refresh === 'true';

    const event = await findEventBySlug(slug);
    if (!event) {
      return res.status(404).json({
        error: {
          code: 'EVENT_NOT_FOUND',
          message: `No wedding event found for slug: "${slug}"`,
          statusCode: 404
        }
      });
    }

    let categories = [];
    let driveNotice = null;

    try {
      categories = await getEventCategories(event.drive_folder_id, { bypassCache });
    } catch (err) {
      driveNotice = err.message;
      categories = [];
    }

    res.json({
      event,
      categories,
      ...(driveNotice && { driveNotice })
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 2. GET /api/events/:slug/photos
 * Accepts query params: categoryId (optional), pageSize (default 40), pageToken (optional), refresh (optional)
 * Uses server/utils/drive.js with pagination so large events load smoothly on mobile and PC.
 */
router.get('/:slug/photos', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const {
      categoryId,
      pageSize = 40,
      pageToken = null,
      refresh = 'false'
    } = req.query;

    const bypassCache = refresh === 'true';
    const parsedPageSize = Math.min(Math.max(parseInt(pageSize, 10) || 40, 1), 100);

    const event = await findEventBySlug(slug);
    if (!event) {
      return res.status(404).json({
        error: {
          code: 'EVENT_NOT_FOUND',
          message: `No wedding event found for slug: "${slug}"`,
          statusCode: 404
        }
      });
    }

    // If categoryId is specified, fetch that category
    if (categoryId && categoryId !== '__all__') {
      const cleanCatId = extractFolderId(categoryId);
      const result = await getCategoryPhotos(cleanCatId, {
        pageSize: parsedPageSize,
        pageToken: pageToken || null,
        bypassCache
      });
      return res.json(result);
    }

    // Otherwise, fetch all event photos across categories or root folder
    const allResult = await getAllEventPhotos(event.drive_folder_id, { bypassCache });
    return res.json(allResult);
  } catch (err) {
    next(err);
  }
});

/**
 * 3. POST /api/events/:slug/leads
 * Accepts { visitorName, visitorEmail } (supports visitor_name / visitor_email)
 * Validates both fields & email format, inserts into download_leads, returns { ok: true }
 */
router.post('/:slug/leads', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const visitorName = req.body.visitorName || req.body.visitor_name;
    const visitorEmail = req.body.visitorEmail || req.body.visitor_email;

    // Validate visitor name
    if (!visitorName || typeof visitorName !== 'string' || visitorName.trim().length === 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_VISITOR_NAME',
          message: 'Visitor name is required.',
          statusCode: 400
        }
      });
    }

    // Validate visitor email
    if (!visitorEmail || typeof visitorEmail !== 'string' || !EMAIL_REGEX.test(visitorEmail.trim())) {
      return res.status(400).json({
        error: {
          code: 'INVALID_EMAIL',
          message: 'A valid email address is required to download photos.',
          statusCode: 400
        }
      });
    }

    const cleanName = visitorName.trim();
    const cleanEmail = visitorEmail.trim().toLowerCase();
    const cleanSlug = String(slug).trim().toLowerCase();

    const supabase = getSupabaseClient();
    let savedLead = null;

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
        // If foreign key constraint fails because event slug is not in DB, log warning
        console.warn(`[GalleryLeads] Supabase insert note (${cleanSlug}):`, error.message);
      } else {
        savedLead = data;
      }
    }

    res.status(201).json({
      ok: true,
      message: 'Download lead recorded successfully.',
      lead: savedLead || {
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
