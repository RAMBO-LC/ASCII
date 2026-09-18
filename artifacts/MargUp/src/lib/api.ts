import { useQueryClient } from '@tanstack/react-query';
import {
  getGetDashboardQueryKey,
  getListMessagesQueryKey,
  getListTopicsQueryKey,
  useCreateTopic as useCreateTopicMutation,
  useDeleteTopic as useDeleteTopicMutation,
  useGetDashboard,
  useGetRoadmap,
  useListMessages,
  useListPlaybooks,
  useListResources,
  useListRoadmaps,
  useListTopics,
  useRequestRoadmapAdvice,
  useSendMessage as useSendMessageMutation,
  type ChatResponse,
  type RoadmapAdvice,
  type Topic,
  type TopicInput,
} from '@workspace/api-client-react';

interface SimpleMutationOptions<TData> {
  onSuccess?: (data: TData) => void;
  onError?: () => void;
}

function invalidateTopicQueries(
  qc: ReturnType<typeof useQueryClient>,
  topicId?: string,
): void {
  void qc.invalidateQueries({ queryKey: getListTopicsQueryKey() });
  void qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
  if (topicId) {
    void qc.invalidateQueries({
      queryKey: getListMessagesQueryKey(topicId),
    });
  }
}

export function useDashboard() {
  return useGetDashboard();
}

export function useTopics() {
  return useListTopics();
}

export function useCreateTopic() {
  const qc = useQueryClient();
  const mutation = useCreateTopicMutation();
  return {
    ...mutation,
    mutate: (
      input: TopicInput,
      options?: SimpleMutationOptions<Topic>,
    ): void => {
      mutation.mutate(
        { data: input },
        {
          onSuccess: (data) => {
            invalidateTopicQueries(qc);
            options?.onSuccess?.(data);
          },
          onError: () => options?.onError?.(),
        },
      );
    },
  };
}

export function useDeleteTopic() {
  const qc = useQueryClient();
  const mutation = useDeleteTopicMutation();
  return {
    ...mutation,
    mutate: (
      topicId: string,
      options?: SimpleMutationOptions<void>,
    ): void => {
      mutation.mutate(
        { topicId },
        {
          onSuccess: (data) => {
            invalidateTopicQueries(qc, topicId);
            options?.onSuccess?.(data);
          },
          onError: () => options?.onError?.(),
        },
      );
    },
  };
}

export function useMessages(topicId: string | undefined) {
  return useListMessages(topicId ?? '', {
    query: {
      enabled: Boolean(topicId),
      queryKey: getListMessagesQueryKey(topicId ?? ''),
    },
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  const mutation = useSendMessageMutation();
  return {
    ...mutation,
    mutate: (
      variables: { topicId: string; content: string },
      options?: SimpleMutationOptions<ChatResponse>,
    ): void => {
      mutation.mutate(
        { topicId: variables.topicId, data: { content: variables.content } },
        {
          onSuccess: (data) => {
            invalidateTopicQueries(qc, variables.topicId);
            options?.onSuccess?.(data);
          },
          onError: () => {
            // The title may still have been auto-set before the AI failed.
            invalidateTopicQueries(qc, variables.topicId);
            options?.onError?.();
          },
        },
      );
    },
  };
}

export function useRoadmap(slug: string) {
  return useGetRoadmap(slug);
}

export function useRoadmaps() {
  return useListRoadmaps();
}

/** Opt-in AI guidance for a roadmap/phase. Call mutate only on user action. */
export function useRoadmapAdvice() {
  const mutation = useRequestRoadmapAdvice();
  return {
    ...mutation,
    mutate: (
      variables: { slug: string; phaseId?: string; question?: string },
      options?: SimpleMutationOptions<RoadmapAdvice>,
    ): void => {
      mutation.mutate(
        {
          slug: variables.slug,
          data: { phaseId: variables.phaseId, question: variables.question },
        },
        {
          onSuccess: (data) => options?.onSuccess?.(data),
          onError: () => options?.onError?.(),
        },
      );
    },
  };
}

export function usePlaybooks() {
  return useListPlaybooks();
}

export function useResources(topic?: string) {
  return useListResources(topic ? { topic } : undefined);
}
