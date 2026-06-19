import { createFileRoute } from "@tanstack/react-router";
import { HeatmapPage } from "../components/HeatmapPage";

export const Route = createFileRoute("/heatmap")({
  head: () => ({
    meta: [
      { title: "Heatmap — CausalFunnel" },
      { name: "description", content: "Click distribution heatmap per page URL." },
    ],
  }),
  component: HeatmapPage,
});
