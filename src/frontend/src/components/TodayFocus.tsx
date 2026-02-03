import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useGetAllTasks, useGetCookingAssignments, useGetAllProfiles } from '../hooks/useQueries';
import { getTodayDayKey, taskDueDateToDayKey } from '../utils/taskDayKey';
import { getCookingAssignmentLabel, getNoAssignmentLabel } from '../utils/cookingAssignmentLabel';
import { CheckCircle2, Circle, ChefHat } from 'lucide-react';
import type { Task } from '../backend';

export function TodayFocus() {
  const todayKey = getTodayDayKey();
  
  const { data: tasks = [], isLoading: tasksLoading } = useGetAllTasks();
  const { data: cookingAssignments = [], isLoading: assignmentsLoading } = useGetCookingAssignments();
  const { data: profiles = [], isLoading: profilesLoading } = useGetAllProfiles();

  const isLoading = tasksLoading || assignmentsLoading || profilesLoading;

  // Filter tasks due today
  const todayTasks = tasks.filter((task) => {
    const taskDay = taskDueDateToDayKey(task.dueDate);
    return taskDay === todayKey;
  });

  // Find today's cooking assignment
  const todayCookingAssignment = cookingAssignments.find(
    (assignment) => assignment.day === todayKey
  );

  const todayCookLabel = todayCookingAssignment
    ? getCookingAssignmentLabel(todayCookingAssignment, profiles)
    : '';

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Today's Focus</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Skeleton className="h-5 w-24 mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full mt-1" />
          </div>
          <Separator />
          <div>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="text-primary">Today's Focus</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Today's Tasks */}
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
            <Circle className="h-4 w-4" />
            Tasks Due Today
          </h3>
          {todayTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No tasks due today</p>
          ) : (
            <ul className="space-y-1.5">
              {todayTasks.map((task) => (
                <TaskItem key={task.id.toString()} task={task} />
              ))}
            </ul>
          )}
        </div>

        <Separator />

        {/* Today's Cook */}
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            Today's Cook
          </h3>
          {todayCookLabel ? (
            <p className="text-sm font-medium">{todayCookLabel}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">{getNoAssignmentLabel()}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TaskItem({ task }: { task: Task }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      {task.completed ? (
        <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      )}
      <span className={task.completed ? 'line-through text-muted-foreground' : ''}>
        {task.name}
      </span>
    </li>
  );
}
