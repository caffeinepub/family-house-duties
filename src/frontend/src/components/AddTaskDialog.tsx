import { useState } from 'react';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Principal } from '@icp-sdk/core/principal';

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTaskDialog({ open, onOpenChange }: AddTaskDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [assignedToPrincipal, setAssignedToPrincipal] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);

  const { identity } = useInternetIdentity();
  const addTask = useAddTask();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const dueDateNano = dueDate ? BigInt(dueDate.getTime() * 1000000) : undefined;
    let assignee: Principal | undefined = undefined;

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

    addTask.mutate(
      {
        name: name.trim(),
        description: description.trim(),
        dueDate: dueDateNano,
        assignedTo: assignee,
      },
      {
        onSuccess: () => {
          setName('');
          setDescription('');
          setAssignedToPrincipal('');
          setDueDate(undefined);
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
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>Create a new household task for your family.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Task Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Vacuum living room"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Add any details about this task..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assigned To (Principal ID)</Label>
              <div className="flex gap-2">
                <Input
                  id="assignedTo"
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
            <Button type="submit" disabled={addTask.isPending}>
              {addTask.isPending ? 'Adding...' : 'Add Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
