import { Lock } from "lucide-react";

export function Privacy() {
  return (
    <section id="privacy" className="relative py-14 scroll-mt-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="border-gradient rounded-3xl p-10 md:p-14 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
          <Lock className="h-8 w-8 text-primary mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Privacy by design.
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl">
            Your logs stay inside your information system. Only encrypted, anonymized or
            pseudonymized signals are forwarded to WatchMyAgents — never raw PII, secrets
            or business content. On serious threats, deeper investigation is requested
            through the channels <em>you</em> define.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {["No raw PII", "Encrypted in transit", "Pseudonymized", "Customer-owned retention", "SIEM / GRC ready"].map((b) => (
              <span key={b} className="text-xs font-mono uppercase tracking-widest px-3 py-1.5 rounded-full border border-primary/30 text-primary bg-primary/5">
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
