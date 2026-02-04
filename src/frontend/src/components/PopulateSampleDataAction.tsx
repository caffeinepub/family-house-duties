import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSeedSampleData } from '../hooks/useSeedSampleData';
import { useGetAllTasks } from '../hooks/useQueries';
import { useGetAllRecurringChores } from '../hooks/useQueries';
import { useGetCookingAssignments } from '../hooks/useQueries';
import { useGetAllProfiles } from '../hooks/useQueries';
import { Loader2, Database } from 'lucide-react';

export function PopulateSampleDataAction() {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const seedMutation = useSeedSampleData();

  // Check if data already exists
  const { data: tasks = [], isLoading: tasksLoading } = useGetAllTasks();
  const { data: chores = [], isLoading: choresLoading } = useGetAllRecurringChores();
  const { data: assignments = [], isLoading: assignmentsLoading } = useGetCookingAssignments();
  const { data: profiles = [], isLoading: profilesLoading } = useGetAllProfiles();

  const isCheckingData = tasksLoading || choresLoading || assignmentsLoading || profilesLoading;
  const hasExistingData = tasks.length > 0 || chores.length > 0 || assignments.length > 0 || profiles.length > 0;

  const handleClick = () => {
    if (hasExistingData) {
      setShowConfirmDialog(true);
    } else {
      seedMutation.mutate();
    }
  };

  const handleConfirm = () => {
    setShowConfirmDialog(false);
    seedMutation.mutate();
  };

  const isDisabled = seedMutation.isPending || isCheckingData;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isDisabled}
        className="gap-2"
      >
        {seedMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Adding sample data...</span>
          </>
        ) : (
          <>
            <Database className="h-4 w-4" />
            <span>Populate sample data</span>
          </>
        )}
      </Button>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add sample data?</AlertDialogTitle>
            <AlertDialogDescription>
              You already have existing data in the app. Sample data will be added on top of your current tasks, chores, cooking assignments, and profiles. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Add sample data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
