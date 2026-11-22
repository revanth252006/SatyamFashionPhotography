import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const METADATA_FILE = path.resolve(DATA_DIR, 'event-metadata.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial default metadata for known events
const DEFAULT_METADATA = {
  'satyam-and-nagalaxmi-6k7z3t': {
    event_date: '22 November 2026',
    location: 'Hyderabad, Telangana'
  },
  'elena-and-lucas-2026': {
    event_date: 'Summer 2026',
    location: 'Villa Cora, Florence'
  },
  'sophia-and-daniel-2026': {
    event_date: 'Autumn 2026',
    location: 'Big Sur, California'
  }
};

/**
 * Load all metadata from disk
 */
export function loadAllMetadata() {
  try {
    if (fs.existsSync(METADATA_FILE)) {
      const content = fs.readFileSync(METADATA_FILE, 'utf-8');
      return { ...DEFAULT_METADATA, ...JSON.parse(content || '{}') };
    }
  } catch (err) {
    console.warn('[Metadata] Could not read metadata file, using defaults:', err.message);
  }
  return { ...DEFAULT_METADATA };
}

/**
 * Save metadata for a specific event slug
 */
export function saveEventMetadata(slug, data = {}) {
  try {
    const all = loadAllMetadata();
    all[slug] = {
      ...(all[slug] || {}),
      event_date: data.event_date ?? data.eventDate ?? all[slug]?.event_date ?? '',
      location: data.location ?? all[slug]?.location ?? ''
    };
    fs.writeFileSync(METADATA_FILE, JSON.stringify(all, null, 2), 'utf-8');
    return all[slug];
  } catch (err) {
    console.error('[Metadata] Error saving event metadata:', err.message);
    return null;
  }
}

/**
 * Merges extra metadata (event_date, location) into an event object
 */
export function enrichEvent(event) {
  if (!event) return event;
  const all = loadAllMetadata();
  const meta = all[event.slug] || {};
  return {
    ...event,
    event_date: event.event_date || meta.event_date || '',
    location: event.location || meta.location || ''
  };
}

export default {
  loadAllMetadata,
  saveEventMetadata,
  enrichEvent
};
