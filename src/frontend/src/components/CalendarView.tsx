import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChefHat, Calendar as CalendarIcon, ListTodo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useGetAllTasks, useGetCookingAssignments, useGetAllRecurringChores, useGetAllProfiles } from '../hooks/useQueries';
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
import type { Task, CookingAssignment } from '../backend';
import { CalendarWeekPlanner } from './CalendarWeekPlanner';
import { CalendarDayPlanner } from './CalendarDayPlanner';
import { LightweightMonthOverview } from './LightweightMonthOverview';
import { getCookingAssignmentDisplay } from '../utils/cookingAssignmentLabel';
import { getChoresForDate } from '../utils/recurringChoresSchedule';
import { useSessionStorageState } from '../hooks/useSessionStorageState';
import { HeroHeader } from './HeroHeader';

export function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showRecurringChores, setShowRecurringChores] = useSessionStorageState(
    'calendar.showRecurringChores',
    true
  );

  const { data: allTasks = [], isLoading: tasksLoading } = useGetAllTasks();
  const { data: assignments = [], isLoading: assignmentsLoading } = useGetCookingAssignments();
  const { data: recurringChores = [], isLoading: choresLoading } = useGetAllRecurringChores();
  const { data: profiles = [], isLoading: profilesLoading } = useGetAllProfiles();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Build a map of date -> tasks
  const tasksMap = useMemo(() => {
    const map = new Map<string, Task[]>();
    allTasks.forEach((task) => {
      if (task.dueDate) {
        const dateKey = format(new Date(Number(task.dueDate) / 1000000), 'yyyy-MM-dd');
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(task);
      }
    });
    return map;
  }, [allTasks]);

  const assignmentsMap = useMemo(() => {
    const map = new Map<string, CookingAssignment>();
    assignments.forEach((assignment) => {
      map.set(assignment.day, assignment);
    });
    return map;
  }, [assignments]);

  const getTasksForDay = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return tasksMap.get(dateKey) || [];
  };

  const getAssignmentForDay = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return assignmentsMap.get(dateKey);
  };

  const getChoresForDay = (date: Date) => {
    if (!showRecurringChores) return [];
    return getChoresForDate(recurringChores, date);
  };

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  if (tasksLoading || assignmentsLoading || choresLoading || profilesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HeroHeader
        imageSrc="/assets/generated/header-calendar.dim_1600x420.jpg"
        alt="Family calendar with tasks and meal planning"
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Calendar View</h2>
          <p className="text-muted-foreground">Plan your tasks and meals</p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="show-recurring-chores"
            checked={showRecurringChores}
            onCheckedChange={setShowRecurringChores}
          />
          <Label htmlFor="show-recurring-chores" className="cursor-pointer text-sm font-medium">
            Show recurring chores
          </Label>
        </div>
      </div>

      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'month' | 'week' | 'day')}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="month">Month</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="day">Day</TabsTrigger>
        </TabsList>

        <TabsContent value="month" className="mt-6 space-y-6">
          {/* Lightweight Month Overview */}
          <LightweightMonthOverview
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            allTasks={allTasks}
            assignments={assignments}
            recurringChores={recurringChores}
            onMonthChange={setCurrentMonth}
            onDateSelect={handleDateSelect}
            showRecurringChores={showRecurringChores}
          />

          {/* Full Month Grid */}
          <Card className="bg-card border-border">
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
                  const assignment = getAssignmentForDay(day);
                  const dayChores = getChoresForDay(day);
                  const cookDisplay = getCookingAssignmentDisplay(assignment, profiles);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-24 rounded-lg border p-2 ${
                        isCurrentMonth ? 'bg-card' : 'bg-muted/30'
                      } ${isToday ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}
                    >
                      <div className="mb-1 text-sm font-medium text-foreground">{format(day, 'd')}</div>
                      <div className="space-y-1">
                        {cookDisplay.label && (
                          <div className="flex items-center gap-1 rounded bg-accent/80 px-1.5 py-0.5 text-xs text-accent-foreground">
                            <ChefHat className="h-3 w-3" />
                            {cookDisplay.color && (
                              <span
                                className="inline-block h-2 w-2 rounded-full"
                                style={{ backgroundColor: cookDisplay.color }}
                              />
                            )}
                            <span className="truncate">{cookDisplay.label}</span>
                          </div>
                        )}
                        {dayChores.slice(0, 1).map((chore) => (
                          <div
                            key={chore.id.toString()}
                            className="flex items-center gap-1 truncate rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground"
                          >
                            <ListTodo className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{chore.name}</span>
                          </div>
                        ))}
                        {dayChores.length > 1 && (
                          <div className="text-xs text-muted-foreground">+{dayChores.length - 1} chore{dayChores.length > 2 ? 's' : ''}</div>
                        )}
                        {dayTasks.slice(0, 2).map((task) => (
                          <div
                            key={task.id.toString()}
                            className={`truncate rounded px-1.5 py-0.5 text-xs ${
                              task.completed
                                ? 'bg-success/20 text-success line-through'
                                : 'bg-primary/20 text-primary'
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

              <div className="mt-6 flex flex-wrap gap-4 border-t border-border pt-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-primary/20" />
                  <span className="text-sm text-muted-foreground">Pending Task</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-success/20" />
                  <span className="text-sm text-muted-foreground">Completed Task</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChefHat className="h-3 w-3" />
                  <span className="text-sm text-muted-foreground">Cooking Assignment</span>
                </div>
                {showRecurringChores && (
                  <div className="flex items-center gap-2">
                    <ListTodo className="h-3 w-3" />
                    <span className="text-sm text-muted-foreground">Recurring Chore</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="week" className="mt-6">
          <CalendarWeekPlanner
            selectedDate={selectedDate}
            onDateChange={handleDateSelect}
            showRecurringChores={showRecurringChores}
          />
        </TabsContent>

        <TabsContent value="day" className="mt-6">
          <CalendarDayPlanner
            selectedDate={selectedDate}
            onDateChange={handleDateSelect}
            showRecurringChores={showRecurringChores}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
