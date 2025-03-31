/**
 * FileStore Adapter - Provides file-based storage backend
 */

const fs = require('fs');
const path = require('path');
const { generateId, matches, normalizeName } = require('../utils');

class FileStoreAdapter {
  /**
   * Creates a new FileStore adapter
   * 
   * @param {Object} config - Configuration options
   * @param {string} [config.path='./hyperdb-data'] - Database file path
   */
  constructor(config) {
    this.config = config;
    this.dbDir = path.resolve(config.path || './hyperdb-data');
    this.keyValueDir = path.join(this.dbDir, 'keyvalue');
    this.collectionsDir = path.join(this.dbDir, 'collections');
    this.collectionsListFile = path.join(this.dbDir, 'collections.json');
    this.connected = false;
    this.collections = new Set();
  }

  /**
   * Connects to the FileStore database
   * 
   * @returns {Promise<boolean>} - Success status
   */
  async connect() {
    try {
      // Create directories if they don't exist
      if (!fs.existsSync(this.dbDir)) {
        fs.mkdirSync(this.dbDir, { recursive: true });
      }
      
      if (!fs.existsSync(this.keyValueDir)) {
        fs.mkdirSync(this.keyValueDir, { recursive: true });
      }
      
      if (!fs.existsSync(this.collectionsDir)) {
        fs.mkdirSync(this.collectionsDir, { recursive: true });
      }
      
      // Load collections if the collections list file exists
      if (fs.existsSync(this.collectionsListFile)) {
        try {
          const collectionsData = fs.readFileSync(this.collectionsListFile, 'utf8');
          const collectionsArray = JSON.parse(collectionsData);
          this.collections = new Set(collectionsArray);
          
          // Ensure collection directories exist
          for (const collection of this.collections) {
            const collectionDir = path.join(this.collectionsDir, normalizeName(collection));
            if (!fs.existsSync(collectionDir)) {
              fs.mkdirSync(collectionDir, { recursive: true });
            }
          }
        } catch (err) {
          // If there's an error reading the collections file, create a new one
          fs.writeFileSync(this.collectionsListFile, JSON.stringify([]), 'utf8');
        }
      } else {
        // Initialize with empty array
        fs.writeFileSync(this.collectionsListFile, JSON.stringify([]), 'utf8');
      }
      
      this.connected = true;
      return true;
    } catch (error) {
      console.error('Error connecting to FileStore database:', error);
      return false;
    }
  }

