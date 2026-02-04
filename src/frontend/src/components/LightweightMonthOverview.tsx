import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import type { Task, CookingAssignment, RecurringChore } from '../backend';
import { dateToDayKey, taskDueDateToDayKey } from '../utils/taskDayKey';
import { getChoresForDate } from '../utils/recurringChoresSchedule';

interface LightweightMonthOverviewProps {
  currentMonth: Date;
  selectedDate: Date;
  allTasks: Task[];
  assignments: CookingAssignment[];
  recurringChores: RecurringChore[];
  onMonthChange: (date: Date) => void;
  onDateSelect: (date: Date) => void;
  showRecurringChores: boolean;
}

export function LightweightMonthOverview({
  currentMonth,
  selectedDate,
  allTasks,
  assignments,
  recurringChores,
  onMonthChange,
  onDateSelect,
  showRecurringChores,
}: LightweightMonthOverviewProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Build maps for quick lookups
  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    allTasks.forEach((task) => {
      const dayKey = taskDueDateToDayKey(task.dueDate);
      if (dayKey) {
        if (!map.has(dayKey)) {
          map.set(dayKey, []);
        }
        map.get(dayKey)!.push(task);
      }
    });
    return map;
  }, [allTasks]);

  const assignmentsByDay = useMemo(() => {
    const map = new Map<string, boolean>();
    assignments.forEach((assignment) => {
      if (assignment.cook) {
        map.set(assignment.day, true);
      }
    });
    return map;
  }, [assignments]);

  const hasTasks = (date: Date) => {
    const dayKey = dateToDayKey(date);
    return (tasksByDay.get(dayKey)?.length || 0) > 0;
  };

  const hasCookingAssignment = (date: Date) => {
    const dayKey = dateToDayKey(date);
    return assignmentsByDay.has(dayKey);
  };

  const hasRecurringChores = (date: Date) => {
    if (!showRecurringChores) return false;
    const chores = getChoresForDate(recurringChores, date);
    return chores.length > 0;
  };

  const previousMonth = () => onMonthChange(subMonths(currentMonth, 1));
  const nextMonth = () => onMonthChange(addMonths(currentMonth, 1));
  const goToToday = () => {
    const today = new Date();
    onMonthChange(today);
    onDateSelect(today);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Month Overview</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{format(currentMonth, 'MMMM yyyy')}</p>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-7 gap-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
            <div key={idx} className="p-1 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}

          {calendarDays.map((day) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, selectedDate);
            const dayHasTasks = hasTasks(day);
            const dayHasCooking = hasCookingAssignment(day);
            const dayHasChores = hasRecurringChores(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => onDateSelect(day)}
                className={`relative aspect-square rounded-md p-1 text-xs transition-colors ${
                  isCurrentMonth
                    ? 'hover:bg-accent'
                    : 'text-muted-foreground/40 hover:bg-muted/30'
                } ${isToday ? 'font-bold text-primary' : ''} ${
                  isSelected ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''
                }`}
              >
                <span className="flex h-full w-full items-center justify-center">
                  {format(day, 'd')}
                </span>
                {/* Indicators */}
                {isCurrentMonth && (dayHasTasks || dayHasCooking || dayHasChores) && (
                  <div className="absolute bottom-0.5 left-1/2 flex -translate-x-1/2 gap-0.5">
                    {dayHasTasks && (
                      <div
                        className={`h-1 w-1 rounded-full ${
                          isSelected ? 'bg-primary-foreground' : 'bg-primary'
                        }`}
                      />
                    )}
                    {dayHasCooking && (
                      <div
                        className={`h-1 w-1 rounded-full ${
                          isSelected ? 'bg-primary-foreground' : 'bg-accent-foreground'
                        }`}
                      />
                    )}
                    {dayHasChores && (
                      <div
                        className={`h-1 w-1 rounded-full ${
                          isSelected ? 'bg-primary-foreground' : 'bg-secondary-foreground'
                        }`}
                      />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-3 border-t pt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span>Tasks</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-accent-foreground" />
            <span>Cooking</span>
          </div>
          {showRecurringChores && (
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-secondary-foreground" />
              <span>Chores</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
