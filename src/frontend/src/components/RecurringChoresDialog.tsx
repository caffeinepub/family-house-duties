import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit2, Plus, Repeat, User, AlertCircle, CheckCircle2, XCircle, Calendar, Pause, Play } from 'lucide-react';
import { useGetAllRecurringChores, useCreateRecurringChore, useUpdateRecurringChore, useDeleteRecurringChore, usePauseResumeRecurringChore } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import type { RecurringChore, Timeline } from '../backend';
import { ScrollArea } from '@/components/ui/scroll-area';
import { safeParsePrincipal } from '../utils/principal';
import { getTimelineLabel } from '../utils/recurringChoresPreview';

interface RecurringChoresDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WEEKDAYS = [
  { value: 0n, label: 'Sunday' },
  { value: 1n, label: 'Monday' },
  { value: 2n, label: 'Tuesday' },
  { value: 3n, label: 'Wednesday' },
  { value: 4n, label: 'Thursday' },
  { value: 5n, label: 'Friday' },
  { value: 6n, label: 'Saturday' },
];

const FREQUENCIES = [
  { value: 'weeklies' as const, label: 'Weekly' },
  { value: 'fortnightly' as const, label: 'Fortnightly' },
  { value: 'monthly' as const, label: 'Monthly' },
];

export function RecurringChoresDialog({ open, onOpenChange }: RecurringChoresDialogProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingChore, setEditingChore] = useState<RecurringChore | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [weekday, setWeekday] = useState<bigint>(0n);
  const [frequency, setFrequency] = useState<Timeline>('weeklies' as Timeline);
  const [assignedToPrincipal, setAssignedToPrincipal] = useState('');
  const [principalError, setPrincipalError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const { identity } = useInternetIdentity();
  const { data: chores = [], isLoading } = useGetAllRecurringChores();
  const createChore = useCreateRecurringChore();
  const updateChore = useUpdateRecurringChore();
  const deleteChore = useDeleteRecurringChore();
  const pauseResumeChore = usePauseResumeRecurringChore();

  const currentUserPrincipal = identity?.getPrincipal().toString();

  const resetForm = () => {
    setName('');
    setDescription('');
    setWeekday(0n);
    setFrequency('weeklies' as Timeline);
    setAssignedToPrincipal('');
    setPrincipalError(null);
    setNameError(null);
    setIsCreating(false);
    setEditingChore(null);
  };

  const handleStartCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const handleStartEdit = (chore: RecurringChore) => {
    setName(chore.name);
    setDescription(chore.description);
    setWeekday(chore.weekday);
    setFrequency(chore.timeline || ('weeklies' as Timeline));
    setAssignedToPrincipal(chore.assignedTo?.toString() || '');
    setPrincipalError(null);
    setNameError(null);
    setEditingChore(chore);
    setIsCreating(false);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (nameError && value.trim()) {
      setNameError(null);
    }
  };

  const handlePrincipalChange = (value: string) => {
    setAssignedToPrincipal(value);
    if (principalError) {
      setPrincipalError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setNameError('Chore name is required');
      return;
    }

    const parseResult = safeParsePrincipal(assignedToPrincipal);
    
    if (!parseResult.success && parseResult.errorCode === 'INVALID_FORMAT') {
      console.error('[RecurringChore] Principal parsing failed:', {
        input: assignedToPrincipal,
        error: parseResult.error,
        errorCode: parseResult.errorCode,
      });
      setPrincipalError(parseResult.error || 'Invalid Principal ID');
      return;
    }

    setPrincipalError(null);
    setNameError(null);

    try {
      if (editingChore) {
        console.log('[RecurringChore] Updating chore:', {
          id: editingChore.id.toString(),
          name: name.trim(),
          weekday: weekday.toString(),
          timeline: frequency,
          hasAssignee: !!parseResult.principal,
        });
        
        await updateChore.mutateAsync({
          id: editingChore.id,
          name: name.trim(),
          description: description.trim(),
          weekday,
          assignedTo: parseResult.principal,
          timeline: frequency,
        });
      } else {
        console.log('[RecurringChore] Creating chore:', {
          name: name.trim(),
          weekday: weekday.toString(),
          timeline: frequency,
          hasAssignee: !!parseResult.principal,
        });
        
        await createChore.mutateAsync({
          name: name.trim(),
          description: description.trim(),
          weekday,
          assignedTo: parseResult.principal,
          timeline: frequency,
        });
      }

      resetForm();
    } catch (error: any) {
      console.error('[RecurringChore] Mutation failed:', {
        operation: editingChore ? 'update' : 'create',
        error: error.message || error,
        stack: error.stack,
      });
    }
  };

  const handleDelete = async (id: bigint) => {
    if (confirm('Are you sure you want to delete this recurring chore?')) {
      await deleteChore.mutateAsync(id);
    }
  };

  const handlePauseResume = async (id: bigint, currentlyPaused: boolean) => {
    await pauseResumeChore.mutateAsync({ id, pause: !currentlyPaused });
  };

  const handleAssignToMe = () => {
    if (identity) {
      setAssignedToPrincipal(identity.getPrincipal().toString());
      setPrincipalError(null);
    }
  };

  const canEditChore = (chore: RecurringChore) => {
    return chore.createdBy.toString() === currentUserPrincipal;
  };

  const formatPrincipal = (principal: any) => {
    const str = principal.toString();
    return str.slice(0, 5) + '...' + str.slice(-3);
  };

  const getWeekdayLabel = (weekdayNum: bigint) => {
    return WEEKDAYS.find(w => w.value === weekdayNum)?.label || 'Unknown';
  };

  const isNameValid = name.trim().length > 0;
  const parseResult = safeParsePrincipal(assignedToPrincipal);
  const isPrincipalValid = parseResult.success || parseResult.errorCode === 'EMPTY';
  const canSave = isNameValid && isPrincipalValid;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full h-[90vh] sm:h-auto sm:max-h-[85vh] p-0 flex flex-col">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Repeat className="h-5 w-5 sm:h-6 sm:w-6" />
            Recurring Chores
          </DialogTitle>
          <DialogDescription className="text-sm">
            Create recurring chores that automatically appear on the selected day with your chosen frequency
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-4 sm:px-6">
          <div className="py-4 sm:py-6 space-y-6">
            {(isCreating || editingChore) && (
              <Card className="border-2">
                <CardContent className="p-4 sm:p-6">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="chore-name" className="text-sm font-medium">
                          Chore Name *
                        </Label>
                        <Input
                          id="chore-name"
                          value={name}
                          onChange={(e) => handleNameChange(e.target.value)}
                          placeholder="e.g., Take out trash"
                          className={`h-10 sm:h-11 ${nameError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        />
                        {nameError && (
                          <div className="flex items-center gap-1.5 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            <span>{nameError}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="chore-weekday" className="text-sm font-medium">
                          Repeats On *
                        </Label>
                        <Select value={weekday.toString()} onValueChange={(val) => setWeekday(BigInt(val))}>
                          <SelectTrigger id="chore-weekday" className="h-10 sm:h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {WEEKDAYS.map((day) => (
                              <SelectItem key={day.value.toString()} value={day.value.toString()}>
                                {day.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="chore-frequency" className="text-sm font-medium">
                        Frequency *
                      </Label>
                      <Select value={frequency} onValueChange={(val) => setFrequency(val as Timeline)}>
                        <SelectTrigger id="chore-frequency" className="h-10 sm:h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FREQUENCIES.map((freq) => (
                            <SelectItem key={freq.value} value={freq.value}>
                              {freq.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {frequency === 'weeklies' && 'Appears every week on the selected day'}
                        {frequency === 'fortnightly' && 'Appears every other week on the selected day'}
                        {frequency === 'monthly' && 'Appears on the first occurrence of the selected day each month'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="chore-description" className="text-sm font-medium">
                        Description
                      </Label>
                      <Textarea
                        id="chore-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Optional details about this chore"
                        rows={3}
                        className="resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="chore-assigned" className="text-sm font-medium">
                        Assign To (Principal ID)
                      </Label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1">
                          <Input
                            id="chore-assigned"
                            value={assignedToPrincipal}
                            onChange={(e) => handlePrincipalChange(e.target.value)}
                            placeholder="Optional: Enter principal ID"
                            className={`h-10 sm:h-11 ${principalError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                          />
                          {principalError && (
                            <div className="flex items-center gap-1.5 mt-1.5 text-sm text-destructive">
                              <AlertCircle className="h-4 w-4 flex-shrink-0" />
                              <span>{principalError}</span>
                            </div>
                          )}
                        </div>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleAssignToMe}
                          className="h-10 sm:h-11 whitespace-nowrap"
                        >
                          Assign to Me
                        </Button>
                      </div>
                    </div>

                    <Card className="bg-muted/30 border-muted">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                          <Repeat className="h-4 w-4" />
                          Preview
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground min-w-[80px]">Chore:</span>
                            <span className="font-medium flex-1">
                              {name.trim() || <span className="text-muted-foreground italic">No name entered</span>}
                            </span>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground min-w-[80px]">Schedule:</span>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="font-normal">
                                <Calendar className="mr-1 h-3 w-3" />
                                {getWeekdayLabel(weekday)}
                              </Badge>
                              <Badge variant="secondary" className="font-normal">
                                {getTimelineLabel(frequency)}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground min-w-[80px]">Assigned:</span>
                            <span className="font-medium">
                              {assignedToPrincipal.trim() ? (
                                parseResult.success && parseResult.principal ? (
                                  <Badge variant="secondary" className="font-normal">
                                    {formatPrincipal(parseResult.principal)}
                                  </Badge>
                                ) : parseResult.errorCode === 'EMPTY' ? (
                                  <span className="text-muted-foreground">Unassigned</span>
                                ) : (
                                  <span className="text-destructive">Invalid Principal ID</span>
                                )
                              ) : (
                                <span className="text-muted-foreground">Unassigned</span>
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-border/50">
                          {canSave ? (
                            <div className="flex items-center gap-2 text-sm text-success">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="font-medium">Ready to save</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-sm text-destructive">
                              <XCircle className="h-4 w-4" />
                              <span className="font-medium">
                                Cannot save: {!isNameValid && 'Chore name required'}
                                {!isNameValid && !isPrincipalValid && ', '}
                                {!isPrincipalValid && 'Invalid Principal ID'}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={resetForm}
                        className="h-10 sm:h-11 flex-1 sm:flex-initial sm:min-w-[100px]"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createChore.isPending || updateChore.isPending}
                        className="h-10 sm:h-11 flex-1 sm:flex-initial sm:min-w-[140px]"
                      >
                        {createChore.isPending || updateChore.isPending
                          ? 'Saving...'
                          : editingChore
                          ? 'Update Chore'
                          : 'Create Chore'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {!isCreating && !editingChore && (
              <Button onClick={handleStartCreate} className="w-full h-11 sm:h-12 text-base">
                <Plus className="mr-2 h-5 w-5" />
                Add Recurring Chore
              </Button>
            )}

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Existing Recurring Chores
              </h3>
              
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : chores.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Repeat className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No recurring chores yet. Create one to get started!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {chores.map((chore) => (
                    <Card 
                      key={chore.id.toString()} 
                      className={`hover:shadow-md transition-shadow ${chore.paused ? 'opacity-60 bg-muted/30' : ''}`}
                    >
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                          <div className="flex-1 min-w-0 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <h4 className="font-semibold text-base sm:text-lg">{chore.name}</h4>
                              <div className="flex flex-wrap gap-2">
                                {chore.paused && (
                                  <Badge variant="secondary" className="font-normal w-fit bg-muted text-muted-foreground">
                                    <Pause className="mr-1 h-3 w-3" />
                                    Paused
                                  </Badge>
                                )}
                                <Badge variant="outline" className="font-normal w-fit">
                                  <Calendar className="mr-1.5 h-3.5 w-3.5" />
                                  {getWeekdayLabel(chore.weekday)}
                                </Badge>
                                <Badge variant="secondary" className="font-normal w-fit">
                                  {getTimelineLabel(chore.timeline)}
                                </Badge>
                              </div>
                            </div>
                            
                            {chore.description && (
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {chore.description}
                              </p>
                            )}
                            
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <Badge variant="secondary" className="font-normal">
                                <User className="mr-1 h-3 w-3" />
                                Created: {formatPrincipal(chore.createdBy)}
                              </Badge>
                              {chore.assignedTo && (
                                <Badge variant="outline" className="font-normal">
                                  <User className="mr-1 h-3 w-3" />
                                  Assigned: {formatPrincipal(chore.assignedTo)}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {canEditChore(chore) && (
                            <div className="flex sm:flex-col gap-2 self-end sm:self-start">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 sm:h-10 sm:w-10"
                                onClick={() => handlePauseResume(chore.id, chore.paused)}
                                disabled={pauseResumeChore.isPending}
                                title={chore.paused ? 'Resume chore' : 'Pause chore'}
                              >
                                {chore.paused ? (
                                  <Play className="h-4 w-4" />
                                ) : (
                                  <Pause className="h-4 w-4" />
                                )}
                                <span className="sr-only">{chore.paused ? 'Resume' : 'Pause'} chore</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 sm:h-10 sm:w-10"
                                onClick={() => handleStartEdit(chore)}
                              >
                                <Edit2 className="h-4 w-4" />
                                <span className="sr-only">Edit chore</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 sm:h-10 sm:w-10 text-destructive hover:bg-destructive/10"
                                onClick={() => handleDelete(chore.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete chore</span>
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
