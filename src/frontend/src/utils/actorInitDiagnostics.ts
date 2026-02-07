/**
 * Shared helper for standardizing actor initialization diagnostics.
 * Provides safe error stringification and context formatting for deployment diagnostics.
 */

export interface ActorInitDiagnosticContext {
  step: 'config-load' | 'actor-creation' | 'access-control-init';
  error?: unknown;
  details?: Record<string, unknown>;
}

/**
 * Safely stringify an error for diagnostic logging.
 * Handles Error objects, strings, and unknown types.
 */
export function safeStringifyError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}${error.stack ? `\n${error.stack}` : ''}`;
  }
  if (typeof error === 'string') {
    return error;
  }
  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
}

/**
 * Format a diagnostic context for logging.
 */
export function formatDiagnosticContext(context: ActorInitDiagnosticContext): string {
  const parts = [`Step: ${context.step}`];
  
  if (context.error) {
    parts.push(`Error: ${safeStringifyError(context.error)}`);
  }
  
  if (context.details) {
    try {
      parts.push(`Details: ${JSON.stringify(context.details, null, 2)}`);
    } catch {
      parts.push(`Details: [unable to serialize]`);
    }
  }
  
  return parts.join('\n');
}
