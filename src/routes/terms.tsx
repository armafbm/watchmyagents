import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/CTA";
import { ArrowLeft, FileText, Scale, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Terms of Service — WatchMyAgents" },
      {
        name: "description",
        content: "WatchMyAgents Terms of Service — the rules and guidelines for using our platform.",
      },
    ],
  }),
});

function TermsPage() {
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
              Terms of Service
            </h1>
            <p className="text-muted-foreground text-lg">
              Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>

          <div className="space-y-14">
            <section>
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">1. Acceptance of Terms</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using WatchMyAgents (“the Service”), you agree to be bound by these Terms of Service (“Terms”). If you do not agree to these Terms, you may not access or use the Service. These Terms constitute a legally binding agreement between you and WatchMyAgents.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <Scale className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">2. Description of Service</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                WatchMyAgents provides cybersecurity monitoring, threat detection, and adaptive security policy enforcement for AI agents in production. The Service includes the Watch observation layer, the Shield enforcement layer, the Guardian AI analysis engine, and the Legions collective intelligence network.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. Account Registration</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  To use certain features of the Service, you must register for an account. You agree to provide accurate, current, and complete information during registration and to keep your account information updated.
                </p>
                <p>
                  You are responsible for safeguarding your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Acceptable Use</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground leading-relaxed">
                <li>Violate any applicable laws, regulations, or third-party rights</li>
                <li>Attempt to gain unauthorized access to any part of the Service or other users' accounts</li>
                <li>Interfere with or disrupt the integrity or performance of the Service</li>
                <li>Transmit any malicious code, viruses, or harmful software</li>
                <li>Reverse engineer, decompile, or disassemble any aspect of the Service</li>
                <li>Use the Service to attack, scan, or compromise systems you do not own or have explicit permission to test</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                All content, features, and functionality of the Service — including but not limited to software, algorithms, dashboards, visual designs, text, graphics, and logos — are owned by WatchMyAgents and protected by intellectual property laws. You are granted a limited, non-exclusive, non-transferable license to use the Service in accordance with these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Data & Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your use of the Service is also governed by our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>, which explains how we collect, use, and protect your information. By using the Service, you consent to the practices described in the Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Payment & Subscription</h2>
              <p className="text-muted-foreground leading-relaxed">
                Certain features of the Service may require payment. All fees are exclusive of taxes unless otherwise stated. Subscription fees are billed in advance on a recurring basis. You may cancel your subscription at any time, but no refunds will be provided for partial billing periods.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">8. Limitation of Liability</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                To the maximum extent permitted by law, WatchMyAgents shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Service. Our total liability shall not exceed the amount you paid to us in the twelve (12) months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may suspend or terminate your access to the Service at any time, with or without cause, and with or without notice. Upon termination, all licenses granted to you under these Terms will immediately cease, and you must discontinue all use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">10. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of France, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be resolved exclusively in the courts of Paris, France.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">11. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these Terms at any time. Material changes will be notified via email or through the platform. Your continued use of the Service after changes constitutes acceptance of the revised Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">12. Contact</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions about these Terms, please contact us at <a href="mailto:minedor@watchmyagents.com" className="text-primary hover:underline">minedor@watchmyagents.com</a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
