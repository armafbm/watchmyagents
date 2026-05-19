import { Code2, Headphones, Building2, Network } from "lucide-react";

const cases = [
  { i: Code2, t: "Coding agents", d: "Tool-using agents writing, deploying and altering code." },
  { i: Headphones, t: "Customer support", d: "Agents touching PII, tickets and customer history." },
  { i: Building2, t: "Internal ops", d: "Finance, HR, ops agents with access to sensitive systems." },
  { i: Network, t: "Multi-agent platforms", d: "Swarms, orchestrators and complex agent workflows." },
];

export function UseCases() {
  return (
    <section className="relative py-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mb-12">
          <div className="font-mono text-xs uppercase tracking-widest text-primary mb-4">// Built for</div>
          <h2 className="text-4xl md:text-5xl font-bold">
            Every agent class. <span className="text-gradient">Every risk profile.</span>
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cases.map((c) => (
            <div key={c.t} className="rounded-xl border border-border bg-card/50 backdrop-blur p-6 hover:border-primary/60 transition">
              <c.i className="h-6 w-6 text-primary mb-4" />
              <h3 className="font-display font-bold mb-2">{c.t}</h3>
              <p className="text-sm text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
