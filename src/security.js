/**
 * Security Module - Provides encryption and authentication services
 */

const CryptoJS = require('crypto-js');
const jwt = require('jwt-simple');

class Security {
  /**
   * Creates a new security instance
   * 
   * @param {Object} options - Security options
   * @param {string} [options.encryptionKey] - Key for AES encryption
   * @param {string} [options.jwtSecret] - Secret for JWT authentication
   * @param {string} [options.authMethod='jwt'] - Authentication method ('jwt' or 'oauth')
   */
  constructor(options = {}) {
    this.encryptionKey = options.encryptionKey || this._generateRandomKey();
    this.jwtSecret = options.jwtSecret || this._generateRandomKey();
    this.authMethod = options.authMethod || 'jwt';
  }

  /**
   * Encrypts data using AES-256
   * 
   * @param {any} data - Data to encrypt
   * @returns {string} - Encrypted data
   */
  encrypt(data) {
    if (!data) return data;
    
    const jsonStr = typeof data === 'object' ? 
      JSON.stringify(data) : String(data);
      
    return CryptoJS.AES.encrypt(jsonStr, this.encryptionKey).toString();
  }

  /**
   * Decrypts AES-256 encrypted data
   * 
   * @param {string} encryptedData - Data to decrypt
   * @returns {any} - Decrypted data
   */
  decrypt(encryptedData) {
    if (!encryptedData) return encryptedData;
    
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      
      // Try to parse as JSON if possible
      try {
        return JSON.parse(decryptedString);
      } catch (e) {
        return decryptedString;
      }
    } catch (error) {
      console.error('Error decrypting data:', error);
      return null;
    }
  }

  /**
   * Generates a JWT token for authentication
   * 
   * @param {Object} payload - Token payload
   * @param {Object} [options] - Token options
   * @param {number} [options.expiresIn=86400] - Token expiration in seconds (default: 24 hours)
   * @returns {string} - JWT token
   */
  generateToken(payload, options = {}) {
    const expiresIn = options.expiresIn || 86400; // 24 hours in seconds
    
    const tokenPayload = {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + expiresIn
    };
    
    return jwt.encode(tokenPayload, this.jwtSecret);
  }

  /**
   * Verifies a JWT token
   * 
   * @param {string} token - JWT token to verify
   * @returns {Object|null} - Token payload or null if invalid
   */
  verifyToken(token) {
    try {
      const payload = jwt.decode(token, this.jwtSecret);
      
      // Check if token is expired
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }
      
      return payload;
    } catch (error) {
      console.error('Error verifying token:', error);
      return null;
    }
  }

  /**
   * Hashes a password using SHA-256
   * 
   * @param {string} password - Password to hash
   * @param {string} [salt] - Optional salt
   * @returns {string} - Hashed password
   */
  hashPassword(password, salt = '') {
    return CryptoJS.SHA256(password + salt).toString();
  }

  /**
   * Verifies a password against a hash
   * 
   * @param {string} password - Password to verify
   * @param {string} hash - Hash to compare against
   * @param {string} [salt] - Optional salt
   * @returns {boolean} - True if password matches
   */
  verifyPassword(password, hash, salt = '') {
    const calculatedHash = this.hashPassword(password, salt);
    return calculatedHash === hash;
  }

  /**
   * Generates a random key
   * 
   * @returns {string} - Random key
   * @private
   */
  _generateRandomKey() {
    return CryptoJS.lib.WordArray.random(32).toString();
  }
}

module.exports = Security; 