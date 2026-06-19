import { createFileRoute } from "@tanstack/react-router";
import { SessionsPage } from "../components/SessionsPage";

export const Route = createFileRoute("/sessions")({
  head: () => ({
    meta: [
      { title: "Sessions — CausalFunnel" },
      { name: "description", content: "All tracked user sessions and ordered event journeys." },
    ],
  }),
  component: SessionsPage,
});
