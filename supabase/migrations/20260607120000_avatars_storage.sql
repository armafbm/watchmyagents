-- ─────────────────────────────────────────────────────────────────────────
-- Avatars architecture — long-term solution (2026-06-07)
-- ─────────────────────────────────────────────────────────────────────────
--
-- Before this migration:
--   - Avatars were stored as base64 data URLs in auth.users.user_metadata.avatar_url
--   - A single ~2MB image inflated the JWT to 100KB+ → HTTP 431 +
--     ERR_CONNECTION_RESET because the JWT travels in the Authorization
--     header of every server-fn call. Production was effectively broken.
--
-- After this migration:
--   - Custom uploads land in the public.avatars Storage bucket, keyed by
--     auth.uid()/avatar.<ext> so RLS can scope writes to the owner.
--   - The customers row carries the canonical avatar_url (Storage public
--     URL OR external URL from the OAuth provider). user_metadata stays
--     empty so the JWT stays tiny.
--   - The handle_new_user trigger seeds customers.avatar_url from Google
--     OAuth's raw_user_meta_data.avatar_url on signup (Google sends a
--     ~80-char URL, never base64).
--
-- Backwards compatible: all changes are additive. Existing rows keep
-- working. The frontend will fall back to the legacy user_metadata path
-- when customers.avatar_url is NULL so old sessions don't break.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. customers.avatar_url column
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS avatar_url text;

COMMENT ON COLUMN public.customers.avatar_url IS
  'Canonical avatar URL. Either a Supabase Storage public URL (custom upload) or an OAuth provider URL (Google etc.). Replaces the legacy auth.users.user_metadata.avatar_url to keep JWTs small.';

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Updated handle_new_user trigger
-- ─────────────────────────────────────────────────────────────────────────
--
-- Seeds customers row with email, display_name, and avatar_url drawn
-- from the OAuth provider's metadata. SECURITY DEFINER + pinned
-- search_path keeps us safe from search-path hijacking.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.customers (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Storage bucket for avatars
-- ─────────────────────────────────────────────────────────────────────────
--
-- Public-read so <img> tags can load directly without signed URLs. Writes
-- gated by RLS (next section).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2 * 1024 * 1024, -- 2 MB cap matches the UI input validation
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Storage RLS policies
-- ─────────────────────────────────────────────────────────────────────────
--
-- Convention: a user's avatar lives at <auth.uid()>/avatar.<ext>. RLS
-- pins writes to the owner; reads are public so any UI can display the
-- avatar via the public URL without needing a session.

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_owner_insert" ON storage.objects;
CREATE POLICY "avatars_owner_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
CREATE POLICY "avatars_owner_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;
CREATE POLICY "avatars_owner_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
