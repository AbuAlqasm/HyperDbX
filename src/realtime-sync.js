/**
 * Realtime Sync - Provides real-time synchronization using WebSockets
 */

const WebSocket = require('ws');

class RealtimeSync {
  /**
   * Creates a new realtime sync instance
   * 
   * @param {Object} config - Realtime sync configuration
   * @param {boolean} config.enabled - Whether realtime sync is enabled
   * @param {string} [config.serverUrl] - WebSocket server URL
   * @param {Object} [config.server] - Custom WebSocket server configuration
   * @param {Object} storage - Storage engine reference
   */
  constructor(config, storage) {
    this.config = config;
    this.storage = storage;
    this.ws = null;
    this.server = null;
    this.syncListeners = [];
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1s, will increase with backoff
    
    if (this.config.enabled) {
      this._initialize();
    }
  }

  /**
   * Initializes the realtime sync
   * @private
   */
  _initialize() {
    // If serverUrl is provided, connect as a client
    if (this.config.serverUrl) {
      this._connectToServer();
    }
    // If server config is provided, start a server
    else if (this.config.server) {
      this._startServer();
    }
  }

  /**
   * Connects to a WebSocket server
   * @private
   */
  _connectToServer() {
    try {
      console.log(`[RealtimeSync] Connecting to WebSocket server: ${this.config.serverUrl}`);
      
      // This would be a real WebSocket connection in a full implementation
      // Simulated for this example
      this.ws = {
        send: (data) => {
          console.log(`[RealtimeSync] Sending data to server:`, data);
        },
        close: () => {
          console.log(`[RealtimeSync] Closing WebSocket connection`);
          this.isConnected = false;
        }
      };
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      console.log(`[RealtimeSync] Connected to WebSocket server`);
    } catch (error) {
      console.error('Error connecting to WebSocket server:', error);
      this._scheduleReconnect();
    }
  }

  /**
   * Starts a WebSocket server
   * @private
   */
  _startServer() {
    try {
      const { port = 8080 } = this.config.server;
      
      console.log(`[RealtimeSync] Starting WebSocket server on port ${port}`);
      
      // This would be a real WebSocket server in a full implementation
      // Simulated for this example
      this.server = {
        clients: [],
        broadcast: (data) => {
          console.log(`[RealtimeSync] Broadcasting data to ${this.server.clients.length} clients:`, data);
        },
        close: () => {
          console.log(`[RealtimeSync] Closing WebSocket server`);
        }
      };
      
      console.log(`[RealtimeSync] WebSocket server started`);
    } catch (error) {
      console.error('Error starting WebSocket server:', error);
    }
  }

  /**
   * Schedules a reconnection attempt
   * @private
   */
  _scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log(`[RealtimeSync] Maximum reconnection attempts reached (${this.maxReconnectAttempts})`);
      return;
    }
    
    // Exponential backoff
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    
    console.log(`[RealtimeSync] Scheduling reconnection attempt in ${delay}ms`);
    
    setTimeout(() => {
      this.reconnectAttempts++;
      this._connectToServer();
    }, delay);
  }

  /**
   * Broadcasts a data change event to connected clients
   * 
   * @param {Object} data - Change data to broadcast
   * @returns {Promise<boolean>} - Success status
   */
  async broadcast(data) {
    if (!this.config.enabled) {
      return false;
    }
    
    try {
      const message = JSON.stringify({
        type: 'change',
        data,
        timestamp: Date.now()
      });
      
      // If running as server, broadcast to all clients
      if (this.server) {
        this.server.broadcast(message);
        return true;
      }
      
      // If connected as client, send to server
      if (this.ws && this.isConnected) {
        this.ws.send(message);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error broadcasting change:', error);
      return false;
    }
  }

  /**
   * Registers a sync event listener
   * 
   * @param {Function} callback - Sync event callback
   */
  onSync(callback) {
    if (typeof callback === 'function') {
      this.syncListeners.push(callback);
    }
  }

  /**
   * Removes a sync event listener
   * 
   * @param {Function} callback - Sync event callback to remove
   */
  offSync(callback) {
    this.syncListeners = this.syncListeners.filter(cb => cb !== callback);
  }

  /**
   * Closes the WebSocket connection or server
   * 
   * @returns {Promise<boolean>} - Success status
   */
  async close() {
    try {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      
      if (this.server) {
        this.server.close();
        this.server = null;
      }
      
      this.isConnected = false;
      this.syncListeners = [];
      
      return true;
    } catch (error) {
      console.error('Error closing realtime sync:', error);
      return false;
    }
  }

  /**
   * Notifies all sync listeners of an event
   * 
   * @param {Object} data - Sync event data
   * @private
   */
  _notifyListeners(data) {
    for (const listener of this.syncListeners) {
      try {
        listener(data);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    }
  }
}

module.exports = RealtimeSync; 