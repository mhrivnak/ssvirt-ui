/**
 * Sanitizes error messages for display to users by removing sensitive information
 * and potentially dangerous content like HTML, stack traces, and URLs.
 */
export function sanitizeErrorForUser(error: unknown): string {
  let message: string;

  // Extract base message from error
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else {
    message = 'An unexpected error occurred';
  }

  // Remove HTML tags
  message = message.replace(/<[^>]*>/g, '');

  // Remove stack trace patterns (lines starting with "at " or containing file paths)
  message = message.replace(/\s*at\s+.*$/gm, '');
  message = message.replace(/\s*\(.*\.(js|ts|jsx|tsx):\d+:\d+\).*$/gm, '');

  // Remove URLs and file paths
  message = message.replace(/https?:\/\/[^\s]+/g, '[URL]');
  message = message.replace(/file:\/\/[^\s]+/g, '[PATH]');
  message = message.replace(/[a-zA-Z]:[\\//][^\s]*/g, '[PATH]');

  // Remove potential tokens (anything that looks like a long random string)
  message = message.replace(/[a-zA-Z0-9+/]{20,}={0,2}/g, '[TOKEN]');

  // Remove newlines and excessive whitespace
  message = message.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();

  // Truncate to a safe length
  if (message.length > 200) {
    message = message.substring(0, 197) + '...';
  }

  // Fallback if message becomes empty or too short
  if (!message || message.length < 3) {
    message = 'An error occurred while processing your request';
  }

  return message;
}

/**
 * Alias for sanitizeErrorForUser for backward compatibility
 */
export const sanitizeErrorMessage = sanitizeErrorForUser;