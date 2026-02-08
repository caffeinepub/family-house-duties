import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAddTask } from '../hooks/useQueries';
import { PersonProfileSelect } from './PersonProfileSelect';
import { Principal } from '@icp-sdk/core/principal';
import { useVoiceDictation } from '../hooks/useVoiceDictation';
import { VoiceDictationButton } from './VoiceDictationButton';
import { toast } from 'sonner';
import { useActorWithReadiness } from '../hooks/useActorWithReadiness';
import { getActorAvailabilityMessage, isActorAvailable } from '../utils/actorAvailability';

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTaskDialog({ open, onOpenChange }: AddTaskDialogProps) {
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignedToString, setAssignedToString] = useState<string>('');
  const [activeField, setActiveField] = useState<'name' | 'description' | null>(null);
  const addTaskMutation = useAddTask();
  const { isReady, isInitializing, initError } = useActorWithReadiness();

  // Voice dictation for Task Name
  const nameDictation = useVoiceDictation({
    continuous: false,
    interimResults: true,
    onTranscript: (transcript, isFinal) => {
      if (isFinal && activeField === 'name') {
        setTaskName((prev) => (prev ? prev + ' ' + transcript : transcript));
      }
    },
    onError: (error) => {
      toast.error(error);
      setActiveField(null);
    },
  });

  // Voice dictation for Description
  const descriptionDictation = useVoiceDictation({
    continuous: false,
    interimResults: true,
    onTranscript: (transcript, isFinal) => {
      if (isFinal && activeField === 'description') {
        setDescription((prev) => (prev ? prev + ' ' + transcript : transcript));
      }
    },
    onError: (error) => {
      toast.error(error);
      setActiveField(null);
    },
  });

  // Stop dictation and reset active field when dialog closes
  useEffect(() => {
    if (!open) {
      nameDictation.stop();
      descriptionDictation.stop();
      setActiveField(null);
    }
  }, [open]);

  const handleStartNameDictation = () => {
    descriptionDictation.stop();
    setActiveField('name');
    nameDictation.start();
  };

  const handleStopNameDictation = () => {
    nameDictation.stop();
    setActiveField(null);
  };

  const handleStartDescriptionDictation = () => {
    nameDictation.stop();
    setActiveField('description');
    descriptionDictation.start();
  };

  const handleStopDescriptionDictation = () => {
    descriptionDictation.stop();
    setActiveField(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check actor availability before attempting submission
    if (!isActorAvailable({ isReady, isInitializing, initError })) {
      const message = getActorAvailabilityMessage({ isReady, isInitializing, initError });
      toast.error(message);
      return;
    }

    // Stop any active dictation
    nameDictation.stop();
    descriptionDictation.stop();
    setActiveField(null);

    const dueDateBigInt = dueDate ? BigInt(new Date(dueDate).getTime() * 1_000_000) : undefined;
    
    // Parse assignedTo from string to Principal if provided
    let assignedTo: Principal | undefined = undefined;
    if (assignedToString.trim()) {
      try {
        assignedTo = Principal.fromText(assignedToString);
      } catch (error) {
        toast.error('Invalid Principal ID format');
        return;
      }
    }

    addTaskMutation.mutate(
      {
        name: taskName,
        description,
        dueDate: dueDateBigInt,
        assignedTo,
      },
      {
        onSuccess: () => {
          setTaskName('');
          setDescription('');
          setDueDate('');
          setAssignedToString('');
          onOpenChange(false);
        },
      }
    );
  };

  const handleCancel = () => {
    nameDictation.stop();
    descriptionDictation.stop();
    setActiveField(null);
    onOpenChange(false);
  };

  // Determine if submit should be disabled
  const actorNotReady = !isActorAvailable({ isReady, isInitializing, initError });
  const isSubmitDisabled = !taskName.trim() || addTaskMutation.isPending || actorNotReady;

  // Get disabled reason for tooltip
  let disabledReason = '';
  if (actorNotReady) {
    disabledReason = getActorAvailabilityMessage({ isReady, isInitializing, initError });
  } else if (addTaskMutation.isPending) {
    disabledReason = 'Adding task…';
  } else if (!taskName.trim()) {
    disabledReason = 'Task name is required';
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>Create a new household task for your family.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="task-name">
                Task Name <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="task-name"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="e.g., Take out the trash"
                  required
                  className="flex-1"
                />
                <VoiceDictationButton
                  isListening={nameDictation.isListening && activeField === 'name'}
                  isSupported={nameDictation.isSupported}
                  onStart={handleStartNameDictation}
                  onStop={handleStopNameDictation}
                  disabled={addTaskMutation.isPending}
                  disabledReason={nameDictation.disabledReason || (addTaskMutation.isPending ? 'Adding task...' : undefined)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <div className="flex gap-2">
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add any additional details..."
                  rows={3}
                  className="flex-1"
                />
                <VoiceDictationButton
                  isListening={descriptionDictation.isListening && activeField === 'description'}
                  isSupported={descriptionDictation.isSupported}
                  onStart={handleStartDescriptionDictation}
                  onStop={handleStopDescriptionDictation}
                  disabled={addTaskMutation.isPending}
                  disabledReason={descriptionDictation.disabledReason || (addTaskMutation.isPending ? 'Adding task...' : undefined)}
                />
              </div>
            </div>
            <PersonProfileSelect value={assignedToString} onChange={setAssignedToString} label="Assigned To" />
            <div className="grid gap-2">
              <Label htmlFor="due-date">Due Date</Label>
              <Input
                id="due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={isSubmitDisabled}
              className="relative"
              title={disabledReason}
            >
              {addTaskMutation.isPending ? 'Adding...' : 'Add Task'}
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </DialogFooter>
          {actorNotReady && (
            <div className="mt-2 text-sm text-muted-foreground text-center">
              {getActorAvailabilityMessage({ isReady, isInitializing, initError })}
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
