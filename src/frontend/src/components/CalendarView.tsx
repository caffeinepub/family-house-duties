import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChefHat, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGetCalendar, useGetCookingAssignments } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
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
import type { Task, CalendarDay } from '../backend';
import { Principal } from '@icp-sdk/core/principal';

export function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  // Convert dates to nanoseconds for backend
  const startDateNano = BigInt(calendarStart.getTime() * 1000000);
  const endDateNano = BigInt(calendarEnd.getTime() * 1000000);

  const { data: calendarData = [], isLoading: calendarLoading } = useGetCalendar(startDateNano, endDateNano);
  const { data: assignments = [], isLoading: assignmentsLoading } = useGetCookingAssignments();

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Build a map of date -> tasks from calendar data
  const tasksMap = useMemo(() => {
    const map = new Map<string, Task[]>();
    calendarData.forEach((day: CalendarDay) => {
      const dateKey = format(new Date(Number(day.date) / 1000000), 'yyyy-MM-dd');
      map.set(dateKey, day.tasks);
    });
    return map;
  }, [calendarData]);

  const assignmentsMap = useMemo(() => {
    const map = new Map<string, Principal>();
    assignments.forEach((assignment) => {
      if (assignment.cook) {
        map.set(assignment.day, assignment.cook);
      }
    });
    return map;
  }, [assignments]);

  const getTasksForDay = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return tasksMap.get(dateKey) || [];
  };

  const getCookForDay = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return assignmentsMap.get(dateKey);
  };

  const formatPrincipal = (principal: Principal) => {
    const str = principal.toString();
    return str.slice(0, 5) + '...' + str.slice(-3);
  };

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  if (calendarLoading || assignmentsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Calendar View</h2>
          <p className="text-muted-foreground">Monthly overview of tasks and meal plans</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-semibold">{format(currentMonth, 'MMMM yyyy')}</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}

            {calendarDays.map((day) => {
              const dayTasks = getTasksForDay(day);
              const cookPrincipal = getCookForDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-24 rounded-lg border p-2 ${
                    isCurrentMonth ? 'bg-card' : 'bg-muted/30'
                  } ${isToday ? 'border-primary ring-2 ring-primary/20' : ''}`}
                >
                  <div className="mb-1 text-sm font-medium">{format(day, 'd')}</div>
                  <div className="space-y-1">
                    {cookPrincipal && (
                      <div className="flex items-center gap-1 rounded bg-accent px-1.5 py-0.5 text-xs">
                        <ChefHat className="h-3 w-3" />
                        <span className="truncate">{formatPrincipal(cookPrincipal)}</span>
                      </div>
                    )}
                    {dayTasks.slice(0, 2).map((task) => (
                      <div
                        key={task.id.toString()}
                        className={`truncate rounded px-1.5 py-0.5 text-xs ${
                          task.completed
                            ? 'bg-success/10 text-success line-through'
                            : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {task.name}
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <div className="text-xs text-muted-foreground">+{dayTasks.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-4 border-t pt-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-primary/10" />
              <span className="text-sm text-muted-foreground">Pending Task</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-success/10" />
              <span className="text-sm text-muted-foreground">Completed Task</span>
            </div>
            <div className="flex items-center gap-2">
              <ChefHat className="h-3 w-3" />
              <span className="text-sm text-muted-foreground">Cooking Assignment</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
