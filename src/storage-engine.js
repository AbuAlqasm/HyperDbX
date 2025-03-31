/**
 * @file storage-engine.js
 * @description The storage engine responsible for handling storage operations.
 * Currently supports file-based storage using the FileStoreAdapter.
 */

const { matches } = require('./utils');
const FileStoreAdapter = require('./adapters/filestore-adapter');

class StorageEngine {
  /**
   * Create a new storage engine
   * @param {Object} config - Configuration object
   */
  constructor(config) {
    this.config = config;
    this.adapter = this._createAdapter();
    this.collections = new Map();
  }

  /**
   * Create the appropriate adapter based on the configuration
   * @private
   */
  _createAdapter() {
    const storageType = this.config.storage;
    
    // For now, only filestore is fully supported
    if (storageType !== 'filestore') {
      console.warn(`Storage type '${storageType}' is not fully supported. Using FileStoreAdapter as fallback.`);
    }
    
    // Always use FileStoreAdapter
    return new FileStoreAdapter(this.config);
  }

  /**
   * Initializes the storage engine
   * 
   * @returns {Promise<void>}
   */
  async initialize() {
    await this.adapter.connect();
    
    // Load collections
    const collections = await this.adapter.getCollections();
    for (const collection of collections) {
      this.collections.set(collection.name, collection);
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
    return await this.adapter.set(key, value);
  }

  /**
   * Retrieves a value by key
   * 
   * @param {string} key - The key to retrieve
   * @returns {Promise<any>} - The stored value or null if not found
   */
  async get(key) {
    return await this.adapter.get(key);
  }

  /**
   * Checks if a key exists
   * 
   * @param {string} key - The key to check
   * @returns {Promise<boolean>} - True if the key exists
   */
  async has(key) {
    return await this.adapter.has(key);
  }

  /**
   * Deletes a value by key
   * 
   * @param {string} key - The key to delete
   * @returns {Promise<boolean>} - Success status
   */
  async delete(key) {
    return await this.adapter.delete(key);
  }

  /**
   * Creates a new collection
   * 
   * @param {string} name - The name of the collection
   * @returns {Promise<boolean>} - Success status
   */
  async createCollection(name) {
    const result = await this.adapter.createCollection(name);
    if (result) {
      this.collections.set(name, { name });
    }
    return result;
  }

  /**
   * Inserts a document into a collection
   * 
   * @param {string} collection - The collection name
   * @param {Object} document - The document to insert
   * @returns {Promise<boolean>} - Success status
   */
  async insert(collection, document) {
    // Create collection if it doesn't exist
    if (!this.collections.has(collection)) {
      await this.createCollection(collection);
    }
    
    return await this.adapter.insert(collection, document);
  }

  /**
   * Finds one document in a collection based on query
   * 
   * @param {string} collection - The collection name
   * @param {Object} query - Query parameters
   * @returns {Promise<Object|null>} - The found document or null
   */
  async findOne(collection, query) {
    if (!this.collections.has(collection)) {
      return null;
    }
    
    return await this.adapter.findOne(collection, query);
  }

  /**
   * Finds documents in a collection based on query
   * 
   * @param {string} collection - The collection name
   * @param {Object} query - Query parameters
   * @returns {Promise<Array>} - Array of matching documents
   */
  async find(collection, query) {
    if (!this.collections.has(collection)) {
      return [];
    }
    
    return await this.adapter.find(collection, query);
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
    if (!this.collections.has(collection)) {
      return 0;
    }
    
    return await this.adapter.update(collection, query, update);
  }

  /**
   * Deletes documents from a collection based on query
   * 
   * @param {string} collection - The collection name
   * @param {Object} query - Query parameters
   * @returns {Promise<number>} - Number of deleted documents
   */
  async deleteFrom(collection, query) {
    if (!this.collections.has(collection)) {
      return 0;
    }
    
    return await this.adapter.deleteFrom(collection, query);
  }

  /**
   * Closes the storage engine and all connections
   * 
   * @returns {Promise<void>}
   */
  async close() {
    await this.adapter.close();
    this.collections.clear();
  }
}

module.exports = StorageEngine; 