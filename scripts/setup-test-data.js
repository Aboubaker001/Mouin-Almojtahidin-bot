#!/usr/bin/env node

/**
 * Setup Test Data Script
 * 
 * Populates the database with sample test data for development and testing
 * Uses the existing test_data.sql file and database connection
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, closeDatabase, db } from '../src/database/connection.js';
import { createLogger } from '../src/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const logger = createLogger('TestData');

console.log('📊 Setting up test data...\n');

/**
 * Load and execute SQL from test_data.sql file
 */
async function loadTestData() {
  try {
    const sqlFilePath = path.join(projectRoot, 'test_data.sql');
    
    // Check if test_data.sql exists
    try {
      await fs.access(sqlFilePath);
    } catch {
      console.log('❌ test_data.sql file not found');
      console.log('   Expected location:', sqlFilePath);
      return false;
    }
    
    // Read SQL file
    const sqlContent = await fs.readFile(sqlFilePath, 'utf8');
    
    // Split SQL statements (basic splitting by semicolon)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📄 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    let successCount = 0;
    for (const statement of statements) {
      try {
        if (statement.toLowerCase().startsWith('insert')) {
          await db.run(statement);
          successCount++;
        } else if (statement.toLowerCase().startsWith('pragma')) {
          await db.run(statement);
        }
      } catch (error) {
        // Skip errors for duplicate entries (INSERT OR IGNORE)
        if (!error.message.includes('UNIQUE constraint failed')) {
          logger.warn('SQL statement warning:', error.message);
        }
      }
    }
    
    console.log(`✅ Successfully executed ${successCount} INSERT statements`);
    return true;
    
  } catch (error) {
    logger.error('Failed to load test data:', error);
    return false;
  }
}

/**
 * Verify test data was loaded
 */
async function verifyTestData() {
  try {
    console.log('\n🔍 Verifying test data...');
    
    const checks = [
      { name: 'Users', query: 'SELECT COUNT(*) as count FROM users' },
      { name: 'Courses', query: 'SELECT COUNT(*) as count FROM courses' },
      { name: 'Lessons', query: 'SELECT COUNT(*) as count FROM lessons' },
      { name: 'Assignments', query: 'SELECT COUNT(*) as count FROM assignments' },
      { name: 'Attendance', query: 'SELECT COUNT(*) as count FROM attendance' },
      { name: 'Submissions', query: 'SELECT COUNT(*) as count FROM submissions' }
    ];
    
    const results = {};
    
    for (const check of checks) {
      try {
        const result = await db.get(check.query);
        results[check.name] = result.count;
        console.log(`  ✅ ${check.name}: ${result.count} records`);
      } catch (error) {
        console.log(`  ❌ ${check.name}: Error (${error.message})`);
        results[check.name] = 0;
      }
    }
    
    return results;
    
  } catch (error) {
    logger.error('Failed to verify test data:', error);
    return null;
  }
}

/**
 * Main setup function
 */
async function setupTestData() {
  try {
    // Initialize database
    console.log('🔄 Initializing database connection...');
    await initDatabase();
    console.log('✅ Database connected');
    
    // Load test data
    const loadSuccess = await loadTestData();
    
    if (!loadSuccess) {
      console.log('\n❌ Failed to load test data');
      process.exit(1);
    }
    
    // Verify data
    const verification = await verifyTestData();
    
    if (!verification) {
      console.log('\n⚠️  Could not verify test data');
    }
    
    console.log('\n🎉 Test data setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('  1. Start the bot: npm run dev');
    console.log('  2. Test commands: /start, /profile, /courses');
    console.log('  3. Check admin commands with your admin user ID');
    
  } catch (error) {
    logger.error('Setup failed:', error);
    console.log('\n❌ Test data setup failed:', error.message);
    process.exit(1);
  } finally {
    // Always close database connection
    await closeDatabase();
  }
}

// Run setup
setupTestData();