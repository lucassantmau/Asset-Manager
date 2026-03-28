import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { Link, useLocation } from "wouter";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import {
  ShieldCheck,
  Scale,
  User,
  GraduationCap,
  MapPin,
  Lock,
  LogIn,
  UserPlus,
  Info,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const lawyerSchema = z
  .object({
    name: z.string().min(3, "Nome é obrigatório"),
    email: z.string().email("E-mail profissional inválido"),
    oab: z.string().min(5, "OAB é obrigatória"),
    phone: z.string().min(10, "WhatsApp é obrigatório"),
    cep: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    addressStreet: z.string().optional(),
    addressNumber: z.string().optional(),
    addressComplement: z.string().optional(),
    password: z.string().min(8, "Mínimo de 8 caracteres"),
    confirmPassword: z.string(),
    termsAccepted: z.boolean().refine((v) => v === true, {
      message: "Você deve aceitar os Termos de Uso",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type LawyerForm = z.infer<typeof lawyerSchema>;

export default function LawyerSignup() {
  const [, navigate] = useLocation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<LawyerForm>({
    resolver: zodResolver(lawyerSchema),
    defaultValues: { termsAccepted: false },
  });

  const onSubmit = async (data: LawyerForm) => {
    setSubmitError(null);
    setLoading(true);
    try {
      const email = data.email.trim().toLowerCase();
      const meta = {
        user_role: "lawyer",
        full_name: data.name.trim(),
        oab: data.oab.trim(),
        phone: data.phone.trim(),
        cep: data.cep?.trim() ?? "",
        state: data.state?.trim() ?? "",
        city: data.city?.trim() ?? "",
        address_street: data.addressStreet?.trim() ?? "",
        address_number: data.addressNumber?.trim() ?? "",
        address_complement: data.addressComplement?.trim() ?? "",
        terms_accepted: "true",
      };

      const { data: sessionData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: data.password,
        options: { data: meta },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered") || signUpError.message.includes("User already registered")) {
          setSubmitError("Este e-mail já possui cadastro. Use o login ou recuperação de senha.");
        } else {
          setSubmitError(signUpError.message);
        }
        setLoading(false);
        return;
      }

      const user = sessionData.user;
      const session = sessionData.session;

      if (user && session) {
        const { error: upErr } = await supabase.from("lawyer_profiles").upsert(
          {
            id: user.id,
            full_name: data.name.trim(),
            oab: data.oab.trim(),
            phone: data.phone.trim(),
            cep: data.cep?.trim() || null,
            state: data.state?.trim() || null,
            city: data.city?.trim() || null,
            address_street: data.addressStreet?.trim() || null,
            address_number: data.addressNumber?.trim() || null,
            address_complement: data.addressComplement?.trim() || null,
            terms_accepted_at: new Date().toISOString(),
            registration_status: "pending",
          },
          { onConflict: "id" },
        );
        if (upErr) {
          setSubmitError(
            "Conta criada, mas o perfil de advogado não pôde ser salvo. Aplique a migration `20260328140000_lawyer_profiles.sql` no Supabase ou tente novamente.",
          );
          setLoading(false);
          return;
        }
        navigate("/advogado/area");
        return;
      }

      setSuccess(true);
    } catch (e) {
      console.error(e);
      setSubmitError("Não foi possível concluir o cadastro. Tente novamente.");
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#001532]/10 flex items-center justify-center shrink-0">
                <Scale className="w-5 h-5 text-[#001532]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-[#001532] tracking-tight">Cadastro de Advogado</h1>
                <p className="text-sm text-muted-foreground">Junte-se à nossa plataforma. É gratuito.</p>
              </div>
            </div>
            <Link
              href="/advogado/signin"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#001532]/80 hover:text-[#001532] self-start sm:self-center"
            >
              <LogIn className="w-4 h-4" />
              Já tenho cadastro
            </Link>
          </div>

          {success ? (
            <div className="rounded-2xl border border-border bg-white shadow-sm p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-[#001532] mb-2">Cadastro recebido</h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                Enviamos um link de confirmação para seu e-mail. Após confirmar, você poderá acessar a área do advogado.
                Seu cadastro será analisado pela equipe antes da aprovação completa.
              </p>
              <Link href="/advogado/signin" className="text-[#001532] font-semibold underline">
                Ir para o login
              </Link>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {submitError && (
                <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3">{submitError}</div>
              )}

              <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
                <div className="bg-[#001532] text-white px-4 py-3 flex items-center gap-2 text-sm font-medium">
                  <ShieldCheck className="w-4 h-4 opacity-90" />
                  <span>Dados Profissionais — Preencha suas informações para cadastro.</span>
                </div>

                <div className="p-4 sm:p-6 space-y-8">
                  <section>
                    <div className="flex items-center gap-2 mb-4 text-[#001532] font-bold">
                      <User className="w-4 h-4" />
                      Dados Pessoais
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground">
                          Nome Completo <span className="text-red-500">*</span>
                        </label>
                        <input
                          {...form.register("name")}
                          placeholder="Seu nome completo"
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:border-[#001532] focus:outline-none focus:ring-2 focus:ring-[#001532]/15"
                        />
                        {form.formState.errors.name && (
                          <p className="text-red-600 text-xs mt-1">{form.formState.errors.name.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">
                          E-mail Profissional <span className="text-red-500">*</span>
                        </label>
                        <input
                          {...form.register("email")}
                          type="email"
                          placeholder="nome@escritorio.com.br"
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:border-[#001532] focus:outline-none focus:ring-2 focus:ring-[#001532]/15"
                        />
                        {form.formState.errors.email && (
                          <p className="text-red-600 text-xs mt-1">{form.formState.errors.email.message}</p>
                        )}
                      </div>
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center gap-2 mb-4 text-[#001532] font-bold">
                      <GraduationCap className="w-4 h-4" />
                      Dados Profissionais
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground">
                          Número da OAB <span className="text-red-500">*</span>
                        </label>
                        <input
                          {...form.register("oab")}
                          placeholder="Ex: 123.456/SP"
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:border-[#001532] focus:outline-none focus:ring-2 focus:ring-[#001532]/15"
                        />
                        {form.formState.errors.oab && (
                          <p className="text-red-600 text-xs mt-1">{form.formState.errors.oab.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">
                          Celular/WhatsApp <span className="text-red-500">*</span>
                        </label>
                        <input
                          {...form.register("phone")}
                          placeholder="(11) 99999-9999"
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:border-[#001532] focus:outline-none focus:ring-2 focus:ring-[#001532]/15"
                        />
                        {form.formState.errors.phone && (
                          <p className="text-red-600 text-xs mt-1">{form.formState.errors.phone.message}</p>
                        )}
                      </div>
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center gap-2 mb-4 text-[#001532] font-bold">
                      <MapPin className="w-4 h-4" />
                      Endereço (opcional)
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="col-span-2 md:col-span-1">
                        <label className="text-sm font-medium text-foreground">CEP</label>
                        <input
                          {...form.register("cep")}
                          placeholder="00000-000"
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Estado</label>
                        <input {...form.register("state")} placeholder="SP" className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm" />
                      </div>
                      <div className="col-span-2 md:col-span-2">
                        <label className="text-sm font-medium text-foreground">Cidade</label>
                        <input
                          {...form.register("city")}
                          placeholder="São Paulo"
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm"
                        />
                      </div>
                      <div className="col-span-2 md:col-span-4">
                        <label className="text-sm font-medium text-foreground">Logradouro</label>
                        <input
                          {...form.register("addressStreet")}
                          placeholder="Rua, Avenida..."
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Número</label>
                        <input {...form.register("addressNumber")} placeholder="123" className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm" />
                      </div>
                      <div className="col-span-2 md:col-span-3">
                        <label className="text-sm font-medium text-foreground">Complemento</label>
                        <input
                          {...form.register("addressComplement")}
                          placeholder="Apto, Sala..."
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm"
                        />
                      </div>
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center gap-2 mb-4 text-[#001532] font-bold">
                      <Lock className="w-4 h-4" />
                      Credenciais de Acesso
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground">
                          Senha <span className="text-red-500">*</span>
                        </label>
                        <input
                          {...form.register("password")}
                          type="password"
                          autoComplete="new-password"
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:border-[#001532] focus:outline-none focus:ring-2 focus:ring-[#001532]/15"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Mínimo de 8 caracteres</p>
                        {form.formState.errors.password && (
                          <p className="text-red-600 text-xs mt-1">{form.formState.errors.password.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">
                          Confirmar Senha <span className="text-red-500">*</span>
                        </label>
                        <input
                          {...form.register("confirmPassword")}
                          type="password"
                          autoComplete="new-password"
                          placeholder="Repita a senha"
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm focus:border-[#001532] focus:outline-none focus:ring-2 focus:ring-[#001532]/15"
                        />
                        {form.formState.errors.confirmPassword && (
                          <p className="text-red-600 text-xs mt-1">{form.formState.errors.confirmPassword.message}</p>
                        )}
                      </div>
                    </div>
                  </section>

                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <Controller
                      name="termsAccepted"
                      control={form.control}
                      render={({ field }) => (
                        <Checkbox
                          id="terms"
                          checked={field.value}
                          onCheckedChange={(c) => field.onChange(c === true)}
                          className="mt-1"
                        />
                      )}
                    />
                    <Label htmlFor="terms" className="text-sm font-normal leading-relaxed cursor-pointer">
                      Li e aceito os{" "}
                      <Link href="/advogado/termos" className="text-[#001532] font-semibold underline">
                        Termos de Uso
                      </Link>{" "}
                      da plataforma Pequenas Causas Processos. Entendo que meu cadastro será analisado pela equipe antes da aprovação.
                    </Label>
                  </div>
                  {form.formState.errors.termsAccepted && (
                    <p className="text-red-600 text-xs -mt-4">{form.formState.errors.termsAccepted.message}</p>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Link
                      href="/advogado/signin"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-200 transition-colors"
                    >
                      <LogIn className="w-4 h-4" />
                      Já tenho cadastro
                    </Link>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#001532] px-4 py-3 text-sm font-bold text-white hover:bg-[#001532]/90 disabled:opacity-50 transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      {loading ? "Enviando…" : "Criar Cadastro"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-4 flex gap-3">
                <div className="w-9 h-9 rounded-full bg-[#001532] text-white flex items-center justify-center shrink-0">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#001532] text-sm mb-2">Sobre o Processo de Cadastro</h3>
                  <ul className="text-sm text-slate-700 space-y-1.5 list-disc pl-4">
                    <li>Seu cadastro será analisado por nossa equipe, que poderá entrar em contato via WhatsApp para verificação no ConfirmADV.</li>
                    <li>Você receberá uma notificação assim que seu cadastro for aprovado.</li>
                    <li>Todos os dados são transmitidos de forma segura e protegidos conforme as práticas da plataforma.</li>
                    <li>Em caso de dúvidas, entre em contato conosco pelos canais do site.</li>
                  </ul>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}
