import { logger } from './logger';

/**
 * Type guard to check if error is an Axios error with response
 */
function isAxiosErrorWithResponse(error: unknown): error is {
  response: { data?: { message?: string } };
} {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return false;
  }

  const response = (error as { response?: unknown }).response;
  if (typeof response !== 'object' || response === null) {
    return false;
  }

  // Check if data exists and is an object (if it exists)
  if ('data' in response) {
    const data = (response as { data?: unknown }).data;
    if (data !== undefined && (typeof data !== 'object' || data === null)) {
      return false;
    }
  }

  return true;
}

/**
 * Type guard to check if error has a message property
 */
function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  );
}

/**
 * Safely extracts error message from various error shapes
 */
export function extractErrorMessage(error: unknown): string {
  // Handle Axios errors with response data
  if (isAxiosErrorWithResponse(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') {
      return message;
    }
  }

  // Handle standard Error objects
  if (isErrorWithMessage(error)) {
    return error.message;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Fallback for unknown error shapes
  return 'An unexpected error occurred';
}

/**
 * Centralized error handler for API operations
 */
export function handleApiError(
  error: unknown,
  operation: string,
  context?: Record<string, unknown>
): string {
  const errorMessage = extractErrorMessage(error);

  // Log the error with context
  logger.error(`API Error during ${operation}`, error, {
    operation,
    extractedMessage: errorMessage,
    ...context,
  });

  return errorMessage;
}

/**
 * Error handler specifically for form operations
 */
export function handleFormError(
  error: unknown,
  formType: string,
  fallbackMessage: string
): string {
  const errorMessage = extractErrorMessage(error);

  logger.error(`Form Error in ${formType}`, error, {
    formType,
    extractedMessage: errorMessage,
  });

  // Use fallbackMessage if we got the generic default message
  return errorMessage === 'An unexpected error occurred'
    ? fallbackMessage
    : errorMessage;
}
