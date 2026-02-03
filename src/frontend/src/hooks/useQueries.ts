import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Task, CookingAssignment, AddTaskRequest, AssignCookingDayRequest, UpdateCookingDayRequest, RecurringChore, CreateRecurringChoreRequest, UpdateRecurringChoreRequest } from '../backend';
import { toast } from 'sonner';
import { Principal } from '@icp-sdk/core/principal';

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
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      description: string;
      dueDate: bigint | undefined;
      assignedTo: Principal | undefined;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
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
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: bigint;
      name: string;
      description: string;
      dueDate: bigint | null;
      assignedTo: Principal | null;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
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
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
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
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
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
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
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
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { day: string; cook: Principal | undefined }) => {
      if (!actor) throw new Error('Actor not initialized');
      const request: AssignCookingDayRequest = {
        day: params.day,
        cook: params.cook,
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
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { day: string; cook: Principal | undefined }) => {
      if (!actor) throw new Error('Actor not initialized');
      const request: UpdateCookingDayRequest = {
        day: params.day,
        cook: params.cook,
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
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      description: string;
      weekday: bigint;
      assignedTo: Principal | undefined;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      const request: CreateRecurringChoreRequest = {
        name: params.name,
        description: params.description,
        weekday: params.weekday,
        assignedTo: params.assignedTo,
      };
      return actor.createRecurringChore(request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-chores'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      toast.success('Recurring chore created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create recurring chore');
    },
  });
}

export function useUpdateRecurringChore() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: bigint;
      name: string;
      description: string;
      weekday: bigint;
      assignedTo: Principal | undefined;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      const request: UpdateRecurringChoreRequest = {
        id: params.id,
        name: params.name,
        description: params.description,
        weekday: params.weekday,
        assignedTo: params.assignedTo,
      };
      return actor.updateRecurringChore(request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-chores'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      toast.success('Recurring chore updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update recurring chore');
    },
  });
}

export function useDeleteRecurringChore() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteRecurringChore(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-chores'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      toast.success('Recurring chore deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete recurring chore');
    },
  });
}
