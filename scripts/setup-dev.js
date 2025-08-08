#!/usr/bin/env node

/**
 * Development Setup Script
 * 
 * Initializes the project for local development by:
 * - Creating necessary directories
 * - Setting up environment files
 * - Initializing the database
 * - Verifying configuration
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🚀 Setting up development environment...\n');

/**
 * Create necessary directories
 */
async function createDirectories() {
  const directories = [
    'data',
    'logs',
    'src/tests',
    'src/commands/admin',
    'src/commands/user',
    'src/commands/public'
  ];
  
  console.log('📁 Creating directories...');
  
  for (const dir of directories) {
    const dirPath = path.join(projectRoot, dir);
    try {
      await fs.mkdir(dirPath, { recursive: true });
      console.log(`  ✅ Created: ${dir}`);
    } catch (error) {
      if (error.code !== 'EEXIST') {
        console.log(`  ❌ Failed to create ${dir}: ${error.message}`);
      } else {
        console.log(`  ✅ Exists: ${dir}`);
      }
    }
  }
}

/**
 * Create environment file for development
 */
async function createEnvFile() {
  const envLocalPath = path.join(projectRoot, '.env.local');
  
  try {
    // Check if .env.local already exists
    await fs.access(envLocalPath);
    console.log('\n📋 .env.local already exists, skipping creation...');
    return;
  } catch {
    // File doesn't exist, create it
  }
  
  console.log('\n📋 Creating .env.local file...');
  
  const envContent = `# Mouin Almojtahidin Bot - Local Development Configuration
# This file is for local development only

NODE_ENV=development
PORT=3000

# ============================================================================
# TELEGRAM BOT CONFIGURATION
# ============================================================================

# TODO: Get your bot token from @BotFather and replace this
BOT_TOKEN=your_bot_token_here

# Webhook settings (not needed for development - bot uses polling)
WEBHOOK_URL=
WEBHOOK_SECRET=

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================

# Use SQLite for local development
DB_TYPE=sqlite

# PostgreSQL URL (not needed for local development)
DATABASE_URL=

# ============================================================================
# APPLICATION SETTINGS
# ============================================================================

# User activation code
ACTIVATION_CODE=free_palestine1447

# TODO: Replace with your Telegram user ID for admin access
ADMIN_USER_IDS=123456789

# Support channel
SUPPORT_CHANNEL=@SupportChannel

# Optional settings
ADMIN_CHAT_ID=
GROUP_ID=
ZOOM_LINK=https://zoom.us/j/example

# ============================================================================
# RATE LIMITING & LOGGING
# ============================================================================

RATE_LIMITING_ENABLED=true
MAX_REQUESTS_PER_MINUTE=30
MAX_REQUESTS_PER_HOUR=100

LOG_LEVEL=debug
LOG_FILE=logs/app.log
`;
  
  try {
    await fs.writeFile(envLocalPath, envContent);
    console.log('  ✅ Created .env.local file');
    console.log('  ⚠️  Remember to update BOT_TOKEN and ADMIN_USER_IDS in .env.local');
  } catch (error) {
    console.log(`  ❌ Failed to create .env.local: ${error.message}`);
  }
}

/**
 * Create test environment file
 */
async function createTestEnvFile() {
  const envTestPath = path.join(projectRoot, '.env.test');
  
  try {
    await fs.access(envTestPath);
    console.log('\n🧪 .env.test already exists, skipping creation...');
    return;
  } catch {
    // File doesn't exist, create it
  }
  
  console.log('\n🧪 Creating .env.test file...');
  
  const envContent = `# Test Environment Configuration
NODE_ENV=test
PORT=3001

# Test bot token (can be fake for unit tests)
BOT_TOKEN=test_bot_token

# Test database (uses in-memory SQLite)
DB_TYPE=sqlite

# Test settings
ACTIVATION_CODE=test_code
ADMIN_USER_IDS=123456789
SUPPORT_CHANNEL=@TestChannel

# Disable rate limiting for tests
RATE_LIMITING_ENABLED=false

# Test logging
LOG_LEVEL=warn
LOG_FILE=logs/test.log
`;
  
  try {
    await fs.writeFile(envTestPath, envContent);
    console.log('  ✅ Created .env.test file');
  } catch (error) {
    console.log(`  ❌ Failed to create .env.test: ${error.message}`);
  }
}

/**
 * Verify Node.js and npm versions
 */
async function verifyRequirements() {
  console.log('\n🔍 Verifying requirements...');
  
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion >= 20) {
    console.log(`  ✅ Node.js version: ${nodeVersion} (compatible)`);
  } else {
    console.log(`  ❌ Node.js version: ${nodeVersion} (requires Node.js 20+)`);
    return false;
  }
  
  return true;
}

/**
 * Display next steps
 */
function displayNextSteps() {
  console.log('\n🎉 Development setup completed!\n');
  console.log('📋 Next steps:');
  console.log('  1. Update .env.local with your actual BOT_TOKEN from @BotFather');
  console.log('  2. Update ADMIN_USER_IDS with your Telegram user ID');
  console.log('  3. Run: npm install');
  console.log('  4. Run: npm run dev');
  console.log('  5. Test the bot by sending /start to your bot\n');
  
  console.log('🛠️  Available scripts:');
  console.log('  npm run dev          - Start in development mode with auto-reload');
  console.log('  npm start            - Start in production mode');
  console.log('  npm test             - Run tests');
  console.log('  npm run setup:test-data - Setup test data in database');
  console.log('  npm run health       - Check application health\n');
  
  console.log('🔧 VS Code users:');
  console.log('  - Debug configurations are ready in .vscode/launch.json');
  console.log('  - Use F5 to start debugging');
  console.log('  - Use Ctrl+Shift+P -> "Debug: Select and Start Debugging"\n');
}

/**
 * Main setup function
 */
async function setup() {
  try {
    const requirementsMet = await verifyRequirements();
    if (!requirementsMet) {
      process.exit(1);
    }
    
    await createDirectories();
    await createEnvFile();
    await createTestEnvFile();
    
    displayNextSteps();
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup
setup();