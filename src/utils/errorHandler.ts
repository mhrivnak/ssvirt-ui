import { logger } from './logger';

/**
 * Type guard to check if error is an Axios error with response
 */
function isAxiosErrorWithResponse(error: unknown): error is {
  response: { data?: { message?: string } };
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: unknown }).response === 'object' &&
    (error as { response?: unknown }).response !== null
  );
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

  return errorMessage || fallbackMessage;
}
