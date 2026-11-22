import express from 'express';
import { getCategoryPhotos, getAllEventPhotos, extractFolderId } from '../utils/drive.js';
import driveClient from '../config/googleDrive.js';
import memoryCache from '../utils/cache.js';

const router = express.Router();

// Fallback demo photos for initial local development when using placeholder demo IDs
const DEMO_PHOTOS = [
  {
    id: 'demo-img-01',
    name: 'Satyam-Fashion-01.jpg',
    mimeType: 'image/jpeg',
    thumbnailLink: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    thumbnailSmall: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=70',
    webContentLink: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2400&q=90',
    size: 4200000,
    width: 2400,
    height: 1600,
    categoryName: 'Ceremony'
  },
  {
    id: 'demo-img-02',
    name: 'Satyam-Fashion-02.jpg',
    mimeType: 'image/jpeg',
    thumbnailLink: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
    thumbnailSmall: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=400&q=70',
    webContentLink: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=2400&q=90',
    size: 5100000,
    width: 2400,
    height: 1600,
    categoryName: 'Portraits'
  }
];

/**
 * GET /api/photos/thumbnail/:id
 * Resilient server-side image proxy guaranteeing high-res photo delivery
 * Bypasses Google Drive 429 hotlink / Referer blocks with 24-hour browser caching.
 */
router.get('/thumbnail/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sz = 's1600' } = req.query;

    const cacheKey = `img:thumb:${id}:${sz}`;
    const cached = memoryCache.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', cached.contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
      return res.send(cached.buffer);
    }

    // Retrieve fresh thumbnail link from Google Drive API
    const fileRes = await driveClient.files.get({
      fileId: id,
      fields: 'id, name, mimeType, thumbnailLink'
    });

    let thumbUrl = fileRes.data.thumbnailLink;
    if (thumbUrl) {
      thumbUrl = thumbUrl.replace(/=s\d+$/, `=${sz}`);
    } else {
      thumbUrl = `https://drive.google.com/thumbnail?id=${id}&sz=${sz}`;
    }

    // Fetch server-to-server without cross-origin Referer restrictions
    const imgRes = await fetch(thumbUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    if (imgRes.ok) {
      const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await imgRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      memoryCache.set(cacheKey, { buffer, contentType }, 3600);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
      return res.send(buffer);
    }

    // Alternate fallback: stream media directly via driveClient
    const mediaRes = await driveClient.files.get(
      { fileId: id, alt: 'media' },
      { responseType: 'stream' }
    );
    res.setHeader('Content-Type', fileRes.data.mimeType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    return mediaRes.data.pipe(res);
  } catch (err) {
    next(err);
  }
});

/**
 * Fetch photos inside a category or all photos across all categories
 * GET /api/photos?categoryId=<folderId>&parentFolderId=<rootId>&all=true&pageSize=24&pageToken=<token>&refresh=false
 */
router.get('/', async (req, res, next) => {
  try {
    const { 
      categoryId, 
      parentFolderId, 
      all = 'false', 
      pageSize = 24, 
      pageToken = null, 
      refresh = 'false' 
    } = req.query;

    const bypassCache = refresh === 'true';

    // 1. If "all=true" or no category selected but parentFolderId provided:
    // Fetch all photos across all category subfolders!
    if (all === 'true' || (!categoryId && parentFolderId)) {
      const rootFolder = parentFolderId || categoryId;
      if (!rootFolder) {
        return res.status(400).json({
          error: {
            code: 'MISSING_PARENT_FOLDER',
            message: 'parentFolderId is required when requesting all photos.',
            statusCode: 400
          }
        });
      }

      try {
        const allResult = await getAllEventPhotos(rootFolder, { bypassCache });
        return res.json(allResult);
      } catch (err) {
        if (rootFolder.includes('1aB2cD3e') || rootFolder.includes('DEMO')) {
          return res.json({
            photos: DEMO_PHOTOS,
            nextPageToken: null,
            totalCount: DEMO_PHOTOS.length,
            isCached: false,
            isDemoFallback: true
          });
        }
        throw err;
      }
    }

    // 2. Fetch specific category photos
    if (!categoryId) {
      return res.status(400).json({
        error: {
          code: 'MISSING_CATEGORY_ID',
          message: 'categoryId or parentFolderId query parameter is required.',
          statusCode: 400
        }
      });
    }

    try {
      const result = await getCategoryPhotos(categoryId, {
        pageSize: parseInt(pageSize, 10) || 50,
        pageToken: pageToken || null,
        bypassCache
      });

      return res.json(result);
    } catch (err) {
      if (categoryId.includes('1aB2cD3e') || categoryId.includes('DEMO')) {
        return res.json({
          photos: DEMO_PHOTOS,
          nextPageToken: null,
          totalCount: DEMO_PHOTOS.length,
          isCached: false,
          isDemoFallback: true
        });
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

export default router;
