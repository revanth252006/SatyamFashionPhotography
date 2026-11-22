import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import app from '../server.js';

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
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

describe('Feature 3: Gallery API Endpoints', () => {
  let testSlug = 'satyam-and-nagalaxmi-6k7z3t';

  it('GET /api/events/:slug returns event details and child categories', async () => {
    const res = await fetch(`${baseUrl}/api/events/${testSlug}`);
    assert.equal(res.status, 200);
    const data = await res.json();

    assert.ok(data.event);
    assert.equal(data.event.slug, testSlug);
    assert.ok(Array.isArray(data.categories));
  });

  it('GET /api/events/:slug/photos returns photos with pagination support', async () => {
    const res = await fetch(`${baseUrl}/api/events/${testSlug}/photos?pageSize=10`);
    assert.equal(res.status, 200);
    const data = await res.json();

    assert.ok(Array.isArray(data.photos));
    assert.ok(data.photos.length > 0);
    assert.ok(data.photos[0].id);
    assert.ok(data.photos[0].name);
  });

  it('GET /api/events/:slug/photos accepts categoryId query param', async () => {
    // First get a category
    const eventRes = await fetch(`${baseUrl}/api/events/${testSlug}`);
    const eventData = await eventRes.json();
    const firstCat = eventData.categories?.[0];

    if (firstCat) {
      const res = await fetch(`${baseUrl}/api/events/${testSlug}/photos?categoryId=${firstCat.id}&pageSize=5`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data.photos));
    }
  });

  it('POST /api/events/:slug/leads validates required visitorName and visitorEmail', async () => {
    // Missing fields
    const res1 = await fetch(`${baseUrl}/api/events/${testSlug}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.equal(res1.status, 400);

    // Invalid email format
    const res2 = await fetch(`${baseUrl}/api/events/${testSlug}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorName: 'John Guest',
        visitorEmail: 'not-an-email'
      })
    });
    assert.equal(res2.status, 400);
    const errData = await res2.json();
    assert.equal(errData.error?.code, 'INVALID_EMAIL');
  });

  it('POST /api/events/:slug/leads records valid lead and returns { ok: true }', async () => {
    const res = await fetch(`${baseUrl}/api/events/${testSlug}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorName: 'Priya Sharma',
        visitorEmail: 'priya.sharma@gmail.com'
      })
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.ok(data.lead);
    assert.equal(data.lead.visitor_name, 'Priya Sharma');
    assert.equal(data.lead.visitor_email, 'priya.sharma@gmail.com');
  });
});
