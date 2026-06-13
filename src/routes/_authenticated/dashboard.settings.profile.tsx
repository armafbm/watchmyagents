import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  UserCircle2,
  Mail,
  Save,
  LogOut,
  Briefcase,
  Building2,
  Phone,
  Calendar,
  MapPin,
  Globe,
  AtSign,
  Camera,
  ShieldCheck,
  Sparkles,
  Lock,
  KeyRound,
  Check,
  X,
  Link2,
  QrCode,
  Smartphone,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PageHeader, Panel } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useUserProfile, resolveAvatarUrl } from "@/hooks/use-user-profile";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/dashboard/settings/profile")({
  head: () => ({
    meta: [{ title: "Profile — WatchMyAgents" }, { name: "robots", content: "noindex" }],
  }),
  component: ProfilePage,
});

type ProfileFields = {
  full_name: string;
  job_title: string;
  company: string;
  team: string;
  phone: string;
  date_of_birth: string;
  location: string;
  website: string;
  bio: string;
  avatar_url: string;
};

const EMPTY: ProfileFields = {
  full_name: "",
  job_title: "",
  company: "",
  team: "",
  phone: "",
  date_of_birth: "",
  location: "",
  website: "",
  bio: "",
  avatar_url: "",
};

const COMPLETION_FIELDS: (keyof ProfileFields)[] = [
  "full_name",
  "job_title",
  "company",
  "phone",
  "location",
  "website",
  "bio",
  "avatar_url",
];

