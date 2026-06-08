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

  // Email change
  const [newEmail, setNewEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  useEffect(() => {
    if (!user) return;
    const m = (user.user_metadata ?? {}) as Record<string, unknown>;
    const canonicalAvatar = resolveAvatarUrl(profile.data ?? null, user);
    setFields({
      full_name: ((m.full_name as string) || (m.name as string)) ?? "",
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
    setNewEmail(user.email ?? "");
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

  const changeEmail = async () => {
    if (!newEmail || newEmail === user?.email) {
      return toast.info("Enter a different email to change it.");
    }
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setSavingEmail(false);
    if (error) return toast.error(error.message);
    toast.success(
      "Confirmation email sent. Click the link in BOTH your old and new inbox to confirm.",
    );
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
          <Panel title="Email address" icon={AtSign} tag="LOGIN" className="p-0">
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Changing your email sends confirmation links to BOTH your current and new inbox.
                </p>
              </div>
              <Separator />
              <Button
                variant="outline"
                className="w-full"
                onClick={changeEmail}
                disabled={savingEmail || newEmail === user?.email}
              >
                {savingEmail ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Send confirmation
              </Button>
            </div>
          </Panel>

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
                <span className="text-muted-foreground">Provider</span>
                <span className="font-mono text-xs">
                  {(user?.app_metadata?.provider as string) ?? "email"}
                </span>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </DashboardLayout>
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
