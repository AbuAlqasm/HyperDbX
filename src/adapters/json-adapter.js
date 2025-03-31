/**
 * JSON Adapter - Provides simple JSON file storage backend
 */

const fs = require('fs');
const path = require('path');
const { generateId, matches, normalizeName } = require('../utils');

class JSONAdapter {
  /**
   * Creates a new JSON adapter
   * 
   * @param {Object} config - Configuration options
   * @param {string} [config.path='./hyperdb-data'] - Data directory path
   */
  constructor(config) {
    this.config = config;
    this.dataDir = path.resolve(config.path || './hyperdb-data');
    this.kvFile = path.join(this.dataDir, 'kv-store.json');
    this.collectionsFile = path.join(this.dataDir, 'collections.json');
    this.connected = false;
    this.data = {
      kvStore: {},
      collections: {}
    };
  }

  /**
   * Connects to the JSON storage
   * 
   * @returns {Promise<boolean>} - Success status
   */
  async connect() {
    try {
      // Create directory if it doesn't exist
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      // Load key-value store if it exists
      if (fs.existsSync(this.kvFile)) {
        const kvData = fs.readFileSync(this.kvFile, 'utf8');
        this.data.kvStore = JSON.parse(kvData);
      } else {
        // Initialize with empty object
        fs.writeFileSync(this.kvFile, JSON.stringify({}), 'utf8');
      }

      // Load collections if they exist
      if (fs.existsSync(this.collectionsFile)) {
        const collectionsData = fs.readFileSync(this.collectionsFile, 'utf8');
        this.data.collections = JSON.parse(collectionsData);
      } else {
        // Initialize with empty object
        fs.writeFileSync(this.collectionsFile, JSON.stringify({}), 'utf8');
      }

      this.connected = true;
      return true;
    } catch (error) {
      console.error('Error connecting to JSON storage:', error);
      return false;
    }
  }

