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
import { useUpdateTask } from '../hooks/useQueries';
import type { Task } from '../backend';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { PersonProfileSelect } from './PersonProfileSelect';
import { Principal } from '@icp-sdk/core/principal';
import { useVoiceDictation } from '../hooks/useVoiceDictation';
import { VoiceDictationButton } from './VoiceDictationButton';
import { toast } from 'sonner';

interface EditTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTaskDialog({ task, open, onOpenChange }: EditTaskDialogProps) {
  const [name, setName] = useState(task.name);
  const [description, setDescription] = useState(task.description);
  const [assignedToPrincipal, setAssignedToPrincipal] = useState(task.assignedTo?.toString() || '');
  const [dueDate, setDueDate] = useState<Date | undefined>(
    task.dueDate ? new Date(Number(task.dueDate) / 1000000) : undefined
  );
  const [activeField, setActiveField] = useState<'name' | 'description' | null>(null);

  const updateTask = useUpdateTask();

  // Voice dictation for name field
  const nameDictation = useVoiceDictation({
    continuous: false,
    interimResults: true,
    onTranscript: (transcript, isFinal) => {
      if (isFinal && activeField === 'name') {
        setName((prev) => (prev ? prev + ' ' + transcript : transcript));
      }
    },
    onError: (error) => {
      toast.error(error);
      setActiveField(null);
    },
  });

  // Voice dictation for description field
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

  useEffect(() => {
    setName(task.name);
    setDescription(task.description);
    setAssignedToPrincipal(task.assignedTo?.toString() || '');
    setDueDate(task.dueDate ? new Date(Number(task.dueDate) / 1000000) : undefined);
    // Stop dictation when task changes
    nameDictation.stop();
    descriptionDictation.stop();
    setActiveField(null);
  }, [task]);

  // Stop dictation when dialog closes
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Stop any active dictation before submitting
    nameDictation.stop();
    descriptionDictation.stop();
    setActiveField(null);

    const dueDateNano = dueDate ? BigInt(dueDate.getTime() * 1000000) : null;
    let assignee: Principal | null = null;

    // Try to parse the principal if provided
    if (assignedToPrincipal.trim()) {
      try {
        assignee = Principal.fromText(assignedToPrincipal.trim());
      } catch (error) {
        // Invalid principal, skip assignment
      }
    }

    updateTask.mutate(
      {
        id: task.id,
        name: name.trim(),
        description: description.trim(),
        dueDate: dueDateNano,
        assignedTo: assignee,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update the details of this task.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Task Name *</Label>
              <div className="flex gap-2">
                <Input
                  id="name"
                  placeholder="e.g., Vacuum living room"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="flex-1"
                />
                <VoiceDictationButton
                  isListening={nameDictation.isListening && activeField === 'name'}
                  isSupported={nameDictation.isSupported}
                  onStart={handleStartNameDictation}
                  onStop={handleStopNameDictation}
                  disabled={updateTask.isPending}
                  disabledReason={nameDictation.disabledReason || (updateTask.isPending ? 'Updating task...' : undefined)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <div className="flex gap-2">
                <Textarea
                  id="description"
                  placeholder="Add any details about this task..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="flex-1"
                />
                <VoiceDictationButton
                  isListening={descriptionDictation.isListening && activeField === 'description'}
                  isSupported={descriptionDictation.isSupported}
                  onStart={handleStartDescriptionDictation}
                  onStop={handleStopDescriptionDictation}
                  disabled={updateTask.isPending}
                  disabledReason={descriptionDictation.disabledReason || (updateTask.isPending ? 'Updating task...' : undefined)}
                />
              </div>
            </div>
            <PersonProfileSelect
              value={assignedToPrincipal}
              onChange={setAssignedToPrincipal}
              label="Assigned To"
              placeholder="Select a person or enter Principal ID"
              showMeButton={true}
            />
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateTask.isPending}>
              {updateTask.isPending ? 'Updating...' : 'Update Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
