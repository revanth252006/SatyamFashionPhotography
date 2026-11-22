/**
 * In-Memory TTL (Time-To-Live) Cache Utility
 * Provides lightweight, zero-dependency caching for Google Drive listings
 * to prevent exceeding Google Drive API quotas and optimize response times.
 */

export class TtlCache {
  /**
   * @param {Object} options
   * @param {number} [options.defaultTtlSeconds=300] - Default TTL in seconds (default 5 minutes)
   * @param {number} [options.cleanupIntervalSeconds=60] - Interval to sweep expired entries
   */
  constructor({ defaultTtlSeconds = 300, cleanupIntervalSeconds = 60 } = {}) {
    this.defaultTtl = defaultTtlSeconds * 1000;
    this.cache = new Map();
    this.hits = 0;
    this.misses = 0;

    // Periodic sweep for expired items to prevent memory leaks
    if (cleanupIntervalSeconds > 0) {
      this.timer = setInterval(() => this.pruneExpired(), cleanupIntervalSeconds * 1000);
      // Ensure timer doesn't keep node process alive in tests
      if (this.timer.unref) {
        this.timer.unref();
      }
    }
  }

  /**
   * Retrieve cached value if key exists and has not expired.
   * @param {string} key
   * @returns {any|undefined}
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item) {
      this.misses++;
      return undefined;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return undefined;
    }

    this.hits++;
    return item.value;
  }

  /**
   * Set a key-value pair with an optional custom TTL in seconds.
   * @param {string} key
   * @param {any} value
   * @param {number} [ttlSeconds]
   */
  set(key, value, ttlSeconds) {
    const ttlMs = (ttlSeconds !== undefined && ttlSeconds > 0) 
      ? ttlSeconds * 1000 
      : this.defaultTtl;

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
      createdAt: Date.now()
    });
  }

  /**
   * Check if a valid, non-expired key exists in cache.
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== undefined;
  }

  /**
   * Delete a key from cache.
   * @param {string} key
   * @returns {boolean}
   */
  del(key) {
    return this.cache.delete(key);
  }

  /**
   * Flush all cache entries.
   */
  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Automatically fetch and cache value if missing.
   * @param {string} key
   * @param {Function} fetchFn - Async function returning data to cache
   * @param {number} [ttlSeconds]
   * @returns {Promise<any>}
   */
  async getOrSet(key, fetchFn, ttlSeconds) {
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const freshValue = await fetchFn();
    if (freshValue !== undefined) {
      this.set(key, freshValue, ttlSeconds);
    }
    return freshValue;
  }

  /**
   * Remove all expired items from memory.
   * @returns {number} Count of pruned items
   */
  pruneExpired() {
    const now = Date.now();
    let count = 0;
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Get current cache performance statistics.
   */
  stats() {
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0 
        ? ((this.hits / (this.hits + this.misses)) * 100).toFixed(2) + '%' 
        : '0.00%'
    };
  }

  /**
   * Destroy timer on teardown.
   */
  destroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}

// Global default cache instance for application use
const defaultTtlSeconds = parseInt(process.env.CACHE_TTL_SECONDS || '300', 10);
const cleanupSeconds = parseInt(process.env.CACHE_CLEANUP_INTERVAL_SECONDS || '60', 10);

export const memoryCache = new TtlCache({
  defaultTtlSeconds,
  cleanupIntervalSeconds: cleanupSeconds
});

export default memoryCache;
