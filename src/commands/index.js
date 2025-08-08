/**
 * Commands Setup
 * 
 * Centralizes all bot command registrations for better organization and maintainability
 */

import { requireAdmin } from '../middlewares/index.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('Commands');

/**
 * Basic command handlers (simplified for the restructured project)
 * In a full implementation, these would be imported from separate files
 */

// Public commands
async function handleStart(ctx) {
  await ctx.reply(`🤝 مرحباً بك في بوت معين المجتهدين!

هذا البوت يساعدك في:
📚 متابعة الدروس والكورسات
📝 إدارة الواجبات والمهام
📊 تتبع الحضور
🔔 التذكيرات التلقائية

استخدم /help لعرض جميع الأوامر المتاحة.`);
}

async function handleHelp(ctx) {
  await ctx.reply(`📋 قائمة الأوامر المتاحة:

🔸 الأوامر العامة:
/start - بدء استخدام البوت
/help - عرض هذه المساعدة
/verify <كود> - تفعيل الحساب

🔸 أوامر المستخدمين:
/profile - عرض الملف الشخصي
/courses - عرض الكورسات
/assignments - عرض الواجبات
/attendance - تسجيل الحضور
/reminders - إدارة التذكيرات

🔸 أوامر المدراء:
/stats - إحصائيات البوت
/broadcast - إرسال رسالة جماعية
/addcourse - إضافة كورس جديد

💡 للدعم الفني، تواصل مع @SupportChannel`);
}

async function handleVerify(ctx) {
  const args = ctx.message.text.split(' ').slice(1);
  
  if (args.length === 0) {
    await ctx.reply('❌ يرجى إدخال كود التفعيل.\nالصيغة: /verify <كود_التفعيل>');
    return;
  }
  
  // In a full implementation, this would verify against the database
  await ctx.reply('✅ تم تفعيل حسابك بنجاح! يمكنك الآن استخدام جميع ميزات البوت.');
}

// User commands
async function handleProfile(ctx) {
  await ctx.reply(`👤 ملفك الشخصي:

🆔 معرف المستخدم: ${ctx.from.id}
📛 الاسم: ${ctx.from.first_name || 'غير متوفر'}
📧 اسم المستخدم: ${ctx.from.username ? '@' + ctx.from.username : 'غير متوفر'}
✅ الحالة: مفعل
🔔 التذكيرات: مفعلة`);
}

async function handleCourses(ctx) {
  await ctx.reply(`📚 الكورسات المتاحة:

1️⃣ رياضيات 101
   📖 مقدمة في الرياضيات الأساسية
   📅 3 دروس قادمة

2️⃣ فيزياء 101
   📖 مبادئ الفيزياء العامة
   📅 2 دروس قادمة

استخدم /assignments لعرض الواجبات المتاحة.`);
}

async function handleAssignments(ctx) {
  await ctx.reply(`📝 الواجبات المتاحة:

🔸 واجب رياضيات #1
   ❓ حل المعادلات الخطية
   ⏰ ينتهي في: 3 أيام
   
🔸 واجب فيزياء #1
   ❓ قوانين نيوتن
   ⏰ ينتهي في: 5 أيام

استخدم /submit <رقم_الواجب> <الإجابة> لإرسال الحل.`);
}

// Admin commands
async function handleStats(ctx) {
  await ctx.reply(`📊 إحصائيات البوت:

👥 إجمالي المستخدمين: 150
✅ المستخدمون المفعلون: 120
📚 عدد الكورسات: 5
📝 عدد الواجبات: 15
📈 معدل النشاط: 85%

📅 آخر تحديث: ${new Date().toLocaleString('ar-SA')}`);
}

async function handleBroadcast(ctx) {
  const message = ctx.message.text.split(' ').slice(1).join(' ');
  
  if (!message) {
    await ctx.reply('❌ يرجى إدخال الرسالة التي تريد إرسالها.\nالصيغة: /broadcast <الرسالة>');
    return;
  }
  
  await ctx.reply(`📢 تم إرسال الرسالة لجميع المستخدمين:
"${message}"`);
}

/**
 * Setup all bot commands
 */
export function setupCommands(bot) {
  logger.info('Setting up bot commands...');
  
  // Public commands (no authentication required)
  bot.command('start', handleStart);
  bot.command('help', handleHelp);
  bot.command('verify', handleVerify);
  
  // User commands (require verification - simplified for demo)
  bot.command('profile', handleProfile);
  bot.command('courses', handleCourses);
  bot.command('assignments', handleAssignments);
  
  // Admin commands (require admin privileges)
  bot.command('stats', requireAdmin(), handleStats);
  bot.command('broadcast', requireAdmin(), handleBroadcast);
  
  // Unknown command handler
  bot.on('text', async (ctx) => {
    const text = ctx.message.text;
    
    if (text.startsWith('/')) {
      await ctx.reply(`❓ أمر غير معروف: ${text.split(' ')[0]}
      
استخدم /help لعرض جميع الأوامر المتاحة.`);
    }
  });
  
  logger.info('✅ All commands registered successfully');
}

export default { setupCommands };