/**
 * Database Migration: Create Tables
 * 
 * Creates all necessary tables for the educational bot
 * Compatible with both SQLite and PostgreSQL
 */

import { createLogger } from '../../utils/logger.js';

const logger = createLogger('Migration');

/**
 * Create all database tables
 */
export async function createTables(adapter) {
  logger.info('Creating database tables...');
  
  try {
    // Determine database type for syntax differences
    const isPostgres = adapter.constructor.name === 'PostgresAdapter';
    
    // Helper function to get appropriate SQL syntax
    const sql = (sqliteVersion, postgresVersion = null) => {
      return isPostgres && postgresVersion ? postgresVersion : sqliteVersion;
    };
    
    // Users table
    await adapter.run(`
      CREATE TABLE IF NOT EXISTS users (
        ${sql('user_id INTEGER PRIMARY KEY', 'user_id BIGINT PRIMARY KEY')},
        username TEXT,
        first_name TEXT,
        ${sql('join_date DATETIME DEFAULT CURRENT_TIMESTAMP', 'join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP')},
        ${sql('is_verified BOOLEAN DEFAULT 0', 'is_verified BOOLEAN DEFAULT FALSE')},
        ${sql('reminders_enabled BOOLEAN DEFAULT 1', 'reminders_enabled BOOLEAN DEFAULT TRUE')},
        language TEXT DEFAULT 'ar'
      )
    `);
    
    // Courses table
    await adapter.run(`
      CREATE TABLE IF NOT EXISTS courses (
        ${sql('course_id INTEGER PRIMARY KEY AUTOINCREMENT', 'course_id SERIAL PRIMARY KEY')},
        name TEXT NOT NULL,
        description TEXT,
        ${sql('created_at DATETIME DEFAULT CURRENT_TIMESTAMP', 'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP')}
      )
    `);
    
    // Lessons table
    await adapter.run(`
      CREATE TABLE IF NOT EXISTS lessons (
        ${sql('lesson_id INTEGER PRIMARY KEY AUTOINCREMENT', 'lesson_id SERIAL PRIMARY KEY')},
        course_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        zoom_link TEXT,
        FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
      )
    `);
    
    // Assignments table
    await adapter.run(`
      CREATE TABLE IF NOT EXISTS assignments (
        ${sql('assignment_id INTEGER PRIMARY KEY AUTOINCREMENT', 'assignment_id SERIAL PRIMARY KEY')},
        course_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        question TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        deadline TEXT NOT NULL,
        FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
      )
    `);
    
    // Attendance table
    await adapter.run(`
      CREATE TABLE IF NOT EXISTS attendance (
        ${sql('user_id INTEGER', 'user_id BIGINT')},
        lesson_id INTEGER,
        ${sql('attended_at DATETIME DEFAULT CURRENT_TIMESTAMP', 'attended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP')},
        PRIMARY KEY (user_id, lesson_id),
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id) ON DELETE CASCADE
      )
    `);
    
    // Submissions table
    await adapter.run(`
      CREATE TABLE IF NOT EXISTS submissions (
        ${sql('user_id INTEGER', 'user_id BIGINT')},
        assignment_id INTEGER,
        answer TEXT NOT NULL,
        ${sql('submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP', 'submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP')},
        score INTEGER DEFAULT 0,
        PRIMARY KEY (user_id, assignment_id),
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (assignment_id) REFERENCES assignments(assignment_id) ON DELETE CASCADE
      )
    `);
    
    // Announcements table
    await adapter.run(`
      CREATE TABLE IF NOT EXISTS announcements (
        ${sql('announcement_id INTEGER PRIMARY KEY AUTOINCREMENT', 'announcement_id SERIAL PRIMARY KEY')},
        content TEXT NOT NULL,
        ${sql('published_at DATETIME DEFAULT CURRENT_TIMESTAMP', 'published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP')},
        ${sql('sent_to_group BOOLEAN DEFAULT 0', 'sent_to_group BOOLEAN DEFAULT FALSE')}
      )
    `);
    
    // Custom reminders table
    await adapter.run(`
      CREATE TABLE IF NOT EXISTS custom_reminders (
        ${sql('reminder_id INTEGER PRIMARY KEY AUTOINCREMENT', 'reminder_id SERIAL PRIMARY KEY')},
        ${sql('user_id INTEGER NOT NULL', 'user_id BIGINT NOT NULL')},
        ${sql('reminder_datetime DATETIME NOT NULL', 'reminder_datetime TIMESTAMP NOT NULL')},
        message TEXT NOT NULL,
        ${sql('is_sent BOOLEAN DEFAULT 0', 'is_sent BOOLEAN DEFAULT FALSE')},
        ${sql('created_at DATETIME DEFAULT CURRENT_TIMESTAMP', 'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP')},
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);
    
    // Feedback table
    await adapter.run(`
      CREATE TABLE IF NOT EXISTS feedback (
        ${sql('feedback_id INTEGER PRIMARY KEY AUTOINCREMENT', 'feedback_id SERIAL PRIMARY KEY')},
        ${sql('user_id INTEGER NOT NULL', 'user_id BIGINT NOT NULL')},
        message TEXT NOT NULL,
        ${sql('created_at DATETIME DEFAULT CURRENT_TIMESTAMP', 'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP')},
        ${sql('is_read BOOLEAN DEFAULT 0', 'is_read BOOLEAN DEFAULT FALSE')},
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);
    
    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_verified ON users(is_verified)',
      'CREATE INDEX IF NOT EXISTS idx_lessons_date ON lessons(date, time)',
      'CREATE INDEX IF NOT EXISTS idx_assignments_deadline ON assignments(deadline)',
      'CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_custom_reminders_datetime ON custom_reminders(reminder_datetime)',
      'CREATE INDEX IF NOT EXISTS idx_custom_reminders_sent ON custom_reminders(is_sent)',
      'CREATE INDEX IF NOT EXISTS idx_feedback_read ON feedback(is_read)'
    ];
    
    for (const indexSql of indexes) {
      try {
        await adapter.run(indexSql);
      } catch (error) {
        // Ignore index creation errors (might already exist)
        logger.warn(`Index creation warning: ${error.message}`);
      }
    }
    
    logger.info('✅ All database tables created successfully');
    
  } catch (error) {
    logger.error('❌ Failed to create tables:', error);
    throw error;
  }
}