# Supabase — portal Pequenas Causas

Não é possível aplicar mudanças na sua conta Supabase daqui. Execute o script no painel do seu projeto.

## Passo a passo

1. Abra [Supabase Dashboard](https://supabase.com/dashboard) → seu projeto → **SQL Editor**.
2. Clique em **New query**.
3. Abra o arquivo `migrations/20260328120000_pequenas_causas_portal.sql` nesta pasta, copie **todo** o conteúdo e cole no editor.
4. Clique em **Run** (ou `Cmd/Ctrl + Enter`).
5. Confira se não houve erro em vermelho. Ajuste o nome da tabela se o seu for diferente de `public.pequenas_causas_submissions`.

## O que o script faz

- Adiciona colunas opcionais (`autor_cnpj`, `reu_rg`, `reu_telefone_2`, links de mídia/documentos, flags de testemunha/veículo, `pedido_ref`).
- Cria função `check_pequenas_causas_payment` para a página **Criar conta** (usuário ainda não logado) verificar pagamento sem abrir a tabela ao anonimato.
- Ativa **RLS** na tabela e políticas: usuário autenticado só **lê/atualiza** linhas cujo `autor_email` é o e-mail do JWT.
- Cria/atualiza buckets **pequenas-causas-docs** (5 MB sugerido) e **case-documentos**, com políticas de leitura/escrita para `authenticated` e leitura pública (URLs públicas).

## Depois do SQL

- Em **Authentication → Providers**, confirme que o e-mail do cadastro bate com `autor_email` gravado no pagamento (idealmente sempre em minúsculas).
- Em **Storage**, confira se os buckets aparecem e se **Public bucket** está como esperado para links `getPublicUrl`.
- Webhooks que criam linhas com **service_role** continuam funcionando (RLS não se aplica ao service role).

## CLI (opcional)

Se usar Supabase CLI no projeto:

```bash
supabase db push
```

(apontando `supabase/config` para esta pasta, se você ajustar a estrutura.)
