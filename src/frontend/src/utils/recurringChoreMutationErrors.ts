/**
 * Utility to normalize backend/agent errors into user-facing messages and developer diagnostics
 */

interface ErrorNormalization {
  userMessage: string;
  diagnosticDetails: string;
}

/**
 * Safely stringify an error object without throwing
 */
function safeStringify(value: unknown): string {
  try {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return value;
    if (value instanceof Error) {
      return `${value.name}: ${value.message}\nStack: ${value.stack || 'N/A'}`;
    }
    return JSON.stringify(value, null, 2);
  } catch (e) {
    return `[Unstringifiable: ${typeof value}]`;
  }
}

export function normalizeRecurringChoreError(
  operation: 'create' | 'update' | 'delete' | 'pause-resume',
  error: unknown
): ErrorNormalization {
  // Handle string errors
  if (typeof error === 'string') {
    return {
      userMessage: error,
      diagnosticDetails: `[${operation}] String error: ${error}`,
    };
  }

  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message;
    
    // Check for common backend trap messages
    if (message.includes('Unauthorized')) {
      return {
        userMessage: 'You do not have permission to perform this action',
        diagnosticDetails: `[${operation}] Authorization error: ${message}\nStack: ${error.stack || 'N/A'}`,
      };
    }
    
    if (message.includes('Invalid weekday')) {
      return {
        userMessage: 'Invalid weekday selected. Please choose a day between Sunday and Saturday.',
        diagnosticDetails: `[${operation}] Validation error: ${message}\nStack: ${error.stack || 'N/A'}`,
      };
    }
    
    if (message.includes('Invalid principal') || message.includes('Person profile does not exist')) {
      return {
        userMessage: 'The assigned person does not have a profile. Please create a profile first or leave unassigned.',
        diagnosticDetails: `[${operation}] Principal validation error: ${message}\nStack: ${error.stack || 'N/A'}`,
      };
    }
    
    if (message.includes('not found')) {
      return {
        userMessage: 'Recurring chore not found. It may have been deleted.',
        diagnosticDetails: `[${operation}] Not found error: ${message}\nStack: ${error.stack || 'N/A'}`,
      };
    }
    
    if (message.includes('Cannot update') || message.includes('Cannot delete') || message.includes('Cannot pause')) {
      return {
        userMessage: 'You can only modify recurring chores you created',
        diagnosticDetails: `[${operation}] Permission error: ${message}\nStack: ${error.stack || 'N/A'}`,
      };
    }

    // Agent/Candid serialization errors
    if (message.includes('Invalid') || message.includes('serialize') || message.includes('encode') || message.includes('Candid')) {
      return {
        userMessage: 'Failed to send request. Please check your input and try again.',
        diagnosticDetails: `[${operation}] Serialization error: ${message}\nStack: ${error.stack || 'N/A'}\nRaw error: ${safeStringify(error)}`,
      };
    }
    
    // Generic error with message
    return {
      userMessage: message,
      diagnosticDetails: `[${operation}] Error: ${message}\nStack: ${error.stack || 'N/A'}\nRaw error: ${safeStringify(error)}`,
    };
  }

  // Handle objects with message property
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as any).message);
    return {
      userMessage: message,
      diagnosticDetails: `[${operation}] Object error with message: ${message}\nFull object: ${safeStringify(error)}`,
    };
  }

  // Fallback for unknown error types
  const fallbackMessages = {
    create: 'Failed to create recurring chore',
    update: 'Failed to update recurring chore',
    delete: 'Failed to delete recurring chore',
    'pause-resume': 'Failed to update recurring chore status',
  };

  return {
    userMessage: fallbackMessages[operation],
    diagnosticDetails: `[${operation}] Unknown error type (${typeof error}): ${safeStringify(error)}`,
  };
}
