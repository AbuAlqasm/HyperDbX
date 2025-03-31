# HyperDBX.js

<div align="center">
  <img src="https://raw.githubusercontent.com/ghostnetstudio/hyperdb/main/logo.png" alt="HyperDBX.js Logo" width="250" />
  <p>A powerful yet simple JavaScript database library for Node.js</p>
  <p>
    <img src="https://img.shields.io/npm/v/hyperdbx.js" alt="NPM Version" />
    <img src="https://img.shields.io/npm/l/hyperdbx.js" alt="License" />
    <img src="https://img.shields.io/github/stars/ghostnetstudio/hyperdb" alt="GitHub Stars" />
    <img src="https://img.shields.io/npm/dt/hyperdbx.js" alt="NPM Downloads" />
  </p>
</div>

## 🌟 Why Choose HyperDBX.js?

HyperDBX.js isn't just another database library - it's an integrated solution combining **ease of use**, **flexibility**, and **high performance**. Designed specifically for Node.js developers who need a reliable data storage solution without the complexity of traditional database setups.

### ✨ What Sets Us Apart

| Feature | HyperDBX.js | LowDB | NeDB | SQLite | MongoDB |
|---------|------------|-------|------|--------|---------|
| Ease of Use | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| Key-Value Storage | ✅ | ✅ | ❌ | ❌ | ✅ |
| Document Storage | ✅ | ✅ | ✅ | ❌ | ✅ |
| Memory Caching | ✅ | ❌ | ✅ | ❌ | ✅ |
| Built-in Encryption | ✅ | ❌ | ❌ | ❌ | ❌ |
| Authentication (JWT) | ✅ | ❌ | ❌ | ❌ | ✅ |
| Real-time Sync | ✅ | ❌ | ❌ | ❌ | ✅ |
| Cloud Sync | ✅ | ❌ | ❌ | ❌ | ✅ |
| No Heavy Dependencies | ✅ | ✅ | ✅ | ❌ | ❌ |
| Package Size | Small | Small | Medium | Large | Very Large |

## 📦 Installation

```bash
npm install hyperdbx.js
```

## 🚀 Quick Start

### Basic Usage

```javascript
const HyperDB = require('hyperdbx.js');

// Create a new database
const db = new HyperDB({ 
  storage: 'filestore',
  path: './my-database'
}); 

// Using the key-value interface
async function basicExample() {
  // Store data
  await db.set('user:1001', { 
    name: 'John', 
    email: 'john@example.com',
    role: 'admin'
  });
  
  // Retrieve data
  const user = await db.get('user:1001');
  console.log(user);
  
  // Check if a key exists
  const exists = await db.has('user:1001');
  console.log('User exists:', exists);
  
  // Delete data
  await db.delete('user:1001');
}

basicExample().catch(console.error);
```

### Using Document Collections

```javascript
const HyperDB = require('hyperdbx.js');
const db = new HyperDB({ storage: 'filestore', path: './my-database' });

async function collectionsExample() {
  // Create a collection for products
  await db.createCollection('products');
  
  // Add products
  await db.insert('products', { 
    id: 'prod-1', 
    name: 'Smartphone', 
    price: 999, 
    inStock: true
  });
  
  await db.insert('products', { 
    id: 'prod-2', 
    name: 'Laptop', 
    price: 1499, 
    inStock: true
  });
  
  // Find a specific product
  const laptop = await db.findOne('products', { name: 'Laptop' });
  console.log('Laptop details:', laptop);
  
  // Find all available products
  const availableProducts = await db.find('products', { inStock: true });
  console.log('Available products:', availableProducts.length);
  
  // Update product price
  await db.update('products', { id: 'prod-1' }, { price: 899 });
  
  // Delete a product
  await db.deleteFrom('products', { id: 'prod-2' });
}

collectionsExample().catch(console.error);
```

## 📋 Key Features

### 🔐 Security & Encryption

HyperDBX.js provides strong encryption for sensitive data:

