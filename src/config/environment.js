/**
 * Environment Configuration Manager
 * 
 * Handles environment-specific configuration with validation and type safety.
 * Supports development, production, and test environments.
 */

import dotenv from 'dotenv';
import Joi from 'joi';

// Load environment variables based on NODE_ENV
const NODE_ENV = process.env.NODE_ENV || 'development';

// Load appropriate .env file
if (NODE_ENV === 'development') {
  dotenv.config({ path: '.env.local' });
} else if (NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' });
} else {
  dotenv.config(); // Production uses .env or environment variables
}

/**
 * Environment validation schema using Joi
 */
const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  
  PORT: Joi.number()
    .default(3000),
  
  // Telegram Bot Configuration
  BOT_TOKEN: Joi.string()
    .required()
    .description('Telegram Bot Token'),
  
  WEBHOOK_URL: Joi.string()
    .uri()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
  
  WEBHOOK_SECRET: Joi.string()
    .min(8)
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
  
  // Database Configuration
  DATABASE_URL: Joi.string()
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
  
  DB_TYPE: Joi.string()
    .valid('postgresql', 'sqlite')
    .default('sqlite'),
  
  // App Configuration
  ACTIVATION_CODE: Joi.string()
    .required()
    .description('User activation code'),
  
  ADMIN_USER_IDS: Joi.string()
    .required()
    .description('Comma-separated admin user IDs'),
  
  SUPPORT_CHANNEL: Joi.string()
    .default('@SupportChannel'),
  
  ADMIN_CHAT_ID: Joi.string()
    .optional(),
  
  GROUP_ID: Joi.string()
    .optional(),
  
  ZOOM_LINK: Joi.string()
    .uri()
    .default('https://zoom.us/j/example'),
  
  // Rate Limiting
  RATE_LIMITING_ENABLED: Joi.boolean()
    .default(true),
  
  MAX_REQUESTS_PER_MINUTE: Joi.number()
    .min(1)
    .default(30),
  
  MAX_REQUESTS_PER_HOUR: Joi.number()
    .min(1)
    .default(100),
  
  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),
  
  LOG_FILE: Joi.string()
    .default('logs/app.log')
}).unknown();

/**
 * Validate and extract environment variables
 */
const { error, value: env } = envSchema.validate(process.env);

if (error) {
  console.error('❌ Environment validation failed:', error.details[0].message);
  process.exit(1);
}

/**
 * Parse admin user IDs from string to array
 */
function parseAdminUserIds(userIdsStr) {
  if (!userIdsStr) return [];
  
  try {
    return userIdsStr.split(',')
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id) && id > 0);
  } catch (error) {
    console.error('❌ Error parsing admin user IDs:', error);
    return [];
  }
}

/**
 * Application Configuration Object
 */
export const config = {
  // Environment
  env: env.NODE_ENV,
  port: env.PORT,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  
  // Telegram Bot
  bot: {
    token: env.BOT_TOKEN,
    webhook: {
      url: env.WEBHOOK_URL,
      secret: env.WEBHOOK_SECRET,
      path: '/webhook'
    },
    usePolling: env.NODE_ENV === 'development'
  },
  
  // Database
  database: {
    type: env.DB_TYPE,
    url: env.DATABASE_URL,
    sqlite: {
      filename: env.NODE_ENV === 'test' ? ':memory:' : './data/bot.db'
    },
    postgresql: {
      connectionString: env.DATABASE_URL,
      ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    }
  },
  
  // Application Settings
  app: {
    activationCode: env.ACTIVATION_CODE,
    supportChannel: env.SUPPORT_CHANNEL,
    zoomLink: env.ZOOM_LINK
  },
  
  // Admin Configuration
  admin: {
    userIds: parseAdminUserIds(env.ADMIN_USER_IDS),
    chatId: env.ADMIN_CHAT_ID,
    groupId: env.GROUP_ID
  },
  
  // Rate Limiting
  rateLimiting: {
    enabled: env.RATE_LIMITING_ENABLED,
    maxRequestsPerMinute: env.MAX_REQUESTS_PER_MINUTE,
    maxRequestsPerHour: env.MAX_REQUESTS_PER_HOUR
  },
  
  // Logging
  logging: {
    level: env.LOG_LEVEL,
    file: env.LOG_FILE,
    console: env.NODE_ENV !== 'production'
  }
};

/**
 * Validate critical configuration
 */
export function validateConfig() {
  const errors = [];
  
  if (!config.bot.token) {
    errors.push('BOT_TOKEN is required');
  }
  
  if (config.isProduction && !config.bot.webhook.url) {
    errors.push('WEBHOOK_URL is required in production');
  }
  
  if (config.admin.userIds.length === 0) {
    console.warn('⚠️ No admin users configured');
  }
  
  if (errors.length > 0) {
    console.error('❌ Configuration errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
  
  console.log('✅ Configuration validated successfully');
  console.log(`📊 Environment: ${config.env}`);
  console.log(`🗄️ Database: ${config.database.type}`);
  console.log(`🔄 Bot mode: ${config.bot.usePolling ? 'Polling' : 'Webhook'}`);
}

export default config;