import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChefHat, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGetAllTasks, useGetCookingAssignments, useGetAllRecurringChores, useToggleTaskCompletion, useGetAllProfiles } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  isToday,
} from 'date-fns';
import type { Task, CookingAssignment } from '../backend';
import { dateToDayKey, taskDueDateToDayKey } from '../utils/taskDayKey';
import { getCookingAssignmentDisplay } from '../utils/cookingAssignmentLabel';
import { resolvePersonDisplay } from '../utils/personProfiles';
import { PersonBadge } from './PersonBadge';
import { getChoresForDate } from '../utils/recurringChoresSchedule';
import { getTimelineLabel } from '../utils/recurringChoresPreview';

interface CalendarWeekPlannerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  showRecurringChores: boolean;
}

export function CalendarWeekPlanner({ selectedDate, onDateChange, showRecurringChores }: CalendarWeekPlannerProps) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const { data: allTasks = [], isLoading: tasksLoading } = useGetAllTasks();
  const { data: assignments = [], isLoading: assignmentsLoading } = useGetCookingAssignments();
  const { data: recurringChores = [], isLoading: choresLoading } = useGetAllRecurringChores();
  const { data: profiles = [], isLoading: profilesLoading } = useGetAllProfiles();
  const toggleCompletion = useToggleTaskCompletion();

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
    const map = new Map<string, CookingAssignment>();
    assignments.forEach((assignment) => {
      map.set(assignment.day, assignment);
    });
    return map;
  }, [assignments]);

  const previousWeek = () => onDateChange(subWeeks(selectedDate, 1));
  const nextWeek = () => onDateChange(addWeeks(selectedDate, 1));

  const handleToggleTask = async (taskId: bigint) => {
    await toggleCompletion.mutateAsync(taskId);
  };

  if (tasksLoading || assignmentsLoading || choresLoading || profilesLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={previousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDateChange(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={nextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
          {weekDays.map((day) => {
            const dayKey = dateToDayKey(day);
            const dayTasks = tasksByDay.get(dayKey) || [];
            const assignment = assignmentsByDay.get(dayKey);
            const cookDisplay = getCookingAssignmentDisplay(assignment, profiles);
            const dayChores = showRecurringChores ? getChoresForDate(recurringChores, day) : [];
            const isDayToday = isToday(day);

            const hasItems = dayTasks.length > 0 || cookDisplay.label || dayChores.length > 0;

            return (
              <Card
                key={day.toISOString()}
                className={`${isDayToday ? 'border-primary ring-2 ring-primary/20' : ''}`}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground">{format(day, 'EEE')}</span>
                      <span className="text-lg">{format(day, 'd')}</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pb-4">
                  {cookDisplay.label && (
                    <div className="rounded-lg bg-accent p-2">
                      <div className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <ChefHat className="h-3 w-3" />
                        <span>Cooking</span>
                      </div>
                      <PersonBadge label={cookDisplay.label} color={cookDisplay.color} size="sm" />
                    </div>
                  )}

                  {dayTasks.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">Tasks</div>
                      {dayTasks.map((task) => (
                        <div
                          key={task.id.toString()}
                          className="flex items-start gap-2 rounded-lg border p-2 text-sm"
                        >
                          <button
                            onClick={() => handleToggleTask(task.id)}
                            className="mt-0.5 flex-shrink-0"
                            disabled={toggleCompletion.isPending}
                          >
                            {task.completed ? (
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                          <span className={task.completed ? 'line-through text-muted-foreground' : ''}>
                            {task.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {dayChores.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">Recurring Chores</div>
                      {dayChores.map((chore) => {
                        const assigneeDisplay = chore.assignedTo ? resolvePersonDisplay(chore.assignedTo, profiles) : null;
                        return (
                          <div
                            key={chore.id.toString()}
                            className="rounded-lg bg-secondary/50 p-2 text-sm"
                          >
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-medium">{chore.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {getTimelineLabel(chore.timeline)}
                              </Badge>
                            </div>
                            {assigneeDisplay && (
                              <div className="mt-1">
                                <PersonBadge label={assigneeDisplay.label} color={assigneeDisplay.color} size="sm" variant="outline" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {!hasItems && (
                    <div className="py-4 text-center text-sm text-muted-foreground">No items</div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
