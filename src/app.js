/**
 * Mouin Almojtahidin Educational Bot
 * 
 * Main application entry point with Railway deployment support
 * Handles both polling (development) and webhook (production) modes
 */

import { Telegraf } from 'telegraf';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';

import { config, validateConfig } from './config/environment.js';
import { initDatabase, closeDatabase, healthCheck as dbHealthCheck } from './database/connection.js';
import { 
  createLogger, 
  logBotStartup, 
  logBotShutdown, 
  logError,
  createLoggerMiddleware,
  logHealthCheck 
} from './utils/logger.js';
import { setupMiddlewares } from './middlewares/index.js';
import { setupCommands } from './commands/index.js';
import { initScheduler, cleanupScheduler } from './services/scheduler.js';

const logger = createLogger('App');

class BotApplication {
  constructor() {
    this.bot = null;
    this.server = null;
    this.isShuttingDown = false;
  }
  
  /**
   * Initialize the application
   */
  async initialize() {
    try {
      logger.info('🚀 Starting Mouin Almojtahidin Bot...');
      
      // Validate configuration
      validateConfig();
      
      // Initialize database
      await initDatabase();
      
      // Create Telegraf bot instance
      this.bot = new Telegraf(config.bot.token);
      
      // Setup middlewares
      setupMiddlewares(this.bot);
      
      // Setup commands
      setupCommands(this.bot);
      
      // Initialize scheduler for reminders
      await initScheduler(this.bot);
      
      // Setup graceful shutdown
      this.setupGracefulShutdown();
      
      logger.info('✅ Bot initialization completed');
      
    } catch (error) {
      logger.error('❌ Failed to initialize bot:', error);
      process.exit(1);
    }
  }
  
  /**
   * Start the bot in appropriate mode (polling/webhook)
   */
  async start() {
    try {
      if (config.bot.usePolling) {
        await this.startPolling();
      } else {
        await this.startWebhook();
      }
      
      logBotStartup();
      
    } catch (error) {
      logError(error, 'Bot startup');
      process.exit(1);
    }
  }
  
  /**
   * Start bot in polling mode (development)
   */
  async startPolling() {
    logger.info('🔄 Starting bot in polling mode...');
    
    try {
      // Clear any existing webhook
      await this.bot.telegram.deleteWebhook();
      
      // Start polling
      await this.bot.launch({
        dropPendingUpdates: true,
        allowedUpdates: ['message', 'callback_query', 'inline_query']
      });
      
      logger.info('✅ Bot started in polling mode');
      
    } catch (error) {
      logger.error('❌ Failed to start polling:', error);
      throw error;
    }
  }
  
  /**
   * Start bot in webhook mode (production)
   */
  async startWebhook() {
    logger.info('🌐 Starting bot in webhook mode...');
    
    try {
      // Create Express server
      this.server = this.createExpressServer();
      
      // Set webhook
      await this.bot.telegram.setWebhook(
        `${config.bot.webhook.url}${config.bot.webhook.path}`,
        {
          drop_pending_updates: true,
          secret_token: config.bot.webhook.secret,
          allowed_updates: ['message', 'callback_query', 'inline_query']
        }
      );
      
      // Start server
      const port = config.port;
      await new Promise((resolve, reject) => {
        this.server.listen(port, (error) => {
          if (error) {
            reject(error);
          } else {
            logger.info(`✅ Webhook server started on port ${port}`);
            resolve();
          }
        });
      });
      
    } catch (error) {
      logger.error('❌ Failed to start webhook:', error);
      throw error;
    }
  }
  
  /**
   * Create Express server for webhook mode
   */
  createExpressServer() {
    const app = express();
    
    // Security and performance middlewares
    app.use(helmet());
    app.use(compression());
    app.use(cors({
      origin: config.isProduction ? false : true,
      credentials: true
    }));
    
    // Health check endpoint
    app.get('/health', async (req, res) => {
      try {
        const dbHealth = await dbHealthCheck();
        const logHealth = await logHealthCheck();
        
        const health = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          environment: config.env,
          services: {
            database: dbHealth,
            logging: logHealth
          }
        };
        
        const isHealthy = dbHealth.status === 'healthy' && logHealth.status === 'healthy';
        res.status(isHealthy ? 200 : 503).json(health);
        
      } catch (error) {
        logger.error('Health check failed:', error);
        res.status(503).json({
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Bot webhook endpoint
    app.use(
      config.bot.webhook.path,
      this.bot.webhookCallback(config.bot.webhook.path, {
        secretToken: config.bot.webhook.secret
      })
    );
    
    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({ 
        error: 'Not Found',
        message: 'The requested endpoint does not exist' 
      });
    });
    
    // Error handler
    app.use((error, req, res, next) => {
      logger.error('Express error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: config.isDevelopment ? error.message : 'Something went wrong'
      });
    });
    
    return app;
  }
  
  /**
   * Setup graceful shutdown handlers
   */
  setupGracefulShutdown() {
    const gracefulShutdown = async (signal) => {
      if (this.isShuttingDown) {
        logger.warn(`Received ${signal} during shutdown, forcing exit...`);
        process.exit(1);
      }
      
      this.isShuttingDown = true;
      logger.info(`📴 Received ${signal}, shutting down gracefully...`);
      
      try {
        // Stop accepting new requests
        if (this.server) {
          await new Promise((resolve) => {
            this.server.close(resolve);
          });
          logger.info('✅ HTTP server closed');
        }
        
        // Stop bot
        if (this.bot) {
          this.bot.stop(signal);
          logger.info('✅ Bot stopped');
        }
        
        // Cleanup scheduler
        await cleanupScheduler();
        logger.info('✅ Scheduler cleaned up');
        
        // Close database
        await closeDatabase();
        logger.info('✅ Database connection closed');
        
        logBotShutdown();
        process.exit(0);
        
      } catch (error) {
        logger.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
      }
    };
    
    // Handle termination signals
    process.once('SIGINT', () => gracefulShutdown('SIGINT'));
    process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
    
    // Handle uncaught exceptions
    process.once('uncaughtException', (error) => {
      logger.error('💥 Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });
    
    // Handle unhandled promise rejections
    process.once('unhandledRejection', (reason, promise) => {
      logger.error('💥 Unhandled Rejection:', { reason, promise });
      gracefulShutdown('unhandledRejection');
    });
  }
}

/**
 * Main application bootstrap
 */
async function bootstrap() {
  const app = new BotApplication();
  
  try {
    await app.initialize();
    await app.start();
  } catch (error) {
    logger.error('💥 Failed to start application:', error);
    process.exit(1);
  }
}

// Start the application
bootstrap();