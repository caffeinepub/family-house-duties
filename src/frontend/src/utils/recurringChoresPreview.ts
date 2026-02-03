import type { RecurringChore } from '../backend';
import { Timeline } from '../backend';

const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export interface GroupedChore {
  weekday: bigint;
  weekdayLabel: string;
  chores: RecurringChore[];
}

/**
 * Converts Timeline enum to user-friendly label
 */
export function getTimelineLabel(timeline: Timeline | undefined): string {
  if (!timeline) return 'Weekly'; // Default for backward compatibility
  
  switch (timeline) {
    case Timeline.weeklies:
      return 'Weekly';
    case Timeline.fortnightly:
      return 'Fortnightly';
    case Timeline.monthly:
      return 'Monthly';
    default:
      return 'Weekly';
  }
}

/**
 * Groups recurring chores by weekday and sorts them starting from today's weekday
 */
export function groupRecurringChoresByWeekday(chores: RecurringChore[]): GroupedChore[] {
  const today = new Date().getDay(); // 0 = Sunday, 6 = Saturday
  
  // Group chores by weekday
  const grouped = new Map<bigint, RecurringChore[]>();
  
  chores.forEach(chore => {
    const existing = grouped.get(chore.weekday) || [];
    grouped.set(chore.weekday, [...existing, chore]);
  });
  
  // Create sorted array starting from today
  const result: GroupedChore[] = [];
  
  for (let i = 0; i < 7; i++) {
    const weekdayIndex = (today + i) % 7;
    const weekdayBigInt = BigInt(weekdayIndex);
    const choresForDay = grouped.get(weekdayBigInt) || [];
    
    if (choresForDay.length > 0) {
      result.push({
        weekday: weekdayBigInt,
        weekdayLabel: WEEKDAY_LABELS[weekdayIndex],
        chores: choresForDay,
      });
    }
  }
  
  return result;
}

/**
 * Gets the next N upcoming recurring chores (by weekday from today)
 */
export function getUpcomingRecurringChores(chores: RecurringChore[], limit: number = 5): RecurringChore[] {
  const today = new Date().getDay();
  
  // Sort chores by how soon they occur (relative to today)
  const sorted = [...chores].sort((a, b) => {
    const aDaysUntil = (Number(a.weekday) - today + 7) % 7;
    const bDaysUntil = (Number(b.weekday) - today + 7) % 7;
    return aDaysUntil - bDaysUntil;
  });
  
  return sorted.slice(0, limit);
}

export function getWeekdayLabel(weekday: bigint): string {
  return WEEKDAY_LABELS[Number(weekday)] || 'Unknown';
}
