import type { Task } from '../backend';
import { format, startOfDay } from 'date-fns';
import { taskDueDateToDayKey } from './taskDayKey';

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

  // Group tasks by day using normalized day key
  tasks.forEach((task) => {
    const dayKey = taskDueDateToDayKey(task.dueDate);
    if (!dayKey) {
      noDueDateTasks.push(task);
    } else {
      if (!groupMap.has(dayKey)) {
        groupMap.set(dayKey, []);
      }
      groupMap.get(dayKey)!.push(task);
    }
  });

  // Convert to array and sort by date
  const dayGroups: TaskDayGroup[] = Array.from(groupMap.entries())
    .map(([dayKey, tasks]) => {
      const date = new Date(dayKey + 'T00:00:00');
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
