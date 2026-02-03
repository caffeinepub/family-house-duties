import { useState } from 'react';
import { ChefHat, Calendar as CalendarIcon, User } from 'lucide-react';
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
} from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format, startOfWeek, addDays } from 'date-fns';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Principal } from '@icp-sdk/core/principal';
import type { CookingAssignment } from '../backend';

export function DinnerRota() {
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [cookPrincipal, setCookPrincipal] = useState('');

  const { identity } = useInternetIdentity();
  const { data: assignments = [], isLoading } = useGetCookingAssignments();
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
        },
        {
          onSuccess: () => {
            setEditingDay(null);
            setCookPrincipal('');
          },
        }
      );
    } else {
      // Create new assignment
      assignCooking.mutate(
        {
          day: editingDay,
          cook,
        },
        {
          onSuccess: () => {
            setEditingDay(null);
            setCookPrincipal('');
          },
        }
      );
    }
  };

  const assignToMe = () => {
    if (identity) {
      setCookPrincipal(identity.getPrincipal().toString());
    }
  };

  const formatPrincipal = (principal: Principal) => {
    const str = principal.toString();
    return str.slice(0, 5) + '...' + str.slice(-3);
  };

  if (isLoading) {
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

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {weekDays.map((date) => {
          const assignment = getAssignmentForDay(date);
          const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          const canEdit = canEditAssignment(assignment);

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
                {assignment?.cook ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 rounded-md bg-accent p-3">
                      <ChefHat className="h-5 w-5 text-accent-foreground" />
                      <div className="flex flex-1 items-center gap-1">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{formatPrincipal(assignment.cook)}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Assigned by: {formatPrincipal(assignment.assignedBy)}
                    </Badge>
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">
                    No one assigned
                  </div>
                )}
                {canEdit && (
                  <Button variant="outline" className="w-full" onClick={() => handleAssign(date)}>
                    {assignment?.cook ? 'Change' : 'Assign'}
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
            <div className="space-y-2">
              <Label htmlFor="cook-principal">Cook (Principal ID)</Label>
              <div className="flex gap-2">
                <Input
                  id="cook-principal"
                  placeholder="Principal ID or leave empty"
                  value={cookPrincipal}
                  onChange={(e) => setCookPrincipal(e.target.value)}
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={assignToMe}>
                  Me
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter a family member's principal ID, click "Me" to assign yourself, or leave empty to clear
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