  /**
   * Closes the JSON storage
   * 
   * @returns {Promise<boolean>} - Success status
   */
  async close() {
    try {
      // Save data to disk
      await this._saveData();
      this.connected = false;
      return true;
    } catch (error) {
      console.error('Error closing JSON storage:', error);
      return false;
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
    this._ensureConnected();
    
    try {
      this.data.kvStore[key] = value;
      await this._saveData();
      return true;
    } catch (error) {
      console.error('Error setting value in JSON storage:', error);
      return false;
    }
  }

  /**
   * Retrieves a value by key
   * 
   * @param {string} key - The key to retrieve
   * @returns {Promise<any>} - The stored value or null if not found
   */
  async get(key) {
    this._ensureConnected();
    
    try {
      return this.data.kvStore[key] || null;
    } catch (error) {
      console.error('Error getting value from JSON storage:', error);
      return null;
    }
  }

  /**
   * Checks if a key exists
   * 
   * @param {string} key - The key to check
   * @returns {Promise<boolean>} - True if the key exists
   */
  async has(key) {
    this._ensureConnected();
    
    try {
      return key in this.data.kvStore;
    } catch (error) {
      console.error('Error checking key in JSON storage:', error);
      return false;
    }
  }

  /**
   * Deletes a value by key
   * 
   * @param {string} key - The key to delete
   * @returns {Promise<boolean>} - Success status
   */
  async delete(key) {
    this._ensureConnected();
    
    try {
      if (key in this.data.kvStore) {
        delete this.data.kvStore[key];
        await this._saveData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting key from JSON storage:', error);
      return false;
    }
  }

  /**
   * Gets all collections
   * 
   * @returns {Promise<Array>} - List of collections
   */
  async getCollections() {
    this._ensureConnected();
    
    try {
      return Object.keys(this.data.collections).map(name => ({ name }));
    } catch (error) {
      console.error('Error getting collections from JSON storage:', error);
      return [];
    }
  }

  /**
   * Creates a new collection
   * 
   * @param {string} name - The name of the collection
   * @returns {Promise<boolean>} - Success status
   */
  async createCollection(name) {
    this._ensureConnected();
    
    try {
      // Normalize collection name
      const normalizedName = normalizeName(name);
      
      // Create collection if it doesn't exist
      if (!this.data.collections[normalizedName]) {
        this.data.collections[normalizedName] = [];
        await this._saveData();
      }
      
      return true;
    } catch (error) {
      console.error('Error creating collection in JSON storage:', error);
      return false;
    }
  }

  /**
   * Inserts a document into a collection
   * 
   * @param {string} collection - The collection name
   * @param {Object} document - The document to insert
   * @returns {Promise<boolean>} - Success status
   */
  async insert(collection, document) {
    this._ensureConnected();
    
    try {
      // Normalize collection name
      const normalizedName = normalizeName(collection);
      
      // Ensure collection exists
      await this.createCollection(normalizedName);
      
      // Generate ID if not provided
      const docWithId = { ...document };
      if (!docWithId.id && !docWithId._id) {
        docWithId.id = generateId();
      }
      
      // Use provided ID or generated ID
      const id = docWithId.id || docWithId._id;
      
      // Add timestamps
      const now = Date.now();
      docWithId.created_at = now;
      docWithId.updated_at = now;
      
      // Check if document with the same ID already exists
      const existingIndex = this.data.collections[normalizedName].findIndex(
        doc => (doc.id === id || doc._id === id)
      );
      
      if (existingIndex >= 0) {
        // Replace existing document
        this.data.collections[normalizedName][existingIndex] = docWithId;
      } else {
        // Add new document
        this.data.collections[normalizedName].push(docWithId);
      }
      
      await this._saveData();
      return true;
    } catch (error) {
      console.error('Error inserting document in JSON storage:', error);
      return false;
    }
  }

  /**
   * Finds one document in a collection based on query
   * 
   * @param {string} collection - The collection name
   * @param {Object} query - Query parameters
   * @returns {Promise<Object|null>} - The found document or null
   */
  async findOne(collection, query) {
    this._ensureConnected();
    
    try {
      // Normalize collection name
      const normalizedName = normalizeName(collection);
      
      // Check if collection exists
      if (!this.data.collections[normalizedName]) {
        return null;
      }
      
      // If query contains ID, optimize search
      if (query.id || query._id) {
        const id = query.id || query._id;
        return this.data.collections[normalizedName].find(
          doc => doc.id === id || doc._id === id
        ) || null;
      }
      
      // Otherwise search for first matching document
      return this.data.collections[normalizedName].find(
        doc => matches(doc, query)
      ) || null;
    } catch (error) {
      console.error('Error finding document in JSON storage:', error);
      return null;
    }
  }

  /**
   * Finds documents in a collection based on query
   * 
   * @param {string} collection - The collection name
   * @param {Object} query - Query parameters
   * @returns {Promise<Array>} - Array of matching documents
   */
  async find(collection, query) {
    this._ensureConnected();
    
    try {
      // Normalize collection name
      const normalizedName = normalizeName(collection);
      
      // Check if collection exists
      if (!this.data.collections[normalizedName]) {
        return [];
      }
      
      // If no query, return all documents
      if (!query || Object.keys(query).length === 0) {
        return [...this.data.collections[normalizedName]];
      }
      
      // Otherwise filter by query
      return this.data.collections[normalizedName].filter(
        doc => matches(doc, query)
      );
    } catch (error) {
      console.error('Error finding documents in JSON storage:', error);
      return [];
    }
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
    this._ensureConnected();
    
    try {
      // Normalize collection name
      const normalizedName = normalizeName(collection);
      
      // Check if collection exists
      if (!this.data.collections[normalizedName]) {
        return 0;
      }
      
      // Find documents to update
      const docs = await this.find(collection, query);
      if (docs.length === 0) {
        return 0;
      }
      
      // Current timestamp
      const now = Date.now();
      let updatedCount = 0;
      
      // Update matching documents
      for (const doc of docs) {
        const id = doc.id || doc._id;
        const index = this.data.collections[normalizedName].findIndex(
          d => (d.id === id || d._id === id)
        );
        
        if (index >= 0) {
          // Apply updates to document
          this.data.collections[normalizedName][index] = {
            ...this.data.collections[normalizedName][index],
            ...update,
            updated_at: now
          };
          
          updatedCount++;
        }
      }
      
      if (updatedCount > 0) {
        await this._saveData();
      }
      
      return updatedCount;
    } catch (error) {
      console.error('Error updating documents in JSON storage:', error);
      return 0;
    }
  }

  /**
   * Deletes documents from a collection based on query
   * 
   * @param {string} collection - The collection name
   * @param {Object} query - Query parameters
   * @returns {Promise<number>} - Number of deleted documents
   */
  async deleteFrom(collection, query) {
    this._ensureConnected();
    
    try {
      // Normalize collection name
      const normalizedName = normalizeName(collection);
      
      // Check if collection exists
      if (!this.data.collections[normalizedName]) {
        return 0;
      }
      
      // Find documents to delete
      const docs = await this.find(collection, query);
      if (docs.length === 0) {
        return 0;
      }
      
      // Get IDs of documents to delete
      const idsToDelete = docs.map(doc => doc.id || doc._id);
      const originalLength = this.data.collections[normalizedName].length;
      
      // Filter out documents with matching IDs
      this.data.collections[normalizedName] = this.data.collections[normalizedName].filter(
        doc => !idsToDelete.includes(doc.id) && !idsToDelete.includes(doc._id)
      );
      
      const deletedCount = originalLength - this.data.collections[normalizedName].length;
      
      if (deletedCount > 0) {
        await this._saveData();
      }
      
      return deletedCount;
    } catch (error) {
      console.error('Error deleting documents in JSON storage:', error);
      return 0;
    }
  }

  /**
   * Saves data to disk
   * 
   * @returns {Promise<boolean>} - Success status
   * @private
   */
  async _saveData() {
    try {
      // Save key-value store
      fs.writeFileSync(this.kvFile, JSON.stringify(this.data.kvStore, null, 2), 'utf8');
      
      // Save collections
      fs.writeFileSync(this.collectionsFile, JSON.stringify(this.data.collections, null, 2), 'utf8');
      
      return true;
    } catch (error) {
      console.error('Error saving data to disk:', error);
      return false;
    }
  }

  /**
   * Ensures a connection exists
   * @private
   */
  _ensureConnected() {
    if (!this.connected) {
      throw new Error('Not connected to JSON storage');
    }
  }
}

module.exports = JSONAdapter; 