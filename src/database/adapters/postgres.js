/**
 * PostgreSQL Database Adapter
 * 
 * Provides PostgreSQL implementation for production deployment on Railway
 * Handles connection pooling, transactions, and migrations
 */

import pg from 'pg';
import { DatabaseInterface } from '../connection.js';
import { createLogger } from '../../utils/logger.js';
import { createTables } from '../migrations/create-tables.js';

const { Pool } = pg;
const logger = createLogger('PostgreSQL');

export default class PostgresAdapter extends DatabaseInterface {
  constructor(config) {
    super();
    this.config = config;
    this.pool = null;
  }
  
  /**
   * Connect to PostgreSQL database with connection pooling
   */
  async connect() {
    try {
      this.pool = new Pool({
        connectionString: this.config.connectionString,
        ssl: this.config.ssl,
        max: 20, // Maximum number of connections in the pool
        idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
        connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection could not be established
        maxUses: 7500, // Close connection after 7500 uses (helpful for AWS RDS)
      });
      
      // Test the connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      logger.info('✅ Connected to PostgreSQL database with connection pooling');
    } catch (error) {
      logger.error('❌ Failed to connect to PostgreSQL:', error);
      throw error;
    }
  }
  
  /**
   * Disconnect from PostgreSQL database
   */
  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      logger.info('✅ PostgreSQL connection pool closed');
    }
  }
  
  /**
   * Execute a query (generic method)
   */
  async query(sql, params = []) {
    try {
      const result = await this.pool.query(sql, params);
      return result.rows;
    } catch (error) {
      logger.error('PostgreSQL query error:', { sql, params, error: error.message });
      throw error;
    }
  }
  
  /**
   * Get a single row
   */
  async get(sql, params = []) {
    try {
      const result = await this.pool.query(sql, params);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('PostgreSQL get error:', { sql, params, error: error.message });
      throw error;
    }
  }
  
  /**
   * Get all rows
   */
  async all(sql, params = []) {
    try {
      const result = await this.pool.query(sql, params);
      return result.rows;
    } catch (error) {
      logger.error('PostgreSQL all error:', { sql, params, error: error.message });
      throw error;
    }
  }
  
  /**
   * Execute a statement (INSERT, UPDATE, DELETE)
   */
  async run(sql, params = []) {
    try {
      const result = await this.pool.query(sql, params);
      return {
        lastID: result.rows[0]?.id || null,
        changes: result.rowCount,
        success: true
      };
    } catch (error) {
      logger.error('PostgreSQL run error:', { sql, params, error: error.message });
      throw error;
    }
  }
  
  /**
   * Execute multiple queries in a transaction
   */
  async transaction(callback) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create a temporary adapter for the transaction
      const transactionAdapter = {
        query: (sql, params) => client.query(sql, params).then(r => r.rows),
        get: (sql, params) => client.query(sql, params).then(r => r.rows[0] || null),
        all: (sql, params) => client.query(sql, params).then(r => r.rows),
        run: (sql, params) => client.query(sql, params).then(r => ({
          lastID: r.rows[0]?.id || null,
          changes: r.rowCount,
          success: true
        }))
      };
      
      const result = await callback(transactionAdapter);
      await client.query('COMMIT');
      return result;
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('PostgreSQL transaction error:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Run database migrations
   */
  async migrate() {
    try {
      logger.info('Running PostgreSQL migrations...');
      
      // Create migrations table if it doesn't exist
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Run create tables migration
      const migrationName = 'create_tables';
      const existingMigration = await this.get(
        'SELECT id FROM migrations WHERE name = $1',
        [migrationName]
      );
      
      if (!existingMigration) {
        await createTables(this);
        await this.run(
          'INSERT INTO migrations (name) VALUES ($1)',
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
   * Get raw connection pool (for advanced operations)
   */
  getRawConnection() {
    return this.pool;
  }
  
  /**
   * Convert SQLite syntax to PostgreSQL syntax
   */
  static convertSqliteToPostgres(sql) {
    return sql
      // Convert INTEGER PRIMARY KEY AUTOINCREMENT to SERIAL PRIMARY KEY
      .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
      // Convert DATETIME to TIMESTAMP
      .replace(/DATETIME/gi, 'TIMESTAMP')
      // Convert BOOLEAN to BOOLEAN (already compatible)
      // Convert parameter placeholders from ? to $1, $2, etc.
      .replace(/\?/g, (match, offset, string) => {
        const beforeMatch = string.substring(0, offset);
        const count = (beforeMatch.match(/\?/g) || []).length + 1;
        return `$${count}`;
      });
  }
}