/**
 * Middleware Setup
 * 
 * Configures all bot middlewares including logging, rate limiting, and authentication
 */

import { createLoggerMiddleware, logUserActivity, logSecurityEvent } from '../utils/logger.js';
import { config } from '../config/environment.js';

/**
 * Rate limiter middleware
 */
function createRateLimiter() {
  const userRequests = new Map();
  
  return async (ctx, next) => {
    if (!config.rateLimiting.enabled) {
      return next();
    }
    
    const userId = ctx.from?.id;
    if (!userId) {
      return next();
    }
    
    const now = Date.now();
    const userKey = userId.toString();
    
    // Get or create user request tracking
    if (!userRequests.has(userKey)) {
      userRequests.set(userKey, {
        minute: { count: 0, resetTime: now + 60000 },
        hour: { count: 0, resetTime: now + 3600000 }
      });
    }
    
    const userLimit = userRequests.get(userKey);
    
    // Reset counters if time window expired
    if (now > userLimit.minute.resetTime) {
      userLimit.minute = { count: 0, resetTime: now + 60000 };
    }
    if (now > userLimit.hour.resetTime) {
      userLimit.hour = { count: 0, resetTime: now + 3600000 };
    }
    
    // Check rate limits
    if (userLimit.minute.count >= config.rateLimiting.maxRequestsPerMinute) {
      logSecurityEvent('rate_limit_exceeded', {
        userId,
        username: ctx.from?.username,
        type: 'minute',
        count: userLimit.minute.count
      });
      
      await ctx.reply(
        '⚠️ لقد تجاوزت الحد المسموح من الطلبات في الدقيقة الواحدة. يرجى المحاولة لاحقاً.',
        { reply_to_message_id: ctx.message?.message_id }
      );
      return;
    }
    
    if (userLimit.hour.count >= config.rateLimiting.maxRequestsPerHour) {
      logSecurityEvent('rate_limit_exceeded', {
        userId,
        username: ctx.from?.username,
        type: 'hour',
        count: userLimit.hour.count
      });
      
      await ctx.reply(
        '⚠️ لقد تجاوزت الحد المسموح من الطلبات في الساعة الواحدة. يرجى المحاولة لاحقاً.',
        { reply_to_message_id: ctx.message?.message_id }
      );
      return;
    }
    
    // Increment counters
    userLimit.minute.count++;
    userLimit.hour.count++;
    
    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance
      for (const [key, limits] of userRequests.entries()) {
        if (now > limits.hour.resetTime) {
          userRequests.delete(key);
        }
      }
    }
    
    return next();
  };
}

/**
 * Error handling middleware
 */
function createErrorHandler() {
  return async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      console.error('Bot error:', error);
      
      // Log the error with context
      logUserActivity(ctx.from?.id, 'error', {
        command: ctx.message?.text?.split(' ')[0],
        error: error.message,
        username: ctx.from?.username
      });
      
      // Send user-friendly error message
      const errorMessage = config.isDevelopment 
        ? `❌ خطأ: ${error.message}`
        : '❌ حدث خطأ غير متوقع. يرجى المحاولة لاحقاً أو التواصل مع الدعم الفني.';
      
      try {
        await ctx.reply(errorMessage, {
          reply_to_message_id: ctx.message?.message_id
        });
      } catch (replyError) {
        console.error('Failed to send error message:', replyError);
      }
    }
  };
}

/**
 * User verification middleware
 */
function createVerificationMiddleware() {
  return async (ctx, next) => {
    // Skip verification for certain commands
    const command = ctx.message?.text?.split(' ')[0]?.toLowerCase();
    const publicCommands = ['/start', '/verify', '/help'];
    
    if (publicCommands.includes(command)) {
      return next();
    }
    
    // Add user verification logic here if needed
    return next();
  };
}

/**
 * Admin authorization middleware
 */
export function requireAdmin() {
  return async (ctx, next) => {
    const userId = ctx.from?.id;
    
    if (!config.admin.userIds.includes(userId)) {
      logSecurityEvent('unauthorized_admin_access', {
        userId,
        username: ctx.from?.username,
        command: ctx.message?.text?.split(' ')[0]
      });
      
      await ctx.reply(
        '🚫 هذا الأمر مخصص للمدراء فقط.',
        { reply_to_message_id: ctx.message?.message_id }
      );
      return;
    }
    
    return next();
  };
}

/**
 * Setup all middlewares
 */
export function setupMiddlewares(bot) {
  // Logger middleware (should be first)
  bot.use(createLoggerMiddleware());
  
  // Error handling middleware
  bot.use(createErrorHandler());
  
  // Rate limiting middleware
  bot.use(createRateLimiter());
  
  // Verification middleware
  bot.use(createVerificationMiddleware());
  
  console.log('✅ Middlewares configured');
}

export default { setupMiddlewares, requireAdmin };