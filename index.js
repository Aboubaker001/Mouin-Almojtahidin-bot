import { Telegraf } from 'telegraf';
import { config } from './config.js';
import { initDatabase, closeDatabase } from './bot/utils/database.js';
import { initReminders, cleanupReminders } from './bot/utils/reminders.js';
import { loggerMiddleware, logBotStartup, logBotShutdown, logError, logActivity } from './bot/middlewares/logger.js';
import { verifyMiddleware, requireAdmin } from './bot/middlewares/verifyMiddleware.js';
import { rateLimiterMiddleware } from './bot/middlewares/rateLimiter.js';

// Import command handlers
import { handleStart } from './bot/commands/start.js';
import { handleVerify } from './bot/commands/verify.js';
import { handleFaq } from './bot/commands/faq.js';
import { handleProfile } from './bot/commands/profile.js';
import { handleAttendance } from './bot/commands/attendance.js';
import { handleStats } from './bot/commands/stats.js';
import { handlePublish } from './bot/commands/publish.js';
import { 
  handleAddAssignment, 
  handleUpdateAssignment, 
  handleDeleteAssignment, 
  handleSubmit 
} from './bot/commands/assignment.js';
import { handleCourses } from './bot/commands/courses.js';
import { handleAssignments } from './bot/commands/assignments.js';
import { handleReminders } from './bot/commands/reminders.js';
import { handleHelp } from './bot/commands/help.js';

// Validate environment variables
function validateConfig() {
  if (!config.botToken) {
    console.error('❌ BOT_TOKEN غير موجود في متغيرات البيئة');
    process.exit(1);
  }
  
  if (config.admin.userIds.length === 0) {
    console.warn('⚠️ ADMIN_USER_IDS غير محدد، لن تعمل الأوامر الإدارية');
  }
  
  logActivity('تم التحقق من متغيرات البيئة بنجاح');
}

