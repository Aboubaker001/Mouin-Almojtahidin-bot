import { getUserInfo, isUserAdmin } from '../utils/database.js';
import { config } from '../../config.js';

export async function handleHelp(ctx) {
  try {
    const userId = ctx.from.id;
    const userInfo = await getUserInfo(userId);
    const isAdmin = await isUserAdmin(userId);

    // Build help message
    let message = `🆘 *دليل استخدام بوت معين المجتهدين*\\n\\n`;
    
    message += `مرحباً بك في بوت إدارة الدورات التعليمية\\! 📚\\n\\n`;
    
    // Public commands (available to all users)
    message += `🌐 *الأوامر العامة:*\\n\\n`;
    
    message += `🏠 \`/start\` \\- بدء استخدام البوت\\n`;
    message += `   • تسجيل حساب جديد\\n`;
    message += `   • عرض رسالة الترحيب\\n\\n`;
    
    message += `🔐 \`/verify كود_التفعيل\` \\- تفعيل الحساب\\n`;
    message += `   • تفعيل حسابك للوصول للميزات\\n`;
    message += `   • مثال: \`/verify ${config.users.activationCode}\`\\n\\n`;
    
    message += `🆘 \`/help\` \\- عرض هذه المساعدة\\n`;
    message += `   • دليل شامل لجميع الأوامر\\n\\n`;

    // User commands (requires verification)
    if (userInfo && userInfo.is_verified) {
      message += `👤 *أوامر المستخدم المفعل:*\\n\\n`;
      
      message += `👤 \`/profile\` \\- عرض الملف الشخصي\\n`;
      message += `   • معلوماتك الأساسية\\n`;
      message += `   • إحصائيات الحضور والواجبات\\n\\n`;
      
      message += `📚 \`/courses\` \\- قائمة الدروس\\n`;
      message += `   • جميع الدروس المجدولة\\n`;
      message += `   • المواعيد والأوقات\\n\\n`;
      
      message += `📝 \`/assignments\` \\- قائمة الواجبات\\n`;
      message += `   • الواجبات النشطة والمنتهية\\n`;
      message += `   • المواعيد النهائية\\n\\n`;
      
      message += `✅ \`/attendance رقم_الدرس\` \\- تسجيل الحضور\\n`;
      message += `   • تسجيل حضورك في درس معين\\n`;
      message += `   • مثال: \`/attendance 1\`\\n\\n`;
      
      message += `📤 \`/submit رقم_الواجب الإجابة\` \\- إرسال إجابة\\n`;
      message += `   • إرسال إجابة واجب معين\\n`;
      message += `   • مثال: \`/submit 1 هذه إجابتي\`\\n\\n`;
      
      message += `🔔 \`/reminders\` \\- تبديل التذكيرات\\n`;
      message += `   • تفعيل/إيقاف تذكيرات الدروس\\n\\n`;
      
      message += `❓ \`/faq\` \\- الأسئلة الشائعة\\n`;
      message += `   • إجابات للأسئلة الشائعة\\n\\n`;
    } else if (userInfo && !userInfo.is_verified) {
      message += `⚠️ *ملاحظة:* حسابك غير مفعل\\! استخدم \`/verify\` مع كود التفعيل للوصول لجميع الميزات\\.\n\n`;
    } else {
      message += `⚠️ *ملاحظة:* لم تسجل حساباً بعد\\! استخدم \`/start\` أولاً\\.\n\n`;
    }

    // Admin commands (admin only)
    if (isAdmin) {
      message += `⚙️ *أوامر المدير:*\\n\\n`;
      
      message += `📊 \`/stats\` \\- عرض الإحصائيات\\n`;
      message += `   • إحصائيات شاملة للبوت\\n`;
      message += `   • أعداد المستخدمين والحضور\\n\\n`;
      
      message += `📢 \`/publish نص_الإعلان\` \\- نشر إعلان\\n`;
      message += `   • إرسال إعلان لجميع المستخدمين\\n\\n`;
      
      message += `➕ \`/addassignment\` \\- إضافة واجب جديد\\n`;
      message += `   • إضافة واجب بسؤال وإجابة\\n\\n`;
      
      message += `✏️ \`/updateassignment رقم_الواجب\` \\- تحديث واجب\\n`;
      message += `   • تعديل بيانات واجب موجود\\n\\n`;
      
      message += `🗑️ \`/deleteassignment رقم_الواجب\` \\- حذف واجب\\n`;
      message += `   • حذف واجب نهائياً\\n\\n`;
    }

    // Tips and notes
    message += `━━━━━━━━━━━━━━━━━━━━\\n\\n`;
    message += `💡 *نصائح مهمة:*\\n\\n`;
    message += `• تأكد من تفعيل حسابك أولاً\\n`;
    message += `• احفظ كود التفعيل في مكان آمن\\n`;
    message += `• فعّل التذكيرات لعدم تفويت الدروس\\n`;
    message += `• تابع الواجبات ومواعيدها النهائية\\n\\n`;
    
    message += `🔗 *روابط مفيدة:*\\n\\n`;
    message += `• دعم فني: ${config.admin.supportChannel.replace(/@/g, '\\@')}\\n`;
    message += `• رابط الدروس: [انقر هنا](${config.zoom.fullLink})\\n\\n`;
    
    message += `📱 *معلومات إضافية:*\\n\\n`;
    message += `• البوت متاح 24/7\\n`;
    message += `• جميع البيانات محفوظة بأمان\\n`;
    message += `• يدعم اللغة العربية والإنجليزية\\n\\n`;
    
    message += `━━━━━━━━━━━━━━━━━━━━\\n\\n`;
    message += `🤖 *بوت معين المجتهدين* \\- نسخة 1\\.0\\.0\\n`;
    message += `📅 آخر تحديث: ${new Date().toLocaleDateString('ar-SA')}`;

    await ctx.reply(message, { 
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true 
    });

  } catch (error) {
    console.error('خطأ في أمر /help:', error);
    await ctx.reply(`❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel}`);
  }
}