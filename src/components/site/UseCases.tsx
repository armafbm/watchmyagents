import { Code2, Headphones, Building2, Network } from "lucide-react";
import legions from "@/assets/wma-legions.png";

const cases = [
  { i: Code2, t: "Coding agents", d: "Tool-using agents writing, deploying and altering code." },
  { i: Headphones, t: "Customer support", d: "Agents touching PII, tickets and customer history." },
  { i: Building2, t: "Internal ops", d: "Finance, HR, ops agents with access to sensitive systems." },
  { i: Network, t: "Multi-agent platforms", d: "Swarms, orchestrators and complex agent workflows." },
];

export function UseCases() {
  return (
    <section className="relative py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mb-12">
          <div className="font-mono text-xs uppercase tracking-widest text-primary mb-4">// Built for</div>
          <h2 className="text-4xl md:text-5xl font-bold">
            Every agent class. <span className="text-gradient">Every risk profile.</span>
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {cases.map((c) => (
            <div key={c.t} className="rounded-xl border border-border bg-card/50 backdrop-blur p-6 hover:border-primary/60 transition">
              <c.i className="h-6 w-6 text-primary mb-4 icon-neon-glow" />
              <h3 className="font-display font-bold mb-2">{c.t}</h3>
              <p className="text-sm text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>

        <div className="border-gradient rounded-2xl p-8 md:p-12 grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-center">
          <div className="flex justify-center">
            <img
              src={legions}
              alt="WatchMyAgents legions — agent fleet management"
              loading="lazy"
              className="w-full max-w-md h-auto object-contain animate-float"
            />
          </div>
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-primary mb-4">
              // Agents fleet management
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Command your <span className="text-gradient">LEGIONS</span>.
            </h3>
            <p className="text-muted-foreground text-lg">
              Organize agents into squads by team — Customer Services, HR, Marketing, Dev Team.
              Apply policies, monitor hygiene and orchestrate the whole fleet from a single
              command center.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
