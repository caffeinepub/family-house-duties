import type { RecurringChore } from '../backend';
import { Timeline } from '../backend';

/**
 * Reference date for fortnightly calculations (Monday, January 1, 2024)
 * This ensures consistent fortnightly scheduling across all users
 */
const FORTNIGHTLY_REFERENCE_DATE = new Date('2024-01-01T00:00:00Z');

/**
 * Determines if a recurring chore should appear on a given date
 * based on its weekday and timeline (frequency)
 * Paused chores are excluded from appearing on any date
 */
export function shouldChoreAppearOnDate(chore: RecurringChore, date: Date): boolean {
  // Paused chores never appear on the calendar
  if (chore.paused) {
    return false;
  }

  const choreWeekday = Number(chore.weekday);
  const dateWeekday = date.getDay();

  // First check: weekday must match
  if (choreWeekday !== dateWeekday) {
    return false;
  }

  // Get timeline, default to weeklies if missing (for backward compatibility)
  const timeline = chore.timeline || Timeline.weeklies;

  switch (timeline) {
    case Timeline.weeklies:
      // Weekly: appears every matching weekday
      return true;

    case Timeline.fortnightly:
      // Fortnightly: appears every other matching weekday
      // Calculate weeks since reference date
      const msPerWeek = 7 * 24 * 60 * 60 * 1000;
      const msSinceReference = date.getTime() - FORTNIGHTLY_REFERENCE_DATE.getTime();
      const weeksSinceReference = Math.floor(msSinceReference / msPerWeek);
      // Appears on even weeks (0, 2, 4, ...) relative to reference
      return weeksSinceReference % 2 === 0;

    case Timeline.monthly:
      // Monthly: appears on the first occurrence of the weekday in the month
      const dayOfMonth = date.getDate();
      // First occurrence is always between day 1-7
      return dayOfMonth <= 7;

    default:
      // Unknown timeline, default to weekly behavior
      return true;
  }
}

/**
 * Filters recurring chores to only those that should appear on the given date
 * Automatically excludes paused chores
 */
export function getChoresForDate(chores: RecurringChore[], date: Date): RecurringChore[] {
  return chores.filter(chore => shouldChoreAppearOnDate(chore, date));
}
