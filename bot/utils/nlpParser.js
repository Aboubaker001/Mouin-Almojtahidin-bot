import { escapeMarkdownV2 } from './escapeMarkdownV2.js';

// Natural language date/time parsing
const timePatterns = {
  // Relative times
  'in 5 minutes': () => new Date(Date.now() + 5 * 60 * 1000),
  'in 10 minutes': () => new Date(Date.now() + 10 * 60 * 1000),
  'in 30 minutes': () => new Date(Date.now() + 30 * 60 * 1000),
  'in 1 hour': () => new Date(Date.now() + 60 * 60 * 1000),
  'in 2 hours': () => new Date(Date.now() + 2 * 60 * 60 * 1000),
  'tomorrow': () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // Default to 9 AM
    return tomorrow;
  },
  'next week': () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(9, 0, 0, 0);
    return nextWeek;
  },
  
  // Specific times
  'today at 3pm': () => {
    const today = new Date();
    today.setHours(15, 0, 0, 0);
    return today;
  },
  'tomorrow at 10am': () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow;
  },
  
  // Arabic patterns
  'بعد 5 دقائق': () => new Date(Date.now() + 5 * 60 * 1000),
  'بعد ساعة': () => new Date(Date.now() + 60 * 60 * 1000),
  'غداً': () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow;
  },
  'الأسبوع القادم': () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(9, 0, 0, 0);
    return nextWeek;
  }
};

// Task priority detection
const priorityKeywords = {
  high: ['urgent', 'important', 'critical', 'asap', 'مهم', 'عاجل', 'ضروري'],
  medium: ['normal', 'regular', 'عادي'],
  low: ['low', 'when possible', 'متاح']
};

// Task category detection
const categoryKeywords = {
  work: ['work', 'job', 'office', 'meeting', 'project', 'عمل', 'وظيفة', 'مشروع'],
  study: ['study', 'homework', 'assignment', 'exam', 'test', 'دراسة', 'واجب', 'امتحان'],
  personal: ['personal', 'family', 'health', 'exercise', 'شخصي', 'عائلة', 'صحة'],
  shopping: ['buy', 'purchase', 'shopping', 'store', 'شراء', 'تسوق'],
  reminder: ['remind', 'remember', 'تذكير', 'تذكر']
};

export class NLPParser {
  static parseTaskInput(input) {
    const result = {
      title: '',
      description: '',
      priority: 'medium',
      category: 'general',
      dueDate: null,
      tags: [],
      isValid: false,
      error: null
    };

    try {
      // Extract time/date information
      const timeMatch = this.extractTime(input);
      if (timeMatch) {
        result.dueDate = timeMatch.date;
        input = input.replace(timeMatch.text, '').trim();
      }

      // Extract priority
      result.priority = this.extractPriority(input);
      
      // Extract category
      result.category = this.extractCategory(input);
      
      // Extract tags (words starting with #)
      const tagMatches = input.match(/#\w+/g);
      if (tagMatches) {
        result.tags = tagMatches.map(tag => tag.substring(1));
        input = input.replace(/#\w+/g, '').trim();
      }

      // Split into title and description
      const parts = input.split(/\s+by\s+|\s+في\s+/);
      if (parts.length >= 2) {
        result.title = parts[0].trim();
        result.description = parts.slice(1).join(' ').trim();
      } else {
        result.title = input.trim();
      }

      result.isValid = result.title.length > 0;
      
      if (!result.isValid) {
        result.error = 'Task title is required';
      }

    } catch (error) {
      result.error = 'Failed to parse input';
    }

    return result;
  }

  static extractTime(input) {
    const lowerInput = input.toLowerCase();
    
    // Check for exact matches
    for (const [pattern, dateFn] of Object.entries(timePatterns)) {
      if (lowerInput.includes(pattern.toLowerCase())) {
        return {
          text: pattern,
          date: dateFn()
        };
      }
    }

    // Check for specific time patterns
    const timeRegex = /(\d{1,2}):(\d{2})\s*(am|pm)?/i;
    const timeMatch = input.match(timeRegex);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const ampm = timeMatch[3]?.toLowerCase();
      
      if (ampm === 'pm' && hours !== 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;
      
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      
      // If time has passed today, set to tomorrow
      if (date <= new Date()) {
        date.setDate(date.getDate() + 1);
      }
      
      return {
        text: timeMatch[0],
        date: date
      };
    }

    // Check for date patterns (YYYY-MM-DD)
    const dateRegex = /(\d{4})-(\d{1,2})-(\d{1,2})/;
    const dateMatch = input.match(dateRegex);
    if (dateMatch) {
      const date = new Date(dateMatch[1], dateMatch[2] - 1, dateMatch[3]);
      return {
        text: dateMatch[0],
        date: date
      };
    }

    return null;
  }

  static extractPriority(input) {
    const lowerInput = input.toLowerCase();
    
    for (const [priority, keywords] of Object.entries(priorityKeywords)) {
      if (keywords.some(keyword => lowerInput.includes(keyword))) {
        return priority;
      }
    }
    
    return 'medium';
  }

  static extractCategory(input) {
    const lowerInput = input.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerInput.includes(keyword))) {
        return category;
      }
    }
    
