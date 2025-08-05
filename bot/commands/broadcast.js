// bot/commands/broadcast.js
import { getAllVerifiedUsers } from '../utils/database.js';
import { escapeMarkdownV2 } from '../utils/escapeMarkdownV2.js';
import { config } from '../../config.js';

export async function handleBroadcast(ctx) {
  try {
    const userId = ctx.from.id;
    const messageText = ctx.message.text;

    // Check if user is admin
    if (!config.admin.userIds.includes(userId)) {
      await ctx.reply(
        escapeMarkdownV2(
          `🚫 *غير مسموح*\n\n` +
          `هذا الأمر مخصص للمدراء فقط.\n` +
          `للمساعدة، تواصل مع ${config.admin.supportChannel}`
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Parse command arguments
    const args = messageText.split(' ');
    if (args.length < 3) {
      await ctx.reply(
        escapeMarkdownV2(
          `📢 *كيفية استخدام البث*\n\n` +
          `الصيغة الصحيحة: \`/broadcast <group|users> <message>\`\n\n` +
          `*الخيارات:*\n` +
          `• \`group\` - إرسال للمجموعة الرئيسية\n` +
          `• \`users\` - إرسال لجميع المستخدمين المفعلين\n\n` +
          `*أمثلة:*\n` +
          `\`/broadcast group الدرس غداً في الساعة 8 مساءً\`\n` +
          `\`/broadcast users تذكير: موعد التسليم غداً\``
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    const target = args[1].toLowerCase();
    const message = args.slice(2).join(' ');

    if (!['group', 'users'].includes(target)) {
      await ctx.reply(
        escapeMarkdownV2(
          `❌ *خيار غير صحيح*\n\n` +
          `الخيارات المتاحة: \`group\` أو \`users\`\n` +
          `استخدم \`/broadcast\` بدون معاملات لمعرفة التفاصيل.`
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    if (message.trim().length === 0) {
      await ctx.reply(
        escapeMarkdownV2(
          `❌ *الرسالة فارغة*\n\n` +
          `يرجى كتابة الرسالة المراد إرسالها.`
        ),
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    let successCount = 0;
    let failCount = 0;
    let totalTargets = 0;

    if (target === 'group') {
      // Send to main group
      if (config.admin.chatId) {
        try {
          await ctx.telegram.sendMessage(
            config.admin.chatId,
            `📢 *إعلان من الإدارة*\n\n${message}`,
            { parse_mode: 'Markdown' }
          );
          successCount = 1;
          totalTargets = 1;
        } catch (error) {
          console.error('خطأ في إرسال الرسالة للمجموعة:', error);
          failCount = 1;
          totalTargets = 1;
        }
      } else {
        await ctx.reply(
          escapeMarkdownV2(
            `❌ *معرف المجموعة غير محدد*\n\n` +
            `لم يتم تحديد معرف المجموعة الرئيسية في الإعدادات.`
          ),
          { parse_mode: 'MarkdownV2' }
        );
        return;
      }
    } else if (target === 'users') {
      // Send to all verified users
      const users = await getAllVerifiedUsers();
      totalTargets = users.length;

      if (users.length === 0) {
        await ctx.reply(
          escapeMarkdownV2(
            `❌ *لا يوجد مستخدمون مفعلون*\n\n` +
            `لا يوجد مستخدمون مفعلون لإرسال الرسالة إليهم.`
          ),
          { parse_mode: 'MarkdownV2' }
        );
        return;
      }

      // Send status message
      await ctx.reply(
        escapeMarkdownV2(
          `📤 *جاري الإرسال...*\n\n` +
          `عدد المستخدمين المستهدفين: ${users.length}\n` +
          `سيتم إرسال تقرير عند الانتهاء.`
        ),
        { parse_mode: 'MarkdownV2' }
      );

      // Send to each user with delay to avoid rate limiting
      for (const user of users) {
        try {
          await ctx.telegram.sendMessage(
            user.user_id,
            `📢 *رسالة من إدارة معين المجتهدين*\n\n${message}`,
            { parse_mode: 'Markdown' }
          );
          successCount++;
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`خطأ في إرسال الرسالة للمستخدم ${user.user_id}:`, error);
          failCount++;
        }
      }
    }

    // Send completion report
    await ctx.reply(
      escapeMarkdownV2(
        `✅ *تم إنجاز البث*\n\n` +
        `📊 *تقرير الإرسال:*\n` +
        `• المستهدفون: ${totalTargets}\n` +
        `• نجح الإرسال: ${successCount}\n` +
        `• فشل الإرسال: ${failCount}\n` +
        `• معدل النجاح: ${totalTargets > 0 ? Math.round((successCount / totalTargets) * 100) : 0}%\n\n` +
        `📝 *الرسالة المرسلة:*\n${message}`
      ),
      { parse_mode: 'MarkdownV2' }
    );

  } catch (error) {
    console.error('خطأ في أمر /broadcast:', error);
    await ctx.reply(
      escapeMarkdownV2(`❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel}`),
      { parse_mode: 'MarkdownV2' }
    );
  }
}