import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const SETTINGS_FILE = path.resolve(DATA_DIR, 'studio-settings.json');

const DEFAULT_SETTINGS = {
  studioName: 'Satyam Fashion Photography',
  phone1: '9347242212',
  phone2: '9440163135',
  email: 'a.satyamdigital@gmail.com',
  locationName: 'Hyderabad, Telangana',
  mapsUrl: 'https://maps.google.com/?q=Satyam+Fashion+Photography+Hyderabad',
  instagramUrl: 'https://www.instagram.com/satyamfashionphotography',
  youtubeUrl: 'https://www.youtube.com/@satyamfashionphotography'
};

export function getStudioSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const content = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(content || '{}') };
    }
  } catch (err) {
    console.warn('[StudioSettings] Error reading settings file:', err.message);
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveStudioSettings(updated = {}) {
  try {
    const current = getStudioSettings();
    const merged = { ...current, ...updated };
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2), 'utf-8');
    return merged;
  } catch (err) {
    console.error('[StudioSettings] Error saving settings:', err.message);
    return getStudioSettings();
  }
}

export default {
  getStudioSettings,
  saveStudioSettings
};
