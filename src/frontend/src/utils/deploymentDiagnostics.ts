/**
 * Deployment diagnostics utility for structured logging
 * Helps identify which step of the deployment/initialization process failed
 */

export type DiagnosticStep = 
  | 'config-load'
  | 'actor-creation'
  | 'access-control-init'
  | 'query-execution'
  | 'mutation-execution';

export interface DiagnosticContext {
  step: DiagnosticStep;
  timestamp: number;
  details?: Record<string, any>;
}

/**
 * Logs the start of a deployment/initialization step
 */
export function logStepStart(step: DiagnosticStep, details?: Record<string, any>): DiagnosticContext {
  const context: DiagnosticContext = {
    step,
    timestamp: Date.now(),
    details,
  };
  
  console.log(`[Diagnostic] Starting: ${step}`, details || '');
  return context;
}

/**
 * Logs the successful completion of a step
 */
export function logStepSuccess(context: DiagnosticContext, result?: any): void {
  const duration = Date.now() - context.timestamp;
  console.log(`[Diagnostic] Success: ${context.step} (${duration}ms)`, result ? { result } : '');
}

/**
 * Logs a step failure with detailed error information
 */
export function logStepFailure(context: DiagnosticContext, error: any): void {
  const duration = Date.now() - context.timestamp;
  
  console.error(`[Diagnostic] Failed: ${context.step} (${duration}ms)`);
  console.error('Error details:', {
    message: error?.message || 'Unknown error',
    stack: error?.stack,
    code: error?.code,
    details: context.details,
  });
  
  // Provide actionable guidance based on the failing step
  const guidance = getStepGuidance(context.step);
  if (guidance) {
    console.error(`[Diagnostic] Guidance: ${guidance}`);
  }
}

/**
 * Provides actionable guidance for common failure scenarios
 */
function getStepGuidance(step: DiagnosticStep): string | null {
  const guidanceMap: Record<DiagnosticStep, string> = {
    'config-load': 'Ensure env.json exists and contains valid canister IDs. Run `dfx deploy` to generate configuration.',
    'actor-creation': 'Check that the backend canister is deployed and accessible. Verify network connectivity.',
    'access-control-init': 'Verify the admin token is correct. Check backend logs for access control initialization errors.',
    'query-execution': 'Ensure the user is authenticated and has proper permissions. Check backend query method implementation.',
    'mutation-execution': 'Ensure the user is authenticated and has proper permissions. Check backend update method implementation.',
  };
  
  return guidanceMap[step] || null;
}

/**
 * Wraps an async operation with diagnostic logging
 */
export async function withDiagnostics<T>(
  step: DiagnosticStep,
  operation: () => Promise<T>,
  details?: Record<string, any>
): Promise<T> {
  const context = logStepStart(step, details);
  
  try {
    const result = await operation();
    logStepSuccess(context, result);
    return result;
  } catch (error) {
    logStepFailure(context, error);
    throw error;
  }
}
