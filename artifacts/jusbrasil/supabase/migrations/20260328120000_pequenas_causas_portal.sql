-- =============================================================================
-- Pequenas causas — portal do cliente (Supabase / Postgres)
-- Como aplicar: Supabase Dashboard → SQL Editor → New query → colar tudo → Run
--
-- Requisito: a tabela public.pequenas_causas_submissions já deve existir
-- (colunas comuns: id, autor_email, pagamento_confirmado, arquivos_urls, …).
-- =============================================================================

-- Verificação de pagamento antes do cadastro (papel anon não enxerga a tabela com RLS)
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

-- Colunas usadas pelo formulário / área logada (ignora se já existirem)
ALTER TABLE public.pequenas_causas_submissions
  ADD COLUMN IF NOT EXISTS autor_cnpj text,
  ADD COLUMN IF NOT EXISTS reu_rg text,
  ADD COLUMN IF NOT EXISTS reu_telefone_2 text,
  ADD COLUMN IF NOT EXISTS incluir_testemunhas boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS envolve_veiculo boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS links_midia text,
  ADD COLUMN IF NOT EXISTS links_documentais text,
  ADD COLUMN IF NOT EXISTS pedido_ref text;

COMMENT ON COLUMN public.pequenas_causas_submissions.links_midia IS 'JSON array de URLs (Drive, etc.) — vídeo/áudio';
COMMENT ON COLUMN public.pequenas_causas_submissions.links_documentais IS 'JSON array de URLs — provas documentais';
COMMENT ON COLUMN public.pequenas_causas_submissions.pedido_ref IS 'ID exibido ao cliente (ex.: id do checkout)';

-- Índice para login / listagem por e-mail
CREATE INDEX IF NOT EXISTS idx_pequenas_causas_submissions_autor_email
  ON public.pequenas_causas_submissions (lower(trim(autor_email)));

-- -----------------------------------------------------------------------------
-- RLS: quem está logado (Supabase Auth) só lê e atualiza a própria linha pelo e-mail
-- -----------------------------------------------------------------------------

ALTER TABLE public.pequenas_causas_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pc_submissions_select_own_email" ON public.pequenas_causas_submissions;
CREATE POLICY "pc_submissions_select_own_email"
  ON public.pequenas_causas_submissions
  FOR SELECT
  TO authenticated
  USING (
    lower(trim(autor_email))
    = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
  );

DROP POLICY IF EXISTS "pc_submissions_update_own_email" ON public.pequenas_causas_submissions;
CREATE POLICY "pc_submissions_update_own_email"
  ON public.pequenas_causas_submissions
  FOR UPDATE
  TO authenticated
  USING (
    lower(trim(autor_email))
    = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
  )
  WITH CHECK (
    lower(trim(autor_email))
    = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
  );

-- INSERT costuma vir do backend (service_role) ao confirmar pagamento — não liberamos INSERT anônimo aqui.
-- Se precisar de INSERT pelo app com usuário autenticado, crie outra política ou use Edge Function com service_role.

-- -----------------------------------------------------------------------------
-- Storage: bucket de documentos do formulário
-- -----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('pequenas-causas-docs', 'pequenas-causas-docs', true)
ON CONFLICT (id) DO NOTHING;

-- Limite 5 MB no bucket (somente se a coluna existir)
DO $size$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'storage' AND table_name = 'buckets' AND column_name = 'file_size_limit'
  ) THEN
    UPDATE storage.buckets SET file_size_limit = 5242880 WHERE id = 'pequenas-causas-docs';
  END IF;
END $size$;

-- Políticas no bucket pequenas-causas-docs
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

-- Leitura pública (URLs getPublicUrl no front)
DROP POLICY IF EXISTS "pc_docs_select_public" ON storage.objects;
CREATE POLICY "pc_docs_select_public"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'pequenas-causas-docs');

-- -----------------------------------------------------------------------------
-- Storage: bucket "case-documents" (upload complementar na área do cliente)
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

-- =============================================================================
-- Fim. Se algum DROP POLICY falhar com "policy does not exist", pode ignorar
-- na primeira execução, ou rodar de novo (já usamos IF EXISTS no nome errado — 
-- no PG, DROP POLICY IF EXISTS está ok desde PG 9.x para policy name).
-- =============================================================================
