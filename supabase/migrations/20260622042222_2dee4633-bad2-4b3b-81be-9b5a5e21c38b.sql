
-- 1. Avatars: add DELETE policy scoped to owner's folder
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 2. Avatars: remove broad public SELECT policy (public URLs still serve files in public buckets)
DROP POLICY IF EXISTS "Public avatar read" ON storage.objects;

-- Allow authenticated users to list only their own avatar folder
CREATE POLICY "Users can list own avatar folder"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 3. user_roles: prevent bootstrap privilege escalation
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;
CREATE POLICY "Only admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin')
  AND EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
);

-- 4. Revoke EXECUTE on trigger-only SECURITY DEFINER functions from client roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_deal_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Keep has_role and is_team_member callable (used by RLS policies)
-- Keep seed_default_pipeline callable by authenticated (called from client)
REVOKE EXECUTE ON FUNCTION public.seed_default_pipeline(uuid) FROM PUBLIC, anon;
