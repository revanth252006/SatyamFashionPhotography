import express from 'express';
import { getSupabaseClient } from '../config/supabase.js';
import { extractFolderId, getEventCategories } from '../utils/drive.js';
import { enrichEvent } from '../utils/eventMetadata.js';

const router = express.Router();

// Fallback demo events for initial development before Supabase DB credentials are set
const DEMO_EVENTS = [
  {
    id: 'e0123456-789a-bcde-f012-3456789abcde',
    slug: 'elena-and-lucas-2026',
    title: 'Elena & Lucas — Tuscan Villa Wedding',
    client_name: 'Elena Rostova & Lucas Bennett',
    drive_folder_id: '1aB2cD3eF4gH5iJ6kL7mN8oP9qR0sT1uV',
    created_at: new Date().toISOString()
  },
  {
    id: 'f9876543-210b-cdef-0123-456789abcdef',
    slug: 'sophia-and-daniel-2026',
    title: 'Sophia & Daniel — Coastal Sunset Celebration',
    client_name: 'Sophia Martinez & Daniel Vance',
    drive_folder_id: '1XYZ_SAMPLE_FOLDER_ID_FOR_DEMO_001',
    created_at: new Date().toISOString()
  }
];

/**
 * List all events
 * GET /api/events
 */
router.get('/', async (req, res, next) => {
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.json({ events: (data || []).map(enrichEvent) });
    }

    // Fallback when Supabase is not yet connected
    return res.json({ events: DEMO_EVENTS, notice: 'Running with sample events (Supabase credentials not configured)' });
  } catch (err) {
    next(err);
  }
});

/**
 * Get single event by slug along with its Google Drive categories
 * GET /api/events/:slug
 */
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const bypassCache = req.query.refresh === 'true';

    let event = null;
    const supabase = getSupabaseClient();

    if (supabase) {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      event = data;
    }

    // Fallback to demo events if not in DB
    if (!event) {
      event = DEMO_EVENTS.find((e) => e.slug === slug);
    }

    if (!event) {
      return res.status(404).json({
        error: {
          code: 'EVENT_NOT_FOUND',
          message: `No wedding event found for slug: "${slug}"`,
          statusCode: 404
        }
      });
    }

    // Fetch child folders (categories) from Google Drive
    let categories = [];
    let driveErrorNotice = null;

    try {
      categories = await getEventCategories(event.drive_folder_id, { bypassCache });
    } catch (driveErr) {
      // In case Google Drive API credentials are not yet configured or folder is mock,
      // return default mock categories so frontend remains previewable
      driveErrorNotice = driveErr.message;
      categories = [
        { id: `${event.drive_folder_id}_getting_ready`, name: 'Getting Ready' },
        { id: `${event.drive_folder_id}_ceremony`, name: 'Ceremony' },
        { id: `${event.drive_folder_id}_portraits`, name: 'Portraits' },
        { id: `${event.drive_folder_id}_reception`, name: 'Reception & Party' }
      ];
    }

    res.json({
      event: enrichEvent(event),
      categories,
      ...(driveErrorNotice && { driveNotice: driveErrorNotice })
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Create a new event
 * POST /api/events
 */
router.post('/', async (req, res, next) => {
  try {
    const { slug, title, client_name, drive_folder_id } = req.body;

    if (!slug || !title || !client_name || !drive_folder_id) {
      return res.status(400).json({
        error: {
          code: 'MISSING_FIELDS',
          message: 'slug, title, client_name, and drive_folder_id are required fields.',
          statusCode: 400
        }
      });
    }

    // Validate and clean Google Drive folder URL or ID
    const cleanFolderId = extractFolderId(drive_folder_id);

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(503).json({
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Supabase client is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
          statusCode: 503
        }
      });
    }

    const { data, error } = await supabase
      .from('events')
      .insert([
        {
          slug: slug.toLowerCase().trim(),
          title: title.trim(),
          client_name: client_name.trim(),
          drive_folder_id: cleanFolderId
        }
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          error: {
            code: 'SLUG_ALREADY_EXISTS',
            message: `Event slug "${slug}" already exists. Please choose a unique slug.`,
            statusCode: 409
          }
        });
      }
      throw error;
    }

    res.status(201).json({ event: data });
  } catch (err) {
    next(err);
  }
});

export default router;