```javascript
const db = new HyperDB({
  storage: 'filestore',
  path: './secure-database',
  security: {
    encryption: {
      enabled: true,
      secret: 'your-secure-encryption-key'
    },
    jwt: {
      enabled: true,
      secret: 'your-jwt-secret-key'
    }
  }
});

// Data is automatically encrypted
await db.set('api_credentials', {
  api_key: 'sensitive-api-key',
  api_secret: 'very-sensitive-secret'
});

// Create and verify JWT tokens
const token = db.security.generateToken({ userId: 1, role: 'admin' });
const verified = db.security.verifyToken(token);
```

### 🔄 Real-time Synchronization

Set up real-time synchronization between multiple clients:

```javascript
const db = new HyperDB({
  storage: 'filestore',
  path: './sync-database',
  realtime: {
    enabled: true,
    serverUrl: 'wss://your-websocket-server.com'
  }
});

// Listen for data changes
db.on('sync', (change) => {
  console.log('Received new change:', change);
});
```

### ☁️ Cloud Synchronization

Support for synchronizing data with cloud services:

```javascript
const db = new HyperDB({
  storage: 'filestore',
  path: './cloud-database',
  sync: {
    enabled: true,
    type: 'firebase',
    config: {
      // Firebase or other cloud service settings
      apiKey: 'your-api-key',
      databaseURL: 'https://your-database.firebaseio.com'
    }
  }
});
```

## 🧩 Architecture

HyperDBX.js is designed with a modular architecture for easy extensibility:

```
HyperDBX.js/
├── src/
│   ├── adapters/         # Storage engines
│   ├── storage-engine.js # Core storage engine
│   ├── memory-cache.js   # In-memory caching system
│   ├── security.js       # Encryption and security module
│   ├── cloud-sync.js     # Cloud synchronization
│   ├── realtime-sync.js  # Real-time synchronization
│   └── utils.js          # Helper functions
├── index.js              # Main library interface
└── examples/             # Example implementations
```

## 📊 Optimal Performance

HyperDBX.js is optimized for excellent performance. The in-memory caching mechanism accelerates repeated read operations, while organized file storage ensures efficient write operations.

### Speed Comparison (Operations per Second)

| Operation | HyperDBX.js | LowDB | NeDB |
|-----------|------------|-------|------|
| Read      | ~10,000    | ~5,000| ~7,000|
| Write     | ~2,000     | ~1,000| ~1,500|
| Search    | ~5,000     | ~2,000| ~3,000|

## 🔧 Advanced Options

### Cache Customization

```javascript
const db = new HyperDB({
  storage: 'filestore',
  path: './database',
  cache: {
    enabled: true,
    maxSize: 5000,      // Maximum number of items in memory
    ttl: 60 * 60 * 1000 // Expiration time: 1 hour
  }
});
```

### Advanced Queries

```javascript
// Advanced queries (coming in future versions)
const expensiveProducts = await db.find('products', {
  price: { $gt: 1000 },
  category: { $in: ['electronics', 'computers'] },
  'specs.ram': { $gte: 16 }
});
```

## 📚 Comprehensive Examples

The library includes a set of detailed examples in the `examples/` folder:

- [Basic Example](examples/filestore-example.js): Demonstrates basic library usage
- [Security Example](examples/secure-storage.js): Shows how to use encryption features
- [Sync Example](examples/sync.js): Demonstrates how to use synchronization

## 🗺️ Roadmap

We're continuously working to improve HyperDBX.js. Upcoming features include:

- More advanced query support ($gt, $lt, $in, etc.)
- Indexes for faster search operations
- Storage engine performance improvements
- Batch operations support
- Hierarchical data support
- Cloud synchronization enhancements

For more details, please check the [Roadmap](ROADMAP.md).

## 🤝 Contributing

Contributions from the community are welcome! If you'd like to contribute:

1. Fork the project
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 👥 Development Team

HyperDBX.js was developed by **GhostNet Studio**, a team of passionate developers creating easy-to-use, high-performance open-source tools.

## 📄 License

This project is licensed under the [MIT License](LICENSE), which means you can freely use it in both personal and commercial projects.

## 📞 Support

If you encounter any issues or have questions, please open an issue on GitHub or contact us at:

- Discord: https://discord.gg/HVbWnCZr7s

---

<div align="center">
  <p>💙 Developed with love at GhostNet Studio</p>
  <p>We use HyperDBX.js ourselves in many projects and are continuously improving it for you!</p>
</div> 