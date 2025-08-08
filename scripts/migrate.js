#!/usr/bin/env node

/**
 * Database Migration Script
 * 
 * Manually runs database migrations for development and production
 * Can be used to initialize database schema or apply updates
 */

import { initDatabase, closeDatabase } from '../src/database/connection.js';
import { createLogger } from '../src/utils/logger.js';
import { config } from '../src/config/environment.js';

const logger = createLogger('Migration');

console.log('🗄️  Database Migration Tool\n');

/**
 * Display migration information
 */
function displayInfo() {
  console.log('📋 Migration Information:');
  console.log(`  Environment: ${config.env}`);
  console.log(`  Database Type: ${config.database.type}`);
  
  if (config.database.type === 'sqlite') {
    console.log(`  SQLite File: ${config.database.sqlite.filename}`);
  } else {
    console.log(`  PostgreSQL URL: ${config.database.postgresql.connectionString ? '✅ Configured' : '❌ Not configured'}`);
  }
  
  console.log('');
}

/**
 * Run migrations
 */
async function runMigrations() {
  try {
    console.log('🔄 Starting database migration...');
    
    // Initialize database (this runs migrations automatically)
    await initDatabase();
    
    console.log('✅ Database migration completed successfully!');
    
    // Verify migration by checking for tables
    console.log('\n🔍 Verifying database schema...');
    
    const { db } = await import('../src/database/connection.js');
    
    // Check for core tables
    const tables = [
      'users', 'courses', 'lessons', 'assignments', 
      'attendance', 'submissions', 'announcements', 
      'custom_reminders', 'feedback'
    ];
    
    let verifiedTables = 0;
    
    for (const tableName of tables) {
      try {
        // Different query for SQLite vs PostgreSQL
        const query = config.database.type === 'sqlite' 
          ? `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`
          : `SELECT tablename FROM pg_tables WHERE tablename='${tableName}'`;
          
        const result = await db.get(query);
        
        if (result) {
          console.log(`  ✅ Table '${tableName}' exists`);
          verifiedTables++;
        } else {
          console.log(`  ❌ Table '${tableName}' missing`);
        }
      } catch (error) {
        console.log(`  ⚠️  Error checking table '${tableName}': ${error.message}`);
      }
    }
    
    console.log(`\n📊 Verification Summary: ${verifiedTables}/${tables.length} tables verified`);
    
    if (verifiedTables === tables.length) {
      console.log('🎉 All tables are present and migration is complete!');
    } else {
      console.log('⚠️  Some tables are missing. Migration may have failed.');
    }
    
  } catch (error) {
    logger.error('Migration failed:', error);
    console.log('\n❌ Database migration failed:');
    console.log(`   Error: ${error.message}`);
    
    if (config.database.type === 'postgresql' && error.message.includes('connection')) {
      console.log('\n💡 Troubleshooting tips for PostgreSQL:');
      console.log('   1. Check DATABASE_URL environment variable');
      console.log('   2. Ensure PostgreSQL service is running');
      console.log('   3. Verify connection string format');
      console.log('   4. Check network connectivity');
    } else if (config.database.type === 'sqlite') {
      console.log('\n💡 Troubleshooting tips for SQLite:');
      console.log('   1. Check write permissions to data directory');
      console.log('   2. Ensure sqlite3 is properly installed');
      console.log('   3. Verify disk space availability');
    }
    
    process.exit(1);
  }
}

/**
 * Main migration function
 */
async function migrate() {
  try {
    displayInfo();
    await runMigrations();
    
    console.log('\n📋 Next steps:');
    console.log('  1. Populate test data: npm run setup:test-data');
    console.log('  2. Start the application: npm run dev');
    console.log('  3. Run health check: npm run health');
    
  } catch (error) {
    logger.error('Migration process failed:', error);
    process.exit(1);
  } finally {
    // Always close database connection
    await closeDatabase();
  }
}

// Check command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('Database Migration Tool');
  console.log('');
  console.log('Usage: npm run db:migrate');
  console.log('   or: node scripts/migrate.js');
  console.log('');
  console.log('This script will:');
  console.log('  1. Connect to the configured database');
  console.log('  2. Run all pending migrations');
  console.log('  3. Verify the database schema');
  console.log('');
  console.log('Environment variables:');
  console.log('  NODE_ENV - Set environment (development/production)');
  console.log('  DB_TYPE - Database type (sqlite/postgresql)');
  console.log('  DATABASE_URL - PostgreSQL connection string (production)');
  process.exit(0);
}

// Run migration
migrate();