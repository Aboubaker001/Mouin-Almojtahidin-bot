/**
 * Logger Utility
 * 
 * Provides structured logging using Winston with file rotation and console output
 * Supports different log levels and environment-specific configuration
 */

import winston from 'winston';
import { promises as fs } from 'fs';
import path from 'path';
import { config } from '../config/environment.js';

// Ensure logs directory exists
const logsDir = path.dirname(config.logging.file);
try {
  await fs.mkdir(logsDir, { recursive: true });
} catch (error) {
  console.warn('Failed to create logs directory:', error.message);
}

/**
 * Custom log format
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level.toUpperCase()}] ${service ? `[${service}] ` : ''}${message}${metaStr ? '\n' + metaStr : ''}`;
  })
);

/**
 * Console format for development
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const servicePrefix = service ? `[${service}] ` : '';
    const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
    return `${timestamp} ${level} ${servicePrefix}${message}${metaStr}`;
  })
);

/**
 * Main logger instance
 */
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { 
    service: 'bot',
    environment: config.env 
  },
  transports: [
    // File transport for all logs
    new winston.transports.File({
      filename: config.logging.file,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Separate error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 3,
      tailable: true
    })
  ],
  
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log')
    })
  ],
  
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log')
    })
  ]
});

// Add console transport for development
if (config.logging.console || config.isDevelopment) {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

/**
 * Create a child logger with specific service name
 */
export function createLogger(serviceName) {
  return logger.child({ service: serviceName });
}

/**
 * Log bot startup event
 */
export function logBotStartup() {
  logger.info('🚀 Bot started successfully', {
    environment: config.env,
    database: config.database.type,
    mode: config.bot.usePolling ? 'polling' : 'webhook',
    adminCount: config.admin.userIds.length
  });
}

/**
 * Log bot shutdown event
 */
export function logBotShutdown() {
  logger.info('🛑 Bot shutting down gracefully');
}

/**
 * Log user activity
 */
export function logUserActivity(userId, action, details = {}) {
  logger.info('User activity', {
    userId,
    action,
    ...details
  });
}

/**
 * Log admin activity
 */
export function logAdminActivity(userId, action, details = {}) {
  logger.warn('Admin activity', {
    userId,
    action,
    ...details
  });
}

/**
 * Log error with context
 */
export function logError(error, context = '', details = {}) {
  logger.error(`Error in ${context}`, {
    error: error.message,
    stack: error.stack,
    context,
    ...details
  });
}

/**
 * Log security events
 */
export function logSecurityEvent(type, details = {}) {
  logger.warn('Security event', {
    type,
    ...details
  });
}

/**
 * Log database operations
 */
export function logDatabaseOperation(operation, table, details = {}) {
  logger.debug('Database operation', {
    operation,
    table,
    ...details
  });
}

/**
 * Middleware logger for Telegraf
 */
export function createLoggerMiddleware() {
  const middlewareLogger = createLogger('Middleware');
  
  return async (ctx, next) => {
    const start = Date.now();
    const userId = ctx.from?.id;
    const username = ctx.from?.username;
    const messageType = ctx.updateType;
    const command = ctx.message?.text?.split(' ')[0];
    
    try {
      middlewareLogger.info('Request received', {
        userId,
        username,
        messageType,
        command
      });
      
      await next();
      
      const duration = Date.now() - start;
      middlewareLogger.info('Request completed', {
        userId,
        command,
        duration: `${duration}ms`
      });
      
    } catch (error) {
      const duration = Date.now() - start;
      middlewareLogger.error('Request failed', {
        userId,
        command,
        duration: `${duration}ms`,
        error: error.message
      });
      throw error;
    }
  };
}

/**
 * Health check for logging system
 */
export async function logHealthCheck() {
  try {
    logger.info('Health check - logging system operational');
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error.message, 
      timestamp: new Date().toISOString() 
    };
  }
}

// Export the main logger instance
export default logger;