    return 'general';
  }

  static formatTaskResponse(task) {
    const priorityEmojis = {
      high: '🔴',
      medium: '🟡', 
      low: '🟢'
    };

    const categoryEmojis = {
      work: '💼',
      study: '📚',
      personal: '👤',
      shopping: '🛒',
      reminder: '🔔',
      general: '📝'
    };

    let response = `✅ *تم إنشاء المهمة بنجاح*\\n\\n`;
    response += `📝 *العنوان:* ${escapeMarkdownV2(task.title)}\\n`;
    
    if (task.description) {
      response += `📄 *الوصف:* ${escapeMarkdownV2(task.description)}\\n`;
    }
    
    response += `🎯 *الأولوية:* ${priorityEmojis[task.priority]} ${escapeMarkdownV2(task.priority)}\\n`;
    response += `📂 *الفئة:* ${categoryEmojis[task.category]} ${escapeMarkdownV2(task.category)}\\n`;
    
    if (task.dueDate) {
      const formattedDate = task.dueDate.toLocaleDateString('ar-SA');
      const formattedTime = task.dueDate.toLocaleTimeString('ar-SA', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      response += `⏰ *الموعد:* ${escapeMarkdownV2(formattedDate)} ${escapeMarkdownV2(formattedTime)}\\n`;
    }
    
    if (task.tags.length > 0) {
      response += `🏷️ *العلامات:* ${task.tags.map(tag => escapeMarkdownV2('#' + tag)).join(' ')}\\n`;
    }
    
    return response;
  }

  static getUsageExamples() {
    return [
      '📝 *أمثلة على الأوامر الذكية:*\\n\\n',
      '🔹 *مهام بسيطة:*\\n',
      '• `addtask مراجعة الدرس`\\n',
      '• `addtask شراء الخبز`\\n\\n',
      '🔹 *مهام مع وقت:*\\n',
      '• `addtask اجتماع العمل في 2 hours`\\n',
      '• `addtask تسليم الواجب tomorrow at 3pm`\\n',
      '• `addtask مراجعة الامتحان غداً`\\n\\n',
      '🔹 *مهام مع أولوية:*\\n',
      '• `addtask urgent call client`\\n',
      '• `addtask مهم meeting with manager`\\n\\n',
      '🔹 *مهام مع وصف:*\\n',
      '• `addtask study math by review chapter 5`\\n',
      '• `addtask buy groceries by milk, bread, eggs`\\n\\n',
      '🔹 *مهام مع علامات:*\\n',
      '• `addtask #work #meeting team sync`\\n',
      '• `addtask #personal #health gym workout`\\n'
    ].join('');
  }
}