import type { CookingAssignment, PersonProfile } from '../backend';
import { getCookingAssignmentLabel } from './cookingAssignmentLabel';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, isWithinInterval, subDays, format } from 'date-fns';

export type FairnessRange = 'week' | 'month' | 'last4weeks' | 'last30days' | 'alltime';

export interface FairnessStats {
  counts: Map<string, number>; // label -> count
  colors: Map<string, string | undefined>; // label -> color
  mostCooked: { label: string; count: number; color?: string } | null;
  leastCooked: { label: string; count: number; color?: string } | null;
  isEmpty: boolean;
  periodLabel: string; // Human-readable period description
  startDate: Date | null;
  endDate: Date;
}

/**
 * Computes fairness statistics for cooking assignments within a date range.
 * Only counts assignments that have either a cook principal or cookName.
 */
export function computeFairnessStats(
  assignments: CookingAssignment[],
  profiles: PersonProfile[],
  range: FairnessRange
): FairnessStats {
  const now = new Date();
  let startDate: Date | null;
  let endDate: Date;
  let periodLabel: string;

  if (range === 'week') {
    startDate = startOfWeek(now, { weekStartsOn: 1 });
    endDate = endOfWeek(now, { weekStartsOn: 1 });
    periodLabel = `This Week (${format(startDate, 'MMM d')} – ${format(endDate, 'MMM d')})`;
  } else if (range === 'month') {
    startDate = startOfMonth(now);
    endDate = endOfMonth(now);
    periodLabel = `This Month (${format(startDate, 'MMM d')} – ${format(endDate, 'MMM d')})`;
  } else if (range === 'last4weeks') {
    // last4weeks: rolling 4-week window ending today
    endDate = now;
    startDate = subDays(now, 28);
    periodLabel = `Last 4 Weeks (${format(startDate, 'MMM d')} – ${format(endDate, 'MMM d')})`;
  } else if (range === 'last30days') {
    // last30days: rolling 30-day window ending today
    endDate = now;
    startDate = subDays(now, 30);
    periodLabel = `Last 30 Days (${format(startDate, 'MMM d')} – ${format(endDate, 'MMM d')})`;
  } else {
    // alltime: no start date filter
    startDate = null;
    endDate = now;
    periodLabel = 'All Time';
  }

  const counts = new Map<string, number>();
  const colors = new Map<string, string | undefined>();

  // Filter and count assignments in range
  for (const assignment of assignments) {
    // Skip assignments with neither cook nor cookName
    if (!assignment.cook && !assignment.cookName) {
      continue;
    }

    // Parse day key (yyyy-MM-dd format)
    let assignmentDate: Date;
    try {
      assignmentDate = parseISO(assignment.day);
    } catch {
      continue; // Skip invalid dates
    }

    // Check if within range
    if (startDate !== null) {
      if (!isWithinInterval(assignmentDate, { start: startDate, end: endDate })) {
        continue;
      }
    } else {
      // For all-time, only check that it's not in the future
      if (assignmentDate > endDate) {
        continue;
      }
    }

    // Get display label and color
    const label = getCookingAssignmentLabel(assignment, profiles);
    if (!label) continue; // Skip if no label could be resolved

    // Increment count
    counts.set(label, (counts.get(label) || 0) + 1);

    // Store color if not already stored
    if (!colors.has(label)) {
      // Try to find color from profile
      if (assignment.cook) {
        const profile = profiles.find(p => p.principal.toString() === assignment.cook!.toString());
        colors.set(label, profile?.color);
      } else {
        colors.set(label, undefined);
      }
    }
  }

  // If no qualifying assignments, return empty state
  if (counts.size === 0) {
    return {
      counts,
      colors,
      mostCooked: null,
      leastCooked: null,
      isEmpty: true,
      periodLabel,
      startDate,
      endDate,
    };
  }

  // Find most and least cooked
  let mostCooked: { label: string; count: number; color?: string } | null = null;
  let leastCooked: { label: string; count: number; color?: string } | null = null;

  for (const [label, count] of counts.entries()) {
    const color = colors.get(label);
    
    if (!mostCooked || count > mostCooked.count) {
      mostCooked = { label, count, color };
    }
    
    if (!leastCooked || count < leastCooked.count) {
      leastCooked = { label, count, color };
    }
  }

  return {
    counts,
    colors,
    mostCooked,
    leastCooked,
    isEmpty: false,
    periodLabel,
    startDate,
    endDate,
  };
}