// Clear webhook and updates with retry logic
async function clearUpdatesWithRetry(bot, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Delete webhook
      await bot.telegram.deleteWebhook();
      logActivity('تم حذف الـ webhook');
      
      // Clear pending updates
      const updates = await bot.telegram.getUpdates({ timeout: 1 });
      if (updates.length > 0) {
        logActivity(`تم العثور على ${updates.length} تحديث معلق، سيتم تنظيفها`);
        await bot.telegram.getUpdates({ 
          offset: updates[updates.length - 1].update_id + 1,
          timeout: 1 
        });
      }
      
      logActivity('تم تنظيف التحديثات بنجاح');
      return;
    } catch (error) {
      logError(error, `CLEAR_UPDATES_ATTEMPT_${attempt}`);
      if (attempt === maxRetries) {
        logError(new Error('فشل في تنظيف التحديثات بعد عدة محاولات'), 'CLEAR_UPDATES_FAILED');
      } else {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
}

// Initialize bot
async function initBot() {
  try {
    // Validate configuration
    validateConfig();
    
    // Create bot instance
    const bot = new Telegraf(config.botToken);
    
    // Clear webhooks and updates
    await clearUpdatesWithRetry(bot);
    
    // Initialize database
    await initDatabase();
    
    // Apply middlewares
    bot.use(loggerMiddleware());
    bot.use(rateLimiterMiddleware());
    bot.use(verifyMiddleware());
    
    // Register commands
    registerCommands(bot);
    
    // Initialize reminders
    initReminders(bot);
    
    // Handle shutdown gracefully
    setupShutdownHandlers(bot);
    
    // Start bot
    await bot.launch();
    
    logBotStartup();
    console.log('🚀 بوت معين المجتهدين يعمل بنجاح!');
    console.log(`📊 معرف البوت: @${bot.botInfo.username}`);
    console.log(`👥 عدد المدراء: ${config.admin.userIds.length}`);
    
    // Send startup notification to admin
    if (config.admin.chatId) {
      try {
        const escapedUsername = bot.botInfo.username.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
        const startupMessage = `🚀 *تم تشغيل البوت بنجاح*\\n\\n` +
          `🤖 البوت: @${escapedUsername}\\n` +
          `⏰ الوقت: ${new Date().toLocaleString('ar-SA')}\\n` +
          `📊 حالة قاعدة البيانات: ✅ متصلة\\n` +
          `🔔 نظام التذكيرات: ✅ مفعل`;
        
        await bot.telegram.sendMessage(config.admin.chatId, startupMessage, { parse_mode: 'MarkdownV2' });
      } catch (notifyError) {
        logError(notifyError, 'STARTUP_NOTIFICATION');
      }
    }
    
    return bot;
  } catch (error) {
    logError(error, 'BOT_INIT');
    console.error('❌ فشل في تشغيل البوت:', error);
    process.exit(1);
  }
}

// Register all bot commands
function registerCommands(bot) {
  // Public commands (no verification required)
  bot.command('start', handleStart);
  bot.command('verify', handleVerify);
  bot.command('help', handleHelp);
  
  // User commands (verification required)
  bot.command('faq', handleFaq);
  bot.command('profile', handleProfile);
  bot.command('courses', handleCourses);
  bot.command('assignments', handleAssignments);
  bot.command('attendance', handleAttendance);
  bot.command('reminders', handleReminders);
  bot.command('submit', handleSubmit);
  
  // Admin commands (verification + admin privileges required)
  bot.command('stats', requireAdmin, handleStats);
  bot.command('publish', requireAdmin, handlePublish);
  bot.command('addassignment', requireAdmin, handleAddAssignment);
  bot.command('updateassignment', requireAdmin, handleUpdateAssignment);
  bot.command('deleteassignment', requireAdmin, handleDeleteAssignment);
  
  // Handle unknown commands
  bot.on('text', async (ctx) => {
    const messageText = ctx.message.text;
    
    // Skip if it's not a command
    if (!messageText.startsWith('/')) {
      return;
    }
    
    const command = messageText.split(' ')[0].toLowerCase();
    
    // List of known commands
    const knownCommands = [
      '/start', '/verify', '/help', '/faq', '/profile', '/courses', 
      '/assignments', '/attendance', '/reminders', '/submit',
      '/stats', '/publish', '/addassignment', '/updateassignment', '/deleteassignment'
    ];
    
    if (!knownCommands.includes(command)) {
      await ctx.reply(
        `❓ *أمر غير معروف*\\n\\n` +
        `الأوامر المتاحة:\\n\\n` +
        `🌐 *الأوامر العامة:*\\n` +
        `• \`/start\` \\- بدء استخدام البوت\\n` +
        `• \`/verify\` \\- تفعيل الحساب\\n` +
        `• \`/help\` \\- دليل المساعدة الشامل\\n\\n` +
        `👤 *أوامر المستخدم:*\\n` +
        `• \`/profile\` \\- عرض الملف الشخصي\\n` +
        `• \`/courses\` \\- قائمة الدروس\\n` +
        `• \`/assignments\` \\- قائمة الواجبات\\n` +
        `• \`/attendance\` \\- تسجيل الحضور\\n` +
        `• \`/reminders\` \\- تبديل التذكيرات\\n` +
        `• \`/submit\` \\- إرسال إجابة واجب\\n` +
        `• \`/faq\` \\- الأسئلة الشائعة\\n\\n` +
        `⚙️ *أوامر المدير:*\\n` +
        `• \`/stats\` \\- عرض الإحصائيات\\n` +
        `• \`/publish\` \\- نشر إعلان\\n` +
        `• إدارة الواجبات \\(add/update/delete\\)\\n\\n` +
        `💡 استخدم \`/help\` للحصول على دليل مفصل\\n\\n` +
        `للمساعدة: ${config.admin.supportChannel.replace(/@/g, '\\@')}`,
        { parse_mode: 'MarkdownV2' }
      );
    }
  });
  
  logActivity('تم تسجيل جميع أوامر البوت');
}

// Setup graceful shutdown handlers
function setupShutdownHandlers(bot) {
  const gracefulShutdown = async (signal) => {
    console.log(`\n📴 تم استقبال إشارة ${signal}، جاري إيقاف البوت...`);
    
    try {
      // Stop bot
      await bot.stop(signal);
      logActivity(`تم إيقاف البوت بسبب ${signal}`);
      
      // Cleanup reminders
      cleanupReminders();
      
      // Close database
      await closeDatabase();
      
      // Send shutdown notification to admin
      if (config.admin.chatId) {
        try {
          const shutdownMessage = `🛑 *تم إيقاف البوت*\\n\\n` +
            `⏰ الوقت: ${new Date().toLocaleString('ar-SA')}\\n` +
            `📊 السبب: ${signal}`;
          
          await bot.telegram.sendMessage(config.admin.chatId, shutdownMessage, { parse_mode: 'MarkdownV2' });
        } catch (notifyError) {
          logError(notifyError, 'SHUTDOWN_NOTIFICATION');
        }
      }
      
      logBotShutdown();
      console.log('✅ تم إيقاف البوت بنجاح');
      process.exit(0);
    } catch (error) {
      logError(error, 'GRACEFUL_SHUTDOWN');
      console.error('❌ خطأ أثناء إيقاف البوت:', error);
      process.exit(1);
    }
  };
  
  // Handle different shutdown signals
  process.once('SIGINT', () => gracefulShutdown('SIGINT'));
  process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logError(error, 'UNCAUGHT_EXCEPTION');
    console.error('❌ خطأ غير معالج:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logError(new Error(`Unhandled Rejection: ${reason}`), 'UNHANDLED_REJECTION');
    console.error('❌ رفض غير معالج في:', promise, 'السبب:', reason);
    gracefulShutdown('UNHANDLED_REJECTION');
  });
}

// Start the bot
initBot().catch((error) => {
  logError(error, 'MAIN');
  console.error('❌ فشل في بدء تشغيل البوت:', error);
  process.exit(1);
});