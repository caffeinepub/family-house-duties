import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useActorWithReadiness } from './useActorWithReadiness';
import type { Task, CookingAssignment, AddTaskRequest, AssignCookingDayRequest, UpdateCookingDayRequest, UpdateMealDescriptionRequest, RecurringChore, CreateRecurringChoreRequest, UpdateRecurringChoreRequest, Timeline, PauseResumeChoreRequest } from '../backend';
import { toast } from 'sonner';
import { Principal } from '@icp-sdk/core/principal';
import { normalizeRecurringChoreError } from '../utils/recurringChoreMutationErrors';
import { logRecurringChoreMutationStart, logRecurringChoreMutationOutcome } from '../utils/recurringChoreDiagnostics';
import { guardActorAvailability } from '../utils/actorAvailability';

export function useGetAllTasks() {
  const { actor, isFetching } = useActor();

  return useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTasks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddTask() {
  const { actor, isReady, isInitializing, initError } = useActorWithReadiness();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      description: string;
      dueDate: bigint | undefined;
      assignedTo: Principal | undefined;
    }) => {
      guardActorAvailability({ isReady, isInitializing, initError });
      if (!actor) throw new Error('Backend is not ready. Please try again.');
      
      const request: AddTaskRequest = {
        name: params.name,
        description: params.description,
        dueDate: params.dueDate,
        assignedTo: params.assignedTo,
      };
      return actor.addTask(request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      toast.success('Task added successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add task');
    },
  });
}

export function useUpdateTask() {
  const { actor, isReady, isInitializing, initError } = useActorWithReadiness();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: bigint;
      name: string;
      description: string;
      dueDate: bigint | null;
      assignedTo: Principal | null;
    }) => {
      guardActorAvailability({ isReady, isInitializing, initError });
      if (!actor) throw new Error('Backend is not ready. Please try again.');
      
      return actor.updateTask(params.id, params.name, params.description, params.dueDate, params.assignedTo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      toast.success('Task updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update task');
    },
  });
}

export function useDeleteTask() {
  const { actor, isReady, isInitializing, initError } = useActorWithReadiness();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      guardActorAvailability({ isReady, isInitializing, initError });
      if (!actor) throw new Error('Backend is not ready. Please try again.');
      
      return actor.deleteTask(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      toast.success('Task deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete task');
    },
  });
}

export function useToggleTaskCompletion() {
  const { actor, isReady, isInitializing, initError } = useActorWithReadiness();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      guardActorAvailability({ isReady, isInitializing, initError });
      if (!actor) throw new Error('Backend is not ready. Please try again.');
      
      return actor.toggleTaskCompletion(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update task');
    },
  });
}

export function useClearCompletedTasks() {
  const { actor, isReady, isInitializing, initError } = useActorWithReadiness();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      guardActorAvailability({ isReady, isInitializing, initError });
      if (!actor) throw new Error('Backend is not ready. Please try again.');
      
      return actor.clearCompletedTasks();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      toast.success('Completed tasks cleared');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to clear tasks');
    },
  });
}

export function useGetCookingAssignments() {
  const { actor, isFetching } = useActor();

  return useQuery<CookingAssignment[]>({
    queryKey: ['cooking-assignments'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCookingAssignments();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAssignCookingDay() {
  const { actor, isReady, isInitializing, initError } = useActorWithReadiness();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { day: string; cook: Principal | undefined; cookName?: string; description: string }) => {
      guardActorAvailability({ isReady, isInitializing, initError });
      if (!actor) throw new Error('Backend is not ready. Please try again.');
      
      const request: AssignCookingDayRequest = {
        day: params.day,
        cook: params.cook,
        cookName: params.cookName,
        description: params.description,
      };
      return actor.assignCookingDay(request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cooking-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      toast.success('Cooking assignment updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update assignment');
    },
  });
}

export function useUpdateCookingDay() {
  const { actor, isReady, isInitializing, initError } = useActorWithReadiness();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { day: string; cook: Principal | undefined; cookName?: string; description: string }) => {
      guardActorAvailability({ isReady, isInitializing, initError });
      if (!actor) throw new Error('Backend is not ready. Please try again.');
      
      const request: UpdateCookingDayRequest = {
        day: params.day,
        cook: params.cook,
        cookName: params.cookName,
        description: params.description,
      };
      return actor.updateCookingDay(request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cooking-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      toast.success('Cooking assignment updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update assignment');
    },
  });
}

export function useUpdateMealDescription() {
  const { actor, isReady, isInitializing, initError } = useActorWithReadiness();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { day: string; description: string }) => {
      guardActorAvailability({ isReady, isInitializing, initError });
      if (!actor) throw new Error('Backend is not ready. Please try again.');
      
      const request: UpdateMealDescriptionRequest = {
        day: params.day,
        description: params.description,
      };
      return actor.updateMealDescription(request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cooking-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      toast.success('Meal description updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update meal description');
    },
  });
}

