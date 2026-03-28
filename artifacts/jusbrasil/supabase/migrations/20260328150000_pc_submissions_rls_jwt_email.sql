-- =============================================================================
-- RLS: e-mail do JWT às vezes vem só em user_metadata (ou claim vazio).
-- Reexecutar no SQL Editor se UPDATE do formulário falhar com "permission denied".
-- =============================================================================

DROP POLICY IF EXISTS "pc_submissions_select_own_email" ON public.pequenas_causas_submissions;
CREATE POLICY "pc_submissions_select_own_email"
  ON public.pequenas_causas_submissions
  FOR SELECT
  TO authenticated
  USING (
    lower(trim(autor_email)) = lower(trim(coalesce(
      auth.jwt() ->> 'email',
      auth.jwt() -> 'user_metadata' ->> 'email',
      ''
    )))
  );

DROP POLICY IF EXISTS "pc_submissions_update_own_email" ON public.pequenas_causas_submissions;
CREATE POLICY "pc_submissions_update_own_email"
  ON public.pequenas_causas_submissions
  FOR UPDATE
  TO authenticated
  USING (
    lower(trim(autor_email)) = lower(trim(coalesce(
      auth.jwt() ->> 'email',
      auth.jwt() -> 'user_metadata' ->> 'email',
      ''
    )))
  )
  WITH CHECK (
    lower(trim(autor_email)) = lower(trim(coalesce(
      auth.jwt() ->> 'email',
      auth.jwt() -> 'user_metadata' ->> 'email',
      ''
    )))
  );
