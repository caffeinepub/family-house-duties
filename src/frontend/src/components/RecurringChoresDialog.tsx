import { useState, useEffect } from 'react';
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
import { useVoiceDictation } from '../hooks/useVoiceDictation';
import { VoiceDictationButton } from './VoiceDictationButton';
import { toast } from 'sonner';

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
  { value: 'daily' as const, label: 'Daily' },
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
  const [activeField, setActiveField] = useState<'name' | 'description' | null>(null);

  const { identity } = useInternetIdentity();
  const { data: chores = [], isLoading } = useGetAllRecurringChores();
  const createChore = useCreateRecurringChore();
  const updateChore = useUpdateRecurringChore();
  const deleteChore = useDeleteRecurringChore();
  const pauseResumeChore = usePauseResumeRecurringChore();

  const currentUserPrincipal = identity?.getPrincipal().toString();

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

  const resetForm = () => {
    console.log('[RecurringChoresDialog] Resetting form state');
    setName('');
    setDescription('');
    setWeekday(0n);
    setFrequency('weeklies' as Timeline);
    setAssignedToPrincipal('');
    setPrincipalError(null);
    setNameError(null);
    setIsCreating(false);
    setEditingChore(null);
    nameDictation.stop();
    descriptionDictation.stop();
    setActiveField(null);
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      console.log('[RecurringChoresDialog] Dialog closed, resetting form');
      resetForm();
    }
  }, [open]);

  const handleStartCreate = () => {
    console.log('[RecurringChoresDialog] User initiated create');
    resetForm();
    setIsCreating(true);
  };

  const handleStartEdit = (chore: RecurringChore) => {
    console.log('[RecurringChoresDialog] User initiated edit:', {
      id: chore.id.toString(),
      name: chore.name,
    });
    setName(chore.name);
    setDescription(chore.description);
    setWeekday(chore.weekday);
    setFrequency(chore.timeline || ('weeklies' as Timeline));
    setAssignedToPrincipal(chore.assignedTo?.toString() || '');
    setPrincipalError(null);
    setNameError(null);
    setEditingChore(chore);
    setIsCreating(false);
    nameDictation.stop();
    descriptionDictation.stop();
    setActiveField(null);
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
    
    // Prevent double submission
    if (createChore.isPending || updateChore.isPending) {
      console.log('[RecurringChoresDialog] Submit ignored: mutation already in flight');
      return;
    }
    
    console.log('[RecurringChoresDialog] User submitted form:', {
      operation: editingChore ? 'update' : 'create',
      name: name.trim(),
      weekday: weekday.toString(),
      timeline: frequency,
      assignedTo: assignedToPrincipal || '(unassigned)',
    });
    
    if (!name.trim()) {
      setNameError('Chore name is required');
      return;
    }

    // Stop any active dictation before submitting
    nameDictation.stop();
    descriptionDictation.stop();
    setActiveField(null);

    const parseResult = safeParsePrincipal(assignedToPrincipal);
    
    if (!parseResult.success && parseResult.errorCode === 'INVALID_FORMAT') {
      console.error('[RecurringChoresDialog] Principal parsing failed:', {
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
        console.log('[RecurringChoresDialog] Calling update mutation');
        
        await updateChore.mutateAsync({
          id: editingChore.id,
          name: name.trim(),
          description: description.trim(),
          weekday,
          assignedTo: parseResult.principal,
          timeline: frequency,
        });
      } else {
        console.log('[RecurringChoresDialog] Calling create mutation');
        
        await createChore.mutateAsync({
          name: name.trim(),
          description: description.trim(),
          weekday,
          assignedTo: parseResult.principal,
          timeline: frequency,
        });
      }

      console.log('[RecurringChoresDialog] Mutation succeeded, resetting form');
      resetForm();
    } catch (error: any) {
      // Error is already handled by the mutation's onError with toast and diagnostics
      console.error('[RecurringChoresDialog] Mutation failed (caught in component):', {
        operation: editingChore ? 'update' : 'create',
        error: error.message || error,
      });
      // Keep form state so user can correct and retry
    }
  };

  const handleDelete = async (id: bigint) => {
    if (confirm('Are you sure you want to delete this recurring chore?')) {
      console.log('[RecurringChoresDialog] User initiated delete:', { id: id.toString() });
      try {
        await deleteChore.mutateAsync(id);
      } catch (error: any) {
        // Error is already handled by the mutation's onError with toast
        console.error('[RecurringChoresDialog] Delete failed (caught in component):', error);
      }
    }
  };

  const handlePauseResume = async (id: bigint, currentlyPaused: boolean) => {
    console.log('[RecurringChoresDialog] User initiated pause/resume:', {
      id: id.toString(),
      action: currentlyPaused ? 'resume' : 'pause',
    });
    try {
      await pauseResumeChore.mutateAsync({ id, pause: !currentlyPaused });
    } catch (error: any) {
      // Error is already handled by the mutation's onError with toast
      console.error('[RecurringChoresDialog] Pause/Resume failed (caught in component):', error);
    }
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
  const canSave = isNameValid && isPrincipalValid && !createChore.isPending && !updateChore.isPending;

  const showFormFooter = isCreating || editingChore;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl">
        <DialogHeader>
          <DialogTitle>Recurring Chores</DialogTitle>
          <DialogDescription>
            Manage chores that repeat on a schedule
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-hidden">
          {/* Form Section */}
          {showFormFooter && (
            <Card className="border-primary">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="chore-name">
                      Chore Name *
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="chore-name"
                        placeholder="e.g., Take out trash"
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className={nameError ? 'border-destructive' : ''}
                      />
                      <VoiceDictationButton
                        isListening={nameDictation.isListening && activeField === 'name'}
                        isSupported={nameDictation.isSupported}
                        onStart={handleStartNameDictation}
                        onStop={handleStopNameDictation}
                        disabled={createChore.isPending || updateChore.isPending}
                        disabledReason={createChore.isPending || updateChore.isPending ? 'Saving chore...' : undefined}
                      />
                    </div>
                    {nameError && (
                      <p className="text-sm text-destructive">{nameError}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chore-description">Description</Label>
                    <div className="flex gap-2">
                      <Textarea
                        id="chore-description"
                        placeholder="Add details about this chore..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                      />
                      <VoiceDictationButton
                        isListening={descriptionDictation.isListening && activeField === 'description'}
                        isSupported={descriptionDictation.isSupported}
                        onStart={handleStartDescriptionDictation}
                        onStop={handleStopDescriptionDictation}
                        disabled={createChore.isPending || updateChore.isPending}
                        disabledReason={createChore.isPending || updateChore.isPending ? 'Saving chore...' : undefined}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Frequency</Label>
                      <Select
                        value={frequency}
                        onValueChange={(value) => setFrequency(value as Timeline)}
                      >
                        <SelectTrigger id="frequency">
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
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="weekday">Weekday</Label>
                      <Select
                        value={weekday.toString()}
                        onValueChange={(value) => setWeekday(BigInt(value))}
                        disabled={frequency === 'daily'}
                      >
                        <SelectTrigger id="weekday">
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
                      {frequency === 'daily' && (
                        <p className="text-xs text-muted-foreground">
                          Weekday is ignored for daily chores
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assigned-to">Assigned To (optional)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="assigned-to"
                        placeholder="Enter Principal ID"
                        value={assignedToPrincipal}
                        onChange={(e) => handlePrincipalChange(e.target.value)}
                        className={principalError ? 'border-destructive' : ''}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleAssignToMe}
                        disabled={!identity}
                      >
                        <User className="h-4 w-4" />
                      </Button>
                    </div>
                    {principalError && (
                      <p className="text-sm text-destructive">{principalError}</p>
                    )}
                  </div>

                  {/* Preview */}
                  <div className="rounded-md border bg-muted/50 p-3">
                    <div className="mb-1 text-xs font-medium text-muted-foreground">Preview:</div>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Badge variant="outline">
                        <Repeat className="mr-1 h-3 w-3" />
                        {getTimelineLabel(frequency)}
                      </Badge>
                      {frequency !== 'daily' && (
                        <Badge variant="outline">
                          <Calendar className="mr-1 h-3 w-3" />
                          {getWeekdayLabel(weekday)}
                        </Badge>
                      )}
                      {assignedToPrincipal && isPrincipalValid && (
                        <Badge variant="outline">
                          <User className="mr-1 h-3 w-3" />
                          {formatPrincipal(assignedToPrincipal)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!canSave}
                    >
                      {createChore.isPending || updateChore.isPending ? (
                        'Saving...'
                      ) : editingChore ? (
                        'Update Chore'
                      ) : (
                        'Create Chore'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* List Section */}
          <div className="flex-1 overflow-hidden">
            {!showFormFooter && (
              <div className="mb-4">
                <Button onClick={handleStartCreate} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Recurring Chore
                </Button>
              </div>
            )}

            <ScrollArea className="h-[400px] pr-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : chores.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No recurring chores yet</p>
                  <p className="text-sm text-muted-foreground">Click the button above to create one</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {chores.map((chore) => (
                    <Card key={chore.id.toString()} className={chore.paused ? 'opacity-60' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium truncate">{chore.name}</h3>
                              {chore.paused && (
                                <Badge variant="outline" className="shrink-0">
                                  <Pause className="mr-1 h-3 w-3" />
                                  Paused
                                </Badge>
                              )}
                            </div>
                            {chore.description && (
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {chore.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              <Badge variant="outline">
                                <Repeat className="mr-1 h-3 w-3" />
                                {getTimelineLabel(chore.timeline)}
                              </Badge>
                              {chore.timeline !== 'daily' && (
                                <Badge variant="outline">
                                  <Calendar className="mr-1 h-3 w-3" />
                                  {getWeekdayLabel(chore.weekday)}
                                </Badge>
                              )}
                              {chore.assignedTo && (
                                <Badge variant="outline">
                                  <User className="mr-1 h-3 w-3" />
                                  {formatPrincipal(chore.assignedTo)}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {canEditChore(chore) && (
                            <div className="flex gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handlePauseResume(chore.id, chore.paused)}
                                title={chore.paused ? 'Resume' : 'Pause'}
                              >
                                {chore.paused ? (
                                  <Play className="h-4 w-4" />
                                ) : (
                                  <Pause className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleStartEdit(chore)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(chore.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
