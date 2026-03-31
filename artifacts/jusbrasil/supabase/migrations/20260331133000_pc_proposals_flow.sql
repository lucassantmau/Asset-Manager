ALTER TABLE public.pequenas_causas_submissions
  ADD COLUMN IF NOT EXISTS accepted_proposal_id uuid;

CREATE TABLE IF NOT EXISTS public.pequenas_causas_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.pequenas_causas_submissions(id) ON DELETE CASCADE,
  lawyer_id uuid NOT NULL REFERENCES public.lawyer_profiles(id) ON DELETE CASCADE,
  fee_percentage numeric(5,2),
  summary text,
  terms text,
  lawyer_name text,
  lawyer_oab text,
  lawyer_phone text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (submission_id, lawyer_id)
);

CREATE INDEX IF NOT EXISTS idx_pc_proposals_submission_id ON public.pequenas_causas_proposals (submission_id);
CREATE INDEX IF NOT EXISTS idx_pc_proposals_lawyer_id ON public.pequenas_causas_proposals (lawyer_id);

DO $proposal_fk$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pequenas_causas_submissions_accepted_proposal_id_fkey'
  ) THEN
    ALTER TABLE public.pequenas_causas_submissions
      ADD CONSTRAINT pequenas_causas_submissions_accepted_proposal_id_fkey
      FOREIGN KEY (accepted_proposal_id) REFERENCES public.pequenas_causas_proposals(id) ON DELETE SET NULL;
  END IF;
END $proposal_fk$;

ALTER TABLE public.pequenas_causas_proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pc_proposals_lawyer_select_own" ON public.pequenas_causas_proposals;
CREATE POLICY "pc_proposals_lawyer_select_own"
  ON public.pequenas_causas_proposals
  FOR SELECT
  TO authenticated
  USING (
    lawyer_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.pequenas_causas_submissions s
      WHERE s.id = submission_id
        AND lower(trim(s.autor_email)) = lower(trim(coalesce(auth.jwt() ->> 'email', auth.jwt() -> 'user_metadata' ->> 'email', '')))
    )
  );

DROP POLICY IF EXISTS "pc_proposals_lawyer_insert" ON public.pequenas_causas_proposals;
CREATE POLICY "pc_proposals_lawyer_insert"
  ON public.pequenas_causas_proposals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    lawyer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.lawyer_profiles lp
      WHERE lp.id = auth.uid() AND lp.registration_status = 'approved'
    )
  );

DROP POLICY IF EXISTS "pc_proposals_lawyer_update_own" ON public.pequenas_causas_proposals;
CREATE POLICY "pc_proposals_lawyer_update_own"
  ON public.pequenas_causas_proposals
  FOR UPDATE
  TO authenticated
  USING (lawyer_id = auth.uid())
  WITH CHECK (lawyer_id = auth.uid());

DROP POLICY IF EXISTS "pc_proposals_client_update_status" ON public.pequenas_causas_proposals;
CREATE POLICY "pc_proposals_client_update_status"
  ON public.pequenas_causas_proposals
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.pequenas_causas_submissions s
      WHERE s.id = submission_id
        AND lower(trim(s.autor_email)) = lower(trim(coalesce(auth.jwt() ->> 'email', auth.jwt() -> 'user_metadata' ->> 'email', '')))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.pequenas_causas_submissions s
      WHERE s.id = submission_id
        AND lower(trim(s.autor_email)) = lower(trim(coalesce(auth.jwt() ->> 'email', auth.jwt() -> 'user_metadata' ->> 'email', '')))
    )
  );
