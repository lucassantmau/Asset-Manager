import React, { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { ShieldCheck, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Nome é obrigatório"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function CadastroPage() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [prefillName, setPrefillName] = useState<string>("");
  const [tokenError, setTokenError] = useState(false);
  const [validating, setValidating] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", password: "", confirmPassword: "" },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (!t) { setTokenError(true); setValidating(false); return; }
    setToken(t);

    fetch(`${API_BASE}/api/auth/validate-token?token=${t}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setTokenError(true);
        } else {
          setEmail(data.email || "");
          setPrefillName(data.name || "");
          form.setValue("name", data.name || "");
        }
        setValidating(false);
      })
      .catch(() => { setTokenError(true); setValidating(false); });
  }, []);

  const onSubmit = async (data: FormData) => {
    setSubmitError(null);
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: data.password, name: data.name }),
    });
    const json = await res.json();
    if (!res.ok || json.error) {
      setSubmitError("Erro ao criar conta. Tente novamente.");
      return;
    }
    setSuccess(true);
    setTimeout(() => navigate("/login"), 2000);
  };

  return (
    <Layout>
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-16 hero-gradient">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full bg-[#fee001] flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-7 h-7 text-[#716300]" />
            </div>
            <h1 className="text-2xl font-black text-white mb-1">Criar Acesso</h1>
            <p className="text-white/60 text-sm">Defina sua senha para acessar a plataforma</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            {validating && (
              <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" /> Validando link...
              </div>
            )}

            {!validating && tokenError && (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <AlertCircle className="w-10 h-10 text-red-500" />
                <p className="font-bold text-foreground">Link expirado ou inválido.</p>
                <p className="text-sm text-muted-foreground">Solicite um novo link de acesso pelo suporte.</p>
              </div>
            )}

            {!validating && !tokenError && !success && (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">E-mail</label>
                  <input
                    value={email}
                    readOnly
                    className="w-full h-11 bg-slate-50 border-2 border-slate-200 rounded-xl px-3 text-sm text-muted-foreground cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Nome completo</label>
                  <input
                    {...form.register("name")}
                    placeholder="Seu nome"
                    className="w-full h-11 bg-white border-2 border-slate-200 rounded-xl px-3 text-sm focus:outline-none focus:border-[#276749] focus:ring-[3px] focus:ring-[#276749]/10 transition-all"
                  />
                  {form.formState.errors.name && (
                    <p className="text-red-600 text-xs mt-1">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Senha</label>
                  <input
                    {...form.register("password")}
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    className="w-full h-11 bg-white border-2 border-slate-200 rounded-xl px-3 text-sm focus:outline-none focus:border-[#276749] focus:ring-[3px] focus:ring-[#276749]/10 transition-all"
                  />
                  {form.formState.errors.password && (
                    <p className="text-red-600 text-xs mt-1">{form.formState.errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Confirmar Senha</label>
                  <input
                    {...form.register("confirmPassword")}
                    type="password"
                    placeholder="Repita a senha"
                    autoComplete="new-password"
                    className="w-full h-11 bg-white border-2 border-slate-200 rounded-xl px-3 text-sm focus:outline-none focus:border-[#276749] focus:ring-[3px] focus:ring-[#276749]/10 transition-all"
                  />
                  {form.formState.errors.confirmPassword && (
                    <p className="text-red-600 text-xs mt-1">{form.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                {submitError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-xl text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-[#276749] text-white font-bold text-sm shadow-[0_5px_0_0_#1a4a33] hover:shadow-[0_2px_0_0_#1a4a33] hover:translate-y-[3px] active:shadow-none active:translate-y-[5px] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {form.formState.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar Minha Conta"}
                </button>
              </form>
            )}

            {success && (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                <p className="font-bold text-lg text-foreground">Conta criada!</p>
                <p className="text-sm text-muted-foreground">Redirecionando para o login...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
