import { useQuery } from "@tanstack/react-query";
import { api, type SessionSummary, type SessionEvent } from "../lib/api";
import { MOCK_EVENTS, MOCK_SESSIONS } from "../lib/mockData";

const REFETCH_MS = 30_000;

export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: async (): Promise<{ data: SessionSummary[]; usingMock: boolean }> => {
      try {
        const data = await api.sessions();
        return { data, usingMock: false };
      } catch {
        return { data: MOCK_SESSIONS, usingMock: true };
      }
    },
    refetchInterval: REFETCH_MS,
    staleTime: 10_000,
  });
}

export function useSessionDetail(id: string | null) {
  return useQuery({
    queryKey: ["session", id],
    enabled: !!id,
    queryFn: async (): Promise<{ data: SessionEvent[]; usingMock: boolean }> => {
      if (!id) return { data: [], usingMock: false };
      try {
        const data = await api.session(id);
        return { data, usingMock: false };
      } catch {
        return { data: MOCK_EVENTS[id] ?? [], usingMock: true };
      }
    },
  });
}