export function useGetCalendar(startDate: bigint, endDate: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['calendar', startDate.toString(), endDate.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCalendar({ startDate, endDate });
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllRecurringChores() {
  const { actor, isFetching } = useActor();

  return useQuery<RecurringChore[]>({
    queryKey: ['recurring-chores'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllRecurringChores();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateRecurringChore() {
  const { actor, isReady, isInitializing, initError } = useActorWithReadiness();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      description: string;
      weekday: bigint;
      assignedTo: Principal | undefined;
      timeline: Timeline;
    }) => {
      guardActorAvailability({ isReady, isInitializing, initError });
      if (!actor) throw new Error('Backend is not ready. Please try again.');
      
      // Log mutation start with payload details
      logRecurringChoreMutationStart({
        operation: 'create',
        name: params.name,
        weekday: params.weekday,
        timeline: params.timeline,
        assignedTo: params.assignedTo?.toString() || '(unassigned)',
      });
      
      // Build request with explicit optional field handling
      const request: CreateRecurringChoreRequest = {
        name: params.name,
        description: params.description,
        weekday: params.weekday,
        timeline: params.timeline,
        assignedTo: params.assignedTo,
      };
      
      const newId = await actor.createRecurringChore(request);
      
      // Fetch the newly created chore to get the full object
      const newChore = await actor.getRecurringChore(newId);
      
      // Immediately update the cache with the new chore
      queryClient.setQueryData<RecurringChore[]>(['recurring-chores'], (old = []) => {
        return [...old, newChore];
      });
      
      return newId;
    },
    onSuccess: (newId) => {
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['recurring-chores'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      
      logRecurringChoreMutationOutcome('create', {
        success: true,
        id: newId,
      });
      
      toast.success('Recurring chore created successfully');
    },
    onError: (error: unknown) => {
      const normalized = normalizeRecurringChoreError('create', error);
      
      logRecurringChoreMutationOutcome('create', {
        success: false,
        normalizedError: normalized.userMessage,
        rawError: error,
      });
      
      console.error(normalized.diagnosticDetails);
      toast.error(normalized.userMessage);
    },
  });
}

export function useUpdateRecurringChore() {
  const { actor, isReady, isInitializing, initError } = useActorWithReadiness();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: bigint;
      name: string;
      description: string;
      weekday: bigint;
      assignedTo: Principal | undefined;
      timeline: Timeline;
    }) => {
      guardActorAvailability({ isReady, isInitializing, initError });
      if (!actor) throw new Error('Backend is not ready. Please try again.');
      
      // Log mutation start with payload details
      logRecurringChoreMutationStart({
        operation: 'update',
        id: params.id,
        name: params.name,
        weekday: params.weekday,
        timeline: params.timeline,
        assignedTo: params.assignedTo?.toString() || '(unassigned)',
      });
      
      // Build request with explicit optional field handling
      const request: UpdateRecurringChoreRequest = {
        id: params.id,
        name: params.name,
        description: params.description,
        weekday: params.weekday,
        timeline: params.timeline,
        assignedTo: params.assignedTo,
      };
      
      await actor.updateRecurringChore(request);
      
      // Fetch the updated chore to get the full object
      const updatedChore = await actor.getRecurringChore(params.id);
      
      // Immediately update the cache with the updated chore
      queryClient.setQueryData<RecurringChore[]>(['recurring-chores'], (old = []) => {
        return old.map(chore => 
          chore.id === params.id ? updatedChore : chore
        );
      });
      
      return params.id;
    },
    onSuccess: (id) => {
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['recurring-chores'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      
      logRecurringChoreMutationOutcome('update', {
        success: true,
        id,
      });
      
      toast.success('Recurring chore updated successfully');
    },
    onError: (error: unknown) => {
      const normalized = normalizeRecurringChoreError('update', error);
      
      logRecurringChoreMutationOutcome('update', {
        success: false,
        normalizedError: normalized.userMessage,
        rawError: error,
      });
      
      console.error(normalized.diagnosticDetails);
      toast.error(normalized.userMessage);
    },
  });
}

export function useDeleteRecurringChore() {
  const { actor, isReady, isInitializing, initError } = useActorWithReadiness();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      guardActorAvailability({ isReady, isInitializing, initError });
      if (!actor) throw new Error('Backend is not ready. Please try again.');
      
      logRecurringChoreMutationStart({
        operation: 'delete',
        id,
      });
      
      return actor.deleteRecurringChore(id);
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-chores'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      
      logRecurringChoreMutationOutcome('delete', {
        success: true,
        id,
      });
      
      toast.success('Recurring chore deleted successfully');
    },
    onError: (error: unknown) => {
      const normalized = normalizeRecurringChoreError('delete', error);
      
      logRecurringChoreMutationOutcome('delete', {
        success: false,
        normalizedError: normalized.userMessage,
        rawError: error,
      });
      
      console.error(normalized.diagnosticDetails);
      toast.error(normalized.userMessage);
    },
  });
}

export function usePauseResumeRecurringChore() {
  const { actor, isReady, isInitializing, initError } = useActorWithReadiness();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: bigint; pause: boolean }) => {
      guardActorAvailability({ isReady, isInitializing, initError });
      if (!actor) throw new Error('Backend is not ready. Please try again.');
      
      logRecurringChoreMutationStart({
        operation: 'pause-resume',
        id: params.id,
        pause: params.pause,
      });
      
      const request: PauseResumeChoreRequest = {
        id: params.id,
        pause: params.pause,
      };
      return actor.pauseResumeRecurringChore(request);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-chores'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      
      logRecurringChoreMutationOutcome('pause-resume', {
        success: true,
        id: variables.id,
      });
      
      toast.success(variables.pause ? 'Recurring chore paused' : 'Recurring chore resumed');
    },
    onError: (error: unknown) => {
      const normalized = normalizeRecurringChoreError('pause-resume', error);
      
      logRecurringChoreMutationOutcome('pause-resume', {
        success: false,
        normalizedError: normalized.userMessage,
        rawError: error,
      });
      
      console.error(normalized.diagnosticDetails);
      toast.error(normalized.userMessage);
    },
  });
}

// Re-export people profile hooks
export { useGetAllProfiles, useGetProfile, useUpsertProfile, useDeleteProfile } from './usePeopleProfilesQueries';
