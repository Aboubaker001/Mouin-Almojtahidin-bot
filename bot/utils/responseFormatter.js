import { escapeMarkdownV2 } from './escapeMarkdownV2.js';

export class ResponseFormatter {
  static createWelcomeMessage(userName) {
    return [
      `🎉 *مرحباً ${escapeMarkdownV2(userName)}!*\\n\\n`,
      `🤖 أنا مساعدك الشخصي للإنتاجية\\n\\n`,
      `📋 *الأوامر المتاحة:*\\n\\n`,
      `🔹 \`/addtask\` \\- إضافة مهمة جديدة\\n`,
      `🔹 \`/tasks\` \\- عرض قائمة المهام\\n`,
      `🔹 \`/complete\` \\- إكمال مهمة\\n`,
      `🔹 \`/stats\` \\- إحصائيات الإنجاز\\n`,
      `🔹 \`/suggestions\` \\- اقتراحات ذكية\\n`,
      `🔹 \`/remindme\` \\- إضافة تذكير\\n\\n`,
      `💡 *نصائح:*\\n`,
      `• يمكنك استخدام اللغة الطبيعية لإضافة المهام\\n`,
      `• مثال: \`/addtask اجتماع العمل غداً في 3pm\`\\n`,
      `• استخدم \`/help\` للمساعدة التفصيلية`
    ].join('');
  }

  static createProgressCard(stats) {
    const progressBar = this.createProgressBar(stats.completionRate);
    const streak = this.calculateStreak(stats.dailyStats);
    
    return [
      `📊 *بطاقة التقدم*\\n\\n`,
      `📈 *معدل الإنجاز:* ${escapeMarkdownV2(stats.completionRate)}%\\n`,
      `${progressBar}\\n\\n`,
      `🔥 *سلسلة الإنجاز:* ${escapeMarkdownV2(streak.toString())} أيام\\n`,
      `📋 *المهام المكتملة:* ${escapeMarkdownV2(stats.completed.toString())}/${escapeMarkdownV2(stats.total.toString())}\\n\\n`,
      `🎯 *حسب الأولوية:*\\n`,
      `🔴 عالية: ${escapeMarkdownV2(stats.high_priority.toString())} | `,
      `🟡 متوسطة: ${escapeMarkdownV2(stats.medium_priority.toString())} | `,
      `🟢 منخفضة: ${escapeMarkdownV2(stats.low_priority.toString())}\\n\\n`,
      `⏰ *المهام المتأخرة:* ${escapeMarkdownV2(stats.overdue.toString())}`
    ].join('');
  }

