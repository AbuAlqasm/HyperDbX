/**
 * TypeScript definitions for HyperDBX.js
 */

declare module 'hyperdbx.js' {
  /**
   * Configuration options for HyperDBX
   */
  export interface HyperDBConfig {
    storage?: string;
    path?: string;
    cache?: {
      enabled?: boolean;
      maxSize?: number;
      ttl?: number;
    };
    sync?: {
      enabled?: boolean;
      type?: string;
      config?: Record<string, any>;
    };
    realtime?: {
      enabled?: boolean;
      serverUrl?: string;
      server?: any;
    };
    security?: {
      encryption?: {
        enabled?: boolean;
        secret: string;
      };
      jwt?: {
        enabled?: boolean;
        secret: string;
      };
    };
  }

  export interface SecurityAPI {
    encrypt(data: any): any;
    decrypt(data: any): any;
    generateToken(payload: Record<string, any>): string;
    verifyToken(token: string): Record<string, any> | null;
  }

  /**
   * Main HyperDB class
   */
  export default class HyperDB {
    constructor(options?: HyperDBConfig);
    
    security: SecurityAPI;
    
    set(key: string, value: any): Promise<boolean>;
    get(key: string): Promise<any>;
    has(key: string): Promise<boolean>;
    delete(key: string): Promise<boolean>;
    
    createCollection(name: string): Promise<boolean>;
    insert(collection: string, document: Record<string, any>): Promise<boolean>;
    findOne(collection: string, query: Record<string, any>): Promise<Record<string, any> | null>;
    find(collection: string, query: Record<string, any>): Promise<Array<Record<string, any>>>;
    update(collection: string, query: Record<string, any>, update: Record<string, any>): Promise<number>;
    deleteFrom(collection: string, query: Record<string, any>): Promise<number>;
    
    on(event: string, callback: Function): void;
    off(event: string, callback: Function): void;
    
    close(): Promise<void>;
  }
} 