  /**
   * Closes the database connection
   * 
   * @returns {Promise<boolean>} - Success status
   */
  async close() {
    this.connected = false;
    return true;
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
      const filePath = path.join(this.keyValueDir, `${key}.json`);
      fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Error setting value in FileStore:', error);
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
      const filePath = path.join(this.keyValueDir, `${key}.json`);
      
      if (!fs.existsSync(filePath)) {
        return null;
      }
      
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error getting value from FileStore:', error);
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
      const filePath = path.join(this.keyValueDir, `${key}.json`);
      return fs.existsSync(filePath);
    } catch (error) {
      console.error('Error checking key in FileStore:', error);
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
      const filePath = path.join(this.keyValueDir, `${key}.json`);
      
      if (!fs.existsSync(filePath)) {
        return false;
      }
      
      fs.unlinkSync(filePath);
      return true;
    } catch (error) {
      console.error('Error deleting key from FileStore:', error);
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
      return Array.from(this.collections).map(name => ({ name }));
    } catch (error) {
      console.error('Error getting collections from FileStore:', error);
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
      
      // Create collection directory if it doesn't exist
      const collectionDir = path.join(this.collectionsDir, normalizedName);
      if (!fs.existsSync(collectionDir)) {
        fs.mkdirSync(collectionDir, { recursive: true });
      }
      
      // Add to collections set and save to disk
      if (!this.collections.has(normalizedName)) {
        this.collections.add(normalizedName);
        
        // Save updated collections list
        fs.writeFileSync(
          this.collectionsListFile, 
          JSON.stringify(Array.from(this.collections)), 
          'utf8'
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error creating collection in FileStore:', error);
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
      
      // Current timestamp
      const now = Date.now();
      
      // Add timestamps
      docWithId.created_at = now;
      docWithId.updated_at = now;
      
      // Save document to file
      const docPath = path.join(this.collectionsDir, normalizedName, `${id}.json`);
      fs.writeFileSync(docPath, JSON.stringify(docWithId, null, 2), 'utf8');
      
      return true;
    } catch (error) {
      console.error('Error inserting document in FileStore:', error);
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
      if (!this.collections.has(normalizedName)) {
        return null;
      }
      
      // If query contains ID, optimize by loading just that document
      if (query.id || query._id) {
        const id = query.id || query._id;
        const docPath = path.join(this.collectionsDir, normalizedName, `${id}.json`);
        
        if (fs.existsSync(docPath)) {
          const docData = fs.readFileSync(docPath, 'utf8');
          return JSON.parse(docData);
        }
        
        return null;
      }
      
      // Otherwise, scan all documents
      const collectionDir = path.join(this.collectionsDir, normalizedName);
      const files = fs.readdirSync(collectionDir);
      
      // Find first match
      for (const file of files) {
        if (file.endsWith('.json')) {
          const docPath = path.join(collectionDir, file);
          const docData = fs.readFileSync(docPath, 'utf8');
          const doc = JSON.parse(docData);
          
          if (matches(doc, query)) {
            return doc;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error finding document in FileStore:', error);
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
      if (!this.collections.has(normalizedName)) {
        return [];
      }
      
      // Load all documents in the collection
      const collectionDir = path.join(this.collectionsDir, normalizedName);
      const files = fs.readdirSync(collectionDir);
      
      const documents = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const docPath = path.join(collectionDir, file);
          const docData = fs.readFileSync(docPath, 'utf8');
          const doc = JSON.parse(docData);
          
          // If no query or document matches query, add to results
          if (!query || Object.keys(query).length === 0 || matches(doc, query)) {
            documents.push(doc);
          }
        }
      }
      
      return documents;
    } catch (error) {
      console.error('Error finding documents in FileStore:', error);
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
      if (!this.collections.has(normalizedName)) {
        return 0;
      }
      
      // Find documents to update
      const docs = await this.find(collection, query);
      if (docs.length === 0) {
        return 0;
      }
      
      // Current timestamp
      const now = Date.now();
      
      // Update each document
      let updatedCount = 0;
      
      for (const doc of docs) {
        const id = doc.id || doc._id;
        const docPath = path.join(this.collectionsDir, normalizedName, `${id}.json`);
        
        // Apply updates
        const updatedDoc = { ...doc, ...update, updated_at: now };
        
        // Save updated document
        fs.writeFileSync(docPath, JSON.stringify(updatedDoc, null, 2), 'utf8');
        updatedCount++;
      }
      
      return updatedCount;
    } catch (error) {
      console.error('Error updating documents in FileStore:', error);
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
      if (!this.collections.has(normalizedName)) {
        return 0;
      }
      
      // If query has ID, optimize the delete
      if (query.id || query._id) {
        const id = query.id || query._id;
        const docPath = path.join(this.collectionsDir, normalizedName, `${id}.json`);
        
        if (fs.existsSync(docPath)) {
          fs.unlinkSync(docPath);
          return 1;
        }
        
        return 0;
      }
      
      // Find documents to delete
      const docs = await this.find(collection, query);
      if (docs.length === 0) {
        return 0;
      }
      
      // Delete each document
      let deletedCount = 0;
      
      for (const doc of docs) {
        const id = doc.id || doc._id;
        const docPath = path.join(this.collectionsDir, normalizedName, `${id}.json`);
        
        if (fs.existsSync(docPath)) {
          fs.unlinkSync(docPath);
          deletedCount++;
        }
      }
      
      return deletedCount;
    } catch (error) {
      console.error('Error deleting documents in FileStore:', error);
      return 0;
    }
  }

  /**
   * Checks if a collection exists
   * 
   * @param {string} collection - Collection name
   * @returns {Promise<boolean>} - True if collection exists
   * @private
   */
  async _collectionExists(collection) {
    try {
      return this.collections.has(collection);
    } catch (error) {
      return false;
    }
  }

  /**
   * Ensures a connection to the database exists
   * @private
   */
  _ensureConnected() {
    if (!this.connected) {
      throw new Error('Not connected to FileStore database');
    }
  }
}

module.exports = FileStoreAdapter; 