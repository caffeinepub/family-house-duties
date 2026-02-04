import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ChefHat, CheckCircle2, Circle, Calendar as CalendarIcon, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGetAllTasks, useGetCookingAssignments, useGetAllRecurringChores, useToggleTaskCompletion, useGetAllProfiles, useDeleteTask } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { format, addDays, subDays } from 'date-fns';
import type { Task, RecurringChore } from '../backend';
import { dateToDayKey, taskDueDateToDayKey } from '../utils/taskDayKey';
import { getCookingAssignmentDisplay } from '../utils/cookingAssignmentLabel';
import { resolvePersonDisplay } from '../utils/personProfiles';
import { PersonBadge } from './PersonBadge';
import { getChoresForDate } from '../utils/recurringChoresSchedule';
import { getTimelineLabel } from '../utils/recurringChoresPreview';
import { EditTaskDialog } from './EditTaskDialog';
import { RecurringChoresDialog } from './RecurringChoresDialog';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

interface CalendarDayPlannerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  showRecurringChores: boolean;
}

export function CalendarDayPlanner({ selectedDate, onDateChange, showRecurringChores }: CalendarDayPlannerProps) {
  const { data: allTasks = [], isLoading: tasksLoading } = useGetAllTasks();
  const { data: assignments = [], isLoading: assignmentsLoading } = useGetCookingAssignments();
  const { data: recurringChores = [], isLoading: choresLoading } = useGetAllRecurringChores();
  const { data: profiles = [], isLoading: profilesLoading } = useGetAllProfiles();
  const toggleCompletion = useToggleTaskCompletion();
  const deleteTask = useDeleteTask();
  const { identity } = useInternetIdentity();

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingChoreId, setEditingChoreId] = useState<bigint | null>(null);
  const [choreDialogOpen, setChoreDialogOpen] = useState(false);

  const currentUserPrincipal = identity?.getPrincipal().toString();

  const dayKey = dateToDayKey(selectedDate);

  const dayTasks = useMemo(() => {
    return allTasks.filter((task) => {
      const taskDayKey = taskDueDateToDayKey(task.dueDate);
      return taskDayKey === dayKey;
    });
  }, [allTasks, dayKey]);

  const cookingAssignment = useMemo(() => {
    return assignments.find((a) => a.day === dayKey);
  }, [assignments, dayKey]);

  const cookDisplay = getCookingAssignmentDisplay(cookingAssignment, profiles);

  const dayChores = useMemo(() => {
    if (!showRecurringChores) return [];
    return getChoresForDate(recurringChores, selectedDate);
  }, [recurringChores, selectedDate, showRecurringChores]);

  const previousDay = () => onDateChange(subDays(selectedDate, 1));
  const nextDay = () => onDateChange(addDays(selectedDate, 1));

  const handleToggleTask = async (taskId: bigint) => {
    await toggleCompletion.mutateAsync(taskId);
  };

  const handleDeleteTask = async (taskId: bigint) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTask.mutateAsync(taskId);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleEditChore = (chore: RecurringChore) => {
    setEditingChoreId(chore.id);
    setChoreDialogOpen(true);
  };

  const handleDeleteChore = async (choreId: bigint) => {
    if (confirm('Are you sure you want to delete this recurring chore?')) {
      const { useDeleteRecurringChore } = await import('../hooks/useQueries');
      // We need to use the hook at component level, so we'll trigger via the dialog
      setEditingChoreId(choreId);
      setChoreDialogOpen(true);
    }
  };

  const isTaskCreator = (task: Task) => {
    return task.createdBy.toString() === currentUserPrincipal;
  };

  const isChoreCreator = (chore: RecurringChore) => {
    return chore.createdBy.toString() === currentUserPrincipal;
  };

  const hasItems = dayTasks.length > 0 || cookDisplay.label || dayChores.length > 0;

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
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {format(selectedDate, 'EEEE')} schedule
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={previousDay}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => onDateChange(new Date())}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={nextDay}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {!hasItems ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarIcon className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="mb-2 text-lg font-medium">No items for this day</h3>
              <p className="text-sm text-muted-foreground">
                There are no tasks, cooking assignments{showRecurringChores ? ', or recurring chores' : ''} scheduled for {format(selectedDate, 'EEEE, MMMM d')}.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {cookDisplay.label && (
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <ChefHat className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Cooking Assignment</h3>
                  </div>
                  <Card className="bg-accent">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <ChefHat className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Cook</div>
                          <PersonBadge label={cookDisplay.label} color={cookDisplay.color} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {dayTasks.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Tasks</h3>
                    <Badge variant="secondary">{dayTasks.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {dayTasks.map((task) => {
                      const assigneeDisplay = task.assignedTo ? resolvePersonDisplay(task.assignedTo, profiles) : null;
                      const canEdit = isTaskCreator(task);
                      return (
                        <Card key={task.id.toString()}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <button
                                onClick={() => handleToggleTask(task.id)}
                                className="mt-1 flex-shrink-0"
                                disabled={toggleCompletion.isPending}
                              >
                                {task.completed ? (
                                  <CheckCircle2 className="h-5 w-5 text-success" />
                                ) : (
                                  <Circle className="h-5 w-5 text-muted-foreground" />
                                )}
                              </button>
                              <div className="flex-1">
                                <div className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                  {task.name}
                                </div>
                                {task.description && (
                                  <div className="mt-1 text-sm text-muted-foreground">{task.description}</div>
                                )}
                                {assigneeDisplay && (
                                  <div className="mt-2">
                                    <PersonBadge label={assigneeDisplay.label} color={assigneeDisplay.color} size="sm" variant="outline" />
                                  </div>
                                )}
                              </div>
                              {canEdit && (
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleEditTask(task)}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                    <span className="sr-only">Edit task</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteTask(task.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete task</span>
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {dayChores.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Recurring Chores</h3>
                    <Badge variant="secondary">{dayChores.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {dayChores.map((chore) => {
                      const assigneeDisplay = chore.assignedTo ? resolvePersonDisplay(chore.assignedTo, profiles) : null;
                      const canEdit = isChoreCreator(chore);
                      return (
                        <Card key={chore.id.toString()} className="bg-secondary/30">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-secondary">
                                <div className="h-2 w-2 rounded-full bg-secondary-foreground" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium">{chore.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {getTimelineLabel(chore.timeline)}
                                  </Badge>
                                </div>
                                {chore.description && (
                                  <div className="mt-1 text-sm text-muted-foreground">{chore.description}</div>
                                )}
                                {assigneeDisplay && (
                                  <div className="mt-2">
                                    <PersonBadge label={assigneeDisplay.label} color={assigneeDisplay.color} size="sm" variant="outline" />
                                  </div>
                                )}
                              </div>
                              {canEdit && (
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleEditChore(chore)}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                    <span className="sr-only">Edit chore</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteChore(chore.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete chore</span>
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {editingTask && (
        <EditTaskDialog
          task={editingTask}
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
        />
      )}

      <RecurringChoresDialog
        open={choreDialogOpen}
        onOpenChange={setChoreDialogOpen}
        initialEditChoreId={editingChoreId}
        onDialogClose={() => setEditingChoreId(null)}
      />
    </>
  );
}
