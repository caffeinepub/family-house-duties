import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { PersonProfile } from '../backend';
import { toast } from 'sonner';
import { Principal } from '@icp-sdk/core/principal';

export function useGetAllProfiles() {
  const { actor, isFetching } = useActor();

  return useQuery<PersonProfile[]>({
    queryKey: ['people-profiles'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllProfiles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetProfile(principal: Principal | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<PersonProfile | null>({
    queryKey: ['people-profile', principal?.toString()],
    queryFn: async () => {
      if (!actor || !principal) return null;
      try {
        return await actor.getProfile(principal);
      } catch (error) {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useUpsertProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: PersonProfile) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.upsertProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['people-profile'] });
      toast.success('Profile saved successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save profile');
    },
  });
}

export function useDeleteProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (principal: Principal) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteProfile(principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['people-profile'] });
      toast.success('Profile deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete profile');
    },
  });
}
