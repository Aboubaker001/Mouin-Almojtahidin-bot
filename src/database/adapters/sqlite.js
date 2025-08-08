/**
 * SQLite Database Adapter
 * 
 * Provides SQLite implementation for local development
 * Handles connection management, transactions, and migrations
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { promises as fs } from 'fs';
import path from 'path';
import { DatabaseInterface } from '../connection.js';
import { createLogger } from '../../utils/logger.js';
import { createTables } from '../migrations/create-tables.js';

const logger = createLogger('SQLite');

export default class SqliteAdapter extends DatabaseInterface {
  constructor(config) {
    super();
    this.config = config;
    this.db = null;
  }
  
  /**
   * Connect to SQLite database
   */
  async connect() {
    try {
      // Ensure data directory exists for file-based SQLite
      if (this.config.filename !== ':memory:') {
        const dataDir = path.dirname(this.config.filename);
        await fs.mkdir(dataDir, { recursive: true });
      }
      
      this.db = await open({
        filename: this.config.filename,
        driver: sqlite3.Database
      });
      
      // Enable foreign keys and optimize SQLite
      await this.db.exec('PRAGMA foreign_keys = ON');
      await this.db.exec('PRAGMA journal_mode = WAL');
      await this.db.exec('PRAGMA synchronous = NORMAL');
      await this.db.exec('PRAGMA cache_size = 1000');
      await this.db.exec('PRAGMA temp_store = MEMORY');
      
      logger.info(`✅ Connected to SQLite database: ${this.config.filename}`);
    } catch (error) {
      logger.error('❌ Failed to connect to SQLite:', error);
      throw error;
    }
  }
  
  /**
   * Disconnect from SQLite database
   */
  async disconnect() {
    if (this.db) {
      await this.db.close();
      this.db = null;
      logger.info('✅ SQLite connection closed');
    }
  }
  
  /**
   * Execute a query (generic method)
   */
  async query(sql, params = []) {
    try {
      return await this.db.all(sql, params);
    } catch (error) {
      logger.error('SQLite query error:', { sql, params, error: error.message });
      throw error;
    }
  }
  
  /**
   * Get a single row
   */
  async get(sql, params = []) {
    try {
      return await this.db.get(sql, params);
    } catch (error) {
      logger.error('SQLite get error:', { sql, params, error: error.message });
      throw error;
    }
  }
  
  /**
   * Get all rows
   */
  async all(sql, params = []) {
    try {
      return await this.db.all(sql, params);
    } catch (error) {
      logger.error('SQLite all error:', { sql, params, error: error.message });
      throw error;
    }
  }
  
  /**
   * Execute a statement (INSERT, UPDATE, DELETE)
   */
  async run(sql, params = []) {
    try {
      const result = await this.db.run(sql, params);
      return {
        lastID: result.lastID,
        changes: result.changes,
        success: true
      };
    } catch (error) {
      logger.error('SQLite run error:', { sql, params, error: error.message });
      throw error;
    }
  }
  
  /**
   * Execute multiple queries in a transaction
   */
  async transaction(callback) {
    try {
      await this.db.exec('BEGIN TRANSACTION');
      
      try {
        const result = await callback(this);
        await this.db.exec('COMMIT');
        return result;
      } catch (error) {
        await this.db.exec('ROLLBACK');
        throw error;
      }
    } catch (error) {
      logger.error('SQLite transaction error:', error);
      throw error;
    }
  }
  
  /**
   * Run database migrations
   */
  async migrate() {
    try {
      logger.info('Running SQLite migrations...');
      
      // Create migrations table if it doesn't exist
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Run create tables migration
      const migrationName = 'create_tables';
      const existingMigration = await this.db.get(
        'SELECT id FROM migrations WHERE name = ?',
        [migrationName]
      );
      
      if (!existingMigration) {
        await createTables(this);
        await this.db.run(
          'INSERT INTO migrations (name) VALUES (?)',
          [migrationName]
        );
        logger.info(`✅ Migration ${migrationName} completed`);
      } else {
        logger.info(`⏭️ Migration ${migrationName} already applied`);
      }
      
    } catch (error) {
      logger.error('❌ Migration failed:', error);
      throw error;
    }
  }
  
  /**
   * Get raw database instance (for advanced operations)
   */
  getRawConnection() {
    return this.db;
  }
}