/**
 * Logger utility for application-wide logging
 * Provides consistent logging interface with different log levels
 */

const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};

class Logger {
  constructor() {
    this.level = import.meta.env.VITE_LOG_LEVEL || 'info';
    this.isDevelopment = import.meta.env.DEV;
  }

  debug(...args) {
    if (this.isDevelopment && this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.debug('[DEBUG]', ...args);
    }
  }

  info(...args) {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      console.info('[INFO]', ...args);
    }
  }

  warn(...args) {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      console.warn('[WARN]', ...args);
    }
  }

  error(...args) {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      console.error('[ERROR]', ...args);
    }
  }

  shouldLog(level) {
    const levels = Object.values(LOG_LEVELS);
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  setLevel(level) {
    if (Object.values(LOG_LEVELS).includes(level)) {
      this.level = level;
    }
  }
}

// Create singleton instance
const logger = new Logger();

// Initialize logger
export const initLogger = (level) => {
  if (level) {
    logger.setLevel(level);
  }
  logger.info('Logger initialized with level:', logger.level);
};

export default logger;
