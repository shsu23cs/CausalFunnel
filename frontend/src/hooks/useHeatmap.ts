import { useQuery } from "@tanstack/react-query";
import { api, type ClickPoint } from "../lib/api";
import { MOCK_HEATMAP, MOCK_PAGES } from "../lib/mockData";

export function usePages() {
  return useQuery({
    queryKey: ["pages"],
    queryFn: async (): Promise<{ data: string[]; usingMock: boolean }> => {
      try {
        const data = await api.pages();
        return { data, usingMock: false };
      } catch {
        return { data: MOCK_PAGES, usingMock: true };
      }
    },
    staleTime: 60_000,
  });
}

export function useHeatmap(page: string | null) {
  return useQuery({
    queryKey: ["heatmap", page],
    enabled: !!page,
    queryFn: async (): Promise<{ data: ClickPoint[]; usingMock: boolean }> => {
      if (!page) return { data: [], usingMock: false };
      try {
        const data = await api.heatmap(page);
        return { data, usingMock: false };
      } catch {
        return { data: MOCK_HEATMAP[page] ?? [], usingMock: true };
      }
    },
  });
}
