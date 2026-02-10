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

  const fairnessStats = computeFairnessStats(assignments, profiles, fairnessRange);

  // Convert fairness stats to array format for display
  const cookCountsArray = Array.from(fairnessStats.counts.entries()).map(([label, count]) => ({
    label,
    count,
    color: fairnessStats.colors.get(label),
    principal: label, // Use label as identifier for comparison
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
    <div className="space-y-6">
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
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Cooking Distribution</CardTitle>
            <select
              value={fairnessRange}
              onChange={(e) => setFairnessRange(e.target.value as FairnessRange)}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="last4weeks">Last 4 Weeks</option>
              <option value="last30days">Last 30 Days</option>
              <option value="alltime">All Time</option>
            </select>
          </div>
          <CardDescription>
            {fairnessStats.periodLabel}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fairnessStats.isEmpty ? (
            <p className="text-sm text-muted-foreground">No cooking assignments in this period</p>
          ) : (
            <div className="space-y-3">
              {cookCountsArray.map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <PersonBadge label={stat.label} color={stat.color} />
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono">
                      {stat.count} {stat.count === 1 ? 'time' : 'times'}
                    </Badge>
                    {fairnessStats.mostCooked && stat.label === fairnessStats.mostCooked.label && stat.count > 0 && (
                      <TrendingUp className="h-4 w-4 text-destructive" />
                    )}
                    {fairnessStats.leastCooked && stat.label === fairnessStats.leastCooked.label && cookCountsArray.length > 1 && (
                      <TrendingDown className="h-4 w-4 text-success" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {weekDays.map((day) => {
          const assignment = getAssignmentForDay(day);
          const cookDisplay = getCookingAssignmentDisplay(assignment, profiles);
          const canEdit = canEditAssignment(assignment);
          const canEditMeal = canEditMealDescription(assignment);

          return (
            <Card key={day.toISOString()} className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{format(day, 'EEEE')}</CardTitle>
                    <CardDescription>{format(day, 'MMM d')}</CardDescription>
                  </div>
                  {canEdit && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleAssign(day)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {assignment ? (
                  <>
                    <div className="flex items-center gap-2">
                      <ChefHat className="h-4 w-4 text-muted-foreground" />
                      <PersonBadge label={cookDisplay.label} color={cookDisplay.color} size="sm" />
                    </div>
                    {assignment.description && (
                      <div className="rounded-md bg-muted p-3 text-sm text-foreground">
                        <p className="font-medium mb-1">Meal:</p>
                        <p className="text-muted-foreground">{assignment.description}</p>
                      </div>
                    )}
                    {canEditMeal && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleEditMeal(day)}
                      >
                        Edit Meal
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <ChefHat className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">No cook assigned</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Assign/Edit Cook Dialog */}
      <Dialog open={!!editingDay} onOpenChange={() => setEditingDay(null)}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>
              {assignments.find((a) => a.day === editingDay) ? 'Edit' : 'Assign'} Cook
            </DialogTitle>
            <DialogDescription>
              {editingDay && format(new Date(editingDay), 'EEEE, MMMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <PersonProfileSelect
              value={cookPrincipal}
              onChange={setCookPrincipal}
            />
            <div className="space-y-2">
              <Label htmlFor="cook-name">Cook Name (optional)</Label>
              <Input
                id="cook-name"
                placeholder="Enter cook name"
                value={cookName}
                onChange={(e) => setCookName(e.target.value)}
                className="bg-background text-foreground"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="meal-description">Meal Description</Label>
                <VoiceDictationButton
                  isListening={assignMealDictation.isListening}
                  isSupported={assignMealDictation.isSupported}
                  disabled={!!assignMealDictation.disabledReason}
                  disabledReason={assignMealDictation.disabledReason || undefined}
                  onStart={assignMealDictation.start}
                  onStop={assignMealDictation.stop}
                />
              </div>
              <Textarea
                id="meal-description"
                placeholder="What's for dinner?"
                value={mealDescription}
                onChange={(e) => setMealDescription(e.target.value)}
                rows={3}
                className="bg-background text-foreground"
              />
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

      {/* Edit Meal Description Dialog */}
      <Dialog open={!!editingMealDay} onOpenChange={() => setEditingMealDay(null)}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Edit Meal Description</DialogTitle>
            <DialogDescription>
              {editingMealDay && format(new Date(editingMealDay), 'EEEE, MMMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-meal-description">Meal Description</Label>
              <VoiceDictationButton
                isListening={editMealDictation.isListening}
                isSupported={editMealDictation.isSupported}
                disabled={!!editMealDictation.disabledReason}
                disabledReason={editMealDictation.disabledReason || undefined}
                onStart={editMealDictation.start}
                onStop={editMealDictation.stop}
              />
            </div>
            <Textarea
              id="edit-meal-description"
              placeholder="What's for dinner?"
              value={mealDescription}
              onChange={(e) => setMealDescription(e.target.value)}
              rows={3}
              className="bg-background text-foreground"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMealDay(null)}>
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
