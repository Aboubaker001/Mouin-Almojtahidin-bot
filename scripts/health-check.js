#!/usr/bin/env node

/**
 * Health Check Script
 * 
 * Verifies that all application components are working properly
 * Can be used for monitoring and deployment verification
 */

import { config } from '../src/config/environment.js';
import { initDatabase, closeDatabase, healthCheck as dbHealthCheck } from '../src/database/connection.js';
import { logHealthCheck } from '../src/utils/logger.js';

console.log('🏥 Running health check...\n');

/**
 * Check environment configuration
 */
function checkConfiguration() {
  console.log('📋 Checking configuration...');
  
  const checks = [
    { name: 'BOT_TOKEN', value: !!config.bot.token, required: true },
    { name: 'Environment', value: config.env, required: true },
    { name: 'Database Type', value: config.database.type, required: true },
    { name: 'Admin Users', value: config.admin.userIds.length > 0, required: true },
    { name: 'Webhook URL', value: !!config.bot.webhook.url, required: config.isProduction },
    { name: 'Webhook Secret', value: !!config.bot.webhook.secret, required: config.isProduction }
  ];
  
  let configHealthy = true;
  
  for (const check of checks) {
    const status = check.value ? '✅' : '❌';
    const required = check.required ? '(required)' : '(optional)';
    console.log(`  ${status} ${check.name}: ${check.value} ${required}`);
    
    if (check.required && !check.value) {
      configHealthy = false;
    }
  }
  
  return configHealthy;
}

/**
 * Check database connectivity
 */
async function checkDatabase() {
  console.log('\n🗄️  Checking database...');
  
  try {
    await initDatabase();
    const health = await dbHealthCheck();
    
    if (health.status === 'healthy') {
      console.log('  ✅ Database connection: healthy');
      console.log(`  ✅ Database type: ${config.database.type}`);
      return true;
    } else {
      console.log('  ❌ Database connection: unhealthy');
      console.log(`  ❌ Error: ${health.error}`);
      return false;
    }
  } catch (error) {
    console.log('  ❌ Database connection failed');
    console.log(`  ❌ Error: ${error.message}`);
    return false;
  } finally {
    await closeDatabase();
  }
}

/**
 * Check logging system
 */
async function checkLogging() {
  console.log('\n📝 Checking logging...');
  
  try {
    const health = await logHealthCheck();
    
    if (health.status === 'healthy') {
      console.log('  ✅ Logging system: healthy');
      console.log(`  ✅ Log level: ${config.logging.level}`);
      console.log(`  ✅ Log file: ${config.logging.file}`);
      return true;
    } else {
      console.log('  ❌ Logging system: unhealthy');
      console.log(`  ❌ Error: ${health.error}`);
      return false;
    }
  } catch (error) {
    console.log('  ❌ Logging system failed');
    console.log(`  ❌ Error: ${error.message}`);
    return false;
  }
}

/**
 * Check bot connectivity (if token is provided)
 */
async function checkBot() {
  console.log('\n🤖 Checking bot connectivity...');
  
  if (!config.bot.token || config.bot.token === 'your_bot_token_here') {
    console.log('  ⚠️  Bot token not configured, skipping bot check');
    return true;
  }
  
  try {
    // Create a simple bot instance for testing
    const { Telegraf } = await import('telegraf');
    const bot = new Telegraf(config.bot.token);
    
    // Test API connectivity
    const botInfo = await bot.telegram.getMe();
    console.log(`  ✅ Bot connected: @${botInfo.username}`);
    console.log(`  ✅ Bot ID: ${botInfo.id}`);
    console.log(`  ✅ Can join groups: ${botInfo.can_join_groups ? 'Yes' : 'No'}`);
    
    return true;
  } catch (error) {
    console.log('  ❌ Bot connectivity failed');
    console.log(`  ❌ Error: ${error.message}`);
    return false;
  }
}

/**
 * Check system resources
 */
function checkSystemResources() {
  console.log('\n💻 Checking system resources...');
  
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  console.log(`  ✅ Memory usage: ${Math.round(memoryUsage.rss / 1024 / 1024)} MB`);
  console.log(`  ✅ Heap used: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`);
  console.log(`  ✅ Process uptime: ${Math.round(uptime)} seconds`);
  console.log(`  ✅ Node.js version: ${process.version}`);
  console.log(`  ✅ Platform: ${process.platform}`);
  
  return true;
}

/**
 * Main health check function
 */
async function runHealthCheck() {
  const startTime = Date.now();
  
  try {
    const checks = [
      { name: 'Configuration', fn: checkConfiguration },
      { name: 'Database', fn: checkDatabase },
      { name: 'Logging', fn: checkLogging },
      { name: 'Bot', fn: checkBot },
      { name: 'System Resources', fn: checkSystemResources }
    ];
    
    const results = [];
    
    for (const check of checks) {
      try {
        const result = await check.fn();
        results.push({ name: check.name, status: result ? 'healthy' : 'unhealthy' });
      } catch (error) {
        console.log(`  ❌ ${check.name} check failed: ${error.message}`);
        results.push({ name: check.name, status: 'unhealthy' });
      }
    }
    
    const duration = Date.now() - startTime;
    const allHealthy = results.every(r => r.status === 'healthy');
    
    console.log('\n📊 Health Check Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    for (const result of results) {
      const status = result.status === 'healthy' ? '✅' : '❌';
      console.log(`  ${status} ${result.name}: ${result.status}`);
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`⏱️  Total time: ${duration}ms`);
    console.log(`🏥 Overall status: ${allHealthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
    
    if (!allHealthy) {
      console.log('\n⚠️  Some components are unhealthy. Please check the details above.');
      process.exit(1);
    } else {
      console.log('\n🎉 All systems are healthy!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n💥 Health check failed:', error.message);
    process.exit(1);
  }
}

// Run the health check
runHealthCheck();