import { useState, useEffect } from 'react';
import { ChefHat, Calendar as CalendarIcon, User, TrendingUp, TrendingDown, Edit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  useUpdateMealDescription,
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
import { useVoiceDictation } from '../hooks/useVoiceDictation';
import { VoiceDictationButton } from './VoiceDictationButton';
import { toast } from 'sonner';

export function DinnerRota() {
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editingMealDay, setEditingMealDay] = useState<string | null>(null);
  const [cookPrincipal, setCookPrincipal] = useState('');
  const [cookName, setCookName] = useState('');
  const [mealDescription, setMealDescription] = useState('');
  const [fairnessRange, setFairnessRange] = useState<FairnessRange>('last30days');

  const { identity } = useInternetIdentity();
  const { data: assignments = [], isLoading: assignmentsLoading } = useGetCookingAssignments();
  const { data: profiles = [], isLoading: profilesLoading } = useGetAllProfiles();
  const assignCooking = useAssignCookingDay();
  const updateCooking = useUpdateCookingDay();
  const updateMealDesc = useUpdateMealDescription();

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const currentUserPrincipal = identity?.getPrincipal().toString();

  // Voice dictation for meal description in assign/edit dialog
  const assignMealDictation = useVoiceDictation({
    continuous: false,
    interimResults: true,
    onTranscript: (transcript, isFinal) => {
      if (isFinal && editingDay) {
        setMealDescription((prev) => (prev ? prev + ' ' + transcript : transcript));
      }
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  // Voice dictation for meal description in dedicated edit dialog
  const editMealDictation = useVoiceDictation({
    continuous: false,
    interimResults: true,
    onTranscript: (transcript, isFinal) => {
      if (isFinal && editingMealDay) {
        setMealDescription((prev) => (prev ? prev + ' ' + transcript : transcript));
      }
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  // Stop dictation when dialogs close
  useEffect(() => {
    if (!editingDay) {
      assignMealDictation.stop();
    }
  }, [editingDay]);

  useEffect(() => {
    if (!editingMealDay) {
      editMealDictation.stop();
    }
  }, [editingMealDay]);

  const getAssignmentForDay = (date: Date) => {
    const dayKey = format(date, 'yyyy-MM-dd');
    return assignments.find((a) => a.day === dayKey);
  };

  const canEditAssignment = (assignment: CookingAssignment | undefined) => {
    if (!assignment) return true; // Can create new assignment
    return assignment.assignedBy.toString() === currentUserPrincipal;
  };

  const canEditMealDescription = (assignment: CookingAssignment | undefined) => {
    if (!assignment) return false; // No assignment exists
    // Can edit if you're the cook or the person who assigned
    const isCook = assignment.cook?.toString() === currentUserPrincipal;
    const isAssigner = assignment.assignedBy.toString() === currentUserPrincipal;
    return isCook || isAssigner;
  };

  const handleAssign = (date: Date) => {
    const dayKey = format(date, 'yyyy-MM-dd');
    const assignment = getAssignmentForDay(date);
    setCookPrincipal(assignment?.cook?.toString() || '');
    setCookName(assignment?.cookName || '');
    setMealDescription(assignment?.description || '');
    setEditingDay(dayKey);
    assignMealDictation.stop();
  };

  const handleEditMeal = (date: Date) => {
    const dayKey = format(date, 'yyyy-MM-dd');
    const assignment = getAssignmentForDay(date);
    setMealDescription(assignment?.description || '');
    setEditingMealDay(dayKey);
    editMealDictation.stop();
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
          description: mealDescription.trim(),
        },
        {
          onSuccess: () => {
            setEditingDay(null);
            setCookPrincipal('');
            setCookName('');
            setMealDescription('');
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
          description: mealDescription.trim(),
        },
        {
          onSuccess: () => {
            setEditingDay(null);
            setCookPrincipal('');
            setCookName('');
            setMealDescription('');
          },
        }
      );
    }
  };

  const handleSaveMealDescription = () => {
    if (!editingMealDay) return;

    updateMealDesc.mutate(
      {
        day: editingMealDay,
        description: mealDescription.trim(),
      },
      {
        onSuccess: () => {
          setEditingMealDay(null);
          setMealDescription('');
        },
      }
    );
  };

  const handleDialogClose = () => {
    setEditingDay(null);
    setCookPrincipal('');
    setCookName('');
    setMealDescription('');
    assignMealDictation.stop();
  };

  const handleMealDialogClose = () => {
    setEditingMealDay(null);
    setMealDescription('');
    editMealDictation.stop();
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
          const canEditMeal = canEditMealDescription(assignment);
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
                    {assignment?.description ? (
                      <div className="group relative rounded-md bg-muted/50 p-3">
                        <div className="pr-8">
                          <p className="whitespace-pre-wrap text-sm text-foreground">{assignment.description}</p>
                        </div>
                        {canEditMeal && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-2 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={() => handleEditMeal(date)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ) : canEditMeal ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleEditMeal(date)}
                      >
                        Add meal description
                      </Button>
                    ) : null}
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

      {/* Assign/Edit Cook Dialog */}
      <Dialog open={!!editingDay} onOpenChange={handleDialogClose}>
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
            <div className="space-y-2">
              <Label htmlFor="meal-description">What are you cooking (include ingredients)?</Label>
              <div className="flex gap-2">
                <Textarea
                  id="meal-description"
                  placeholder="e.g., Spaghetti Bolognese with ground beef, tomatoes, onions, garlic, and herbs"
                  value={mealDescription}
                  onChange={(e) => setMealDescription(e.target.value)}
                  rows={4}
                  className="flex-1"
                />
                <VoiceDictationButton
                  isListening={assignMealDictation.isListening}
                  isSupported={assignMealDictation.isSupported}
                  onStart={() => assignMealDictation.start()}
                  onStop={() => assignMealDictation.stop()}
                  disabled={assignCooking.isPending || updateCooking.isPending}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Describe the meal and list the main ingredients
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleDialogClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={assignCooking.isPending || updateCooking.isPending}>
              {assignCooking.isPending || updateCooking.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Meal Description Dialog */}
      <Dialog open={!!editingMealDay} onOpenChange={handleMealDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Meal Description</DialogTitle>
            <DialogDescription>Update what you're planning to cook with ingredients</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-meal-description">Meal Description</Label>
              <div className="flex gap-2">
                <Textarea
                  id="edit-meal-description"
                  placeholder="e.g., Spaghetti Bolognese with ground beef, tomatoes, onions, garlic, and herbs"
                  value={mealDescription}
                  onChange={(e) => setMealDescription(e.target.value)}
                  rows={4}
                  className="flex-1"
                />
                <VoiceDictationButton
                  isListening={editMealDictation.isListening}
                  isSupported={editMealDictation.isSupported}
                  onStart={() => editMealDictation.start()}
                  onStop={() => editMealDictation.stop()}
                  disabled={updateMealDesc.isPending}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Describe the meal and list the main ingredients
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleMealDialogClose}>
              Cancel
            </Button>
            <Button onClick={handleSaveMealDescription} disabled={updateMealDesc.isPending}>
              {updateMealDesc.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
