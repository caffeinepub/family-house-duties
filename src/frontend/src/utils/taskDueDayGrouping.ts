import type { Task } from '../backend';
import { format, startOfDay } from 'date-fns';

export interface TaskDayGroup {
  dayKey: string;
  displayDate: string;
  tasks: Task[];
  sortOrder: number;
}

/**
 * Groups tasks by calendar day (normalized to day-level, not timestamp).
 * Returns sorted day groups in ascending date order, with a trailing "No due date" group.
 */
export function groupTasksByDay(tasks: Task[]): TaskDayGroup[] {
  const groupMap = new Map<string, Task[]>();
  const noDueDateTasks: Task[] = [];

  // Group tasks by day
  tasks.forEach((task) => {
    if (!task.dueDate) {
      noDueDateTasks.push(task);
    } else {
      // Convert nanoseconds to milliseconds
      const date = new Date(Number(task.dueDate) / 1000000);
      const dayStart = startOfDay(date);
      const dayKey = dayStart.toISOString();
      
      if (!groupMap.has(dayKey)) {
        groupMap.set(dayKey, []);
      }
      groupMap.get(dayKey)!.push(task);
    }
  });

  // Convert to array and sort by date
  const dayGroups: TaskDayGroup[] = Array.from(groupMap.entries())
    .map(([dayKey, tasks]) => {
      const date = new Date(dayKey);
      return {
        dayKey,
        displayDate: format(date, 'EEEE, MMMM d, yyyy'),
        tasks,
        sortOrder: date.getTime(),
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Add "No due date" group at the end if there are tasks without dates
  if (noDueDateTasks.length > 0) {
    dayGroups.push({
      dayKey: 'no-due-date',
      displayDate: 'No due date',
      tasks: noDueDateTasks,
      sortOrder: Infinity,
    });
  }

  return dayGroups;
}
