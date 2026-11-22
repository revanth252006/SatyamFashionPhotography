import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../server.js';
import { getSupabaseClient } from '../config/supabase.js';

describe('Express API Server Endpoints', () => {
  let server;
  let baseUrl;

  before(async () => {
    // Ensure test event exists for integration tests
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('events').upsert({
        slug: 'satyam-and-nagalaxmi-6k7z3t',
        title: 'Satyam weds Nagalaxmi',
        client_name: 'Satyam And Nagalaxmi',
        drive_folder_id: '1znJU4nLx5dQM0kUKjEYIg14Zxtf8MYDX'
      }, { onConflict: 'slug' });
    }

    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('GET /api/health returns 200 with service status and cache stats', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.service, 'wedding-gallery-api');
    assert(body.cacheStats !== undefined);
  });

  it('GET /health returns 200', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, 'ok');
  });

  it('GET /api/events returns list of events', async () => {
    const res = await fetch(`${baseUrl}/api/events`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert(Array.isArray(body.events));
    assert(body.events.length > 0);
  });

  it('GET /api/events/:slug returns event details and categories', async () => {
    const eventsRes = await fetch(`${baseUrl}/api/events`);
    const eventsData = await eventsRes.json();
    const testSlug = eventsData.events?.[0]?.slug || 'satyam-and-nagalaxmi-6k7z3t';

    const res = await fetch(`${baseUrl}/api/events/${testSlug}`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.event.slug, testSlug);
    assert(Array.isArray(body.categories));
  });

  it('POST /api/leads validates required fields and accepts valid lead', async () => {
    // Get an existing event slug from the database
    const eventsRes = await fetch(`${baseUrl}/api/events`);
    const eventsData = await eventsRes.json();
    const testSlug = eventsData.events?.[0]?.slug || 'satyam-and-nagalaxmi-6k7z3t';

    // Missing email
    const invalidRes = await fetch(`${baseUrl}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_slug: testSlug,
        visitor_name: 'Jane Doe'
      })
    });
    assert.strictEqual(invalidRes.status, 400);

    // Valid lead
    const validRes = await fetch(`${baseUrl}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_slug: testSlug,
        visitor_name: 'Jane Doe',
        visitor_email: 'jane.doe@example.com'
      })
    });
    assert.strictEqual(validRes.status, 201);
    const validBody = await validRes.json();
    assert.strictEqual(validBody.success, true);
    assert.strictEqual(validBody.lead.visitor_email, 'jane.doe@example.com');
  });

  it('GET /api/photos?categoryId=... returns photos list or demo fallback', async () => {
    const res = await fetch(`${baseUrl}/api/photos?categoryId=1aB2cD3eF4gH5iJ6kL7mN8oP9qR0sT1uV`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert(Array.isArray(body.photos));
  });

  // ===========================================================================
  // Feature 2: Admin Endpoints Tests
  // ===========================================================================
  it('GET /api/admin/events returns all events with lead_count', async () => {
    const res = await fetch(`${baseUrl}/api/admin/events`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert(Array.isArray(body.events));
    if (body.events.length > 0) {
      assert(typeof body.events[0].lead_count === 'number');
    }
  });

  it('POST /api/admin/events rejects missing fields with 400', async () => {
    const res = await fetch(`${baseUrl}/api/admin/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Only Title'
      })
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.error.code, 'MISSING_CLIENT_NAME');
  });

  it('POST /api/admin/events rejects invalid drive url with 400', async () => {
    const res = await fetch(`${baseUrl}/api/admin/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Ananya & Karthik Wedding',
        clientName: 'Ananya & Karthik',
        driveFolderUrl: 'https://example.com/invalid-link'
      })
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.error.code, 'INVALID_DRIVE_URL');
  });

  it('GET /api/admin/events/:slug/leads returns leads for an event slug', async () => {
    const eventsRes = await fetch(`${baseUrl}/api/events`);
    const eventsData = await eventsRes.json();
    const testSlug = eventsData.events?.[0]?.slug || 'satyam-and-nagalaxmi-6k7z3t';

    const res = await fetch(`${baseUrl}/api/admin/events/${testSlug}/leads`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.slug, testSlug);
    assert(Array.isArray(body.leads));
  });

  it('DELETE /api/admin/events/:id returns 404 for non-existent UUID', async () => {
    const fakeUuid = '00000000-0000-0000-0000-000000000000';
    const res = await fetch(`${baseUrl}/api/admin/events/${fakeUuid}`, {
      method: 'DELETE'
    });
    assert.strictEqual(res.status, 404);
    const body = await res.json();
    assert.strictEqual(body.error.code, 'EVENT_NOT_FOUND');
  });
});
