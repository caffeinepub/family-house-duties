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
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Principal } from '@icp-sdk/core/principal';

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

  const { identity } = useInternetIdentity();
  const updateTask = useUpdateTask();

  useEffect(() => {
    setName(task.name);
    setDescription(task.description);
    setAssignedToPrincipal(task.assignedTo?.toString() || '');
    setDueDate(task.dueDate ? new Date(Number(task.dueDate) / 1000000) : undefined);
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const dueDateNano = dueDate ? BigInt(dueDate.getTime() * 1000000) : null;
    let assignee: Principal | null = null;

    // Try to parse the principal if provided
    if (assignedToPrincipal.trim()) {
      try {
        assignee = Principal.fromText(assignedToPrincipal.trim());
      } catch (error) {
        // If it's not a valid principal, try to use current user's principal
        if (identity) {
          assignee = identity.getPrincipal();
        }
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

  const assignToMe = () => {
    if (identity) {
      setAssignedToPrincipal(identity.getPrincipal().toString());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update the task details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Task Name *</Label>
              <Input
                id="edit-name"
                placeholder="e.g., Vacuum living room"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Add any details about this task..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-assignedTo">Assigned To (Principal ID)</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-assignedTo"
                  placeholder="Principal ID or leave empty"
                  value={assignedToPrincipal}
                  onChange={(e) => setAssignedToPrincipal(e.target.value)}
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={assignToMe}>
                  Me
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter a family member's principal ID or click "Me" to assign to yourself
              </p>
            </div>
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
              {updateTask.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
