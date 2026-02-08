import { useActor } from './useActor';

export interface UseActorWithReadinessResult {
  actor: ReturnType<typeof useActor>['actor'];
  isFetching: boolean;
  isReady: boolean;
  isInitializing: boolean;
  initError: Error | null;
}

/**
 * Wrapper around useActor that adds readiness state for mutation gating.
 * This hook extends the base useActor with additional state to help
 * prevent mutations from running before the actor is fully initialized.
 */
export function useActorWithReadiness(): UseActorWithReadinessResult {
  const actorResult = useActor();
  const actor = actorResult.actor;
  const isFetching = actorResult.isFetching;
  
  // Access error properties safely - they may not exist in old version
  const error = 'error' in actorResult ? actorResult.error : null;
  const isError = 'isError' in actorResult ? actorResult.isError : false;
  
  // Derive readiness state: actor is ready as soon as it exists (not gated by background fetch)
  const isReady = !!actor && !isError;
  // Initializing only when no actor exists yet and we're still fetching
  const isInitializing = !actor && isFetching;
  
  // Expose initialization error from React Query
  const initError = isError && error ? (error instanceof Error ? error : new Error(String(error))) : null;
  
  return {
    actor,
    isFetching,
    isReady,
    isInitializing,
    initError,
  };
}
