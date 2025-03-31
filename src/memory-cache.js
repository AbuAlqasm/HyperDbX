/**
 * Memory Cache - Provides fast in-memory storage for frequently accessed data
 */

class MemoryCache {
  /**
   * Creates a new memory cache instance
   * 
   * @param {Object} options - Cache options
   * @param {number} [options.maxSize=1000] - Maximum number of entries in the cache
   * @param {number} [options.ttl=3600000] - Time to live for cache entries in ms (default: 1 hour)
   */
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.ttl = options.ttl || 3600000; // 1 hour in milliseconds
    this.cache = new Map();
    this.expiry = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }

  /**
   * Stores a value in the cache
   * 
   * @param {string} key - The key to store under
   * @param {any} value - The value to store
   * @param {number} [ttl] - Optional custom TTL in ms for this entry
   */
  set(key, value, ttl = this.ttl) {
    // Handle cache size limit
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this._evictOldest();
    }
    
    // Store value and set expiry
    this.cache.set(key, value);
    this.expiry.set(key, Date.now() + ttl);
    this.stats.sets++;
    
    return true;
  }

  /**
   * Retrieves a value from the cache
   * 
   * @param {string} key - The key to retrieve
   * @returns {any} - The stored value or undefined if not found
   */
  get(key) {
    // Check if key exists
    if (!this.cache.has(key)) {
      this.stats.misses++;
      return undefined;
    }
    
    // Check if expired
    const expiryTime = this.expiry.get(key);
    if (expiryTime < Date.now()) {
      this.delete(key);
      this.stats.misses++;
      return undefined;
    }
    
    // Return value and update stats
    this.stats.hits++;
    return this.cache.get(key);
  }

  /**
   * Checks if a key exists in the cache and is not expired
   * 
   * @param {string} key - The key to check
   * @returns {boolean} - True if the key exists and is not expired
   */
  has(key) {
    // Check if key exists
    if (!this.cache.has(key)) {
      return false;
    }
    
    // Check if expired
    const expiryTime = this.expiry.get(key);
    if (expiryTime < Date.now()) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Deletes a value from the cache
   * 
   * @param {string} key - The key to delete
   * @returns {boolean} - True if the key was deleted
   */
  delete(key) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.expiry.delete(key);
      this.stats.deletes++;
      return true;
    }
    return false;
  }

  /**
   * Clears all values from the cache
   */
  clear() {
    this.cache.clear();
    this.expiry.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }

  /**
   * Returns cache statistics
   * 
   * @returns {Object} - Cache statistics
   */
  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
    };
  }

  /**
   * Removes expired entries from the cache
   */
  cleanup() {
    const now = Date.now();
    for (const [key, expiryTime] of this.expiry.entries()) {
      if (expiryTime < now) {
        this.delete(key);
      }
    }
  }

  /**
   * Evicts the oldest entry from the cache
   * @private
   */
  _evictOldest() {
    let oldestKey = null;
    let oldestTime = Infinity;
    
    // Find the oldest entry
    for (const [key, expiryTime] of this.expiry.entries()) {
      if (expiryTime < oldestTime) {
        oldestTime = expiryTime;
        oldestKey = key;
      }
    }
    
    // Delete the oldest entry
    if (oldestKey) {
      this.delete(oldestKey);
    }
  }
}

module.exports = MemoryCache; 