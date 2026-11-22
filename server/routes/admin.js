import express from 'express';
import crypto from 'crypto';
import { getSupabaseClient } from '../config/supabase.js';
import { extractFolderId, getEventCategories, normalizeDriveError } from '../utils/drive.js';
import { saveEventMetadata, enrichEvent, loadAllMetadata } from '../utils/eventMetadata.js';
import { getStudioSettings, saveStudioSettings } from '../utils/studioSettings.js';

const router = express.Router();

/**
 * Generates an URL-friendly unique slug from client name or title
 */
export function generateEventSlug(clientName, title) {
  const source = clientName || title || 'wedding';
  const cleanBase = source
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);

  const alphabet = '23456789abcdefghjkmnpqrstuvwxyz';
  const bytes = crypto.randomBytes(6);
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += alphabet[bytes[i] % alphabet.length];
  }

  const base = cleanBase || 'event';
  return `${base}-${suffix}`;
}

/**
 * POST /api/admin/events
 * Creates a new wedding event after verifying the Google Drive folder.
 * Body: { title, clientName, driveFolderUrl, eventDate, location }
 */
router.post('/events', async (req, res, next) => {
  try {
    const { title, clientName, driveFolderUrl, eventDate, location } = req.body;

    // 1. Validate required fields
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        error: {
          code: 'MISSING_TITLE',
          message: 'Event Title is required.',
          statusCode: 400
        }
      });
    }

    if (!clientName || typeof clientName !== 'string' || clientName.trim().length === 0) {
      return res.status(400).json({
        error: {
          code: 'MISSING_CLIENT_NAME',
          message: 'Client Name is required.',
          statusCode: 400
        }
      });
    }

    if (!driveFolderUrl || typeof driveFolderUrl !== 'string' || driveFolderUrl.trim().length === 0) {
      return res.status(400).json({
        error: {
          code: 'MISSING_DRIVE_LINK',
          message: 'Google Drive folder link is required.',
          statusCode: 400
        }
      });
    }

    // 2. Extract Google Drive folder ID
    let folderId;
    try {
      folderId = extractFolderId(driveFolderUrl);
    } catch (err) {
      return res.status(400).json({
        error: {
          code: 'INVALID_DRIVE_URL',
          message: err.message || 'Invalid Google Drive folder link or ID format.',
          statusCode: 400
        }
      });
    }

    // 3. Verify folder is accessible via Google Drive API v3
    let categories = [];
    try {
      categories = await getEventCategories(folderId, { bypassCache: true });
    } catch (driveErr) {
      const normalized = normalizeDriveError(driveErr, 'Folder Verification');

      if (normalized.code === 'FOLDER_ACCESS_DENIED' || normalized.statusCode === 403) {
        return res.status(403).json({
          error: {
            code: 'FOLDER_ACCESS_DENIED',
            message:
              'The Google Drive folder is private or not shared. Please set the folder sharing settings in Google Drive to "Anyone with the link can view" before creating this gallery.',
            statusCode: 403,
            details: normalized.details
          }
        });
      }

      if (normalized.code === 'FOLDER_NOT_FOUND' || normalized.statusCode === 404) {
        return res.status(404).json({
          error: {
            code: 'FOLDER_NOT_FOUND',
            message: 'Google Drive folder not found. Please verify the folder URL or ID.',
            statusCode: 404,
            details: normalized.details
          }
        });
      }

      return res.status(normalized.statusCode).json({
        error: {
          code: normalized.code,
          message: normalized.message,
          statusCode: normalized.statusCode,
          details: normalized.details
        }
      });
    }

    // 4. Generate unique slug
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(503).json({
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Supabase client is not configured.',
          statusCode: 503
        }
      });
    }

    let slug = generateEventSlug(clientName, title);
    let attempts = 0;
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (!existing) break;
      slug = generateEventSlug(clientName, title);
      attempts++;
    }

    // 5. Insert event into Supabase
    // Try with event_date and location first
    let newEvent = null;
    const insertPayloadWithMeta = {
      slug,
      title: title.trim(),
      client_name: clientName.trim(),
      drive_folder_id: folderId,
      event_date: eventDate ? eventDate.trim() : null,
      location: location ? location.trim() : null
    };

    const { data: insertedWithMeta, error: metaInsertError } = await supabase
      .from('events')
      .insert([insertPayloadWithMeta])
      .select()
      .maybeSingle();

    if (!metaInsertError && insertedWithMeta) {
      newEvent = insertedWithMeta;
    } else {
      // Fallback without columns in case schema hasn't been migrated yet
      const { data: basicInsert, error: basicError } = await supabase
        .from('events')
        .insert([
          {
            slug,
            title: title.trim(),
            client_name: clientName.trim(),
            drive_folder_id: folderId
          }
        ])
        .select()
        .single();

      if (basicError) throw basicError;
      newEvent = basicInsert;
    }

    // Persist metadata locally as well
    saveEventMetadata(slug, {
      eventDate: eventDate?.trim() || '',
      location: location?.trim() || ''
    });

    return res.status(201).json({
      event: enrichEvent(newEvent),
      categories: categories || [],
      shareableUrl: `/e/${newEvent.slug}`
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/admin/events/:id
 * Updates an event's details: title, clientName, driveFolderUrl, eventDate, location
 */
router.put('/events/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, clientName, driveFolderUrl, eventDate, location } = req.body;

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(503).json({
        error: { code: 'DATABASE_UNAVAILABLE', message: 'Supabase client is not configured.' }
      });
    }

    // Find existing event
    const { data: existing, error: findError } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (findError) throw findError;
    if (!existing) {
      return res.status(404).json({
        error: { code: 'EVENT_NOT_FOUND', message: `Event with ID "${id}" was not found.` }
      });
    }

    let folderId = existing.drive_folder_id;
    if (driveFolderUrl && driveFolderUrl.trim().length > 0) {
      try {
        folderId = extractFolderId(driveFolderUrl);
      } catch (err) {
        return res.status(400).json({
          error: { code: 'INVALID_DRIVE_URL', message: err.message, statusCode: 400 }
        });
      }
    }

    const updateFields = {
      title: title ? title.trim() : existing.title,
      client_name: clientName ? clientName.trim() : existing.client_name,
      drive_folder_id: folderId
    };

    // Try updating with event_date and location
    let updatedEvent = null;
    const { data: withMeta, error: metaUpdateErr } = await supabase
      .from('events')
      .update({
        ...updateFields,
        event_date: eventDate !== undefined ? eventDate.trim() : existing.event_date,
        location: location !== undefined ? location.trim() : existing.location
      })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (!metaUpdateErr && withMeta) {
      updatedEvent = withMeta;
    } else {
      // Fallback update without meta columns
      const { data: basicUpdate, error: basicUpdateErr } = await supabase
        .from('events')
        .update(updateFields)
        .eq('id', id)
        .select()
        .single();

      if (basicUpdateErr) throw basicUpdateErr;
      updatedEvent = basicUpdate;
    }

    // Save metadata
    saveEventMetadata(existing.slug, {
      eventDate: eventDate !== undefined ? eventDate : undefined,
      location: location !== undefined ? location : undefined
    });

    res.json({
      success: true,
      event: enrichEvent(updatedEvent),
      message: 'Event updated successfully.'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/events
 * Returns list of events ordered by created_at desc with download lead counts and metadata.
 */
router.get('/events', async (req, res, next) => {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(503).json({
        error: { code: 'DATABASE_UNAVAILABLE', message: 'Supabase client is not configured.' }
      });
    }

    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (eventsError) throw eventsError;

    const { data: leads, error: leadsError } = await supabase
      .from('download_leads')
      .select('event_slug');

    const leadCounts = {};
    if (leads && !leadsError) {
      for (const lead of leads) {
        leadCounts[lead.event_slug] = (leadCounts[lead.event_slug] || 0) + 1;
      }
    }

    const eventsWithCounts = (events || []).map((ev) => ({
      ...enrichEvent(ev),
      lead_count: leadCounts[ev.slug] || 0
    }));

    res.json({ events: eventsWithCounts });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/events/:slug/leads
 */
router.get('/events/:slug/leads', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(503).json({
        error: { code: 'DATABASE_UNAVAILABLE', message: 'Supabase client is not configured.' }
      });
    }

    const { data: leads, error } = await supabase
      .from('download_leads')
      .select('id, visitor_name, visitor_email, created_at')
      .eq('event_slug', slug)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      slug,
      leads: leads || []
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/admin/events/:id
 */
router.delete('/events/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(503).json({
        error: { code: 'DATABASE_UNAVAILABLE', message: 'Supabase client is not configured.' }
      });
    }

    const { data: existing, error: findError } = await supabase
      .from('events')
      .select('id, slug, title')
      .eq('id', id)
      .maybeSingle();

    if (findError) throw findError;
    if (!existing) {
      return res.status(404).json({
        error: { code: 'EVENT_NOT_FOUND', message: `Event with ID "${id}" was not found.`, statusCode: 404 }
      });
    }

    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    res.json({
      success: true,
      message: `Event "${existing.title}" deleted successfully.`
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/studio
 * Returns current studio contacts & social profiles
 */
router.get('/studio', (req, res) => {
  res.json(getStudioSettings());
});

/**
 * PUT /api/admin/studio
 * Updates studio contacts & social profiles
 */
router.put('/studio', (req, res) => {
  const updated = saveStudioSettings(req.body);
  res.json({
    success: true,
    settings: updated,
    message: 'Studio settings updated successfully.'
  });
});

export default router;
