/**
 * HyperDB.js - A versatile database library implementing file-based storage
 * with support for key-value operations and document collections
 * By GhostNet Studio
 */

const StorageEngine = require('./src/storage-engine');
const MemoryCache = require('./src/memory-cache');
const CloudSync = require('./src/cloud-sync');
const RealtimeSync = require('./src/realtime-sync');
const Security = require('./src/security');
const { validateConfig } = require('./src/utils');

class HyperDB {
  /**
   * Creates a new HyperDB instance
   * 
   * @param {Object} options - Configuration options
   * @param {string} options.storage - Storage engine type ('filestore' is the default and recommended)
   * @param {string} [options.path] - Path for file-based storage
   * @param {Object} [options.sync] - Cloud sync configuration
   * @param {Object} [options.realtime] - Real-time sync configuration
   * @param {Object} [options.security] - Security configuration
   */
  constructor(options = {}) {
    // Validate configuration
    this.config = validateConfig(options);
    
    // Initialize memory cache for fast access
    this.cache = new MemoryCache();
    
    // Initialize storage engine based on configuration
    this.storage = new StorageEngine(this.config);
    
    // Initialize cloud sync if configured
    if (this.config.sync && this.config.sync.enabled) {
      this.cloudSync = new CloudSync(this.config.sync, this.storage);
    }
    
    // Initialize real-time sync if configured
    if (this.config.realtime && this.config.realtime.enabled) {
      this.realtimeSync = new RealtimeSync(this.config.realtime, this.storage);
    }
    
    // Initialize security if configured
    if (this.config.security) {
      this.security = new Security(this.config.security);
    }
    
    // Events listeners
    this.events = {};

    // Load initial data
    this._loadInitialData();
  }

  /**
   * Loads initial data from storage into memory cache
   * @private
   */
  async _loadInitialData() {
    try {
      // Load data from storage to cache
      await this.storage.initialize();
    } catch (error) {
      console.error('Error initializing HyperDB:', error);
    }
  }

  /**
   * Stores a value with the specified key
   * 
   * @param {string} key - The key to store data under
   * @param {any} value - The data to store
   * @returns {Promise<boolean>} - Success status
   */
  async set(key, value) {
    // Encrypt if security is enabled
    const secureValue = this.security ? 
      this.security.encrypt(value) : value;
      
    // Update memory cache
    this.cache.set(key, value);
    
    // Update storage
    const result = await this.storage.set(key, secureValue);
    
    // Trigger sync with cloud and real-time clients if enabled
    if (result && this.cloudSync) {
      this.cloudSync.sync({ key, value: secureValue, operation: 'set' });
    }
    
    if (result && this.realtimeSync) {
      this.realtimeSync.broadcast({ key, operation: 'set' });
    }
    
    return result;
  }

  /**
   * Retrieves a value by key
   * 
   * @param {string} key - The key to retrieve
   * @returns {Promise<any>} - The stored value or null if not found
   */
  async get(key) {
    // Try to get from memory cache first for speed
    const cachedValue = this.cache.get(key);
    if (cachedValue !== undefined) {
      return cachedValue;
    }
    
    // If not in cache, get from storage
    const value = await this.storage.get(key);
    
    // Decrypt if security is enabled and value exists
    const decryptedValue = value && this.security ? 
      this.security.decrypt(value) : value;
      
    // Update cache with retrieved value
    if (decryptedValue !== null) {
      this.cache.set(key, decryptedValue);
    }
    
    return decryptedValue;
  }

  /**
   * Checks if a key exists
   * 
   * @param {string} key - The key to check
   * @returns {Promise<boolean>} - True if the key exists
   */
  async has(key) {
    // Check cache first
    if (this.cache.has(key)) {
      return true;
    }
    
    // If not in cache, check storage
    return await this.storage.has(key);
  }

  /**
   * Deletes a value by key
   * 
   * @param {string} key - The key to delete
   * @returns {Promise<boolean>} - Success status
   */
  async delete(key) {
    // Remove from cache
    this.cache.delete(key);
    
    // Remove from storage
    const result = await this.storage.delete(key);
    
    // Trigger sync with cloud and real-time clients if enabled
    if (result && this.cloudSync) {
      this.cloudSync.sync({ key, operation: 'delete' });
    }
    
    if (result && this.realtimeSync) {
      this.realtimeSync.broadcast({ key, operation: 'delete' });
    }
    
    return result;
  }

  /**
   * Creates a new collection
   * 
   * @param {string} name - The name of the collection
   * @returns {Promise<boolean>} - Success status
   */
  async createCollection(name) {
    return await this.storage.createCollection(name);
  }

