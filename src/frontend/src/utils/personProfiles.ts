import type { PersonProfile } from '../backend';
import { Principal } from '@icp-sdk/core/principal';

/**
 * Resolves a Principal to a display label using People Profiles.
 * Returns profile displayName if found, otherwise returns shortened principal.
 */
export function resolvePersonLabel(
  principal: Principal | undefined,
  profiles: PersonProfile[]
): string {
  if (!principal) return '';
  
  const profile = profiles.find(p => p.principal.toString() === principal.toString());
  if (profile) {
    return profile.displayName;
  }
  
  // Fallback to shortened principal
  const str = principal.toString();
  return str.slice(0, 5) + '...' + str.slice(-3);
}

/**
 * Resolves a Principal to a color using People Profiles.
 * Returns profile color if found, otherwise returns undefined.
 */
export function resolvePersonColor(
  principal: Principal | undefined,
  profiles: PersonProfile[]
): string | undefined {
  if (!principal) return undefined;
  
  const profile = profiles.find(p => p.principal.toString() === principal.toString());
  return profile?.color;
}

/**
 * Resolves a Principal to both label and color.
 */
export function resolvePersonDisplay(
  principal: Principal | undefined,
  profiles: PersonProfile[]
): { label: string; color?: string } {
  if (!principal) return { label: '' };
  
  const profile = profiles.find(p => p.principal.toString() === principal.toString());
  if (profile) {
    return { label: profile.displayName, color: profile.color };
  }
  
  // Fallback to shortened principal
  const str = principal.toString();
  return { label: str.slice(0, 5) + '...' + str.slice(-3) };
}

/**
 * Formats a principal to a shortened display string.
 */
export function formatPrincipal(principal: Principal): string {
  const str = principal.toString();
  return str.slice(0, 5) + '...' + str.slice(-3);
}
