import { useState } from 'react';
import { ChefHat, Calendar as CalendarIcon, User, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useGetCookingAssignments,
  useAssignCookingDay,
  useUpdateCookingDay,
  useGetAllProfiles,
} from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format, startOfWeek, addDays } from 'date-fns';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Principal } from '@icp-sdk/core/principal';
import type { CookingAssignment } from '../backend';
import { getCookingAssignmentDisplay, formatPrincipal } from '../utils/cookingAssignmentLabel';
import { PersonProfileSelect } from './PersonProfileSelect';
import { PersonBadge } from './PersonBadge';
import { computeFairnessStats, type FairnessRange } from '../utils/fairness';

export function DinnerRota() {
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [cookPrincipal, setCookPrincipal] = useState('');
  const [cookName, setCookName] = useState('');
  const [fairnessRange, setFairnessRange] = useState<FairnessRange>('last30days');

  const { identity } = useInternetIdentity();
  const { data: assignments = [], isLoading: assignmentsLoading } = useGetCookingAssignments();
  const { data: profiles = [], isLoading: profilesLoading } = useGetAllProfiles();
  const assignCooking = useAssignCookingDay();
  const updateCooking = useUpdateCookingDay();

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const currentUserPrincipal = identity?.getPrincipal().toString();

  const getAssignmentForDay = (date: Date) => {
    const dayKey = format(date, 'yyyy-MM-dd');
    return assignments.find((a) => a.day === dayKey);
  };

  const canEditAssignment = (assignment: CookingAssignment | undefined) => {
    if (!assignment) return true; // Can create new assignment
    return assignment.assignedBy.toString() === currentUserPrincipal;
  };

  const handleAssign = (date: Date) => {
    const dayKey = format(date, 'yyyy-MM-dd');
    const assignment = getAssignmentForDay(date);
    setCookPrincipal(assignment?.cook?.toString() || '');
    setCookName(assignment?.cookName || '');
    setEditingDay(dayKey);
  };

  const handleSave = () => {
    if (!editingDay) return;

    let cook: Principal | undefined = undefined;

    // Try to parse the principal if provided
    if (cookPrincipal.trim()) {
      try {
        cook = Principal.fromText(cookPrincipal.trim());
      } catch (error) {
        // If it's not a valid principal, try to use current user's principal
        if (identity) {
          cook = identity.getPrincipal();
        }
      }
    }

    const existingAssignment = assignments.find((a) => a.day === editingDay);

    if (existingAssignment) {
      // Update existing assignment
      updateCooking.mutate(
        {
          day: editingDay,
          cook,
          cookName: cookName.trim() || undefined,
        },
        {
          onSuccess: () => {
            setEditingDay(null);
            setCookPrincipal('');
            setCookName('');
          },
        }
      );
    } else {
      // Create new assignment
      assignCooking.mutate(
        {
          day: editingDay,
          cook,
          cookName: cookName.trim() || undefined,
        },
        {
          onSuccess: () => {
            setEditingDay(null);
            setCookPrincipal('');
            setCookName('');
          },
        }
      );
    }
  };

  // Compute fairness stats
  const fairnessStats = computeFairnessStats(assignments, profiles, fairnessRange);

  // Calculate max count for visual indicator scaling
  const maxCount = fairnessStats.counts.size > 0 
    ? Math.max(...Array.from(fairnessStats.counts.values())) 
    : 0;

  if (assignmentsLoading || profilesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dinner Rota</h2>
          <p className="text-muted-foreground">Weekly cooking schedule for the family</p>
        </div>
      </div>

      <div className="relative">
        <img
          src="/assets/generated/family-cooking.dim_800x600.jpg"
          alt="Family cooking together"
          className="h-48 w-full rounded-lg object-cover"
        />
        <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      {/* Fairness Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Fairness Indicator
              </CardTitle>
              <CardDescription>See who's cooking most and least</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={fairnessRange === 'last30days' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFairnessRange('last30days')}
              >
                Last 30 Days
              </Button>
              <Button
                variant={fairnessRange === 'alltime' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFairnessRange('alltime')}
              >
                All Time
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Period Indicator */}
          <div className="mb-4 rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            <span className="font-medium">Period:</span> {fairnessStats.periodLabel}
          </div>

          {fairnessStats.isEmpty ? (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              No cooking assignments in this period
            </div>
          ) : (
            <div className="space-y-4">
              {/* Most and Least Cooked */}
              <div className="grid gap-3 md:grid-cols-2">
                {fairnessStats.mostCooked && (
                  <div className="rounded-lg border bg-accent/50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      Most Cooked
                    </div>
                    <div className="flex items-center justify-between">
                      <PersonBadge
                        label={fairnessStats.mostCooked.label}
                        color={fairnessStats.mostCooked.color}
                        variant="default"
                      />
                      <Badge variant="secondary" className="text-lg font-bold">
                        {fairnessStats.mostCooked.count}
                      </Badge>
                    </div>
                  </div>
                )}
                {fairnessStats.leastCooked && (
                  <div className="rounded-lg border bg-accent/50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <TrendingDown className="h-4 w-4" />
                      Least Cooked
                    </div>
                    <div className="flex items-center justify-between">
                      <PersonBadge
                        label={fairnessStats.leastCooked.label}
                        color={fairnessStats.leastCooked.color}
                        variant="default"
                      />
                      <Badge variant="secondary" className="text-lg font-bold">
                        {fairnessStats.leastCooked.count}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              {/* All Counts with Visual Indicator */}
              <div>
                <div className="mb-3 text-sm font-medium text-muted-foreground">All Cooks</div>
                <div className="space-y-3">
                  {Array.from(fairnessStats.counts.entries())
                    .sort((a, b) => b[1] - a[1]) // Sort by count descending
                    .map(([label, count]) => {
                      const color = fairnessStats.colors.get(label);
                      const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                      
                      return (
                        <div
                          key={label}
                          className="rounded-md border bg-card p-3"
                        >
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <PersonBadge label={label} color={color} variant="outline" size="sm" />
                            <Badge variant="secondary">{count}</Badge>
                          </div>
                          {/* Visual indicator bar */}
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {weekDays.map((date) => {
          const assignment = getAssignmentForDay(date);
          const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          const canEdit = canEditAssignment(assignment);
          const cookDisplay = getCookingAssignmentDisplay(assignment, profiles);

          return (
            <Card key={date.toISOString()} className={isToday ? 'border-primary' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{format(date, 'EEEE')}</CardTitle>
                  {isToday && <Badge>Today</Badge>}
                </div>
                <CardDescription className="flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  {format(date, 'MMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {cookDisplay.label ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 rounded-md bg-accent p-3">
                      <ChefHat className="h-5 w-5 text-accent-foreground" />
                      <div className="flex flex-1 items-center gap-2">
                        <PersonBadge label={cookDisplay.label} color={cookDisplay.color} variant="secondary" />
                      </div>
                    </div>
                    {assignment && (
                      <Badge variant="outline" className="text-xs">
                        Assigned by: {formatPrincipal(assignment.assignedBy)}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">
                    No one assigned
                  </div>
                )}
                {canEdit && (
                  <Button variant="outline" className="w-full" onClick={() => handleAssign(date)}>
                    {cookDisplay.label ? 'Change' : 'Assign'}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!editingDay} onOpenChange={() => setEditingDay(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Cook</DialogTitle>
            <DialogDescription>Who will be cooking on this day?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <PersonProfileSelect
              value={cookPrincipal}
              onChange={setCookPrincipal}
              label="Cook"
              placeholder="Select a person or enter Principal ID"
              showMeButton={true}
            />
            <div className="space-y-2">
              <Label htmlFor="cook-name">Cook name (optional)</Label>
              <Input
                id="cook-name"
                placeholder="Enter cook's name (e.g., Mom, Dad)"
                value={cookName}
                onChange={(e) => setCookName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Optional: Enter a friendly name if not using a profile
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDay(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={assignCooking.isPending || updateCooking.isPending}>
              {assignCooking.isPending || updateCooking.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
