-- Fix handle_new_user trigger to pick up GitHub OAuth username fields
-- GitHub sends: name, preferred_username, user_name (not full_name)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.customers (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      NULLIF(NEW.raw_user_meta_data->>'preferred_username', ''),
      NULLIF(NEW.raw_user_meta_data->>'user_name', '')
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Backfill existing users whose display_name is null due to GitHub sign-up
UPDATE public.customers c
SET display_name = COALESCE(
  NULLIF(u.raw_user_meta_data->>'full_name', ''),
  NULLIF(u.raw_user_meta_data->>'name', ''),
  NULLIF(u.raw_user_meta_data->>'preferred_username', ''),
  NULLIF(u.raw_user_meta_data->>'user_name', '')
)
FROM auth.users u
WHERE c.id = u.id
  AND c.display_name IS NULL
  AND COALESCE(
    NULLIF(u.raw_user_meta_data->>'full_name', ''),
    NULLIF(u.raw_user_meta_data->>'name', ''),
    NULLIF(u.raw_user_meta_data->>'preferred_username', ''),
    NULLIF(u.raw_user_meta_data->>'user_name', '')
  ) IS NOT NULL;
