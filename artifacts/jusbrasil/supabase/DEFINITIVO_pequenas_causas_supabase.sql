-- =============================================================================
-- SCRIPT DEFINITIVO — Pequenas Causas Processos (Supabase)
-- =============================================================================
-- Como aplicar:
--   1. Supabase Dashboard → SQL Editor → New query
--   2. Colar este ficheiro inteiro
--   3. Run (uma vez; é idempotente na maior parte)
--
-- Pré-requisito: a tabela public.pequenas_causas_submissions já existir
-- (com pelo menos id, autor_email, e o que o teu backend já grava).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1) RPC: verificar pagamento antes de criar conta (página /criar-conta)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_pequenas_causas_payment(p_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.pequenas_causas_submissions s
    WHERE lower(trim(s.autor_email)) = lower(trim(p_email))
      AND coalesce(s.pagamento_confirmado, false) = true
  );
$$;

REVOKE ALL ON FUNCTION public.check_pequenas_causas_payment(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_pequenas_causas_payment(text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_pequenas_causas_payment(text) TO authenticated;


-- -----------------------------------------------------------------------------
-- 2) Colunas extra na submissão (formulário + área do cliente)
-- -----------------------------------------------------------------------------
ALTER TABLE public.pequenas_causas_submissions
  ADD COLUMN IF NOT EXISTS autor_cnpj text,
  ADD COLUMN IF NOT EXISTS reu_rg text,
  ADD COLUMN IF NOT EXISTS reu_telefone_2 text,
  ADD COLUMN IF NOT EXISTS incluir_testemunhas boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS envolve_veiculo boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS links_midia text,
  ADD COLUMN IF NOT EXISTS links_documentais text,
  ADD COLUMN IF NOT EXISTS pedido_ref text,
  ADD COLUMN IF NOT EXISTS protocolo text;

COMMENT ON COLUMN public.pequenas_causas_submissions.links_midia IS 'JSON array ou texto JSON — vídeo/áudio';
COMMENT ON COLUMN public.pequenas_causas_submissions.links_documentais IS 'JSON array ou texto JSON — provas documentais';
COMMENT ON COLUMN public.pequenas_causas_submissions.pedido_ref IS 'Protocolo / ref. exibida ao cliente (ex. PCC-xxx, checkout)';
COMMENT ON COLUMN public.pequenas_causas_submissions.protocolo IS 'Opcional: duplicado semântico de pedido_ref se quiseres coluna separada';

CREATE INDEX IF NOT EXISTS idx_pequenas_causas_submissions_autor_email
  ON public.pequenas_causas_submissions (lower(trim(autor_email)));


-- -----------------------------------------------------------------------------
-- 3) RLS — cliente só lê/atualiza a linha do próprio e-mail (JWT + user_metadata)
-- -----------------------------------------------------------------------------
ALTER TABLE public.pequenas_causas_submissions ENABLE ROW LEVEL SECURITY;

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


-- -----------------------------------------------------------------------------
-- 4) Storage — bucket formulário (pequenas-causas-docs)
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('pequenas-causas-docs', 'pequenas-causas-docs', true)
ON CONFLICT (id) DO NOTHING;

DO $size$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'storage' AND table_name = 'buckets' AND column_name = 'file_size_limit'
  ) THEN
    UPDATE storage.buckets SET file_size_limit = 5242880 WHERE id = 'pequenas-causas-docs';
  END IF;
END $size$;

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

DROP POLICY IF EXISTS "pc_docs_select_public" ON storage.objects;
CREATE POLICY "pc_docs_select_public"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'pequenas-causas-docs');


-- -----------------------------------------------------------------------------
-- 5) Storage — bucket uploads extra (case-documents)
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('case-documents', 'case-documents', true)
ON CONFLICT (id) DO NOTHING;

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

DROP POLICY IF EXISTS "case_docs_select_public" ON storage.objects;
CREATE POLICY "case_docs_select_public"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'case-documents');


-- -----------------------------------------------------------------------------
-- 6) Advogados — tabela + RLS + trigger em auth.users
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lawyer_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text NOT NULL,
  oab text NOT NULL,
  phone text NOT NULL,
  cep text,
  state text,
  city text,
  address_street text,
  address_number text,
  address_complement text,
  registration_status text NOT NULL DEFAULT 'pending'
    CHECK (registration_status IN ('pending', 'approved', 'rejected')),
  terms_accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lawyer_profiles_oab ON public.lawyer_profiles (oab);

ALTER TABLE public.lawyer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lawyer_profiles_select_own" ON public.lawyer_profiles;
CREATE POLICY "lawyer_profiles_select_own"
  ON public.lawyer_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "lawyer_profiles_insert_own" ON public.lawyer_profiles;
CREATE POLICY "lawyer_profiles_insert_own"
  ON public.lawyer_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "lawyer_profiles_update_own" ON public.lawyer_profiles;
CREATE POLICY "lawyer_profiles_update_own"
  ON public.lawyer_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_lawyer_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.raw_user_meta_data->>'user_role') = 'lawyer' THEN
    INSERT INTO public.lawyer_profiles (
      id,
      full_name,
      oab,
      phone,
      cep,
      state,
      city,
      address_street,
      address_number,
      address_complement,
      terms_accepted_at
    )
    VALUES (
      NEW.id,
      coalesce(nullif(trim(NEW.raw_user_meta_data->>'full_name'), ''), '(pendente)'),
      coalesce(nullif(trim(NEW.raw_user_meta_data->>'oab'), ''), '—'),
      coalesce(nullif(trim(NEW.raw_user_meta_data->>'phone'), ''), '—'),
      nullif(trim(NEW.raw_user_meta_data->>'cep'), ''),
      nullif(trim(NEW.raw_user_meta_data->>'state'), ''),
      nullif(trim(NEW.raw_user_meta_data->>'city'), ''),
      nullif(trim(NEW.raw_user_meta_data->>'address_street'), ''),
      nullif(trim(NEW.raw_user_meta_data->>'address_number'), ''),
      nullif(trim(NEW.raw_user_meta_data->>'address_complement'), ''),
      CASE
        WHEN (NEW.raw_user_meta_data->>'terms_accepted') = 'true' THEN now()
        ELSE NULL
      END
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_lawyer ON auth.users;
CREATE TRIGGER on_auth_user_created_lawyer
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_lawyer_user();


-- =============================================================================
-- Fim. Depois de correr: Settings → API → Reload schema (ou espera ~1 min)
-- para o PostgREST atualizar o cache (evita PGRST204 em colunas novas).
-- =============================================================================
