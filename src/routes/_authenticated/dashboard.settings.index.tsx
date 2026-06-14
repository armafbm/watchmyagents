import { createFileRoute, Link } from "@tanstack/react-router";
import { UserCircle2, KeyRound, CreditCard, ChevronRight } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHeader, Panel } from "@/components/dashboard/primitives";

export const Route = createFileRoute("/_authenticated/dashboard/settings/")({
  head: () => ({
    meta: [{ title: "Settings — WatchMyAgents" }, { name: "robots", content: "noindex" }],
  }),
  component: SettingsHub,
});

type Item = {
  to: string;
  label: string;
  description: string;
  icon: typeof UserCircle2;
};

function SettingsHub() {
  const items: Item[] = [
    {
      to: "/dashboard/settings/profile",
      label: "Profile",
      description: "Your identity, display name, avatar.",
      icon: UserCircle2,
    },
    {
      to: "/dashboard/settings/keys",
      label: "API Keys",
      description: "Issue & revoke keys used by your agents.",
      icon: KeyRound,
    },
    {
      to: "/dashboard/settings/subscription",
      label: "Subscription",
      description: "Plan, billing and seats.",
      icon: CreditCard,
    },
  ];

  return (
    <DashboardLayout breadcrumb="Settings">
      <PageHeader
        kicker="CONFIGURATION"
        title="Fortress settings"
        subtitle="Tune your account, billing and security primitives."
      />

      <div className="grid md:grid-cols-2 gap-4">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Link key={it.to} to={it.to}>
              <Panel className="p-5 hover:border-primary/50 transition group">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-md bg-primary/10 border border-primary/30 grid place-items-center text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-base">{it.label}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{it.description}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
                </div>
              </Panel>
            </Link>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
