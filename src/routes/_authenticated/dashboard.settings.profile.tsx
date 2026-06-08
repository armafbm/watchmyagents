import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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

function ProfilePage() {
  const { user, signOut } = useAuth();
  const profile = useUserProfile();
  const queryClient = useQueryClient();
  const [fields, setFields] = useState<ProfileFields>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Email change
  const [newEmail, setNewEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  useEffect(() => {
    if (!user) return;
    const m = (user.user_metadata ?? {}) as Record<string, unknown>;
    // Avatar comes from public.customers (canonical) with fallback to
    // user_metadata for legacy sessions. resolveAvatarUrl rejects base64
    // dataURLs so the bloated form never renders. Everything else (name,
    // job_title, etc.) stays in user_metadata — those fields are small
    // and changing the schema is out of scope for this PR.
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

  const save = async () => {
    setSaving(true);
    // avatar_url lives in public.customers (long-term storage) — never
    // ship it back into user_metadata, otherwise we re-bloat the JWT
    // every time the user clicks save. Other fields stay in
    // user_metadata for now (small, name/job/etc.); display_name is
    // mirrored into customers so the topbar can read it via
    // useUserProfile without a second query.

    const { avatar_url, ...metaFields } = fields;
    const { error } = await supabase.auth.updateUser({ data: metaFields });
    if (!error && user) {
      // Mirror display_name into customers so the rest of the app gets
      // it via useUserProfile (single source of truth).
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

    // 1. Upload to the public `avatars` bucket at <uid>/avatar.<ext>.
    //    RLS only lets the user write under their own uid folder.
    //    upsert=true so re-uploading replaces the previous file.
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const path = `${user.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, cacheControl: "3600", contentType: file.type });
    if (upErr) return toast.error(upErr.message);

    // 2. Resolve the public URL + cache-bust so the new image shows
    //    immediately without waiting for CDN/browser cache to expire.
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${publicUrl}?t=${Date.now()}`;

    // 3. Persist the URL in public.customers (canonical store). The old
    //    user_metadata.avatar_url is left untouched here — the resolver
    //    prefers customers.avatar_url so it wins anyway. We also clear
    //    any legacy base64 in user_metadata so it stops bloating the
    //    next refreshed JWT.
    const { error: dbErr } = await supabase
      .from("customers")
      .update({ avatar_url: url })
      .eq("id", user.id);
    if (dbErr) return toast.error(dbErr.message);

    const legacy = (user.user_metadata ?? {}) as Record<string, unknown>;
    if (typeof legacy.avatar_url === "string" && legacy.avatar_url.startsWith("data:")) {
      // Best-effort cleanup of the legacy bloat. Don't surface failures —
      // the UX-relevant write (Storage + customers) already succeeded.
      await supabase.auth.updateUser({ data: { avatar_url: null } }).catch(() => undefined);
    }

    // 4. Optimistically refresh local state + invalidate the React Query
    //    cache so the topbar avatar re-renders with the new URL.
    set("avatar_url", url);
    queryClient.invalidateQueries({ queryKey: ["user-profile", user.id] });
    toast.success("Avatar updated");
  };

  const initials = (fields.full_name || user?.email || "??").slice(0, 2).toUpperCase();

  return (
    <DashboardLayout breadcrumb="Settings · Profile">
      <PageHeader
        kicker="ACCOUNT"
        title="Your profile"
        subtitle="Identity, role and contact details. Visible to your team and operators."
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Identity card */}
        <Panel className="lg:col-span-1 p-6 flex flex-col items-center text-center">
          <div className="h-28 w-28 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-3xl font-display font-bold text-primary-foreground overflow-hidden">
            {fields.avatar_url ? (
              <img src={fields.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>

          <label className="mt-4 w-full">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleAvatarUpload(f);
              }}
            />
            <Button asChild variant="outline" size="sm" className="w-full cursor-pointer">
              <span>Upload photo</span>
            </Button>
          </label>

          <div className="mt-5 font-display text-lg">{fields.full_name || "Unnamed operator"}</div>
          {fields.job_title && (
            <div className="text-sm text-muted-foreground">{fields.job_title}</div>
          )}
          {fields.company && (
            <div className="text-xs text-muted-foreground mt-0.5">{fields.company}</div>
          )}

          <div className="font-mono text-xs text-muted-foreground flex items-center gap-1.5 mt-3">
            <Mail className="h-3 w-3" /> {user?.email}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="mt-6 w-full"
            onClick={async () => {
              await signOut();
              window.location.replace("/");
            }}
          >
            <LogOut className="h-3.5 w-3.5 mr-2" /> Sign out
          </Button>
        </Panel>

        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          <Panel title="Identity" icon={UserCircle2} className="p-6 space-y-5">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full name</Label>
                    <Input
                      id="full_name"
                      value={fields.full_name}
                      onChange={(e) => set("full_name", e.target.value)}
                      placeholder="Arma Talkytranslate"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth" className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> Date of birth
                    </Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={fields.date_of_birth}
                      onChange={(e) => set("date_of_birth", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    rows={3}
                    value={fields.bio}
                    onChange={(e) => set("bio", e.target.value)}
                    placeholder="Short pitch — what you do, what you're protecting."
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" /> Phone
                    </Label>
                    <Input
                      id="phone"
                      value={fields.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      placeholder="+33 6 ..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location" className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" /> Location
                    </Label>
                    <Input
                      id="location"
                      value={fields.location}
                      onChange={(e) => set("location", e.target.value)}
                      placeholder="Paris, FR"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" /> Website
                  </Label>
                  <Input
                    id="website"
                    value={fields.website}
                    onChange={(e) => set("website", e.target.value)}
                    placeholder="https://…"
                  />
                </div>
              </>
            )}
          </Panel>

          <Panel title="Organization" icon={Building2} className="p-6 space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="job_title" className="flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" /> Job title
                </Label>
                <Input
                  id="job_title"
                  value={fields.job_title}
                  onChange={(e) => set("job_title", e.target.value)}
                  placeholder="Head of AI Security"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={fields.company}
                  onChange={(e) => set("company", e.target.value)}
                  placeholder="TalkyTranslate"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="team">Team / Department</Label>
                <Input
                  id="team"
                  value={fields.team}
                  onChange={(e) => set("team", e.target.value)}
                  placeholder="Platform · SecOps"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Member management (invitations, roles) lives under{" "}
              <span className="font-mono">Settings → Subscription</span> once your plan supports
              seats.
            </p>
          </Panel>

          <div className="flex justify-end">
            <Button onClick={save} disabled={saving || loading} size="lg">
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save profile
            </Button>
          </div>

          <Panel title="Email address" icon={AtSign} className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Changing your email sends confirmation links to BOTH your current and new inbox.
                Both must be clicked.
              </p>
            </div>
            <Separator />
            <div className="flex justify-end">
              <Button
                variant="outline"
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
        </div>
      </div>
    </DashboardLayout>
  );
}
