import React from "react";
import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLawyerSignIn } from "@workspace/api-client-react";
import { Scale, Lock } from "lucide-react";
import { motion } from "framer-motion";

const signinSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export default function LawyerSignin() {
  const signinMutation = useLawyerSignIn();
  
  const form = useForm<z.infer<typeof signinSchema>>({
    resolver: zodResolver(signinSchema)
  });

  const onSubmit = async (data: z.infer<typeof signinSchema>) => {
    try {
      const result = await signinMutation.mutateAsync({
        data: {
          email: data.email,
          password: data.password
        }
      });
      // Handle success - usually save token and redirect
      alert(`Bem vindo, Dr(a). ${result.lawyer.name}`);
      window.location.href = "/";
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-20 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background z-0"></div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel w-full max-w-md p-8 rounded-2xl relative z-10"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(212,175,55,0.3)]">
              <Scale className="w-8 h-8 text-background" />
            </div>
            <h1 className="text-2xl font-display font-bold">Portal do Advogado</h1>
            <p className="text-muted-foreground text-sm mt-2">Acesse sua conta para visualizar novos casos.</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {signinMutation.error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                E-mail ou senha incorretos.
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1 text-muted-foreground">E-mail Profissional</label>
              <input 
                {...form.register("email")} 
                type="email" 
                className="w-full bg-white border border-border rounded-xl p-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none transition-all" 
              />
              {form.formState.errors.email && <p className="text-red-400 text-xs mt-1">{form.formState.errors.email.message}</p>}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-muted-foreground">Senha</label>
                <a href="#" className="text-xs text-primary hover:underline">Esqueceu a senha?</a>
              </div>
              <input 
                {...form.register("password")} 
                type="password" 
                className="w-full bg-white border border-border rounded-xl p-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none transition-all" 
              />
              {form.formState.errors.password && <p className="text-red-400 text-xs mt-1">{form.formState.errors.password.message}</p>}
            </div>

            <button 
              type="submit"
              disabled={signinMutation.isPending}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {signinMutation.isPending ? "Autenticando..." : "Entrar Seguramente"} <Lock className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Ainda não faz parte? <Link href="/advogado/signup" className="text-primary hover:underline font-medium">Cadastre-se grátis</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
