/**
 * Structured logging helper for recurring chore mutations
 * Provides consistent diagnostic output for debugging save/update failures
 */

interface RecurringChoreMutationPayload {
  operation: 'create' | 'update' | 'delete' | 'pause-resume';
  id?: bigint;
  name?: string;
  weekday?: bigint;
  timeline?: string;
  assignedTo?: string;
  pause?: boolean;
}

interface RecurringChoreMutationOutcome {
  success: boolean;
  id?: bigint;
  normalizedError?: string;
  rawError?: unknown;
}

/**
 * Log the start of a recurring chore mutation with payload details
 */
export function logRecurringChoreMutationStart(payload: RecurringChoreMutationPayload): void {
  const details: Record<string, any> = {
    operation: payload.operation,
  };

  if (payload.id !== undefined) {
    details.id = payload.id.toString();
  }
  if (payload.name !== undefined) {
    details.name = payload.name;
  }
  if (payload.weekday !== undefined) {
    details.weekday = payload.weekday.toString();
  }
  if (payload.timeline !== undefined) {
    details.timeline = payload.timeline;
  }
  if (payload.assignedTo !== undefined) {
    details.assignedTo = payload.assignedTo || '(unassigned)';
  }
  if (payload.pause !== undefined) {
    details.pause = payload.pause;
  }

  console.log(`[RecurringChore:${payload.operation}] Mutation started:`, details);
}

/**
 * Log the outcome of a recurring chore mutation
 */
export function logRecurringChoreMutationOutcome(
  operation: string,
  outcome: RecurringChoreMutationOutcome
): void {
  if (outcome.success) {
    const details: Record<string, any> = {
      operation,
      success: true,
    };
    if (outcome.id !== undefined) {
      details.id = outcome.id.toString();
    }
    console.log(`[RecurringChore:${operation}] Mutation succeeded:`, details);
  } else {
    console.error(`[RecurringChore:${operation}] Mutation failed:`, {
      operation,
      success: false,
      normalizedError: outcome.normalizedError,
      rawError: safeStringify(outcome.rawError),
    });
  }
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
