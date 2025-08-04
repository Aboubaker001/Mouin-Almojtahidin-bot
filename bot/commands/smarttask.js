import { NLPParser } from '../utils/nlpParser.js';
import { TaskManager } from '../utils/taskManager.js';
import { escapeMarkdownV2 } from '../utils/escapeMarkdownV2.js';
import { config } from '../../config.js';

export async function handleSmartTask(ctx) {
  try {
    const userId = ctx.from.id;
    const messageText = ctx.message.text;

    // Extract the task description from the command
    const taskInput = messageText.replace(/^\/addtask\s+/i, '').trim();

    if (!taskInput) {
      // Show usage examples
      const examples = NLPParser.getUsageExamples();
      await ctx.reply(examples, { parse_mode: 'MarkdownV2' });
      return;
    }

    // Parse the input using NLP
    const parsedTask = NLPParser.parseTaskInput(taskInput);

    if (!parsedTask.isValid) {
      await ctx.reply(
        `❌ *خطأ في المدخلات*\\n\\n` +
        `${escapeMarkdownV2(parsedTask.error || 'يرجى إدخال عنوان للمهمة')}\\n\\n` +
        `💡 استخدم \`/addtask\` لعرض أمثلة الاستخدام\\.`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Create the task
    const taskId = await TaskManager.createTask(userId, {
      title: parsedTask.title,
      description: parsedTask.description,
      priority: parsedTask.priority,
      category: parsedTask.category,
      dueDate: parsedTask.dueDate,
      tags: parsedTask.tags
    });

    if (taskId) {
      // Format the response
      const response = NLPParser.formatTaskResponse({
        task_id: taskId,
        ...parsedTask
      });

      await ctx.reply(response, { parse_mode: 'MarkdownV2' });

      // If this is a high priority task, send an additional reminder
      if (parsedTask.priority === 'high') {
        setTimeout(async () => {
          try {
            await ctx.reply(
              `🔴 *تذكير مهمة عالية الأولوية*\\n\\n` +
              `📝 ${escapeMarkdownV2(parsedTask.title)}\\n` +
              `⏰ لا تنسى إنجاز هذه المهمة المهمة\\!`,
              { parse_mode: 'MarkdownV2' }
            );
          } catch (error) {
            console.error('Error sending priority reminder:', error);
          }
        }, 30000); // 30 seconds later
      }
    } else {
      await ctx.reply(
        `❌ *فشل في إنشاء المهمة*\\n\\n` +
        `حدث خطأ تقني، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel.replace(/@/g, '\\@')}`,
        { parse_mode: 'MarkdownV2' }
      );
    }

  } catch (error) {
    console.error('Error in smart task command:', error);
    await ctx.reply(
      `❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel.replace(/@/g, '\\@')}`,
      { parse_mode: 'MarkdownV2' }
    );
  }
}

export async function handleListTasks(ctx) {
  try {
    const userId = ctx.from.id;
    const messageText = ctx.message.text;

    // Parse filters from command
    const args = messageText.split(' ');
    const filters = {};

    // Extract filter arguments
    for (let i = 1; i < args.length; i++) {
      const arg = args[i].toLowerCase();
      
      if (arg === 'completed' || arg === 'pending' || arg === 'overdue') {
        filters.status = arg;
      } else if (arg === 'high' || arg === 'medium' || arg === 'low') {
        filters.priority = arg;
      } else if (arg === 'work' || arg === 'study' || arg === 'personal' || arg === 'shopping') {
        filters.category = arg;
      } else if (arg === 'today') {
        filters.dueDate = new Date();
      }
    }

    // Get tasks
    const tasks = await TaskManager.getUserTasks(userId, filters);
    
    // Format response
    let title = '📋 قائمة المهام';
    if (filters.status) title += ` (${filters.status})`;
    if (filters.priority) title += ` (${filters.priority} priority)`;
    if (filters.category) title += ` (${filters.category})`;
    if (filters.dueDate) title += ' (اليوم)';

    const response = TaskManager.formatTaskList(tasks, title);
    
    // Split long responses
    if (response.length > 4096) {
      const chunks = response.match(/.{1,4096}/g);
      for (const chunk of chunks) {
        await ctx.reply(chunk, { parse_mode: 'MarkdownV2' });
      }
    } else {
      await ctx.reply(response, { parse_mode: 'MarkdownV2' });
    }

  } catch (error) {
    console.error('Error in list tasks command:', error);
    await ctx.reply(
      `❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel.replace(/@/g, '\\@')}`,
      { parse_mode: 'MarkdownV2' }
    );
  }
}

export async function handleCompleteTask(ctx) {
  try {
    const userId = ctx.from.id;
    const messageText = ctx.message.text;

    // Extract task ID
    const args = messageText.split(' ');
    if (args.length < 2) {
      await ctx.reply(
        `✅ *إكمال مهمة*\\n\\n` +
        `📝 *الصيغة:* \`/complete رقم_المهمة\`\\n\\n` +
        `💡 *أمثلة:*\\n` +
        `• \`/complete 123\`\\n` +
        `• \`/complete 456\`\\n\\n` +
        `📋 استخدم \`/tasks\` لعرض قائمة مهامك\\.`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    const taskId = parseInt(args[1]);
    if (isNaN(taskId)) {
      await ctx.reply(
        `❌ *رقم المهمة غير صحيح*\\n\\n` +
        `يرجى إدخال رقم صحيح للمهمة\\.`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Update task status
    const success = await TaskManager.updateTaskStatus(taskId, userId, 'completed');
    
    if (success) {
      await ctx.reply(
        `✅ *تم إكمال المهمة بنجاح*\\n\\n` +
        `🎉 تهانينا\\! لقد أنجزت مهمة أخرى\\.\\n\\n` +
        `📊 استخدم \`/stats\` لعرض إحصائياتك\\.`,
        { parse_mode: 'MarkdownV2' }
      );
    } else {
      await ctx.reply(
        `❌ *فشل في إكمال المهمة*\\n\\n` +
        `تأكد من أن رقم المهمة صحيح وأن المهمة تخصك\\.`,
        { parse_mode: 'MarkdownV2' }
      );
    }

  } catch (error) {
    console.error('Error in complete task command:', error);
    await ctx.reply(
      `❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel.replace(/@/g, '\\@')}`,
      { parse_mode: 'MarkdownV2' }
    );
  }
}

export async function handleTaskStats(ctx) {
  try {
    const userId = ctx.from.id;

    // Get user's task statistics
    const stats = await TaskManager.getTaskStats(userId);
    
    // Format the response
    const response = TaskManager.formatStats(stats);
    
    await ctx.reply(response, { parse_mode: 'MarkdownV2' });

    // Get smart suggestions
    const suggestions = await TaskManager.getSmartSuggestions(userId);
    
    if (suggestions.overdueTasks.length > 0) {
      const overdueResponse = TaskManager.formatTaskList(
        suggestions.overdueTasks, 
        '⚠️ *المهام المتأخرة التي تحتاج انتباهك*'
      );
      await ctx.reply(overdueResponse, { parse_mode: 'MarkdownV2' });
    }

  } catch (error) {
    console.error('Error in task stats command:', error);
    await ctx.reply(
      `❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel.replace(/@/g, '\\@')}`,
      { parse_mode: 'MarkdownV2' }
    );
  }
}

export async function handleSuggestions(ctx) {
  try {
    const userId = ctx.from.id;

    // Get smart suggestions
    const suggestions = await TaskManager.getSmartSuggestions(userId);
    
    let response = `💡 *اقتراحات ذكية*\\n\\n`;

    // Show common patterns
    if (suggestions.commonPatterns.length > 0) {
      response += `🔄 *المهام المتكررة:*\\n`;
      suggestions.commonPatterns.forEach((pattern, index) => {
        response += `${index + 1}\\. ${escapeMarkdownV2(pattern.title)}\\n`;
        response += `   📂 ${escapeMarkdownV2(pattern.category)} | 🎯 ${escapeMarkdownV2(pattern.priority)}\\n`;
        response += `   📊 ${escapeMarkdownV2(pattern.frequency.toString())} مرات\\n\\n`;
      });
    }

    // Show today's tasks
    if (suggestions.todayTasks.length > 0) {
      response += `📅 *مهام اليوم:*\\n`;
      suggestions.todayTasks.forEach((task, index) => {
        const priorityEmoji = { high: '🔴', medium: '🟡', low: '🟢' }[task.priority] || '🟡';
        response += `${index + 1}\\. ${priorityEmoji} ${escapeMarkdownV2(task.title)}\\n`;
      });
      response += `\\n`;
    }

    // Show quick add suggestions
    if (suggestions.commonPatterns.length > 0) {
      response += `⚡ *إضافة سريعة:*\\n`;
      response += `يمكنك إضافة مهام متكررة بسرعة:\\n`;
      suggestions.commonPatterns.slice(0, 3).forEach((pattern, index) => {
        response += `• \`/addtask ${escapeMarkdownV2(pattern.title)}\`\\n`;
      });
    }

    await ctx.reply(response, { parse_mode: 'MarkdownV2' });

  } catch (error) {
    console.error('Error in suggestions command:', error);
    await ctx.reply(
      `❌ حدث خطأ، حاول مرة أخرى أو تواصل مع ${config.admin.supportChannel.replace(/@/g, '\\@')}`,
      { parse_mode: 'MarkdownV2' }
    );
  }
}