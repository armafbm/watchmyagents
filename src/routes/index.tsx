import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/site/Nav";
import { Hero } from "@/components/site/Hero";
import { Problem } from "@/components/site/Problem";
import { InstallSection } from "@/components/site/InstallSection";
import { FractalLoop } from "@/components/site/FractalLoop";
import { Plugins } from "@/components/site/Plugins";
import { Loop } from "@/components/site/Loop";
import { Dashboard } from "@/components/site/Dashboard";
import { UseCases } from "@/components/site/UseCases";
import { Privacy } from "@/components/site/Privacy";
import { CTA, Footer } from "@/components/site/CTA";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "WatchMyAgents — Cybersecurity for AI Agents" },
      {
        name: "description",
        content:
          "Detect abnormal behavior, prevent compromise and enforce adaptive per-agent security policies for AI agents in production.",
      },
      { property: "og:title", content: "WatchMyAgents — Cybersecurity for AI Agents" },
      {
        property: "og:description",
        content:
          "Watch observes. Shield enforces. A live feedback loop that hardens every AI agent in production.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
});

function Index() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main>
        <Hero />
        <Problem />
        <FractalLoop />
        <InstallSection />
        <Plugins />
        <Loop />
        <Dashboard />
        <UseCases />
        <Privacy />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
