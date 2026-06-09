
DROP POLICY IF EXISTS avatars_authenticated_read ON storage.objects;
CREATE POLICY avatars_owner_read ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );
