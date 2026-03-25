import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { ShieldCheck, AlertCircle, Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export default function LoginPage() {
  const [, navigate] = useLocation();
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setLoading(true);
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    setLoading(false);
    if (error) {
      setAuthError("E-mail ou senha incorretos. Tente novamente.");
    } else {
      navigate("/area-cliente");
    }
  };

  return (
    <Layout>
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-16 hero-gradient">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full bg-[#fee001] flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-7 h-7 text-[#716300]" />
            </div>
            <h1 className="text-2xl font-black text-white mb-1">Área do Cliente</h1>
            <p className="text-white/60 text-sm">Acesse sua conta para acompanhar seu caso</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">E-mail</label>
                <input
                  {...form.register("email")}
                  type="email"
                  placeholder="seu@email.com"
                  className="w-full h-11 bg-white border-2 border-slate-200 rounded-xl px-3 text-sm focus:outline-none focus:border-[#425f8e] focus:ring-[3px] focus:ring-[#425f8e]/10 transition-all"
                />
                {form.formState.errors.email && (
                  <p className="text-red-600 text-xs mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Senha</label>
                <input
                  {...form.register("password")}
                  type="password"
                  placeholder="••••••••"
                  className="w-full h-11 bg-white border-2 border-slate-200 rounded-xl px-3 text-sm focus:outline-none focus:border-[#425f8e] focus:ring-[3px] focus:ring-[#425f8e]/10 transition-all"
                />
                {form.formState.errors.password && (
                  <p className="text-red-600 text-xs mt-1">{form.formState.errors.password.message}</p>
                )}
              </div>

              {authError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-xl text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#fee001] text-[#716300] font-bold text-sm shadow-[0_5px_0_0_#caa800] hover:shadow-[0_2px_0_0_#caa800] hover:translate-y-[3px] active:shadow-none active:translate-y-[5px] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar"}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Não tem conta?{" "}
                <Link href="/cadastro" className="text-[#425f8e] font-bold hover:underline">
                  Cadastre-se
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
