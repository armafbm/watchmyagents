import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, UserCircle2, Mail, Save, LogOut } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHeader, Panel } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/dashboard/settings/profile")({
  head: () => ({
    meta: [
      { title: "Profile — WatchMyAgents" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, signOut } = useAuth();
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [company, setCompany] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    setFullName(((meta.full_name as string) || (meta.name as string)) ?? "");
    setAvatarUrl((meta.avatar_url as string) ?? "");
    setCompany((meta.company as string) ?? "");
    setLoading(false);
  }, [user]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName, avatar_url: avatarUrl, company },
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated");
  };

  const initials = (fullName || user?.email || "??").slice(0, 2).toUpperCase();

  return (
    <DashboardLayout breadcrumb="Settings · Profile">
      <PageHeader
        kicker="ACCOUNT"
        title="Your profile"
        subtitle="Manage your identity inside the fortress. Visible to your team members."
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <Panel className="lg:col-span-1 p-6 flex flex-col items-center text-center">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-2xl font-display font-bold text-primary-foreground overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="mt-4 font-display text-lg">{fullName || "Unnamed operator"}</div>
          <div className="font-mono text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
            <Mail className="h-3 w-3" /> {user?.email}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-6 w-full"
            onClick={() => signOut().then(() => (window.location.href = "/"))}
          >
            <LogOut className="h-3.5 w-3.5 mr-2" /> Sign out
          </Button>
        </Panel>

        <Panel title="Identity" icon={UserCircle2} className="lg:col-span-2 p-6 space-y-5">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Arma Talkytranslate"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="TalkyTranslate"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatarUrl">Avatar URL</Label>
                <Input
                  id="avatarUrl"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://…"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email ?? ""} disabled />
                <p className="text-xs text-muted-foreground">
                  Email is tied to your Google identity and cannot be changed here.
                </p>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={save} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save profile
                </Button>
              </div>
            </>
          )}
        </Panel>
      </div>
    </DashboardLayout>
  );
}
