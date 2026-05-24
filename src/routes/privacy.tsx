import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/CTA";
import { ArrowLeft, Shield, Lock, Eye, Server } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy — WatchMyAgents" },
      {
        name: "description",
        content: "WatchMyAgents Privacy Policy — how we collect, use, and protect your data.",
      },
    ],
  }),
});

function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-10 font-mono"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <div className="mb-12">
            <div className="font-mono text-xs uppercase tracking-widest text-primary mb-4">
              // Legal
            </div>
            <h1 className="text-4xl md:text-5xl font-black leading-tight mb-6">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground text-lg">
              Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>

          <div className="space-y-14">
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">1. Overview</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                WatchMyAgents (“we”, “our”, “us”) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services. By accessing or using WatchMyAgents, you agree to the terms of this Privacy Policy.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Eye className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">2. Information We Collect</h2>
              </div>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  <strong className="text-foreground">Account Information:</strong> When you register for an account, we collect your email address, company name, and authentication credentials.
                </p>
                <p>
                  <strong className="text-foreground">Usage Data:</strong> We collect anonymized and pseudonymized signals about how you interact with our platform, including log data, device information, and agent behavior metadata.
                </p>
                <p>
                  <strong className="text-foreground">Agent Signals:</strong> Our systems process encrypted, anonymized security signals from your AI agents. We never collect raw PII, secrets, or proprietary business content from your agents.
                </p>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Lock className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">3. How We Use Your Information</h2>
              </div>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground leading-relaxed">
                <li>To provide, maintain, and improve our cybersecurity services</li>
                <li>To detect, prevent, and respond to security threats and anomalies</li>
                <li>To communicate with you about your account, updates, and security alerts</li>
                <li>To analyze aggregated, anonymized data for platform improvements</li>
                <li>To comply with legal obligations and enforce our terms</li>
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Server className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">4. Data Storage & Security</h2>
              </div>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Your logs stay inside your information system. Only encrypted, anonymized or pseudonymized signals are forwarded to WatchMyAgents — never raw PII, secrets or business content.
                </p>
                <p>
                  We implement industry-standard encryption in transit (TLS 1.3) and at rest (AES-256). Access to production systems is strictly controlled through role-based access controls (RBAC) and multi-factor authentication.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {["No raw PII", "Encrypted in transit", "Pseudonymized", "Customer-owned retention", "SIEM / GRC ready"].map((b) => (
                    <span key={b} className="text-xs font-mono uppercase tracking-widest px-3 py-1.5 rounded-full border border-primary/30 text-primary bg-primary/5">
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Data Sharing & Third Parties</h2>
              <p className="text-muted-foreground leading-relaxed">
                We do not sell your personal information. We may share anonymized, aggregated data with trusted partners for infrastructure hosting, analytics, and security operations. All third-party providers are bound by strict data processing agreements.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed">
                Depending on your jurisdiction, you may have the right to access, correct, delete, or export your personal data. To exercise these rights, contact us at <a href="mailto:minedor@watchmyagents.com" className="text-primary hover:underline">minedor@watchmyagents.com</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy periodically. We will notify you of material changes via email or through the platform. Continued use of our services after changes constitutes acceptance of the revised policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions about this Privacy Policy or our data practices, please contact us at <a href="mailto:minedor@watchmyagents.com" className="text-primary hover:underline">minedor@watchmyagents.com</a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
