import { db } from './database.js';
import { NLPParser } from './nlpParser.js';
import { escapeMarkdownV2 } from './escapeMarkdownV2.js';

export class TaskManager {
  static async createTask(userId, taskData) {
    try {
      const {
        title,
        description = '',
        priority = 'medium',
        category = 'general',
        dueDate = null,
        tags = [],
        recurring = null,
        estimatedTime = null
      } = taskData;

      const result = await db.run(`
        INSERT INTO tasks (
          user_id, title, description, priority, category, 
          due_date, tags, recurring, estimated_time, 
          created_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 'pending')
      `, [
        userId, title, description, priority, category,
        dueDate ? dueDate.toISOString() : null,
        JSON.stringify(tags),
        recurring,
        estimatedTime,
      ]);

      return result.lastID;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  static async getUserTasks(userId, filters = {}) {
    try {
      let query = `
        SELECT * FROM tasks 
        WHERE user_id = ? 
      `;
      const params = [userId];

      // Apply filters
      if (filters.status) {
        query += ` AND status = ?`;
        params.push(filters.status);
      }

      if (filters.category) {
        query += ` AND category = ?`;
        params.push(filters.category);
      }

      if (filters.priority) {
        query += ` AND priority = ?`;
        params.push(filters.priority);
      }

      if (filters.dueDate) {
        query += ` AND date(due_date) = date(?)`;
        params.push(filters.dueDate.toISOString());
      }

      query += ` ORDER BY 
        CASE priority 
          WHEN 'high' THEN 1 
          WHEN 'medium' THEN 2 
          WHEN 'low' THEN 3 
        END,
        due_date ASC,
        created_at DESC
      `;

      const tasks = await db.all(query, params);
      return tasks.map(task => ({
        ...task,
        tags: JSON.parse(task.tags || '[]'),
        dueDate: task.due_date ? new Date(task.due_date) : null,
        createdAt: new Date(task.created_at)
      }));
    } catch (error) {
      console.error('Error getting user tasks:', error);
      throw error;
    }
  }

  static async updateTaskStatus(taskId, userId, status) {
    try {
      const result = await db.run(`
        UPDATE tasks 
        SET status = ?, completed_at = ?
        WHERE task_id = ? AND user_id = ?
      `, [
        status,
        status === 'completed' ? new Date().toISOString() : null,
        taskId,
        userId
      ]);

      return result.changes > 0;
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }

  static async getTaskStats(userId) {
    try {
      const stats = await db.get(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue,
          SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_priority,
          SUM(CASE WHEN priority = 'medium' THEN 1 ELSE 0 END) as medium_priority,
          SUM(CASE WHEN priority = 'low' THEN 1 ELSE 0 END) as low_priority
        FROM tasks 
        WHERE user_id = ?
      `, [userId]);

      // Get category breakdown
      const categories = await db.all(`
        SELECT category, COUNT(*) as count
        FROM tasks 
        WHERE user_id = ?
        GROUP BY category
        ORDER BY count DESC
      `, [userId]);

      // Get completion rate by day (last 7 days)
      const dailyStats = await db.all(`
        SELECT 
          date(completed_at) as date,
          COUNT(*) as completed_count
        FROM tasks 
        WHERE user_id = ? 
          AND status = 'completed' 
          AND completed_at >= date('now', '-7 days')
        GROUP BY date(completed_at)
        ORDER BY date
      `, [userId]);

      return {
        ...stats,
        categories,
        dailyStats,
        completionRate: stats.total > 0 ? (stats.completed / stats.total * 100).toFixed(1) : 0
      };
    } catch (error) {
      console.error('Error getting task stats:', error);
      throw error;
    }
  }

  static async getSmartSuggestions(userId) {
    try {
      // Get user's most common task patterns
      const commonPatterns = await db.all(`
        SELECT 
          title,
          category,
          priority,
          COUNT(*) as frequency
        FROM tasks 
        WHERE user_id = ? 
          AND status = 'completed'
          AND completed_at >= date('now', '-30 days')
        GROUP BY LOWER(title), category, priority
        HAVING frequency >= 2
        ORDER BY frequency DESC
        LIMIT 5
      `, [userId]);

      // Get overdue tasks that need attention
      const overdueTasks = await db.all(`
        SELECT * FROM tasks 
        WHERE user_id = ? 
          AND status = 'pending'
          AND due_date < datetime('now')
        ORDER BY due_date ASC
        LIMIT 3
      `, [userId]);

      // Get tasks due today
      const todayTasks = await db.all(`
        SELECT * FROM tasks 
        WHERE user_id = ? 
          AND status = 'pending'
          AND date(due_date) = date('now')
        ORDER BY priority ASC, due_date ASC
        LIMIT 5
      `, [userId]);

      return {
        commonPatterns,
        overdueTasks: overdueTasks.map(task => ({
          ...task,
          tags: JSON.parse(task.tags || '[]'),
          dueDate: new Date(task.due_date)
        })),
        todayTasks: todayTasks.map(task => ({
          ...task,
          tags: JSON.parse(task.tags || '[]'),
          dueDate: new Date(task.due_date)
        }))
      };
    } catch (error) {
      console.error('Error getting smart suggestions:', error);
      throw error;
    }
  }

  static async createRecurringTask(userId, taskData, recurrence) {
    try {
      const tasks = [];
      const { frequency, interval, endDate } = recurrence;
      
      let currentDate = new Date(taskData.dueDate);
      const end = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default

      while (currentDate <= end) {
        const taskId = await this.createTask(userId, {
          ...taskData,
          dueDate: new Date(currentDate),
          recurring: JSON.stringify(recurrence)
        });
        
        tasks.push(taskId);

        // Calculate next occurrence
        switch (frequency) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + interval);
            break;
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + (7 * interval));
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + interval);
            break;
        }
      }

      return tasks;
    } catch (error) {
      console.error('Error creating recurring tasks:', error);
      throw error;
    }
  }

  static formatTaskList(tasks, title = '📋 قائمة المهام') {
    if (tasks.length === 0) {
      return `${title}\\n\\n📭 لا توجد مهام لعرضها\\.`;
    }

    let response = `${title}\\n\\n`;
    
    const priorityEmojis = { high: '🔴', medium: '🟡', low: '🟢' };
    const statusEmojis = { 
      pending: '⏳', 
      completed: '✅', 
      overdue: '⚠️',
      cancelled: '❌'
    };

    tasks.forEach((task, index) => {
      const priorityEmoji = priorityEmojis[task.priority] || '🟡';
      const statusEmoji = statusEmojis[task.status] || '⏳';
      
      response += `${index + 1}\\. ${statusEmoji} ${priorityEmoji} *${escapeMarkdownV2(task.title)}*\\n`;
      
      if (task.description) {
        response += `   📄 ${escapeMarkdownV2(task.description.substring(0, 50))}${task.description.length > 50 ? '...' : ''}\\n`;
      }
      
      if (task.dueDate) {
        const formattedDate = task.dueDate.toLocaleDateString('ar-SA');
        const formattedTime = task.dueDate.toLocaleTimeString('ar-SA', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        response += `   ⏰ ${escapeMarkdownV2(formattedDate)} ${escapeMarkdownV2(formattedTime)}\\n`;
      }
      
      if (task.tags && task.tags.length > 0) {
        response += `   🏷️ ${task.tags.map(tag => escapeMarkdownV2('#' + tag)).join(' ')}\\n`;
      }
      
      response += `   🆔 ${escapeMarkdownV2(task.task_id.toString())}\\n\\n`;
    });

    return response;
  }

  static formatStats(stats) {
    const progressBar = this.createProgressBar(stats.completionRate);
    
    let response = `📊 *إحصائيات المهام*\\n\\n`;
    response += `📈 *معدل الإنجاز:* ${escapeMarkdownV2(stats.completionRate)}%\\n`;
    response += `${progressBar}\\n\\n`;
    
    response += `📋 *إجمالي المهام:* ${escapeMarkdownV2(stats.total.toString())}\\n`;
    response += `✅ *مكتملة:* ${escapeMarkdownV2(stats.completed.toString())}\\n`;
    response += `⏳ *قيد التنفيذ:* ${escapeMarkdownV2(stats.pending.toString())}\\n`;
    response += `⚠️ *متأخرة:* ${escapeMarkdownV2(stats.overdue.toString())}\\n\\n`;
    
    response += `🎯 *حسب الأولوية:*\\n`;
    response += `🔴 *عالية:* ${escapeMarkdownV2(stats.high_priority.toString())}\\n`;
    response += `🟡 *متوسطة:* ${escapeMarkdownV2(stats.medium_priority.toString())}\\n`;
    response += `🟢 *منخفضة:* ${escapeMarkdownV2(stats.low_priority.toString())}\\n\\n`;
    
    if (stats.categories && stats.categories.length > 0) {
      response += `📂 *حسب الفئة:*\\n`;
      stats.categories.forEach(cat => {
        response += `${escapeMarkdownV2(cat.category)}: ${escapeMarkdownV2(cat.count.toString())}\\n`;
      });
    }
    
    return response;
  }

  static createProgressBar(percentage) {
    const filled = Math.round(percentage / 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  static async cleanupOverdueTasks() {
    try {
      await db.run(`
        UPDATE tasks 
        SET status = 'overdue' 
        WHERE status = 'pending' 
          AND due_date < datetime('now')
      `);
    } catch (error) {
      console.error('Error cleaning up overdue tasks:', error);
    }
  }
}