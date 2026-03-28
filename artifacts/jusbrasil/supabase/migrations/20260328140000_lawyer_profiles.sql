-- =============================================================================
-- Advogados — perfil e (opcional) vínculo com casos na tabela public.cases
-- Aplicar no SQL Editor do Supabase após revisar nomes de colunas em public.cases.
-- =============================================================================

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

-- Trigger: cria perfil ao cadastrar usuário com user_role = lawyer no metadata
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

-- Para vincular processos ao advogado no futuro, adicione manualmente (ex.):
-- ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS assigned_lawyer_id uuid REFERENCES public.lawyer_profiles(id);
-- e políticas RLS adequadas sem quebrar INSERTs existentes.