  /**
   * Inserts a document into a collection
   * 
   * @param {string} collection - The collection name
   * @param {Object} document - The document to insert
   * @returns {Promise<boolean>} - Success status
   */
  async insert(collection, document) {
    // Encrypt if security is enabled
    const secureDocument = this.security ? 
      this.security.encrypt(document) : document;
      
    // Insert into storage
    const result = await this.storage.insert(collection, secureDocument);
    
    // Trigger sync with cloud and real-time clients if enabled
    if (result && this.cloudSync) {
      this.cloudSync.sync({ 
        collection, 
        document: secureDocument, 
        operation: 'insert' 
      });
    }
    
    if (result && this.realtimeSync) {
      this.realtimeSync.broadcast({ 
        collection, 
        documentId: document.id || document._id, 
        operation: 'insert' 
      });
    }
    
    return result;
  }

  /**
   * Finds one document in a collection based on query
   * 
   * @param {string} collection - The collection name
   * @param {Object} query - Query parameters
   * @returns {Promise<Object|null>} - The found document or null
   */
  async findOne(collection, query) {
    const result = await this.storage.findOne(collection, query);
    
    // Decrypt if security is enabled and result exists
    return result && this.security ? 
      this.security.decrypt(result) : result;
  }

  /**
   * Finds documents in a collection based on query
   * 
   * @param {string} collection - The collection name
   * @param {Object} query - Query parameters
   * @returns {Promise<Array>} - Array of matching documents
   */
  async find(collection, query) {
    const results = await this.storage.find(collection, query);
    
    // Decrypt if security is enabled
    if (this.security && results.length > 0) {
      return results.map(doc => this.security.decrypt(doc));
    }
    
    return results;
  }

  /**
   * Updates documents in a collection based on query
   * 
   * @param {string} collection - The collection name
   * @param {Object} query - Query parameters
   * @param {Object} update - Update data
   * @returns {Promise<number>} - Number of updated documents
   */
  async update(collection, query, update) {
    // Encrypt update data if security is enabled
    const secureUpdate = this.security ? 
      this.security.encrypt(update) : update;
      
    // Perform update
    const result = await this.storage.update(collection, query, secureUpdate);
    
    // Trigger sync with cloud and real-time clients if enabled
    if (result > 0 && this.cloudSync) {
      this.cloudSync.sync({ 
        collection, 
        query, 
        update: secureUpdate, 
        operation: 'update' 
      });
    }
    
    if (result > 0 && this.realtimeSync) {
      this.realtimeSync.broadcast({ 
        collection, 
        query, 
        operation: 'update' 
      });
    }
    
    return result;
  }

  /**
   * Deletes documents from a collection based on query
   * 
   * @param {string} collection - The collection name
   * @param {Object} query - Query parameters
   * @returns {Promise<number>} - Number of deleted documents
   */
  async deleteFrom(collection, query) {
    // Perform deletion
    const result = await this.storage.deleteFrom(collection, query);
    
    // Trigger sync with cloud and real-time clients if enabled
    if (result > 0 && this.cloudSync) {
      this.cloudSync.sync({ 
        collection, 
        query, 
        operation: 'delete' 
      });
    }
    
    if (result > 0 && this.realtimeSync) {
      this.realtimeSync.broadcast({ 
        collection, 
        query, 
        operation: 'delete' 
      });
    }
    
    return result;
  }

  /**
   * Registers an event listener
   * 
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    
    // Register with realtime sync if it's a sync event
    if (event === 'sync' && this.realtimeSync) {
      this.realtimeSync.onSync(callback);
    }
  }

  /**
   * Removes an event listener
   * 
   * @param {string} event - Event name
   * @param {Function} callback - Event callback to remove
   */
  off(event, callback) {
    if (!this.events[event]) return;
    
    this.events[event] = this.events[event].filter(cb => cb !== callback);
    
    // Unregister from realtime sync if it's a sync event
    if (event === 'sync' && this.realtimeSync) {
      this.realtimeSync.offSync(callback);
    }
  }

  /**
   * Closes all connections and resources
   * 
   * @returns {Promise<void>}
   */
  async close() {
    // Close storage
    if (this.storage) {
      await this.storage.close();
    }
    
    // Close cloud sync
    if (this.cloudSync) {
      await this.cloudSync.close();
    }
    
    // Close realtime sync
    if (this.realtimeSync) {
      await this.realtimeSync.close();
    }
    
    // Clear cache
    this.cache.clear();
    
    // Clear event listeners
    this.events = {};
  }
}

module.exports = HyperDB; 