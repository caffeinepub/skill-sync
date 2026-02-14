import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, ScheduledSession } from '../backend';

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useCreateUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, skills }: { name: string; skills: string[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createUserProfile(name, skills);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useStartSession() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.startSession();
    },
  });
}

export function useSubmitFeedback() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, rating, comment }: { sessionId: bigint; rating: bigint; comment: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitFeedback(sessionId, rating, comment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Scheduled Sessions

export function useCreateScheduledSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ scheduledTime, duration }: { scheduledTime: bigint; duration: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.scheduleSession(scheduledTime, duration);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledSessions'] });
    },
  });
}

export function useGetUserScheduledSessions() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<ScheduledSession[]>({
    queryKey: ['scheduledSessions'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserScheduledSessions();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 5000, // Poll every 5 seconds for updates
  });
}

export function useGetScheduledSessionById() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (sessionId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      const sessions = await actor.getUserScheduledSessions();
      return sessions.find(s => s.id === sessionId) || null;
    },
  });
}

export function useJoinScheduledSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.joinScheduledSession(sessionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledSessions'] });
      queryClient.invalidateQueries({ queryKey: ['activeCall'] });
    },
  });
}
