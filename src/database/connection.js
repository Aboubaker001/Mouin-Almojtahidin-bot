/**
 * Database Connection Manager
 * 
 * Provides a unified interface for both PostgreSQL (production) and SQLite (development)
 * Automatically handles connection pooling, migrations, and error handling
 */

import { config } from '../config/environment.js';
import { createLogger } from '../utils/logger.js';
import SqliteAdapter from './adapters/sqlite.js';
import PostgresAdapter from './adapters/postgres.js';

const logger = createLogger('Database');

let dbAdapter = null;

/**
 * Database interface that all adapters must implement
 */
export class DatabaseInterface {
  async connect() {
    throw new Error('connect() method must be implemented');
  }
  
  async disconnect() {
    throw new Error('disconnect() method must be implemented');
  }
  
  async query(sql, params = []) {
    throw new Error('query() method must be implemented');
  }
  
  async get(sql, params = []) {
    throw new Error('get() method must be implemented');
  }
  
  async all(sql, params = []) {
    throw new Error('all() method must be implemented');
  }
  
  async run(sql, params = []) {
    throw new Error('run() method must be implemented');
  }
  
  async transaction(callback) {
    throw new Error('transaction() method must be implemented');
  }
  
  async migrate() {
    throw new Error('migrate() method must be implemented');
  }
}

/**
 * Initialize database connection based on configuration
 */
export async function initDatabase() {
  try {
    logger.info(`Initializing ${config.database.type} database...`);
    
    // Create appropriate adapter based on configuration
    switch (config.database.type) {
      case 'postgresql':
        dbAdapter = new PostgresAdapter(config.database.postgresql);
        break;
      case 'sqlite':
        dbAdapter = new SqliteAdapter(config.database.sqlite);
        break;
      default:
        throw new Error(`Unsupported database type: ${config.database.type}`);
    }
    
    // Connect to database
    await dbAdapter.connect();
    
    // Run migrations
    await dbAdapter.migrate();
    
    logger.info('✅ Database initialized successfully');
    return dbAdapter;
    
  } catch (error) {
    logger.error('❌ Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Get database instance
 */
export function getDatabase() {
  if (!dbAdapter) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return dbAdapter;
}

/**
 * Close database connection
 */
export async function closeDatabase() {
  if (dbAdapter) {
    try {
      await dbAdapter.disconnect();
      logger.info('✅ Database connection closed');
    } catch (error) {
      logger.error('❌ Error closing database:', error);
    } finally {
      dbAdapter = null;
    }
  }
}

/**
 * Database operation wrappers with error handling
 */
export const db = {
  /**
   * Execute a query and return all results
   */
  async query(sql, params = []) {
    try {
      return await getDatabase().query(sql, params);
    } catch (error) {
      logger.error('Database query error:', { sql, params, error: error.message });
      throw error;
    }
  },
  
  /**
   * Execute a query and return the first result
   */
  async get(sql, params = []) {
    try {
      return await getDatabase().get(sql, params);
    } catch (error) {
      logger.error('Database get error:', { sql, params, error: error.message });
      throw error;
    }
  },
  
  /**
   * Execute a query and return all results
   */
  async all(sql, params = []) {
    try {
      return await getDatabase().all(sql, params);
    } catch (error) {
      logger.error('Database all error:', { sql, params, error: error.message });
      throw error;
    }
  },
  
  /**
   * Execute a query without returning results (INSERT, UPDATE, DELETE)
   */
  async run(sql, params = []) {
    try {
      return await getDatabase().run(sql, params);
    } catch (error) {
      logger.error('Database run error:', { sql, params, error: error.message });
      throw error;
    }
  },
  
  /**
   * Execute multiple queries in a transaction
   */
  async transaction(callback) {
    try {
      return await getDatabase().transaction(callback);
    } catch (error) {
      logger.error('Database transaction error:', error);
      throw error;
    }
  }
};

/**
 * Health check for database connection
 */
export async function healthCheck() {
  try {
    await db.get('SELECT 1 as health');
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    logger.error('Database health check failed:', error);
    return { 
      status: 'unhealthy', 
      error: error.message, 
      timestamp: new Date().toISOString() 
    };
  }
}

export default db;