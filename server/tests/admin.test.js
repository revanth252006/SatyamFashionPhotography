import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateEventSlug } from '../routes/admin.js';
import { getStudioSettings, saveStudioSettings } from '../utils/studioSettings.js';

describe('Admin Utility - generateEventSlug', () => {
  it('generates a clean slug with 6-char random suffix from client name', () => {
    const slug = generateEventSlug('Ananya & Karthik', 'Royal Palace Wedding');
    // Expected format: ananya-karthik-xxxxxx (length of suffix is 6)
    assert.match(slug, /^ananya-karthik-[a-z0-9]{6}$/);
  });

  it('handles titles when client name is missing', () => {
    const slug = generateEventSlug('', 'Sunset Coast Wedding 2026');
    assert.match(slug, /^sunset-coast-wedding-2026-[a-z0-9]{6}$/);
  });

  it('removes accents and special characters cleanly', () => {
    const slug = generateEventSlug('Hélène & François', 'Château Wedding');
    assert.match(slug, /^helene-francois-[a-z0-9]{6}$/);
  });

  it('generates distinct slugs for subsequent calls with same names', () => {
    const slug1 = generateEventSlug('Sarah & Mike', 'Wedding');
    const slug2 = generateEventSlug('Sarah & Mike', 'Wedding');
    assert.notStrictEqual(slug1, slug2);
  });
});

describe('Studio Settings Utility', () => {
  it('returns default studio contact details and social media links', () => {
    const settings = getStudioSettings();
    assert.equal(settings.studioName, 'Satyam Fashion Photography');
    assert.equal(settings.phone1, '9347242212');
    assert.equal(settings.phone2, '9440163135');
    assert.equal(settings.email, 'a.satyamdigital@gmail.com');
    assert.ok(settings.mapsUrl.includes('google.com') || settings.mapsUrl.includes('goo.gl'));
    assert.ok(settings.instagramUrl.includes('instagram.com'));
    assert.ok(settings.youtubeUrl.includes('youtube.com'));
  });

  it('saves and updates studio settings cleanly', () => {
    const original = getStudioSettings();
    const updated = saveStudioSettings({
      locationName: 'Jubilee Hills, Hyderabad'
    });
    assert.equal(updated.locationName, 'Jubilee Hills, Hyderabad');
    // restore original location
    saveStudioSettings({ locationName: original.locationName });
  });
});
