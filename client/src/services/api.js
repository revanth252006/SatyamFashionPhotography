/**
 * Frontend API client
 * Handles calls to Express backend endpoints.
 */

// Normalize API base: if VITE_API_BASE_URL is 'http://localhost:5000', ensure '/api' prefix
const rawBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const API_BASE = rawBase.endsWith('/api') ? rawBase : (rawBase ? `${rawBase}/api` : '/api');

/**
 * Check backend health & service readiness
 */
export async function getHealthStatus() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

/**
 * Fetch wedding event details & Drive categories by slug
 */
export async function getEventBySlug(slug, bypassCache = false) {
  const url = `${API_BASE}/events/${encodeURIComponent(slug)}${bypassCache ? '?refresh=true' : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to fetch event (${res.status})`);
  }
  return await res.json();
}

/**
 * Feature 3: Fetch photos for an event by slug (GET /api/events/:slug/photos)
 */
export async function getEventPhotos(slug, {
  categoryId = null,
  pageSize = 40,
  pageToken = null,
  bypassCache = false
} = {}) {
  const params = new URLSearchParams();
  if (categoryId) params.set('categoryId', categoryId);
  params.set('pageSize', String(pageSize));
  if (pageToken) params.set('pageToken', pageToken);
  if (bypassCache) params.set('refresh', 'true');

  const res = await fetch(`${API_BASE}/events/${encodeURIComponent(slug)}/photos?${params.toString()}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to fetch event photos (${res.status})`);
  }
  return await res.json();
}

/**
 * Fetch photos inside a specific category folder or all photos across all categories
 */
export async function getPhotosByCategory(categoryId, { 
  pageSize = 50, 
  pageToken = null, 
  bypassCache = false, 
  all = false, 
  parentFolderId = null 
} = {}) {
  const params = new URLSearchParams();

  if (all || !categoryId) {
    params.set('all', 'true');
    if (parentFolderId || categoryId) {
      params.set('parentFolderId', parentFolderId || categoryId);
    }
  } else {
    params.set('categoryId', categoryId);
    if (parentFolderId) {
      params.set('parentFolderId', parentFolderId);
    }
  }

  params.set('pageSize', String(pageSize));
  if (pageToken) params.set('pageToken', pageToken);
  if (bypassCache) params.set('refresh', 'true');

  const res = await fetch(`${API_BASE}/photos?${params.toString()}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to fetch photos (${res.status})`);
  }
  return await res.json();
}

/**
 * Submit download lead before downloading photos
 * Calls Feature 3 endpoint POST /api/events/:slug/leads with fallback to POST /api/leads
 */
export async function submitDownloadLead({ eventSlug, visitorName, visitorEmail }) {
  try {
    const res = await fetch(`${API_BASE}/events/${encodeURIComponent(eventSlug)}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorName,
        visitorEmail
      })
    });
    if (res.ok) return await res.json();
  } catch {
    // Proceed to fallback
  }

  const res = await fetch(`${API_BASE}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_slug: eventSlug,
      visitor_name: visitorName,
      visitor_email: visitorEmail
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Submission failed (${res.status})`);
  }
  return await res.json();
}

/**
 * Fetch all events for the studio admin panel with lead counts
 */
export async function fetchAdminEvents() {
  const res = await fetch(`${API_BASE}/admin/events`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to fetch events (${res.status})`);
  }
  return await res.json();
}

/**
 * Create a new wedding event with Google Drive folder link verification
 */
export async function createAdminEvent({ title, clientName, driveFolderUrl, eventDate, location }) {
  const res = await fetch(`${API_BASE}/admin/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      clientName,
      driveFolderUrl,
      eventDate,
      location
    })
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.error?.message || `Failed to create event (${res.status})`);
    error.code = data.error?.code;
    error.statusCode = res.status;
    error.details = data.error?.details;
    throw error;
  }

  return data;
}

/**
 * Update an existing event (Title, Client Name, Captured Date, Location, Drive Link)
 */
export async function updateAdminEvent(id, { title, clientName, driveFolderUrl, eventDate, location }) {
  const res = await fetch(`${API_BASE}/admin/events/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      clientName,
      driveFolderUrl,
      eventDate,
      location
    })
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.error?.message || `Failed to update event (${res.status})`);
    error.code = data.error?.code;
    error.statusCode = res.status;
    throw error;
  }

  return data;
}

/**
 * Fetch download leads for a specific event slug
 */
export async function fetchAdminEventLeads(slug) {
  const res = await fetch(`${API_BASE}/admin/events/${encodeURIComponent(slug)}/leads`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to fetch leads (${res.status})`);
  }
  return await res.json();
}

/**
 * Delete an event by UUID
 */
export async function deleteAdminEvent(id) {
  const res = await fetch(`${API_BASE}/admin/events/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error?.message || `Failed to delete event (${res.status})`);
  }

  return data;
}

/**
 * Fetch Studio Contact & Social Settings (phones, email, maps, instagram, youtube)
 */
export async function fetchStudioSettings() {
  try {
    const res = await fetch(`${API_BASE}/studio`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    // Return hardcoded defaults if network issue
    return {
      studioName: 'Satyam Fashion Photography',
      phone1: '9347242212',
      phone2: '9440163135',
      email: 'a.satyamdigital@gmail.com',
      locationName: 'Hyderabad, Telangana',
      mapsUrl: 'https://maps.google.com/?q=Satyam+Fashion+Photography+Hyderabad',
      instagramUrl: 'https://www.instagram.com/satyamfashionphotography',
      youtubeUrl: 'https://www.youtube.com/@satyamfashionphotography'
    };
  }
}

/**
 * Update Studio Contact & Social Settings (Admin)
 */
export async function updateStudioSettings(settings) {
  const res = await fetch(`${API_BASE}/admin/studio`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error?.message || 'Failed to update studio settings');
  }

  return data;
}
