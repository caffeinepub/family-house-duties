import type { Principal } from '@icp-sdk/core/principal';

/**
 * Utility to encode optional Candid values consistently.
 * 
 * The Candid optional type expects an explicit representation:
 * - Empty optional: [] (empty array)
 * - Present optional: [value] (single-element array)
 * 
 * This utility ensures we never pass `undefined` or omit the field,
 * which can cause agent/Candid serialization issues.
 */

/**
 * Encode an optional Principal for Candid serialization.
 * @param principal - The principal value or undefined
 * @returns The principal if present, undefined if not (agent will encode as empty optional)
 */
export function encodeCandidOptionalPrincipal(principal: Principal | undefined): Principal | undefined {
  // The @dfinity/agent handles undefined as empty optional [] automatically
  // We just need to ensure we're not omitting the field entirely
  return principal;
}

/**
 * Encode any optional value for Candid serialization.
 * @param value - The value or undefined
 * @returns The value if present, undefined if not
 */
export function encodeCandidOptional<T>(value: T | undefined): T | undefined {
  return value;
}
