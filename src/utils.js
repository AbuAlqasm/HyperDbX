/**
 * Utility functions for HyperDB
 */

/**
 * Validates and normalizes configuration options
 * 
 * @param {Object} config - User provided configuration
 * @returns {Object} - Normalized configuration
 */
function validateConfig(config) {
  // Default configuration
  const defaultConfig = {
    storage: 'filestore',
    path: './hyperdb-data',
    cache: {
      enabled: true,
      maxSize: 1000,
      ttl: 3600000 // 1 hour in milliseconds
    },
    sync: {
      enabled: false
    },
    realtime: {
      enabled: false
    }
  };

  // Validate storage type
  if (config.storage) {
    const validStorageTypes = ['filestore', 'json', 'sqlite', 'leveldb', 'mongodb', 'postgres'];
    if (!validStorageTypes.includes(config.storage.toLowerCase())) {
      console.warn(`Warning: Storage type '${config.storage}' is not officially supported. Using 'filestore' as fallback.`);
      config.storage = 'filestore';
    }
    
    // Convert legacy storage types to filestore
    if (['sqlite', 'leveldb', 'mongodb', 'postgres'].includes(config.storage.toLowerCase())) {
      console.warn(`Note: '${config.storage}' storage type is being mapped to 'filestore' in this version.`);
    }
  }

  // Validate sync configuration
  if (config.sync?.enabled) {
    if (!config.sync.type) {
      throw new Error('Sync type is required when sync is enabled');
    }

    const validSyncTypes = ['firebase', 'supabase', 'custom', 'aws'];
    if (!validSyncTypes.includes(config.sync.type.toLowerCase())) {
      throw new Error(`Invalid sync type: ${config.sync.type}. Valid types are: ${validSyncTypes.join(', ')}`);
    }

    if (!config.sync.config) {
      throw new Error('Sync config is required when sync is enabled');
    }
  }

  // Validate realtime configuration
  if (config.realtime?.enabled) {
    if (!config.realtime.serverUrl && !config.realtime.server) {
      throw new Error('Server URL or server configuration is required for realtime sync');
    }
  }

  // Merge with default config
  return {
    ...defaultConfig,
    ...config,
    cache: {
      ...defaultConfig.cache,
      ...config.cache
    },
    sync: {
      ...defaultConfig.sync,
      ...config.sync
    },
    realtime: {
      ...defaultConfig.realtime,
      ...config.realtime
    }
  };
}

/**
 * Deep clones an object
 * 
 * @param {any} obj - Object to clone
 * @returns {any} - Cloned object
 */
function clone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => clone(item));
  }

  const clonedObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clonedObj[key] = clone(obj[key]);
    }
  }

  return clonedObj;
}

/**
 * Generates a unique ID
 * 
 * @returns {string} - Unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/**
 * Checks if an object matches a query
 * 
 * @param {Object} obj - Object to check
 * @param {Object} query - Query to match against
 * @returns {boolean} - True if object matches query
 */
function matches(obj, query) {
  if (!obj || !query) return false;
  
  for (const key in query) {
    // Handle nested queries with dot notation
    if (key.includes('.')) {
      const parts = key.split('.');
      let value = obj;
      
      // Navigate through nested properties
      for (const part of parts) {
        if (value === undefined || value === null) {
          return false;
        }
        value = value[part];
      }
      
      // Check if nested value matches query value
      if (value !== query[key]) {
        return false;
      }
    } else if (query[key] !== obj[key]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Performs a deep update of an object
 * 
 * @param {Object} obj - Object to update
 * @param {Object} update - Update to apply
 * @returns {Object} - Updated object
 */
function deepUpdate(obj, update) {
  const result = clone(obj);
  
  for (const key in update) {
    if (key.includes('.')) {
      // Handle dot notation
      const parts = key.split('.');
      let current = result;
      
      // Navigate to the nested property
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part] || typeof current[part] !== 'object') {
          current[part] = {};
        }
        current = current[part];
      }
      
      // Set the value on the deepest property
      current[parts[parts.length - 1]] = update[key];
    } else {
      // Direct property update
      result[key] = update[key];
    }
  }
  
  return result;
}

/**
 * Normalizes a database path or collection name
 * 
 * @param {string} name - Path or collection name to normalize
 * @returns {string} - Normalized name
 */
function normalizeName(name) {
  return name
    .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace invalid chars with underscores
    .toLowerCase();
}

module.exports = {
  validateConfig,
  clone,
  generateId,
  matches,
  deepUpdate,
  normalizeName
}; 