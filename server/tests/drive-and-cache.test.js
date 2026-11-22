import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractFolderId, DriveError, normalizeDriveError } from '../utils/drive.js';
import { TtlCache } from '../utils/cache.js';

describe('Google Drive Utility - extractFolderId', () => {
  const sampleFolderId = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs';

  it('extracts folder ID from standard /folders/ URL', () => {
    const url = `https://drive.google.com/drive/folders/${sampleFolderId}`;
    assert.strictEqual(extractFolderId(url), sampleFolderId);
  });

  it('extracts folder ID from URL with user path /u/0/folders/ and query params', () => {
    const url = `https://drive.google.com/drive/u/0/folders/${sampleFolderId}?usp=sharing&authuser=0`;
    assert.strictEqual(extractFolderId(url), sampleFolderId);
  });

  it('extracts folder ID from open?id= URL', () => {
    const url = `https://drive.google.com/open?id=${sampleFolderId}`;
    assert.strictEqual(extractFolderId(url), sampleFolderId);
  });

  it('extracts folder ID from /file/d/ URL', () => {
    const url = `https://drive.google.com/file/d/${sampleFolderId}/view`;
    assert.strictEqual(extractFolderId(url), sampleFolderId);
  });

  it('accepts raw folder ID directly', () => {
    assert.strictEqual(extractFolderId(sampleFolderId), sampleFolderId);
  });

  it('throws DriveError on null or empty input', () => {
    assert.throws(
      () => extractFolderId(''),
      (err) => err instanceof DriveError && err.code === 'INVALID_FOLDER_ID' && err.statusCode === 400
    );
  });

  it('throws DriveError on invalid folder ID string', () => {
    assert.throws(
      () => extractFolderId('too-short'),
      (err) => err instanceof DriveError && err.code === 'INVALID_FOLDER_ID' && err.statusCode === 400
    );
  });
});

describe('Google Drive Utility - normalizeDriveError', () => {
  it('correctly maps 404 to FOLDER_NOT_FOUND', () => {
    const err = { status: 404, message: 'File not found' };
    const norm = normalizeDriveError(err, 'Folder test');
    assert.strictEqual(norm.code, 'FOLDER_NOT_FOUND');
    assert.strictEqual(norm.statusCode, 404);
  });

  it('correctly maps 403 forbidden / unshared to FOLDER_ACCESS_DENIED', () => {
    const err = {
      response: {
        status: 403,
        data: {
          error: {
            errors: [{ reason: 'insufficientFilePermissions' }],
            message: 'User does not have access'
          }
        }
      }
    };
    const norm = normalizeDriveError(err, 'Folder test');
    assert.strictEqual(norm.code, 'FOLDER_ACCESS_DENIED');
    assert.strictEqual(norm.statusCode, 403);
    assert(norm.message.includes('Anyone with the link can view'));
  });

  it('correctly maps 403 rateLimitExceeded to RATE_LIMIT_EXCEEDED (429)', () => {
    const err = {
      response: {
        status: 403,
        data: {
          error: {
            errors: [{ reason: 'rateLimitExceeded' }],
            message: 'User Rate Limit Exceeded'
          }
        }
      }
    };
    const norm = normalizeDriveError(err, 'Rate limit test');
    assert.strictEqual(norm.code, 'RATE_LIMIT_EXCEEDED');
    assert.strictEqual(norm.statusCode, 429);
  });
});

describe('In-Memory TTL Cache Utility', () => {
  it('stores and retrieves values within TTL', () => {
    const cache = new TtlCache({ defaultTtlSeconds: 10, cleanupIntervalSeconds: 0 });
    cache.set('key1', { photos: [1, 2, 3] });
    assert.deepStrictEqual(cache.get('key1'), { photos: [1, 2, 3] });
    assert.strictEqual(cache.has('key1'), true);
  });

  it('expires items after TTL elapsed', async () => {
    // 0.05 second TTL (50ms)
    const cache = new TtlCache({ defaultTtlSeconds: 0.05, cleanupIntervalSeconds: 0 });
    cache.set('short_lived', 'hello', 0.05);

    assert.strictEqual(cache.get('short_lived'), 'hello');

    // Wait 70ms
    await new Promise((resolve) => setTimeout(resolve, 70));

    assert.strictEqual(cache.get('short_lived'), undefined);
    assert.strictEqual(cache.has('short_lived'), false);
  });

  it('getOrSet returns cached value without re-invoking fetcher', async () => {
    const cache = new TtlCache({ defaultTtlSeconds: 10, cleanupIntervalSeconds: 0 });
    let fetchCount = 0;
    const fetcher = async () => {
      fetchCount++;
      return ['ceremony', 'reception'];
    };

    const first = await cache.getOrSet('categories', fetcher);
    const second = await cache.getOrSet('categories', fetcher);

    assert.deepStrictEqual(first, ['ceremony', 'reception']);
    assert.deepStrictEqual(second, ['ceremony', 'reception']);
    assert.strictEqual(fetchCount, 1); // Only called once!
  });

  it('tracks stats properly', () => {
    const cache = new TtlCache({ defaultTtlSeconds: 10, cleanupIntervalSeconds: 0 });
    cache.set('hit', 'value');
    cache.get('hit');
    cache.get('miss');

    const stats = cache.stats();
    assert.strictEqual(stats.hits, 1);
    assert.strictEqual(stats.misses, 1);
    assert.strictEqual(stats.size, 1);
  });
});
