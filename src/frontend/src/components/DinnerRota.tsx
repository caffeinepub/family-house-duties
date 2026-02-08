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
import { HeroHeader } from './HeroHeader';

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

  const fairnessStats = computeFairnessStats(assignments, profiles, fairnessRange);

  // Convert fairness stats to array for display
  const perPersonCounts = Array.from(fairnessStats.counts.entries()).map(([label, count]) => ({
    label,
    count,
    color: fairnessStats.colors.get(label),
  }));

  if (assignmentsLoading || profilesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <HeroHeader
        imageSrc="/assets/generated/header-dinner.dim_1600x420.jpg"
        alt="Family dinner cooking schedule and meal planning"
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dinner Rota</h2>
          <p className="text-muted-foreground mt-1">Weekly cooking schedule for the family</p>
        </div>
      </div>

      {/* Fairness Indicator */}
      {!fairnessStats.isEmpty && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Cooking Fairness</CardTitle>
              <div className="flex items-center gap-2">
                <Label htmlFor="fairness-range" className="text-sm text-muted-foreground">
                  Period:
                </Label>
                <select
                  id="fairness-range"
                  value={fairnessRange}
                  onChange={(e) => setFairnessRange(e.target.value as FairnessRange)}
                  className="rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="last4weeks">Last 4 Weeks</option>
                  <option value="last30days">Last 30 Days</option>
                  <option value="alltime">All Time</option>
                </select>
              </div>
            </div>
            <CardDescription>
              {fairnessStats.periodLabel}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {perPersonCounts.map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <PersonBadge label={stat.label} color={stat.color} />
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{stat.count} times</Badge>
                    {fairnessStats.mostCooked && stat.label === fairnessStats.mostCooked.label && (
                      <TrendingUp className="h-4 w-4 text-primary" />
                    )}
                    {fairnessStats.leastCooked && stat.label === fairnessStats.leastCooked.label && (
                      <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Schedule */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {weekDays.map((day) => {
          const assignment = getAssignmentForDay(day);
          const cookDisplay = getCookingAssignmentDisplay(assignment, profiles);
          const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

          return (
            <Card key={day.toISOString()} className={isToday ? 'border-primary ring-2 ring-primary/20' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{format(day, 'EEEE')}</CardTitle>
                    <CardDescription>{format(day, 'MMM d')}</CardDescription>
                  </div>
                  {isToday && <Badge variant="default">Today</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {assignment ? (
                  <>
                    <div className="flex items-center gap-2">
                      <ChefHat className="h-5 w-5 text-primary" />
                      <PersonBadge label={cookDisplay.label} color={cookDisplay.color} />
                    </div>
                    {assignment.description && (
                      <div className="rounded-md bg-muted p-3">
                        <p className="text-sm text-muted-foreground mb-1 font-medium">Meal:</p>
                        <p className="text-sm">{assignment.description}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {canEditAssignment(assignment) && (
                        <Button variant="outline" size="sm" onClick={() => handleAssign(day)} className="flex-1">
                          Edit Cook
                        </Button>
                      )}
                      {canEditMealDescription(assignment) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditMeal(day)}
                          className="flex-1"
                        >
                          <Edit className="mr-1 h-3 w-3" />
                          Meal
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <Button variant="outline" onClick={() => handleAssign(day)} className="w-full">
                    Assign Cook
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Assign/Edit Cook Dialog */}
      <Dialog open={!!editingDay} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingDay && assignments.find((a) => a.day === editingDay) ? 'Edit' : 'Assign'} Cook
            </DialogTitle>
            <DialogDescription>
              {editingDay && `For ${format(new Date(editingDay), 'EEEE, MMMM d')}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <PersonProfileSelect
              value={cookPrincipal}
              onChange={setCookPrincipal}
              label="Cook"
              placeholder="Select or enter principal"
            />
            <div className="space-y-2">
              <Label htmlFor="cook-name">Cook Name (optional)</Label>
              <Input
                id="cook-name"
                value={cookName}
                onChange={(e) => setCookName(e.target.value)}
                placeholder="e.g., Mom, Dad, Alex"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="meal-description">Meal Description</Label>
                <VoiceDictationButton
                  isListening={assignMealDictation.isListening}
                  isSupported={assignMealDictation.isSupported}
                  onStart={assignMealDictation.start}
                  onStop={assignMealDictation.stop}
                  disabled={!!assignMealDictation.disabledReason}
                  disabledReason={assignMealDictation.disabledReason || undefined}
                />
              </div>
              <Textarea
                id="meal-description"
                value={mealDescription}
                onChange={(e) => setMealDescription(e.target.value)}
                placeholder="What's for dinner?"
                rows={3}
              />
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Meal Description</DialogTitle>
            <DialogDescription>
              {editingMealDay && `For ${format(new Date(editingMealDay), 'EEEE, MMMM d')}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="meal-desc-edit">Meal Description</Label>
                <VoiceDictationButton
                  isListening={editMealDictation.isListening}
                  isSupported={editMealDictation.isSupported}
                  onStart={editMealDictation.start}
                  onStop={editMealDictation.stop}
                  disabled={!!editMealDictation.disabledReason}
                  disabledReason={editMealDictation.disabledReason || undefined}
                />
              </div>
              <Textarea
                id="meal-desc-edit"
                value={mealDescription}
                onChange={(e) => setMealDescription(e.target.value)}
                placeholder="What's for dinner?"
                rows={4}
              />
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