  static createTaskCard(task) {
    const priorityEmojis = { high: '🔴', medium: '🟡', low: '🟢' };
    const statusEmojis = { 
      pending: '⏳', 
      completed: '✅', 
      overdue: '⚠️',
      cancelled: '❌'
    };

    const priorityEmoji = priorityEmojis[task.priority] || '🟡';
    const statusEmoji = statusEmojis[task.status] || '⏳';
    
    let card = [
      `${statusEmoji} *${escapeMarkdownV2(task.title)}*\\n\\n`
    ];

    if (task.description) {
      card.push(`📄 ${escapeMarkdownV2(task.description)}\\n\\n`);
    }

    card.push(`🎯 *الأولوية:* ${priorityEmoji} ${escapeMarkdownV2(task.priority)}\\n`);
    card.push(`📂 *الفئة:* ${escapeMarkdownV2(task.category)}\\n`);

    if (task.dueDate) {
      const formattedDate = task.dueDate.toLocaleDateString('ar-SA');
      const formattedTime = task.dueDate.toLocaleTimeString('ar-SA', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      card.push(`⏰ *الموعد:* ${escapeMarkdownV2(formattedDate)} ${escapeMarkdownV2(formattedTime)}\\n`);
    }

    if (task.tags && task.tags.length > 0) {
      card.push(`🏷️ *العلامات:* ${task.tags.map(tag => escapeMarkdownV2('#' + tag)).join(' ')}\\n`);
    }

    card.push(`🆔 *رقم المهمة:* ${escapeMarkdownV2(task.task_id.toString())}`);

    return card.join('');
  }

  static createMotivationalMessage(completionRate) {
    const messages = [
      "🎉 رائع! أنت على الطريق الصحيح!",
      "💪 استمر في العمل الجيد!",
      "🌟 إنجاز ممتاز!",
      "🚀 أنت تتقدم بشكل رائع!",
      "⭐ أداء مذهل!",
      "🏆 أنت بطل الإنتاجية!",
      "💎 عمل استثنائي!",
      "🔥 أنت تحترق بالإنجاز!"
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    if (completionRate >= 80) {
      return `🏆 *${escapeMarkdownV2(randomMessage)}*\\n\\nمعدل إنجازك ${escapeMarkdownV2(completionRate)}% مذهل!`;
    } else if (completionRate >= 60) {
      return `💪 *${escapeMarkdownV2(randomMessage)}*\\n\\nمعدل إنجازك ${escapeMarkdownV2(completionRate)}% جيد جداً!`;
    } else if (completionRate >= 40) {
      return `🌟 *${escapeMarkdownV2(randomMessage)}*\\n\\nمعدل إنجازك ${escapeMarkdownV2(completionRate)}% جيد!`;
    } else {
      return `💡 *لا تستسلم!*\\n\\nمعدل إنجازك ${escapeMarkdownV2(completionRate)}%، يمكنك تحسينه!`;
    }
  }

  static createQuickActions() {
    return [
      `⚡ *إجراءات سريعة:*\\n\\n`,
      `🔹 \`/addtask\` \\- مهمة جديدة\\n`,
      `🔹 \`/tasks today\` \\- مهام اليوم\\n`,
      `🔹 \`/tasks high\` \\- مهام عالية الأولوية\\n`,
      `🔹 \`/suggestions\` \\- اقتراحات ذكية\\n`,
      `🔹 \`/stats\` \\- إحصائياتك\\n\\n`,
      `💡 *نصائح سريعة:*\\n`,
      `• استخدم \`/addtask urgent\` للمهام العاجلة\\n`,
      `• استخدم \`/addtask #work\` لتصنيف المهام\\n`,
      `• استخدم \`/addtask غداً\` للجدولة التلقائية`
    ].join('');
  }

  static createErrorResponse(error, context = '') {
    const errorMessages = {
      'database': 'حدث خطأ في قاعدة البيانات',
      'network': 'حدث خطأ في الاتصال',
      'permission': 'ليس لديك صلاحية لهذا الإجراء',
      'validation': 'البيانات المدخلة غير صحيحة',
      'not_found': 'العنصر المطلوب غير موجود',
      'timeout': 'انتهت مهلة العملية'
    };

    const errorMessage = errorMessages[error] || 'حدث خطأ غير متوقع';
    
    return [
      `❌ *خطأ في العملية*\\n\\n`,
      `${escapeMarkdownV2(errorMessage)}\\n`,
      context ? `\\n${escapeMarkdownV2(context)}` : '',
      `\\n\\n💡 حاول مرة أخرى أو تواصل مع الدعم الفني`
    ].join('');
  }

  static createSuccessResponse(message, details = '') {
    return [
      `✅ *تم بنجاح*\\n\\n`,
      `${escapeMarkdownV2(message)}`,
      details ? `\\n\\n${escapeMarkdownV2(details)}` : ''
    ].join('');
  }

  static createProgressBar(percentage) {
    const filled = Math.round(percentage / 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  static calculateStreak(dailyStats) {
    if (!dailyStats || dailyStats.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < dailyStats.length; i++) {
      const statDate = new Date(dailyStats[i].date);
      const daysDiff = Math.floor((today - statDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  static formatTimeAgo(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) {
      return `${days} يوم`;
    } else if (hours > 0) {
      return `${hours} ساعة`;
    } else if (minutes > 0) {
      return `${minutes} دقيقة`;
    } else {
      return 'الآن';
    }
  }

  static createHelpMenu() {
    return [
      `📚 *دليل الاستخدام*\\n\\n`,
      `🔹 *إدارة المهام:*\\n`,
      `• \`/addtask\` \\- إضافة مهمة جديدة\\n`,
      `• \`/tasks\` \\- عرض جميع المهام\\n`,
      `• \`/tasks pending\` \\- المهام قيد التنفيذ\\n`,
      `• \`/tasks completed\` \\- المهام المكتملة\\n`,
      `• \`/complete رقم\` \\- إكمال مهمة\\n\\n`,
      `🔹 *التصفية والبحث:*\\n`,
      `• \`/tasks high\` \\- مهام عالية الأولوية\\n`,
      `• \`/tasks work\` \\- مهام العمل\\n`,
      `• \`/tasks today\` \\- مهام اليوم\\n\\n`,
      `🔹 *الإحصائيات والتحليل:*\\n`,
      `• \`/stats\` \\- إحصائيات الإنجاز\\n`,
      `• \`/suggestions\` \\- اقتراحات ذكية\\n\\n`,
      `🔹 *التذكيرات:*\\n`,
      `• \`/remindme\` \\- إضافة تذكير\\n`,
      `• \`/reminders\` \\- عرض التذكيرات\\n\\n`,
      `💡 *نصائح متقدمة:*\\n`,
      `• استخدم اللغة الطبيعية: \`/addtask اجتماع غداً\`\\n`,
      `• أضف علامات: \`/addtask #work #urgent\`\\n`,
      `• حدد الأولوية: \`/addtask مهم call client\`\\n`,
      `• أضف وصف: \`/addtask study math by review chapter 5\``
    ].join('');
  }
}