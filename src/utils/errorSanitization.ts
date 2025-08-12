/**
 * Extracts raw error message from various error types
 * Handles strings, Error objects, Axios-like responses, fetch responses, and RFC7807 problem+json
 */
function deriveRawMessage(error: unknown): string {
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  // Handle Error objects
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle objects that might be API responses
  if (error && typeof error === 'object') {
    const errorObj = error as {
      response?: {
        data?: { message?: string };
        statusText?: string;
      };
      statusText?: string;
      title?: string;
      detail?: string;
      message?: string;
      error?: string;
    };
    
    // Check for Axios-like response structure
    if (typeof errorObj.response?.data?.message === 'string') {
      return errorObj.response.data.message;
    }
    if (typeof errorObj.response?.statusText === 'string') {
      return errorObj.response.statusText;
    }
    
    // Check for fetch-like response
    if (typeof errorObj.statusText === 'string') {
      return errorObj.statusText;
    }
    
    // Check for RFC7807 problem+json format
    if (typeof errorObj.detail === 'string') {
      return errorObj.detail;
    }
    if (typeof errorObj.title === 'string') {
      return errorObj.title;
    }
    
    // Check for common message fields
    if (typeof errorObj.message === 'string') {
      return errorObj.message;
    }
    if (typeof errorObj.error === 'string') {
      return errorObj.error;
    }
  }
  
  // Fallback for unknown error types
  return 'An unexpected error occurred';
}

/**
 * Sanitizes error messages for display to users by removing sensitive information
 * and potentially dangerous content like HTML, stack traces, and URLs.
 */
export function sanitizeErrorForUser(error: unknown): string {
  // Extract base message from error using the helper function
  let message = deriveRawMessage(error);

  // Remove HTML tags
  message = message.replace(/<[^>]*>/g, '');

  // Remove stack trace patterns (lines starting with "at " or containing file paths)
  // Anchor to line start/end and make file path capture non-greedy
  message = message.replace(/^\s*at\s+.*$/gm, '');
  message = message.replace(/^\s*\(.*?\.(js|ts|jsx|tsx):\d+:\d+\)\s*$/gm, '');

  // Remove URLs and file paths
  message = message.replace(/https?:\/\/[^\s]+/g, '[URL]');
  message = message.replace(/file:\/\/[^\s]+/g, '[PATH]');
  message = message.replace(/[a-zA-Z]:[\\/][^\s]*/g, '[PATH]');

  // Remove PII and sensitive information patterns
  // Email addresses
  message = message.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');
  
  // UUIDs (v4 style)
  message = message.replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi, '[UUID]');
  
  // IPv4 addresses
  message = message.replace(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g, '[IP]');
  
  // JWTs and three-segment base64 tokens
  message = message.replace(/\b[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[JWT]');
  
  // Bearer tokens and authorization headers
  message = message.replace(/\bAuthorization:\s*Bearer\s+[A-Za-z0-9+/=_-]+/gi, 'Authorization: Bearer [TOKEN]');
  message = message.replace(/\bBearer\s+[A-Za-z0-9+/=_-]+/gi, 'Bearer [TOKEN]');

  // Remove potential tokens (anything that looks like a long random string)
  message = message.replace(/\b[a-zA-Z0-9+/]{20,}={0,2}\b/g, '[TOKEN]');

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
