import { google } from 'googleapis';
import driveClient from '../config/googleDrive.js';
import memoryCache from './cache.js';

/**
 * Custom Error Class for Google Drive operations
 * Provides structured HTTP status codes, error codes, and human-friendly diagnostics.
 */
export class DriveError extends Error {
  /**
   * @param {string} code - Machine-readable code (e.g., 'INVALID_FOLDER_ID', 'FOLDER_NOT_FOUND', 'ACCESS_DENIED')
   * @param {string} message - Descriptive error message
   * @param {number} [statusCode=500] - Corresponding HTTP status code
   * @param {any} [details=null] - Raw error details or Google API error response
   */
  constructor(code, message, statusCode = 500, details = null) {
    super(message);
    this.name = 'DriveError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Validates and extracts a Google Drive folder ID from various formats
 */
export function extractFolderId(input) {
  if (!input || typeof input !== 'string') {
    throw new DriveError(
      'INVALID_FOLDER_ID',
      'Google Drive folder input is required and must be a valid string.',
      400
    );
  }

  const trimmed = input.trim();

  // Pattern 1: URL with /folders/<ID>
  const foldersRegex = /\/folders\/([a-zA-Z0-9_-]+)/i;
  const foldersMatch = trimmed.match(foldersRegex);
  if (foldersMatch && foldersMatch[1]) {
    return validateIdFormat(foldersMatch[1]);
  }

  // Pattern 2: URL with ?id=<ID> or &id=<ID> (e.g. drive.google.com/open?id=...)
  const queryIdRegex = /[?&]id=([a-zA-Z0-9_-]+)/i;
  const queryMatch = trimmed.match(queryIdRegex);
  if (queryMatch && queryMatch[1]) {
    return validateIdFormat(queryMatch[1]);
  }

  // Pattern 3: URL with /d/<ID>
  const fileDRegex = /\/d\/([a-zA-Z0-9_-]+)/i;
  const fileDMatch = trimmed.match(fileDRegex);
  if (fileDMatch && fileDMatch[1]) {
    return validateIdFormat(fileDMatch[1]);
  }

  // Pattern 4: Raw folder ID
  return validateIdFormat(trimmed);
}

function validateIdFormat(id) {
  const driveIdRegex = /^[a-zA-Z0-9_-]{15,64}$/;
  if (!driveIdRegex.test(id)) {
    throw new DriveError(
      'INVALID_FOLDER_ID',
      `"${id}" is not a valid Google Drive folder ID or supported URL format.`,
      400
    );
  }
  return id;
}

/**
 * Normalizes Google Drive API errors into user-friendly DriveError instances.
 */
export function normalizeDriveError(error, context = 'Google Drive') {
  if (error instanceof DriveError) {
    return error;
  }

  const status = error.status || error.code || (error.response && error.response.status) || 500;
  const errorData = error.response?.data?.error || {};
  const message = errorData.message || error.message || 'Unknown Google Drive API error';
  const errorsList = errorData.errors || [];
  const reason = errorsList[0]?.reason || '';

  // 1. Not Found
  if (status === 404 || reason === 'notFound') {
    return new DriveError(
      'FOLDER_NOT_FOUND',
      `Google Drive resource not found. The folder may have been deleted or the ID is incorrect (${context}).`,
      404,
      errorData
    );
  }

  // 2. Access Denied / Private / Unshared Folder
  if (status === 403 || reason === 'insufficientFilePermissions' || reason === 'forbidden') {
    if (reason === 'rateLimitExceeded' || reason === 'userRateLimitExceeded') {
      return new DriveError(
        'RATE_LIMIT_EXCEEDED',
        'Google Drive API quota limit reached. Please wait a moment and refresh.',
        429,
        errorData
      );
    }

    return new DriveError(
      'FOLDER_ACCESS_DENIED',
      `Access denied to Google Drive folder (${context}). The folder is private or not shared. Please verify the folder's sharing settings are set to "Anyone with the link can view", or share it with your Service Account email.`,
      403,
      errorData
    );
  }

  // 3. Invalid credentials or unauthorized
  if (status === 401 || reason === 'authError') {
    return new DriveError(
      'UNAUTHORIZED',
      'Google Drive authentication failed. Check your GOOGLE_DRIVE_API_KEY in server/.env.',
      401,
      errorData
    );
  }

  // 4. Bad Request
  if (status === 400) {
    return new DriveError(
      'BAD_REQUEST',
      `Google Drive query error: ${message}`,
      400,
      errorData
    );
  }

  // 5. Default generic error
  return new DriveError(
    'DRIVE_API_ERROR',
    `Google Drive API error (${context}): ${message}`,
    status >= 400 && status < 600 ? status : 500,
    errorData
  );
}

/**
 * Fetches child folders inside a parent Google Drive folder to serve as event categories
 */
export async function getEventCategories(parentFolderInput, options = {}) {
  const { bypassCache = false, ttlSeconds = 300 } = options;
  const parentFolderId = extractFolderId(parentFolderInput);
  const cacheKey = `drive:categories:${parentFolderId}`;

  if (!bypassCache) {
    const cached = memoryCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  try {
    const response = await driveClient.files.list({
      q: `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'nextPageToken, files(id, name, createdTime, modifiedTime)',
      orderBy: 'name asc',
      pageSize: 100,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true
    });

    const files = response.data.files || [];
    const categories = files.map((file) => ({
      id: file.id,
      name: file.name,
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime
    }));

    memoryCache.set(cacheKey, categories, ttlSeconds);
    return categories;
  } catch (err) {
    throw normalizeDriveError(err, `Categories for folder: ${parentFolderId}`);
  }
}

/**
 * Fetches image files inside a specific category folder with pagination support
 */
export async function getCategoryPhotos(categoryInput, options = {}) {
  const { 
    pageSize = 100, 
    pageToken = null, 
    bypassCache = false, 
    ttlSeconds = 300,
    categoryName = null
  } = options;

  const categoryId = extractFolderId(categoryInput);
  const clampedPageSize = Math.max(1, Math.min(100, parseInt(pageSize, 10) || 50));
  const tokenKey = pageToken ? pageToken.trim() : 'first_page';
  const cacheKey = `drive:photos:${categoryId}:${clampedPageSize}:${tokenKey}`;

  if (!bypassCache) {
    const cached = memoryCache.get(cacheKey);
    if (cached) {
      return { ...cached, isCached: true };
    }
  }

  try {
    const response = await driveClient.files.list({
      q: `'${categoryId}' in parents and mimeType contains 'image/' and trashed = false`,
      pageSize: clampedPageSize,
      pageToken: pageToken || undefined,
      fields: 'nextPageToken, files(id, name, mimeType, thumbnailLink, webContentLink, size, imageMediaMetadata)',
      orderBy: 'createdTime desc, name asc',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true
    });

    const files = response.data.files || [];

    const photos = files.map((file) => {
      let highResThumbnail = file.thumbnailLink || null;
      if (highResThumbnail && /=s\d+$/.test(highResThumbnail)) {
        highResThumbnail = highResThumbnail.replace(/=s\d+$/, '=s1600');
      }

      return {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        thumbnailLink: highResThumbnail,
        thumbnailSmall: file.thumbnailLink || null,
        webContentLink: file.webContentLink || `https://drive.google.com/uc?id=${file.id}&export=download`,
        size: file.size ? parseInt(file.size, 10) : null,
        width: file.imageMediaMetadata?.width || null,
        height: file.imageMediaMetadata?.height || null,
        categoryId,
        categoryName
      };
    });

    const result = {
      photos,
      nextPageToken: response.data.nextPageToken || null,
      totalCount: photos.length,
      isCached: false
    };

    memoryCache.set(cacheKey, result, ttlSeconds);
    return result;
  } catch (err) {
    throw normalizeDriveError(err, `Photos for category: ${categoryId}`);
  }
}

/**
 * Fetches all photos across all child category folders (and any direct images in root)
 * Ensures "All Moments" displays the complete collection of wedding pictures.
 *
 * @param {string} parentFolderInput
 * @param {Object} [options]
 * @returns {Promise<{ photos: Array<Object>, totalCount: number, categoriesCount: number, isCached: boolean }>}
 */
export async function getAllEventPhotos(parentFolderInput, options = {}) {
  const { bypassCache = false, ttlSeconds = 300 } = options;
  const parentFolderId = extractFolderId(parentFolderInput);
  const cacheKey = `drive:all-photos:${parentFolderId}`;

  if (!bypassCache) {
    const cached = memoryCache.get(cacheKey);
    if (cached) {
      return { ...cached, isCached: true };
    }
  }

  try {
    // 1. Get all child category folders
    const categories = await getEventCategories(parentFolderId, { bypassCache });

    // 2. Fetch direct images in parent folder (if any)
    const directResult = await getCategoryPhotos(parentFolderId, { 
      pageSize: 100, 
      bypassCache,
      categoryName: 'General'
    }).catch(() => ({ photos: [] }));

    let allPhotos = [...(directResult.photos || [])];

    // 3. If there are subfolders (e.g. test 1, test 2, test 3), fetch photos from all of them in parallel
    if (categories && categories.length > 0) {
      const categoryPromises = categories.map((cat) =>
        getCategoryPhotos(cat.id, { 
          pageSize: 100, 
          bypassCache,
          categoryName: cat.name
        }).catch((err) => {
          console.warn(`[Drive] Could not fetch photos for category "${cat.name}" (${cat.id}):`, err.message);
          return { photos: [] };
        })
      );

      const categoryResults = await Promise.all(categoryPromises);
      for (const res of categoryResults) {
        if (res.photos && res.photos.length > 0) {
          allPhotos = allPhotos.concat(res.photos);
        }
      }
    }

    // 4. De-duplicate photos by ID
    const seenIds = new Set();
    const uniquePhotos = [];
    for (const photo of allPhotos) {
      if (!seenIds.has(photo.id)) {
        seenIds.add(photo.id);
        uniquePhotos.push(photo);
      }
    }

    // Sort by name or category
    uniquePhotos.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    const result = {
      photos: uniquePhotos,
      nextPageToken: null,
      totalCount: uniquePhotos.length,
      categoriesCount: categories.length,
      isCached: false
    };

    memoryCache.set(cacheKey, result, ttlSeconds);
    return result;
  } catch (err) {
    throw normalizeDriveError(err, `All photos for parent folder: ${parentFolderId}`);
  }
}

/**
 * Invalidate cached items for a specific folder/category or flush entire drive cache.
 */
export function clearDriveCache(folderId) {
  if (!folderId) {
    memoryCache.clear();
    return;
  }
  try {
    const cleanId = extractFolderId(folderId);
    memoryCache.del(`drive:categories:${cleanId}`);
    memoryCache.del(`drive:all-photos:${cleanId}`);
    for (const key of memoryCache.cache.keys()) {
      if (key.includes(cleanId)) {
        memoryCache.del(key);
      }
    }
  } catch {
    // If not a valid ID, do nothing
  }
}

export default {
  DriveError,
  extractFolderId,
  normalizeDriveError,
  getEventCategories,
  getCategoryPhotos,
  getAllEventPhotos,
  clearDriveCache,
  cache: memoryCache
};
