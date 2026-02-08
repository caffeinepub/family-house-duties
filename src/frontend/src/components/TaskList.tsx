import { useState } from 'react';
import { Plus, Trash2, Edit2, CheckCircle2, Circle, User, Calendar as CalendarIcon, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { AddTaskDialog } from './AddTaskDialog';
import { EditTaskDialog } from './EditTaskDialog';
import { RecurringChoresDialog } from './RecurringChoresDialog';
import { RecurringChoresInlineSection } from './RecurringChoresInlineSection';
import { PersonBadge } from './PersonBadge';
import { HeroHeader } from './HeroHeader';
import {
  useGetAllTasks,
  useToggleTaskCompletion,
  useDeleteTask,
  useClearCompletedTasks,
  useGetAllProfiles,
} from '../hooks/useQueries';
import type { Task } from '../backend';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { groupTasksByDay } from '../utils/taskDueDayGrouping';
import { Separator } from '@/components/ui/separator';
import { resolvePersonDisplay, formatPrincipal } from '../utils/personProfiles';

export function TaskList() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isRecurringChoresOpen, setIsRecurringChoresOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { identity } = useInternetIdentity();
  const { data: tasks = [], isLoading } = useGetAllTasks();
  const { data: profiles = [] } = useGetAllProfiles();
  const toggleCompletion = useToggleTaskCompletion();
  const deleteTask = useDeleteTask();
  const clearCompleted = useClearCompletedTasks();

  const pendingTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

  const pendingDayGroups = groupTasksByDay(pendingTasks);
  const completedDayGroups = groupTasksByDay(completedTasks);

  const currentUserPrincipal = identity?.getPrincipal().toString();

  const handleToggle = (id: bigint) => {
    toggleCompletion.mutate(id);
  };

  const handleDelete = (id: bigint) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask.mutate(id);
    }
  };

  const handleClearCompleted = () => {
    if (completedTasks.length > 0 && confirm('Clear all your completed tasks?')) {
      clearCompleted.mutate();
    }
  };

  const canEditTask = (task: Task) => {
    return task.createdBy.toString() === currentUserPrincipal;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <HeroHeader
        imageSrc="/assets/generated/header-tasks.dim_1600x420.jpg"
        alt="Household tasks and chores organization"
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Household Tasks</h2>
          <p className="text-muted-foreground mt-1">Manage your family's chores and duties</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Add Task
        </Button>
      </div>

      {/* Inline Recurring Chores Section */}
      <RecurringChoresInlineSection onManageClick={() => setIsRecurringChoresOpen(true)} />

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <img
              src="/assets/generated/task-clipboard.dim_200x200.jpg"
              alt="No tasks"
              className="mb-6 h-32 w-32 rounded-lg object-cover opacity-50"
            />
            <p className="text-lg font-medium">No tasks yet</p>
            <p className="text-sm text-muted-foreground mt-1">Add your first household task to get started</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {pendingTasks.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Circle className="h-6 w-6 text-primary" />
                <h3 className="text-2xl font-bold">Pending Tasks</h3>
                <Badge variant="secondary" className="text-sm px-3 py-1">{pendingTasks.length}</Badge>
              </div>
              
              {pendingDayGroups.map((group) => (
                <div key={group.dayKey} className="space-y-3">
                  <div className="flex items-center gap-3 px-1">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-lg font-semibold text-foreground">{group.displayDate}</h4>
                    <Separator className="flex-1" />
                  </div>
                  <div className="space-y-2">
                    {group.tasks.map((task) => (
                      <TaskCard
                        key={task.id.toString()}
                        task={task}
                        profiles={profiles}
                        onToggle={handleToggle}
                        onEdit={setEditingTask}
                        onDelete={handleDelete}
                        canEdit={canEditTask(task)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {completedTasks.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                  <h3 className="text-2xl font-bold">Completed Tasks</h3>
                  <Badge variant="outline" className="text-sm px-3 py-1">{completedTasks.length}</Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={handleClearCompleted}>
                  Clear My Completed
                </Button>
              </div>
              
              {completedDayGroups.map((group) => (
                <div key={group.dayKey} className="space-y-3">
                  <div className="flex items-center gap-3 px-1">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-lg font-semibold text-muted-foreground">{group.displayDate}</h4>
                    <Separator className="flex-1" />
                  </div>
                  <div className="space-y-2">
                    {group.tasks.map((task) => (
                      <TaskCard
                        key={task.id.toString()}
                        task={task}
                        profiles={profiles}
                        onToggle={handleToggle}
                        onEdit={setEditingTask}
                        onDelete={handleDelete}
                        canEdit={canEditTask(task)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <AddTaskDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
      <RecurringChoresDialog open={isRecurringChoresOpen} onOpenChange={setIsRecurringChoresOpen} />
      {editingTask && <EditTaskDialog task={editingTask} open={true} onOpenChange={() => setEditingTask(null)} />}
    </div>
  );
}

function TaskCard({
  task,
  profiles,
  onToggle,
  onEdit,
  onDelete,
  canEdit,
}: {
  task: Task;
  profiles: any[];
  onToggle: (id: bigint) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: bigint) => void;
  canEdit: boolean;
}) {
  const createdByDisplay = resolvePersonDisplay(task.createdBy, profiles);
  const assignedToDisplay = task.assignedTo ? resolvePersonDisplay(task.assignedTo, profiles) : null;

  const isRecurringTask = task.recurringChoreId !== undefined && task.recurringChoreId !== null;

  return (
    <Card className={`transition-all hover:shadow-md ${task.completed ? 'opacity-60 bg-muted/30' : 'bg-card'}`}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Checkbox 
            checked={task.completed} 
            onCheckedChange={() => onToggle(task.id)} 
            className="mt-1.5" 
          />
          
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className={`text-lg font-semibold leading-tight ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {task.name}
                  </h4>
                  {isRecurringTask && (
                    <Badge variant="outline" className="font-normal">
                      <Repeat className="mr-1 h-3 w-3" />
                      Recurring
                    </Badge>
                  )}
                </div>
                {task.description && (
                  <p className={`text-sm mt-1.5 ${task.completed ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                    {task.description}
                  </p>
                )}
              </div>
              
              {canEdit && (
                <div className="flex gap-1 flex-shrink-0">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 hover:bg-primary/10" 
                    onClick={() => onEdit(task)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive hover:bg-destructive/10"
                    onClick={() => onDelete(task.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <PersonBadge 
                label={createdByDisplay.label} 
                color={createdByDisplay.color} 
                variant="secondary"
                size="sm"
              />
              {assignedToDisplay && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">→</span>
                  <PersonBadge 
                    label={assignedToDisplay.label} 
                    color={assignedToDisplay.color} 
                    variant="outline"
                    size="sm"
                  />
                </div>
              )}
              {task.dueDate && (
                <Badge variant="outline" className="font-normal text-xs px-2 py-0.5">
                  <CalendarIcon className="mr-1.5 h-3 w-3" />
                  {format(new Date(Number(task.dueDate) / 1000000), 'MMM d, yyyy')}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
