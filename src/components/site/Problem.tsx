import { AlertTriangle, KeyRound, Activity, Skull } from "lucide-react";

const threats = [
  { icon: KeyRound, title: "Data leaks", desc: "Prompt injection, exfiltration via tools, verbose logs leaking secrets and PII." },
  { icon: AlertTriangle, title: "Bad operational practices", desc: "Plaintext secrets, excessive permissions, no traceability across runs." },
  { icon: Activity, title: "Behavioral drift", desc: "Loops, action escalation, abnormal cost spikes, out-of-scope actions." },
  { icon: Skull, title: "Compromise & corruption", desc: "Hijacked tools, malicious instructions, agents taken hostage." },
];

export function Problem() {
  return (
    <section id="problem" className="relative py-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mb-16">
          <div className="font-mono text-xs uppercase tracking-widest text-primary mb-4">// The problem</div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            AI agents are the new <span className="text-gradient">attack surface</span>.
          </h2>
          <p className="text-muted-foreground text-lg">
            LLM + tools + actions introduce risks classic security stacks were never designed to see.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {threats.map((t, i) => (
            <div
              key={t.title}
              className="border-gradient rounded-xl p-6 relative overflow-hidden group hover:translate-y-[-4px] transition-transform"
            >
              <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition" />
              <div className="relative">
                <div className="font-mono text-xs text-muted-foreground mb-3">0{i + 1}</div>
                <t.icon className="h-7 w-7 text-primary mb-4" />
                <h3 className="font-display text-lg font-bold mb-2">{t.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
