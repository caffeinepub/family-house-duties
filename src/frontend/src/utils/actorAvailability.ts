/**
 * Shared utility for converting actor readiness/error state into user-friendly messages
 * and providing guard helpers for mutations.
 */

export interface ActorAvailabilityState {
  isReady: boolean;
  isInitializing: boolean;
  initError: Error | null;
}

/**
 * Get a user-friendly message based on actor availability state.
 */
export function getActorAvailabilityMessage(state: ActorAvailabilityState): string {
  if (state.initError) {
    return 'Backend connection failed. Please refresh the page and try again.';
  }
  
  if (state.isInitializing) {
    return 'Connecting to backend… please wait a moment.';
  }
  
  // No message when actor exists (even if background fetch is happening)
  return '';
}

/**
 * Guard helper for mutations: throws a user-friendly error if actor is not ready.
 */
export function guardActorAvailability(state: ActorAvailabilityState): void {
  const message = getActorAvailabilityMessage(state);
  if (message) {
    throw new Error(message);
  }
}

/**
 * Check if the actor is available for mutations.
 * Actor is available when it exists and initialization didn't error.
 */
export function isActorAvailable(state: ActorAvailabilityState): boolean {
  return state.isReady && !state.initError;
}
