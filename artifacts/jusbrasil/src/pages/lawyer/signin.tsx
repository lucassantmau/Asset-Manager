import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";

const signinSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export default function LawyerSignin() {
  const [, navigate] = useLocation();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof signinSchema>>({
    resolver: zodResolver(signinSchema),
  });

  const onSubmit = async (data: z.infer<typeof signinSchema>) => {
    setFormError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });
      if (error) {
        setFormError("E-mail ou senha incorretos.");
        setLoading(false);
        return;
      }
      navigate("/advogado/area");
    } catch {
      setFormError("Não foi possível entrar. Tente novamente.");
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-68px)] flex items-center justify-center px-4 py-16 bg-slate-100/80">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-[0_8px_40px_rgba(0,21,50,0.08)] border border-slate-100 px-8 py-10">
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-11 h-11 rounded-lg bg-[#001532] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-[#fee001]" />
              </div>
              <span className="font-black text-xl text-[#001532] tracking-tight leading-none">
                Pequenas Causas <span className="text-[#001532]/60 font-semibold">Processos</span>
              </span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#0f172a]">Bem-vindo(a)!</h1>
            <p className="text-sm text-slate-600 mt-2">Insira seus dados de acesso como advogado(a)</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {formError && <div className="text-sm text-red-600 text-center bg-red-50 rounded-lg py-2 px-3">{formError}</div>}

            <div>
              <label className="block text-sm font-medium text-[#0f172a] mb-1">E-mail</label>
              <input
                {...form.register("email")}
                type="email"
                autoComplete="email"
                className="w-full bg-transparent border-0 border-b border-slate-300 rounded-none px-0 py-2.5 text-sm focus:border-[#001532] focus:ring-0 focus:outline-none placeholder:text-slate-400"
                placeholder="seu@email.com"
              />
              {form.formState.errors.email && (
                <p className="text-red-600 text-xs mt-1">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0f172a] mb-1">Senha</label>
              <div className="relative flex items-center border-b border-slate-300 focus-within:border-[#001532]">
                <input
                  {...form.register("password")}
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  className="w-full bg-transparent border-0 rounded-none px-0 py-2.5 pr-10 text-sm focus:ring-0 focus:outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-0 p-1 text-slate-500 hover:text-[#001532]"
                  aria-label={showPw ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-red-600 text-xs mt-1">{form.formState.errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#c9a227] hover:bg-[#b8941e] text-white font-bold text-sm tracking-wide py-3.5 shadow-sm disabled:opacity-50 transition-colors"
            >
              {loading ? "Entrando…" : "LOGIN"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-600 mt-8">
            Não tem uma conta?{" "}
            <Link href="/advogado/signup" className="text-[#001532] font-semibold hover:underline">
              Cadastre-se aqui
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}
