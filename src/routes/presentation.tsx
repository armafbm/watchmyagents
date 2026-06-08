import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, ChevronRight, X } from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Hero } from "@/components/site/Hero";
import { RecursiveFractalLoop } from "@/components/site/RecursiveFractalLoop";
import { LayerFeatures } from "@/components/site/LayerFeatures";
import { Dashboard } from "@/components/site/Dashboard";
import { Footer } from "@/components/site/CTA";

export const Route = createFileRoute("/presentation")({
  component: PresentationPage,
  head: () => ({
    meta: [
      { title: "Présentation guidée — WatchMyAgents" },
      {
        name: "description",
        content:
          "Visite guidée et automatique de la plateforme WatchMyAgents : Watch, Guardian AI, Shield et My Fortress.",
      },
    ],
  }),
});

type Step = {
  id: string;
  target: string; // CSS selector
  title: string;
  body: string;
  duration: number; // ms
};

const STEPS: Step[] = [
  {
    id: "intro",
    target: "#top",
    title: "Bienvenue dans WatchMyAgents",
    body: "Une infrastructure de cybersécurité runtime pour vos agents IA. Laissez-vous guider : nous allons parcourir les trois couches Watch, Guardian AI et Shield, puis My Fortress.",
    duration: 7000,
  },
  {
    id: "loop",
    target: "#recursive-fractal",
    title: "La boucle Recursive Fractal Security™",
    body: "Watch observe, Guardian AI analyse, Shield applique. Chaque observation nourrit l'analyse, chaque analyse renforce les politiques — agent par agent, puis sur des flottes entières.",
    duration: 8000,
  },
  {
    id: "watch",
    target: "#watch",
    title: "Watch · Observer en temps réel",
    body: "Chaque action, chaque outil appelé, chaque token. Watch capture le comportement réel de vos agents en production sans rien casser.",
    duration: 8000,
  },
  {
    id: "guardian",
    target: "#guardian",
    title: "Guardian AI · Comprendre et conseiller",
    body: "Guardian AI corrèle, score et explique. Il transforme le bruit des signaux en recommandations actionnables : quelle politique appliquer, sur quel agent, et pourquoi.",
    duration: 8000,
  },
  {
    id: "shield",
    target: "#shield",
    title: "Shield · Bloquer en runtime",
    body: "Politiques adaptatives par agent, par flotte ou par sous-arbre. Shield applique en temps réel ce que Guardian recommande — confirm, interrupt ou detect-only.",
    duration: 8000,
  },
  {
    id: "fortress",
    target: "#dashboard",
    title: "My Fortress · Le centre de commandement",
    body: "Une seule console pour tous vos agents. KPI live, timeline temps réel, inbox Guardian, audit et conformité — tout au même endroit.",
    duration: 9000,
  },
];

function PresentationPage() {
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);

  const step = STEPS[index];

  // Scroll to target whenever step changes (only after started)
  useEffect(() => {
    if (!started) return;
    const el = document.querySelector(step.target);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [index, started, step.target]);

  // Animation loop for progress + auto-advance
  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    startedAtRef.current = performance.now() - elapsedRef.current;
    const tick = (now: number) => {
      const elapsed = now - startedAtRef.current;
      elapsedRef.current = elapsed;
      const p = Math.min(1, elapsed / step.duration);
      setProgress(p);
      if (p >= 1) {
        elapsedRef.current = 0;
        setProgress(0);
        if (index < STEPS.length - 1) {
          setIndex((i) => i + 1);
        } else {
          setPlaying(false);
        }
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, index, step.duration]);

  const start = () => {
    setStarted(true);
    setIndex(0);
    elapsedRef.current = 0;
    setProgress(0);
    setPlaying(true);
  };

  const toggle = () => setPlaying((p) => !p);

  const next = () => {
    elapsedRef.current = 0;
    setProgress(0);
    setIndex((i) => Math.min(STEPS.length - 1, i + 1));
  };

  const restart = () => {
    elapsedRef.current = 0;
    setProgress(0);
    setIndex(0);
    setPlaying(true);
    const el = document.querySelector(STEPS[0].target);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const exit = () => {
    setPlaying(false);
    setStarted(false);
    elapsedRef.current = 0;
    setProgress(0);
    setIndex(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      <Nav />
      <main>
        <Hero />
        <RecursiveFractalLoop />
        <LayerFeatures />
        <Dashboard />
      </main>
      <Footer />

      {/* Start overlay */}
      {!started && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/85 backdrop-blur-xl animate-fade-in">
          <div className="max-w-xl mx-4 text-center border border-border bg-background/80 rounded-2xl p-10 shadow-[0_0_60px_-10px_hsl(var(--primary)/0.4)]">
            <div className="eyebrow mb-4">// Visite guidée</div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Découvrez <span className="text-gradient">WatchMyAgents</span>
            </h1>
            <p className="text-muted-foreground mb-8">
              Une présentation automatique de 60 secondes qui parcourt les trois couches Watch,
              Guardian AI et Shield, puis My Fortress. Mettez en pause à tout moment.
            </p>
            <button
              onClick={start}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md font-mono text-sm uppercase tracking-widest bg-primary text-primary-foreground hover:opacity-90 transition glow-cyan"
            >
              <Play className="h-4 w-4" />
              Démarrer la présentation
            </button>
          </div>
        </div>
      )}

      {/* Narration overlay */}
      {started && (
        <div className="fixed inset-x-0 bottom-0 z-[55] pointer-events-none">
          <div className="max-w-3xl mx-auto px-4 pb-6">
            <div className="pointer-events-auto border border-border bg-background/85 backdrop-blur-xl rounded-2xl shadow-[0_0_60px_-10px_hsl(var(--primary)/0.5)] overflow-hidden">
              {/* progress bar */}
              <div className="h-1 bg-border/50">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent transition-[width] duration-100"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-1">
                      Étape {index + 1} / {STEPS.length}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-display font-bold leading-tight">
                      {step.title}
                    </h3>
                  </div>
                  <button
                    onClick={exit}
                    aria-label="Quitter la présentation"
                    className="shrink-0 h-8 w-8 inline-flex items-center justify-center rounded-md border border-border hover:border-primary hover:text-primary transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p
                  className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-5 animate-fade-in"
                  key={step.id}
                >
                  {step.body}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggle}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-mono text-xs uppercase tracking-widest bg-primary text-primary-foreground hover:opacity-90 transition"
                  >
                    {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    {playing ? "Pause" : "Reprendre"}
                  </button>
                  <button
                    onClick={next}
                    disabled={index >= STEPS.length - 1}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-mono text-xs uppercase tracking-widest border border-border hover:border-primary hover:text-primary transition disabled:opacity-40 disabled:hover:border-border disabled:hover:text-foreground"
                  >
                    Suivant
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={restart}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-mono text-xs uppercase tracking-widest border border-border hover:border-primary hover:text-primary transition"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Revoir
                  </button>
                  <div className="ml-auto hidden sm:flex items-center gap-1.5">
                    {STEPS.map((s, i) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          elapsedRef.current = 0;
                          setProgress(0);
                          setIndex(i);
                        }}
                        aria-label={`Aller à l'étape ${i + 1}`}
                        className={`h-1.5 rounded-full transition-all ${
                          i === index
                            ? "w-6 bg-primary"
                            : i < index
                              ? "w-1.5 bg-primary/60"
                              : "w-1.5 bg-border hover:bg-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
