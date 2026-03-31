-- Garante no banco: 1 formulário enviado por pagamento confirmado.
-- Para abrir novo formulário, precisa existir novo "slot" (nova linha paga).

CREATE OR REPLACE FUNCTION public.can_open_new_case_form(p_email text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_paid_count integer;
  v_submitted_count integer;
BEGIN
  SELECT count(*)
  INTO v_paid_count
  FROM public.pequenas_causas_submissions s
  WHERE lower(trim(s.autor_email)) = lower(trim(p_email))
    AND coalesce(s.pagamento_confirmado, false) = true;

  SELECT count(*)
  INTO v_submitted_count
  FROM public.pequenas_causas_submissions s
  WHERE lower(trim(s.autor_email)) = lower(trim(p_email))
    AND s.formulario_enviado_em IS NOT NULL;

  RETURN v_paid_count > v_submitted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.can_open_new_case_form(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_open_new_case_form(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_open_new_case_form(text) TO anon;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pc_submission_requires_payment_before_submit'
  ) THEN
    ALTER TABLE public.pequenas_causas_submissions
      ADD CONSTRAINT pc_submission_requires_payment_before_submit
      CHECK (
        formulario_enviado_em IS NULL
        OR coalesce(pagamento_confirmado, false) = true
      );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.guard_submission_form_slot()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_paid_count integer;
  v_other_submitted_count integer;
BEGIN
  -- Só valida quando o formulário está sendo efetivamente "enviado".
  IF NEW.formulario_enviado_em IS NOT NULL AND OLD.formulario_enviado_em IS NULL THEN
    IF coalesce(NEW.pagamento_confirmado, false) = false THEN
      RAISE EXCEPTION 'Pagamento não confirmado para este formulário.';
    END IF;

    SELECT count(*)
    INTO v_paid_count
    FROM public.pequenas_causas_submissions s
    WHERE lower(trim(s.autor_email)) = lower(trim(NEW.autor_email))
      AND coalesce(s.pagamento_confirmado, false) = true;

    SELECT count(*)
    INTO v_other_submitted_count
    FROM public.pequenas_causas_submissions s
    WHERE lower(trim(s.autor_email)) = lower(trim(NEW.autor_email))
      AND s.formulario_enviado_em IS NOT NULL
      AND s.id <> NEW.id;

    IF v_paid_count < v_other_submitted_count + 1 THEN
      RAISE EXCEPTION 'É necessário um novo pagamento para enviar outro formulário.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_submission_form_slot ON public.pequenas_causas_submissions;
CREATE TRIGGER trg_guard_submission_form_slot
BEFORE UPDATE ON public.pequenas_causas_submissions
FOR EACH ROW
EXECUTE FUNCTION public.guard_submission_form_slot();
