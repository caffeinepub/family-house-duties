import { format } from 'date-fns';

/**
 * Converts a task dueDate (nanoseconds) to a normalized day key string (yyyy-MM-dd)
 * based on local calendar day start.
 */
export function taskDueDateToDayKey(dueDate: bigint | undefined): string | null {
  if (!dueDate) return null;
  const date = new Date(Number(dueDate) / 1000000);
  return format(date, 'yyyy-MM-dd');
}

/**
 * Converts a Date object to a normalized day key string (yyyy-MM-dd)
 */
export function dateToDayKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Returns today's local day key (yyyy-MM-dd)
 */
export function getTodayDayKey(): string {
  return format(new Date(), 'yyyy-MM-dd');
}
