# HyperDB.js Project Structure

This document provides an overview of the HyperDB.js project structure.

## Core Files

- `index.js` - Main entry point for the library
- `package.json` - Project dependencies and metadata
- `README.md` - Project documentation

## Source Code

- `src/` - Source code directory
  - `storage-engine.js` - Storage engine abstraction layer
  - `memory-cache.js` - In-memory cache implementation
  - `cloud-sync.js` - Cloud synchronization module
  - `realtime-sync.js` - Real-time synchronization using WebSockets
  - `security.js` - Encryption and authentication module
  - `utils.js` - Utility functions

## Adapters

- `src/adapters/` - Storage adapters for different backends
  - `sqlite-adapter.js` - SQLite database adapter
  - `json-adapter.js` - JSON file-based adapter
  - `leveldb-adapter.js` - LevelDB adapter (to be implemented)
  - `mongodb-adapter.js` - MongoDB adapter (to be implemented)
  - `postgres-adapter.js` - PostgreSQL adapter (to be implemented)

## Examples

- `examples/` - Example usage of HyperDB.js
  - `basic.js` - Basic usage of key-value and collection APIs
  - `sync.js` - Demonstrates cloud and real-time synchronization
  - `json-storage.js` - Usage of the JSON storage adapter

## Implementation Status

### Implemented
- Core HyperDB class
- Memory cache
- Storage engine abstraction
- SQLite adapter
- JSON adapter
- Security module
- Basic cloud sync
- Basic real-time sync
- Examples

### Pending Implementation
- LevelDB adapter
- MongoDB adapter
- PostgreSQL adapter
- Full cloud sync with Firebase/Supabase/AWS
- Full WebSocket real-time sync
- Query optimization
- Data migration tools
- TypeScript definitions

## Architecture Overview

HyperDB.js follows a modular architecture:

1. **HyperDB (Core)** - Main class that orchestrates all components
2. **Storage Engine** - Abstraction layer for different storage backends
3. **Storage Adapters** - Implementations for different database systems
4. **Memory Cache** - Provides fast in-memory access to frequently used data
5. **Cloud Sync** - Handles synchronization with cloud services
6. **Real-time Sync** - Provides real-time data synchronization between clients
7. **Security** - Handles encryption and authentication

This architecture allows for easy extension and customization. Users can create their own adapters or synchronization mechanisms by implementing the required interfaces. 