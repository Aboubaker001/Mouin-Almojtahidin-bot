/**
 * Scheduler Service
 * 
 * Handles scheduled tasks like reminders and notifications
 * Uses node-schedule for cron-like functionality
 */

import schedule from 'node-schedule';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('Scheduler');
const scheduledJobs = new Map();

/**
 * Initialize scheduler service
 */
export async function initScheduler(bot) {
  logger.info('Initializing scheduler service...');
  
  try {
    // Example: Daily health check at 9 AM
    const healthCheckJob = schedule.scheduleJob('health-check', '0 9 * * *', async () => {
      logger.info('Daily health check scheduled task executed');
      // Add health check logic here
    });
    
    scheduledJobs.set('health-check', healthCheckJob);
    
    // Example: Weekly statistics at Sunday 8 PM
    const weeklyStatsJob = schedule.scheduleJob('weekly-stats', '0 20 * * 0', async () => {
      logger.info('Weekly statistics task executed');
      // Add weekly stats logic here
    });
    
    scheduledJobs.set('weekly-stats', weeklyStatsJob);
    
    logger.info(`✅ Scheduler initialized with ${scheduledJobs.size} jobs`);
    
  } catch (error) {
    logger.error('❌ Failed to initialize scheduler:', error);
    throw error;
  }
}

/**
 * Add a custom reminder
 */
export function scheduleReminder(id, date, message, bot, chatId) {
  try {
    const job = schedule.scheduleJob(id, date, async () => {
      try {
        await bot.telegram.sendMessage(chatId, `🔔 تذكير: ${message}`);
        logger.info('Reminder sent successfully', { id, chatId });
        
        // Remove the job after execution
        scheduledJobs.delete(id);
      } catch (error) {
        logger.error('Failed to send reminder:', { id, error: error.message });
      }
    });
    
    if (job) {
      scheduledJobs.set(id, job);
      logger.info('Reminder scheduled', { id, date: date.toISOString() });
      return true;
    }
    
    return false;
    
  } catch (error) {
    logger.error('Failed to schedule reminder:', { id, error: error.message });
    return false;
  }
}

/**
 * Cancel a scheduled reminder
 */
export function cancelReminder(id) {
  const job = scheduledJobs.get(id);
  
  if (job) {
    job.cancel();
    scheduledJobs.delete(id);
    logger.info('Reminder cancelled', { id });
    return true;
  }
  
  return false;
}

/**
 * Get all scheduled jobs
 */
export function getScheduledJobs() {
  return Array.from(scheduledJobs.keys());
}

/**
 * Cleanup scheduler service
 */
export async function cleanupScheduler() {
  logger.info('Cleaning up scheduler...');
  
  try {
    // Cancel all scheduled jobs
    for (const [id, job] of scheduledJobs) {
      job.cancel();
      logger.debug('Cancelled job', { id });
    }
    
    scheduledJobs.clear();
    
    // Gracefully shutdown the schedule module
    await schedule.gracefulShutdown();
    
    logger.info('✅ Scheduler cleanup completed');
    
  } catch (error) {
    logger.error('❌ Error during scheduler cleanup:', error);
  }
}

export default {
  initScheduler,
  scheduleReminder,
  cancelReminder,
  getScheduledJobs,
  cleanupScheduler
};