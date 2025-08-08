/**
 * Input Validation Utilities
 * 
 * Provides secure input validation and sanitization for bot commands
 * Helps prevent injection attacks and ensures data integrity
 */

import { createLogger } from './logger.js';

const logger = createLogger('Validation');

/**
 * Validate and sanitize user ID
 */
export function validateUserId(userId) {
  const id = parseInt(userId);
  if (isNaN(id) || id <= 0 || id > Number.MAX_SAFE_INTEGER) {
    throw new Error('Invalid user ID');
  }
  return id;
}

/**
 * Validate and sanitize text input
 */
export function validateText(text, maxLength = 1000, allowEmpty = false) {
  if (typeof text !== 'string') {
    throw new Error('Text must be a string');
  }
  
  if (!allowEmpty && text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }
  
  if (text.length > maxLength) {
    throw new Error(`Text exceeds maximum length of ${maxLength} characters`);
  }
  
  // Remove potentially dangerous characters
  return text.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Validate course ID
 */
export function validateCourseId(courseId) {
  const id = parseInt(courseId);
  if (isNaN(id) || id <= 0) {
    throw new Error('Invalid course ID');
  }
  return id;
}

/**
 * Validate lesson ID
 */
export function validateLessonId(lessonId) {
  const id = parseInt(lessonId);
  if (isNaN(id) || id <= 0) {
    throw new Error('Invalid lesson ID');
  }
  return id;
}

/**
 * Validate assignment ID
 */
export function validateAssignmentId(assignmentId) {
  const id = parseInt(assignmentId);
  if (isNaN(id) || id <= 0) {
    throw new Error('Invalid assignment ID');
  }
  return id;
}

/**
 * Validate date string (YYYY-MM-DD format)
 */
export function validateDate(dateString) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  
  if (!dateRegex.test(dateString)) {
    throw new Error('Date must be in YYYY-MM-DD format');
  }
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date');
  }
  
  return dateString;
}

/**
 * Validate time string (HH:MM format)
 */
export function validateTime(timeString) {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  
  if (!timeRegex.test(timeString)) {
    throw new Error('Time must be in HH:MM format');
  }
  
  return timeString;
}

/**
 * Validate URL
 */
export function validateUrl(url) {
  try {
    new URL(url);
    return url;
  } catch {
    throw new Error('Invalid URL format');
  }
}

/**
 * Validate language code
 */
export function validateLanguage(language) {
  const validLanguages = ['ar', 'en'];
  
  if (!validLanguages.includes(language)) {
    throw new Error('Language must be either "ar" or "en"');
  }
  
  return language;
}

/**
 * Sanitize command arguments
 */
export function sanitizeArgs(args, maxArgs = 10) {
  if (!Array.isArray(args)) {
    throw new Error('Arguments must be an array');
  }
  
  if (args.length > maxArgs) {
    throw new Error(`Too many arguments (max: ${maxArgs})`);
  }
  
  return args.map(arg => validateText(arg, 500, true));
}

/**
 * Validate activation code
 */
export function validateActivationCode(code, expectedCode) {
  const sanitizedCode = validateText(code, 100);
  
  if (sanitizedCode !== expectedCode) {
    logger.warn('Invalid activation code attempt', { providedCode: sanitizedCode });
    throw new Error('Invalid activation code');
  }
  
  return sanitizedCode;
}

/**
 * Rate limiting validation
 */
export function validateRateLimit(userId, action, lastActionTime, cooldownMs = 5000) {
  const now = Date.now();
  
  if (lastActionTime && (now - lastActionTime) < cooldownMs) {
    const remainingTime = Math.ceil((cooldownMs - (now - lastActionTime)) / 1000);
    throw new Error(`Please wait ${remainingTime} seconds before trying again`);
  }
  
  return now;
}

/**
 * Escape special characters for MarkdownV2
 */
export function escapeMarkdownV2(text) {
  if (typeof text !== 'string') {
    return String(text || '');
  }
  
  // Escape MarkdownV2 special characters
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

/**
 * Validate and format assignment answer
 */
export function validateAssignmentAnswer(answer) {
  const sanitizedAnswer = validateText(answer, 2000);
  
  // Basic answer validation (no script tags, etc.)
  if (/<script|<iframe|javascript:/i.test(sanitizedAnswer)) {
    throw new Error('Answer contains potentially harmful content');
  }
  
  return sanitizedAnswer;
}

/**
 * Comprehensive input validator for bot commands
 */
export class CommandValidator {
  constructor(ctx) {
    this.ctx = ctx;
    this.userId = ctx.from?.id;
    this.messageText = ctx.message?.text || '';
    this.args = this.messageText.split(' ').slice(1);
  }
  
  /**
   * Validate minimum argument count
   */
  requireArgs(minCount, errorMessage) {
    if (this.args.length < minCount) {
      throw new Error(errorMessage || `This command requires at least ${minCount} arguments`);
    }
    return this;
  }
  
  /**
   * Get validated argument by index
   */
  getArg(index, validator = validateText) {
    if (index >= this.args.length) {
      throw new Error(`Argument ${index + 1} is missing`);
    }
    
    return validator(this.args[index]);
  }
  
  /**
   * Get all remaining arguments as text
   */
  getRemainingText(startIndex = 0) {
    const remainingArgs = this.args.slice(startIndex);
    return validateText(remainingArgs.join(' '), 2000, true);
  }
  
  /**
   * Validate user has admin privileges
   */
  requireAdmin(adminUserIds) {
    if (!adminUserIds.includes(this.userId)) {
      throw new Error('This command requires admin privileges');
    }
    return this;
  }
}

export default {
  validateUserId,
  validateText,
  validateCourseId,
  validateLessonId,
  validateAssignmentId,
  validateDate,
  validateTime,
  validateUrl,
  validateLanguage,
  sanitizeArgs,
  validateActivationCode,
  validateRateLimit,
  escapeMarkdownV2,
  validateAssignmentAnswer,
  CommandValidator
};