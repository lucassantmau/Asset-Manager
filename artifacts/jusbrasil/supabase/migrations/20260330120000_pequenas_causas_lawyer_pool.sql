-- =============================================================================
-- Pool de casos para advogados + colunas (executar depois de lawyer_profiles existir)
-- Idempotente. Se já correu DEFINITIVO_pequenas_causas_supabase.sql, só aplica o que faltar.
-- =============================================================================

ALTER TABLE public.pequenas_causas_submissions
  ADD COLUMN IF NOT EXISTS disponivel_para_advogados boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS assigned_lawyer_id uuid,
  ADD COLUMN IF NOT EXISTS formulario_enviado_em timestamptz;

CREATE INDEX IF NOT EXISTS idx_pc_submissions_lawyer_pool
  ON public.pequenas_causas_submissions (disponivel_para_advogados)
  WHERE disponivel_para_advogados = true AND assigned_lawyer_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_pc_submissions_assigned_lawyer
  ON public.pequenas_causas_submissions (assigned_lawyer_id);

DO $fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pequenas_causas_submissions_assigned_lawyer_id_fkey'
  ) THEN
    ALTER TABLE public.pequenas_causas_submissions
      ADD CONSTRAINT pequenas_causas_submissions_assigned_lawyer_id_fkey
      FOREIGN KEY (assigned_lawyer_id) REFERENCES public.lawyer_profiles (id) ON DELETE SET NULL;
  END IF;
END $fk$;

DROP POLICY IF EXISTS "pc_submissions_select_lawyer_pool" ON public.pequenas_causas_submissions;
CREATE POLICY "pc_submissions_select_lawyer_pool"
  ON public.pequenas_causas_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lawyer_profiles lp
      WHERE lp.id = auth.uid() AND lp.registration_status = 'approved'
    )
    AND (
      (
        coalesce(disponivel_para_advogados, false) = true
        AND assigned_lawyer_id IS NULL
        AND coalesce(pagamento_confirmado, false) = true
      )
      OR assigned_lawyer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "pc_submissions_claim_lawyer" ON public.pequenas_causas_submissions;
CREATE POLICY "pc_submissions_claim_lawyer"
  ON public.pequenas_causas_submissions
  FOR UPDATE
  TO authenticated
  USING (
    assigned_lawyer_id IS NULL
    AND coalesce(disponivel_para_advogados, false) = true
    AND coalesce(pagamento_confirmado, false) = true
    AND EXISTS (
      SELECT 1 FROM public.lawyer_profiles lp
      WHERE lp.id = auth.uid() AND lp.registration_status = 'approved'
    )
  )
  WITH CHECK (
    assigned_lawyer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.lawyer_profiles lp
      WHERE lp.id = auth.uid() AND lp.registration_status = 'approved'
    )
  );
