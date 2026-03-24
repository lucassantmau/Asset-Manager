import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegisterLawyer } from "@workspace/api-client-react";
import { Building2, ShieldCheck, Scale, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const lawyerSchema = z.object({
  name: z.string().min(3, "Nome é obrigatório"),
  email: z.string().email("E-mail profissional inválido"),
  oab: z.string().min(5, "OAB é obrigatória"),
  phone: z.string().min(10, "WhatsApp é obrigatório"),
  cep: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  password: z.string().min(8, "Mínimo de 8 caracteres"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export default function LawyerSignup() {
  const [success, setSuccess] = useState(false);
  const registerMutation = useRegisterLawyer();
  
  const form = useForm<z.infer<typeof lawyerSchema>>({
    resolver: zodResolver(lawyerSchema)
  });

  const onSubmit = async (data: z.infer<typeof lawyerSchema>) => {
    try {
      await registerMutation.mutateAsync({
        data: {
          name: data.name,
          email: data.email,
          oab: data.oab,
          phone: data.phone,
          cep: data.cep,
          state: data.state,
          city: data.city,
          address: data.address,
          password: data.password
        }
      });
      setSuccess(true);
    } catch (error) {
      console.error("Failed to register", error);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-12">
          
          {/* Info Sidebar */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h1 className="text-3xl font-display font-bold mb-4">Cadastro de <span className="gold-gradient-text">Advogado</span></h1>
              <p className="text-muted-foreground leading-relaxed">
                Junte-se a centenas de profissionais que já estão expandindo suas carteiras de clientes através da Pequenas Causas Processos.
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">Verificação no ConfirmADV</h4>
                  <p className="text-sm text-muted-foreground">Seu cadastro será analisado por nossa equipe para garantir a segurança da plataforma.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Scale className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">Casos Filtrados</h4>
                  <p className="text-sm text-muted-foreground">Nossa IA tria os casos de pequenas causas para que você receba apenas demandas qualificadas.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">Crescimento Profissional</h4>
                  <p className="text-sm text-muted-foreground">Aumente seus honorários com fluxo constante de clientes de todo o Brasil.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Area */}
          <div className="lg:col-span-3">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-8 rounded-2xl"
            >
              {success ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-display font-bold mb-4">Cadastro Recebido!</h2>
                  <p className="text-muted-foreground mb-8">
                    Seus dados foram enviados para análise. Em breve, nossa equipe entrará em contato via WhatsApp para finalizar a verificação.
                  </p>
                  <Link href="/" className="inline-flex py-3 px-6 rounded-xl bg-primary text-primary-foreground font-bold hover:shadow-[0_0_20px_rgba(37,99,235,0.35)] transition-all">
                    Voltar ao Início
                  </Link>
                </div>
              ) : (
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {registerMutation.error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                      Erro ao realizar cadastro. Verifique os dados ou tente novamente.
                    </div>
                  )}

                  {/* Section 1 */}
                  <div>
                    <h3 className="text-lg font-bold border-b border-border pb-2 mb-4">Dados Pessoais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Nome Completo *</label>
                        <input {...form.register("name")} className="w-full bg-white border border-border rounded-xl p-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none transition-colors" />
                        {form.formState.errors.name && <p className="text-red-400 text-xs mt-1">{form.formState.errors.name.message}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">E-mail Profissional *</label>
                        <input {...form.register("email")} type="email" className="w-full bg-white border border-border rounded-xl p-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none transition-colors" />
                        {form.formState.errors.email && <p className="text-red-400 text-xs mt-1">{form.formState.errors.email.message}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Section 2 */}
                  <div>
                    <h3 className="text-lg font-bold border-b border-border pb-2 mb-4">Dados Profissionais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Número da OAB *</label>
                        <input {...form.register("oab")} placeholder="Ex: SP123456" className="w-full bg-white border border-border rounded-xl p-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none transition-colors" />
                        {form.formState.errors.oab && <p className="text-red-400 text-xs mt-1">{form.formState.errors.oab.message}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Celular / WhatsApp *</label>
                        <input {...form.register("phone")} className="w-full bg-white border border-border rounded-xl p-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none transition-colors" />
                        {form.formState.errors.phone && <p className="text-red-400 text-xs mt-1">{form.formState.errors.phone.message}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Section 3 */}
                  <div>
                    <h3 className="text-lg font-bold border-b border-border pb-2 mb-4">Credenciais de Acesso</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Senha *</label>
                        <input {...form.register("password")} type="password" placeholder="Mínimo 8 caracteres" className="w-full bg-white border border-border rounded-xl p-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none transition-colors" />
                        {form.formState.errors.password && <p className="text-red-400 text-xs mt-1">{form.formState.errors.password.message}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Confirmar Senha *</label>
                        <input {...form.register("confirmPassword")} type="password" className="w-full bg-white border border-border rounded-xl p-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none transition-colors" />
                        {form.formState.errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{form.formState.errors.confirmPassword.message}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                    <Link href="/advogado/signin" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      Já tenho cadastro
                    </Link>
                    <button 
                      type="submit"
                      disabled={registerMutation.isPending}
                      className="w-full sm:w-auto py-3 px-8 rounded-xl bg-primary text-primary-foreground font-bold hover:shadow-[0_0_20px_rgba(37,99,235,0.35)] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {registerMutation.isPending ? "Enviando..." : "Criar Cadastro"} <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
