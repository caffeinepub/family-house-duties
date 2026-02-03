/**
 * Safe principal parsing utility that returns a structured result instead of throwing.
 * Provides consistent error handling for principal validation across the application.
 */

import { Principal } from '@icp-sdk/core/principal';

export interface ParsePrincipalResult {
  success: boolean;
  principal?: Principal;
  error?: string;
  errorCode?: 'EMPTY' | 'INVALID_FORMAT';
}

/**
 * Safely parse a principal string without throwing exceptions.
 * Returns a structured result with success status and optional error details.
 * 
 * @param principalText - The principal string to parse (can be empty or whitespace)
 * @returns ParsePrincipalResult with success status, principal (if valid), and error details
 */
export function safeParsePrincipal(principalText: string): ParsePrincipalResult {
  const trimmed = principalText.trim();
  
  // Empty string is valid (represents no assignee)
  if (trimmed === '') {
    return {
      success: true,
      principal: undefined,
      errorCode: 'EMPTY',
    };
  }
  
  // Try to parse the principal
  try {
    const principal = Principal.fromText(trimmed);
    return {
      success: true,
      principal,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Invalid Principal ID format',
      errorCode: 'INVALID_FORMAT',
    };
  }
}

/**
 * Validate a principal string and return true if valid or empty.
 * Useful for form validation.
 */
export function isValidPrincipalOrEmpty(principalText: string): boolean {
  return safeParsePrincipal(principalText).success;
}
