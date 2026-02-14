import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Call } from '../backend';
import { Principal } from '@dfinity/principal';

export function useInitiateCall() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ callee, offer }: { callee: string; offer: string }) => {
      if (!actor) throw new Error('Actor not available');
      const calleePrincipal = Principal.fromText(callee);
      return actor.initiateCall(calleePrincipal, offer);
    },
  });
}

export function useGetActiveCall() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Call | null>({
    queryKey: ['activeCall'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getActiveCall();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 2000, // Poll every 2 seconds
    retry: false,
  });
}

export function useAnswerCall() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ callId, answer }: { callId: bigint; answer: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.answerCall(callId, answer);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeCall'] });
    },
  });
}

export function useAddIceCandidate() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ callId, candidate }: { callId: bigint; candidate: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addIceCandidate(callId, candidate);
    },
  });
}

export function useEndCall() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (callId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.endCall(callId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeCall'] });
    },
  });
}
