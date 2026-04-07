-- Security hardening:
-- 1) Remove public read access from document buckets
-- 2) Mark document buckets as private
-- 3) Restrict payment-slot RPC execution to authenticated users only

-- ---------------------------------------------------------------------------
-- Bucket privacy
-- ---------------------------------------------------------------------------
UPDATE storage.buckets
SET public = false
WHERE id IN ('pequenas-causas-docs', 'case-documents');

-- ---------------------------------------------------------------------------
-- Remove public storage read policies
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "pc_docs_select_public" ON storage.objects;
DROP POLICY IF EXISTS "case_docs_select_public" ON storage.objects;

-- Keep authenticated read/write policies scoped by bucket
DROP POLICY IF EXISTS "pc_docs_select_authenticated" ON storage.objects;
CREATE POLICY "pc_docs_select_authenticated"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'pequenas-causas-docs');

DROP POLICY IF EXISTS "pc_docs_insert_authenticated" ON storage.objects;
CREATE POLICY "pc_docs_insert_authenticated"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'pequenas-causas-docs');

DROP POLICY IF EXISTS "pc_docs_update_authenticated" ON storage.objects;
CREATE POLICY "pc_docs_update_authenticated"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'pequenas-causas-docs')
  WITH CHECK (bucket_id = 'pequenas-causas-docs');

DROP POLICY IF EXISTS "case_docs_select_authenticated" ON storage.objects;
CREATE POLICY "case_docs_select_authenticated"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'case-documents');

DROP POLICY IF EXISTS "case_docs_insert_authenticated" ON storage.objects;
CREATE POLICY "case_docs_insert_authenticated"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'case-documents');

-- Optional but recommended to keep consistency with first bucket.
DROP POLICY IF EXISTS "case_docs_update_authenticated" ON storage.objects;
CREATE POLICY "case_docs_update_authenticated"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'case-documents')
  WITH CHECK (bucket_id = 'case-documents');

-- ---------------------------------------------------------------------------
-- Restrict RPC against email enumeration
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.can_open_new_case_form(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_open_new_case_form(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.can_open_new_case_form(text) TO authenticated;
