/**
 * Centralized logging service for the application
 */

export interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

export const LOG_LEVEL: LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

class Logger {
  private isDevelopment = import.meta.env.DEV;

  error(
    message: string,
    error?: unknown,
    context?: Record<string, unknown>
  ): void {
    this.log(LOG_LEVEL.ERROR, message, error, context);
  }

  warn(
    message: string,
    data?: unknown,
    context?: Record<string, unknown>
  ): void {
    this.log(LOG_LEVEL.WARN, message, data, context);
  }

  info(
    message: string,
    data?: unknown,
    context?: Record<string, unknown>
  ): void {
    this.log(LOG_LEVEL.INFO, message, data, context);
  }

  debug(
    message: string,
    data?: unknown,
    context?: Record<string, unknown>
  ): void {
    if (this.isDevelopment) {
      this.log(LOG_LEVEL.DEBUG, message, data, context);
    }
  }

  private log(
    level: string,
    message: string,
    data?: unknown,
    context?: Record<string, unknown>
  ): void {
    const timestamp = new Date().toISOString();

    // In development, log to console with formatting
    if (this.isDevelopment) {
      const consoleMethod = this.getConsoleMethod(level);
      consoleMethod(`[${timestamp}] ${level.toUpperCase()}: ${message}`, {
        data,
        context,
      });
    }

    // In production, you could send to external logging service
    // Example: send to Sentry, DataDog, etc.
    if (!this.isDevelopment && level === LOG_LEVEL.ERROR) {
      const logEntry = {
        timestamp,
        level,
        message,
        data,
        context,
      };
      // TODO: Integrate with external error tracking service
      // this.sendToExternalService(logEntry);
      console.error('Production error logged:', logEntry);
    }
  }

  private getConsoleMethod(level: string): (...args: unknown[]) => void {
    switch (level) {
      case LOG_LEVEL.ERROR:
        return console.error;
      case LOG_LEVEL.WARN:
        return console.warn;
      case LOG_LEVEL.INFO:
        return console.info;
      case LOG_LEVEL.DEBUG:
      default:
        return console.log;
    }
  }
}

// Create and export singleton instance
export const logger = new Logger();