function ProfilePage() {
  const { user, signOut } = useAuth();
  const profile = useUserProfile();
  const queryClient = useQueryClient();
  const [fields, setFields] = useState<ProfileFields>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const m = (user.user_metadata ?? {}) as Record<string, unknown>;
    const canonicalAvatar = resolveAvatarUrl(profile.data ?? null, user);
    setFields({
      full_name: ((m.full_name as string) || (m.name as string) || (m.preferred_username as string) || (m.user_name as string)) ?? "",
      job_title: (m.job_title as string) ?? "",
      company: (m.company as string) ?? "",
      team: (m.team as string) ?? "",
      phone: (m.phone as string) ?? "",
      date_of_birth: (m.date_of_birth as string) ?? "",
      location: (m.location as string) ?? "",
      website: (m.website as string) ?? "",
      bio: (m.bio as string) ?? "",
      avatar_url: canonicalAvatar ?? "",
    });
    setLoading(false);
  }, [user, profile.data]);

  const set = <K extends keyof ProfileFields>(k: K, v: ProfileFields[K]) =>
    setFields((f) => ({ ...f, [k]: v }));

  const completion = useMemo(() => {
    const filled = COMPLETION_FIELDS.filter((k) => (fields[k] ?? "").toString().trim().length > 0)
      .length;
    return Math.round((filled / COMPLETION_FIELDS.length) * 100);
  }, [fields]);

  const save = async () => {
    setSaving(true);
    const { avatar_url, ...metaFields } = fields;
    void avatar_url;
    const { error } = await supabase.auth.updateUser({ data: metaFields });
    if (!error && user) {
      const display = fields.full_name?.trim() || null;
      const { error: dbErr } = await supabase
        .from("customers")
        .update({ display_name: display })
        .eq("id", user.id);
      if (!dbErr) {
        queryClient.invalidateQueries({ queryKey: ["user-profile", user.id] });
      }
    }
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    if (file.size > 2 * 1024 * 1024) return toast.error("Max 2 MB");
    setUploading(true);
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const path = `${user.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, cacheControl: "3600", contentType: file.type });
    if (upErr) {
      setUploading(false);
      return toast.error(upErr.message);
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${publicUrl}?t=${Date.now()}`;
    const { error: dbErr } = await supabase
      .from("customers")
      .update({ avatar_url: url })
      .eq("id", user.id);
    if (dbErr) {
      setUploading(false);
      return toast.error(dbErr.message);
    }
    const legacy = (user.user_metadata ?? {}) as Record<string, unknown>;
    if (typeof legacy.avatar_url === "string" && legacy.avatar_url.startsWith("data:")) {
      await supabase.auth.updateUser({ data: { avatar_url: null } }).catch(() => undefined);
    }
    set("avatar_url", url);
    queryClient.invalidateQueries({ queryKey: ["user-profile", user.id] });
    setUploading(false);
    toast.success("Avatar updated");
  };

  const initials = (fields.full_name || user?.email || "??")
    .split(/[ @._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("") || "??";

  const plan = profile.data?.plan ?? "FREE";

  return (
    <DashboardLayout breadcrumb="Settings · Profile">
      <PageHeader
        kicker="ACCOUNT"
        title="Your profile"
        subtitle="Identity, role and contact details. Visible to your team and operators."
        actions={
          <Button onClick={save} disabled={saving || loading} size="lg">
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save profile
          </Button>
        }
      />

      {/* Hero identity card with cover gradient */}
      <Panel className="overflow-hidden mb-6">
        <div
          className="relative h-32 -m-5 mb-0"
          style={{
            background:
              "radial-gradient(ellipse at 20% 0%, oklch(0.55 0.22 270 / 0.55), transparent 60%), radial-gradient(ellipse at 80% 100%, oklch(0.78 0.18 220 / 0.45), transparent 55%), linear-gradient(135deg, oklch(0.22 0.06 265), oklch(0.18 0.05 265))",
          }}
        >
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
        </div>

        <div className="relative flex flex-col md:flex-row md:items-end gap-5 -mt-14 px-1">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="h-28 w-28 rounded-2xl ring-4 ring-background bg-gradient-to-br from-primary to-accent grid place-items-center text-3xl font-display font-bold text-primary-foreground overflow-hidden shadow-[var(--shadow-card)]">
              {fields.avatar_url ? (
                <img src={fields.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <label
              className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-card border border-border/60 grid place-items-center cursor-pointer hover:bg-secondary transition-colors shadow-md"
              title="Upload photo"
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAvatarUpload(f);
                }}
              />
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <Camera className="h-4 w-4 text-primary" />
              )}
            </label>
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-2xl font-bold tracking-tight truncate">
                {fields.full_name || "Unnamed operator"}
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border border-primary/40 text-primary bg-primary/10">
                {plan}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {fields.job_title && (
                <span className="flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" /> {fields.job_title}
                </span>
              )}
              {fields.company && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> {fields.company}
                </span>
              )}
              {fields.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {fields.location}
                </span>
              )}
              <span className="font-mono text-xs flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {user?.email}
              </span>
            </div>
          </div>

          {/* Completion + signout */}
          <div className="flex flex-col items-stretch md:items-end gap-3 pb-1 md:min-w-[200px]">
            <div className="w-full">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-primary" /> Completion
                </span>
                <span className="text-primary">{completion}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-secondary/60 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${completion}%`,
                    background: "var(--gradient-primary)",
                    boxShadow: "var(--glow-cyan)",
                  }}
                />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await signOut();
                window.location.replace("/");
              }}
            >
              <LogOut className="h-3.5 w-3.5 mr-2" /> Sign out
            </Button>
          </div>
        </div>
      </Panel>

      {/* Form */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Panel title="Identity" icon={UserCircle2} tag="PERSONAL" className="p-0">
            {loading ? (
              <div className="p-6 flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : (
              <div className="p-6 space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field
                    id="full_name"
                    label="Full name"
                    value={fields.full_name}
                    onChange={(v) => set("full_name", v)}
                    placeholder="Arma Talkytranslate"
                  />
                  <Field
                    id="date_of_birth"
                    label="Date of birth"
                    icon={Calendar}
                    type="date"
                    value={fields.date_of_birth}
                    onChange={(v) => set("date_of_birth", v)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    rows={3}
                    value={fields.bio}
                    onChange={(e) => set("bio", e.target.value)}
                    placeholder="Short pitch — what you do, what you're protecting."
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Field
                    id="phone"
                    label="Phone"
                    icon={Phone}
                    value={fields.phone}
                    onChange={(v) => set("phone", v)}
                    placeholder="+33 6 ..."
                  />
                  <Field
                    id="location"
                    label="Location"
                    icon={MapPin}
                    value={fields.location}
                    onChange={(v) => set("location", v)}
                    placeholder="Paris, FR"
                  />
                </div>

                <Field
                  id="website"
                  label="Website"
                  icon={Globe}
                  value={fields.website}
                  onChange={(v) => set("website", v)}
                  placeholder="https://…"
                />
              </div>
            )}
          </Panel>

          <Panel title="Organization" icon={Building2} tag="WORK" className="p-0">
            <div className="p-6 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field
                  id="job_title"
                  label="Job title"
                  icon={Briefcase}
                  value={fields.job_title}
                  onChange={(v) => set("job_title", v)}
                  placeholder="Head of AI Security"
                />
                <Field
                  id="company"
                  label="Company"
                  value={fields.company}
                  onChange={(v) => set("company", v)}
                  placeholder="TalkyTranslate"
                />
                <div className="sm:col-span-2">
                  <Field
                    id="team"
                    label="Team / Department"
                    value={fields.team}
                    onChange={(v) => set("team", v)}
                    placeholder="Platform · SecOps"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground border-l-2 border-primary/40 pl-3">
                Member management (invitations, roles) lives under{" "}
                <span className="font-mono text-foreground">Settings → Subscription</span> once
                your plan supports seats.
              </p>
            </div>
          </Panel>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <EmailPanel user={user} />
          <SignInMethodsPanel user={user} />
          <TwoFactorPanel />
          <Panel title="Security" icon={ShieldCheck} tag="POSTURE" className="p-0">
            <div className="p-6 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-mono text-xs text-primary">{plan}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">User ID</span>
                <span className="font-mono text-[10px] truncate max-w-[140px]" title={user?.id}>
                  {user?.id?.slice(0, 8)}…
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Member since</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                </span>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ----------------------------------------------------------------
// Email panel — provider-aware
// ----------------------------------------------------------------
function EmailPanel({ user }: { user: ReturnType<typeof useAuth>["user"] }) {
  const identities = (user?.identities ?? []) as Array<{ provider: string }>;
  const hasGoogle = identities.some((i) => i.provider === "google");
  const hasEmail = identities.some((i) => i.provider === "email");
  const primaryProvider = (user?.app_metadata?.provider as string) ?? "email";
  const isGoogleOnly = hasGoogle && !hasEmail;

  const [newEmail, setNewEmail] = useState(user?.email ?? "");
  const [busy, setBusy] = useState(false);

  const sendConfirmation = async () => {
    if (!newEmail.trim() || newEmail === user?.email) return;
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Confirmation sent to both inboxes. Click both links to confirm.");
  };

  return (
    <Panel title="Email addresses" icon={AtSign} tag="LOGIN" className="p-0">
      <div className="p-6 space-y-4">
        {/* Primary email row */}
        <div className="flex items-center justify-between gap-2 py-2 border-b border-border/40">
          <div className="flex items-center gap-2 min-w-0">
            <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="font-mono text-sm truncate">{user?.email}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border border-primary/40 text-primary">
              Primary
            </span>
            <span className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border border-success/40 text-success">
              Verified
            </span>
            {hasGoogle && (
              <span className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground">
                Google
              </span>
            )}
          </div>
        </div>

        {isGoogleOnly ? (
          /* Google-only: email managed by Google */
          <div className="rounded-lg border border-border/40 bg-muted/20 p-3 flex items-start gap-2">
            <Lock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Your email is managed by Google. To change it, update your Google account
              or add a password below to enable email/password sign-in separately.
            </p>
          </div>
        ) : (
          /* Email/password: allow change */
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                New email address
              </Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new@email.com"
              />
              <p className="text-[11px] text-muted-foreground">
                Sends confirmation to both your current and new inbox.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={sendConfirmation}
              disabled={busy || !newEmail.trim() || newEmail === user?.email}
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Mail className="h-3.5 w-3.5 mr-2" />}
              Send confirmation
            </Button>
          </div>
        )}
      </div>
    </Panel>
  );
}

// ----------------------------------------------------------------
// Sign-in methods panel — GitHub-style
// ----------------------------------------------------------------
function SignInMethodsPanel({ user }: { user: ReturnType<typeof useAuth>["user"] }) {
  const identities = (user?.identities ?? []) as Array<{ provider: string; identity_data?: Record<string, unknown> }>;
  const hasGoogle = identities.some((i) => i.provider === "google");
  const hasGitHub = identities.some((i) => i.provider === "github");

  // Reliable password detection:
  // - user has an "email" identity (signed up with email+password), OR
  // - user_metadata.has_password=true (set via updateUser after OAuth sign-up)
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const hasPassword =
    identities.some((i) => i.provider === "email") ||
    meta.has_password === true;

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ next: "", confirm: "" });
  const [pwBusy, setPwBusy] = useState(false);
  // Local override: true once the user sets a password in this session
  const [sessionHasPassword, setSessionHasPassword] = useState(false);
  const effectiveHasPassword = hasPassword || sessionHasPassword;

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.next !== passwordForm.confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    if (passwordForm.next.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setPwBusy(true);
    const { error } = await supabase.auth.updateUser({
      password: passwordForm.next,
      data: { has_password: true },
    });
    if (!error) {
      // Refresh session so user_metadata reflects has_password=true
      await supabase.auth.refreshSession();
      setSessionHasPassword(true);
    }
    setPwBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(effectiveHasPassword ? "Password updated." : "Password set. You can now sign in with email + password.");
    setShowPasswordForm(false);
    setPasswordForm({ next: "", confirm: "" });
  };

  const linkGoogle = async () => {
    const { error } = await supabase.auth.linkIdentity({ provider: "google" } as any);
    if (error) toast.error(error.message);
  };

  const linkGitHub = async () => {
    const { error } = await supabase.auth.linkIdentity({ provider: "github" } as any);
    if (error) toast.error(error.message);
  };

  return (
    <Panel title="Sign-in methods" icon={KeyRound} tag="AUTH" className="p-0">
      <div className="p-6 space-y-3">

        {/* Google row */}
        <div className="flex items-center justify-between gap-3 py-2.5 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-full bg-white grid place-items-center border border-border/40 shrink-0">
              <svg viewBox="0 0 24 24" className="h-4 w-4">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium">Google</div>
              <div className="text-[11px] text-muted-foreground">
                {hasGoogle ? "Connected" : "Not connected"}
              </div>
            </div>
          </div>
          {hasGoogle ? (
            <span className="flex items-center gap-1 font-mono text-[10px] text-success">
              <Check className="h-3.5 w-3.5" /> Active
            </span>
          ) : (
            <button
              onClick={linkGoogle}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-primary hover:underline"
            >
              <Link2 className="h-3 w-3" /> Connect
            </button>
          )}
        </div>

        {/* GitHub row */}
        <div className="flex items-center justify-between gap-3 py-2.5 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-full bg-secondary/60 grid place-items-center border border-border/40 shrink-0">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-foreground">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium">GitHub</div>
              <div className="text-[11px] text-muted-foreground">
                {hasGitHub ? "Connected" : "Not connected"}
              </div>
            </div>
          </div>
          {hasGitHub ? (
            <span className="flex items-center gap-1 font-mono text-[10px] text-success">
              <Check className="h-3.5 w-3.5" /> Active
            </span>
          ) : (
            <button
              onClick={linkGitHub}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-primary hover:underline"
            >
              <Link2 className="h-3 w-3" /> Connect
            </button>
          )}
        </div>

        {/* Password row */}
        <div className="py-2.5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-full bg-secondary/60 grid place-items-center border border-border/40 shrink-0">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div>
                <div className="text-sm font-medium">Password</div>
                <div className="text-[11px] text-muted-foreground">
                  {effectiveHasPassword ? "Configured" : "Not set"}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowPasswordForm((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-primary hover:underline"
            >
              {showPasswordForm ? <X className="h-3 w-3" /> : null}
              {showPasswordForm ? "Cancel" : effectiveHasPassword ? "Change" : "Set password"}
            </button>
          </div>

          {showPasswordForm && (
            <form onSubmit={savePassword} className="space-y-2.5 border-t border-border/40 pt-3">
              <p className="text-[11px] text-muted-foreground">
                {effectiveHasPassword
                  ? "Set a new password for your account."
                  : "Set a password to sign in with your email in addition to Google."}
              </p>
              <div className="space-y-1">
                <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">New password</Label>
                <Input
                  type="password"
                  value={passwordForm.next}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, next: e.target.value }))}
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>
              <div className="space-y-1">
                <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Confirm password</Label>
                <Input
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, confirm: e.target.value }))}
                  autoComplete="new-password"
                />
              </div>
              {passwordForm.next && passwordForm.confirm && passwordForm.next !== passwordForm.confirm && (
                <p className="text-[11px] text-danger">Passwords don't match.</p>
              )}
              <Button
                type="submit"
                size="sm"
                className="w-full"
                disabled={pwBusy || !passwordForm.next || passwordForm.next !== passwordForm.confirm}
              >
                {pwBusy ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <KeyRound className="h-3.5 w-3.5 mr-2" />}
                {hasPassword ? "Update password" : "Set password"}
              </Button>
            </form>
          )}
        </div>

      </div>
    </Panel>
  );
}

// ----------------------------------------------------------------
// Two-factor authentication panel — TOTP enrollment & management
// ----------------------------------------------------------------
function TwoFactorPanel() {
  type TotpFactor = { id: string; friendly_name: string; created_at: string };
  const [factors, setFactors] = useState<TotpFactor[]>([]);
  const [step, setStep] = useState<"idle" | "confirming">("idle");
  const [enrollData, setEnrollData] = useState<{ factorId: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const loadFactors = async () => {
    try {
      const { data } = await supabase.auth.mfa.listFactors();
      setFactors((data?.totp ?? []) as TotpFactor[]);
    } catch {
      // MFA not enabled on this Supabase project — keep empty list
    }
  };

  useEffect(() => { void loadFactors(); }, []);

  const startEnroll = async () => {
    setBusy(true);
    // Clean up any leftover unverified factors before enrolling
    const { data: existing } = await supabase.auth.mfa.listFactors();
    const unverified = (existing?.totp ?? []).filter((f: any) => f.status === "unverified");
    await Promise.all(unverified.map((f: any) => supabase.auth.mfa.unenroll({ factorId: f.id })));

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Authenticator app",
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setEnrollData({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    setStep("confirming");
  };

  const confirmEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollData) return;
    setBusy(true);
    const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId: enrollData.factorId });
    if (chErr) { toast.error(chErr.message); setBusy(false); return; }
    const { error } = await supabase.auth.mfa.verify({
      factorId: enrollData.factorId,
      challengeId: challenge.id,
      code: code.replace(/\s/g, ""),
    });
    setBusy(false);
    if (error) { toast.error("Invalid code — try again."); setCode(""); return; }
    toast.success("Two-factor authentication enabled.");
    setStep("idle");
    setEnrollData(null);
    setCode("");
    await loadFactors();
  };

  const unenroll = async (factorId: string) => {
    if (factors.length <= 1) {
      toast.error("Two-factor authentication is mandatory — you cannot remove your last authenticator.");
      return;
    }
    if (!confirm("Remove this authenticator?")) return;
    setBusy(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Authenticator removed.");
    await loadFactors();
  };

  const cancel = () => {
    // Unenroll the pending (unverified) factor to keep DB clean
    if (enrollData) {
      supabase.auth.mfa.unenroll({ factorId: enrollData.factorId }).catch(() => undefined);
    }
    setStep("idle");
    setEnrollData(null);
    setCode("");
  };

  const isEnrolled = factors.length > 0;

  return (
    <Panel title="Two-factor authentication" icon={Smartphone} tag="MFA" className="p-0">
      <div className="p-6 space-y-4">
        {/* Idle — not enrolled */}
        {!isEnrolled && step === "idle" && (
          <>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Add an extra layer of security. After enabling, you'll need a code from your
              authenticator app (Google Authenticator, Authy, 1Password…) at every sign-in.
            </p>
            <Button variant="outline" size="sm" onClick={startEnroll} disabled={busy} className="w-full">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <QrCode className="h-3.5 w-3.5 mr-2" />}
              Set up authenticator app
            </Button>
          </>
        )}

        {/* Idle — enrolled */}
        {isEnrolled && step === "idle" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-success">
              <Check className="h-4 w-4 shrink-0" />
              <span>Authenticator app active</span>
            </div>
            {factors.map((f) => (
              <div key={f.id} className="flex items-center justify-between py-2 border-t border-border/40">
                <div>
                  <div className="text-sm font-medium">{f.friendly_name || "Authenticator app"}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    Added {new Date(f.created_at).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => unenroll(f.id)}
                  disabled={busy}
                  className="font-mono text-xs text-destructive hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {/* QR code + confirm step */}
        {step === "confirming" && enrollData && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Scan the QR code with your authenticator app, then enter the 6-digit code to confirm.
            </p>

            {/* qr_code from Supabase is already a data URI — use it directly */}
            <img
              src={enrollData.qr}
              alt="TOTP QR code"
              className="mx-auto w-44 h-44 rounded-xl bg-white p-2"
            />

            <details className="group">
              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground select-none">
                Can&apos;t scan? Enter the key manually
              </summary>
              <code className="block mt-2 font-mono text-[10px] break-all bg-muted/40 px-2 py-1.5 rounded border border-border/40">
                {enrollData.secret}
              </code>
            </details>

            <form onSubmit={confirmEnroll} className="space-y-3 border-t border-border/40 pt-4">
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Confirmation code
                </Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9 ]*"
                  maxLength={7}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="000 000"
                  autoComplete="one-time-code"
                  autoFocus
                  className="text-center tracking-[0.3em] text-lg font-mono"
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" className="flex-1" onClick={cancel}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="flex-1"
                  disabled={busy || code.replace(/\s/g, "").length < 6}
                >
                  {busy && <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />}
                  Activate
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Panel>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  icon: Icon,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  icon?: typeof Calendar;
}) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5"
      >
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
