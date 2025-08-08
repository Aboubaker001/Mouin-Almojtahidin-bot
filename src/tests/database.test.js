/**
 * Database Tests
 * 
 * Basic tests for database functionality using Node.js built-in test runner
 * Run with: npm test
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { initDatabase, closeDatabase, db } from '../database/connection.js';

describe('Database Tests', () => {
  before(async () => {
    // Initialize database for testing
    await initDatabase();
  });
  
  after(async () => {
    // Cleanup after tests
    await closeDatabase();
  });
  
  test('should connect to database', async () => {
    const result = await db.get('SELECT 1 as test');
    assert.strictEqual(result.test, 1);
  });
  
  test('should create users table', async () => {
    const result = await db.get(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='users'
    `);
    assert.strictEqual(result.name, 'users');
  });
  
  test('should insert and retrieve user', async () => {
    const testUserId = 123456789;
    const testUsername = 'test_user';
    const testFirstName = 'Test User';
    
    // Insert test user
    await db.run(
      'INSERT OR REPLACE INTO users (user_id, username, first_name, is_verified) VALUES (?, ?, ?, ?)',
      [testUserId, testUsername, testFirstName, 1]
    );
    
    // Retrieve test user
    const user = await db.get(
      'SELECT * FROM users WHERE user_id = ?',
      [testUserId]
    );
    
    assert.strictEqual(user.user_id, testUserId);
    assert.strictEqual(user.username, testUsername);
    assert.strictEqual(user.first_name, testFirstName);
    assert.strictEqual(user.is_verified, 1);
  });
  
  test('should create courses table', async () => {
    const result = await db.get(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='courses'
    `);
    assert.strictEqual(result.name, 'courses');
  });
  
  test('should insert and retrieve course', async () => {
    const testCourseName = 'Test Course';
    const testDescription = 'Test course description';
    
    // Insert test course
    const insertResult = await db.run(
      'INSERT INTO courses (name, description) VALUES (?, ?)',
      [testCourseName, testDescription]
    );
    
    assert.ok(insertResult.lastID);
    
    // Retrieve test course
    const course = await db.get(
      'SELECT * FROM courses WHERE course_id = ?',
      [insertResult.lastID]
    );
    
    assert.strictEqual(course.name, testCourseName);
    assert.strictEqual(course.description, testDescription);
  });
  
  test('should handle database transaction', async () => {
    const result = await db.transaction(async (adapter) => {
      // Insert multiple records in a transaction
      await adapter.run(
        'INSERT INTO courses (name, description) VALUES (?, ?)',
        ['Transaction Course 1', 'Test transaction 1']
      );
      
      await adapter.run(
        'INSERT INTO courses (name, description) VALUES (?, ?)',
        ['Transaction Course 2', 'Test transaction 2']
      );
      
      return 'success';
    });
    
    assert.strictEqual(result, 'success');
    
    // Verify both courses were inserted
    const courses = await db.all(
      'SELECT * FROM courses WHERE name LIKE ?',
      ['Transaction Course%']
    );
    
    assert.strictEqual(courses.length, 2);
  });
});

// Export for use in other test files
export { db };