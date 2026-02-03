import type { CookingAssignment, PersonProfile } from '../backend';
import { Principal } from '@icp-sdk/core/principal';

/**
 * Returns a display label for a cooking assignment.
 * Prefers profile displayName if cook principal matches a profile,
 * then cookName if available, otherwise shows shortened principal, otherwise empty.
 */
export function getCookingAssignmentLabel(
  assignment: CookingAssignment | undefined,
  profiles: PersonProfile[] = []
): string {
  if (!assignment) return '';
  
  // First, try to match cook principal to a profile
  if (assignment.cook && profiles.length > 0) {
    const profile = profiles.find(p => p.principal.toString() === assignment.cook!.toString());
    if (profile) {
      return profile.displayName;
    }
  }
  
  // Fall back to cook name if available
  if (assignment.cookName) {
    return assignment.cookName;
  }
  
  // Fall back to shortened principal
  if (assignment.cook) {
    return formatPrincipal(assignment.cook);
  }
  
  return '';
}

/**
 * Returns a color for a cooking assignment based on profile match.
 */
export function getCookingAssignmentColor(
  assignment: CookingAssignment | undefined,
  profiles: PersonProfile[] = []
): string | undefined {
  if (!assignment?.cook || profiles.length === 0) return undefined;
  
  const profile = profiles.find(p => p.principal.toString() === assignment.cook!.toString());
  return profile?.color;
}

/**
 * Returns both label and color for a cooking assignment.
 */
export function getCookingAssignmentDisplay(
  assignment: CookingAssignment | undefined,
  profiles: PersonProfile[] = []
): { label: string; color?: string } {
  return {
    label: getCookingAssignmentLabel(assignment, profiles),
    color: getCookingAssignmentColor(assignment, profiles),
  };
}

/**
 * Returns a display label for a cook (either name or principal).
 * Used when you have the cook name and principal separately.
 */
export function getCookLabel(cookName: string | undefined, cook: Principal | undefined): string {
  if (cookName) {
    return cookName;
  }
  
  if (cook) {
    return formatPrincipal(cook);
  }
  
  return '';
}

/**
 * Returns a user-friendly message for no cook assignment.
 */
export function getNoAssignmentLabel(): string {
  return 'No cook assigned';
}

/**
 * Formats a principal to a shortened display string.
 */
export function formatPrincipal(principal: Principal): string {
  const str = principal.toString();
  return str.slice(0, 5) + '...' + str.slice(-3);
}
