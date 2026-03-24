import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { Search, ShieldCheck, Scale, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
// Mock API fetch since we only have GET /cases/:id and this form requires search by identifier
// We'll simulate finding a case based on email/whatsapp

const lookupSchema = z.object({
  identifier: z.string().min(5, "Digite seu e-mail, CPF ou WhatsApp"),
});

export default function ClientArea() {
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<z.infer<typeof lookupSchema>>({
    resolver: zodResolver(lookupSchema)
  });

  const onSubmit = (data: z.infer<typeof lookupSchema>) => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setHasSearched(true);
    }, 1500);
  };

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-20 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background z-0"></div>
        
        <div className="w-full max-w-2xl relative z-10">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 text-primary">
              <Search className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">Área do Cliente</h1>
            <p className="text-muted-foreground text-lg">Acompanhe o andamento do seu caso e propostas.</p>
          </div>

          {!hasSearched ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-8 rounded-3xl"
            >
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-muted-foreground">Localizar Processo</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground">
                      <Search className="h-5 w-5" />
                    </div>
                    <input 
                      {...form.register("identifier")}
                      className="w-full bg-black/60 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all text-lg"
                      placeholder="E-mail, CPF ou WhatsApp"
                    />
                  </div>
                  {form.formState.errors.identifier && <p className="text-red-400 text-sm mt-2">{form.formState.errors.identifier.message}</p>}
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? "Buscando..." : "Consultar Status"}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel overflow-hidden rounded-3xl"
            >
              {/* Fake Results for Demo */}
              <div className="p-8 border-b border-white/5 bg-white/5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-2xl font-display font-bold">Processo de Indenização</h3>
                    <p className="text-muted-foreground mt-1">Contra: Companhia Aérea X</p>
                  </div>
                  <div className="px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-medium text-sm flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                    Advogado Atribuído
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-8">
                <div className="relative">
                  <div className="absolute left-[15px] top-4 bottom-4 w-px bg-white/10"></div>
                  
                  <div className="space-y-6">
                    <div className="flex gap-4 relative">
                      <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary flex items-center justify-center shrink-0 z-10">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-lg">Ação Distribuída</p>
                        <p className="text-sm text-muted-foreground">O advogado protocolou a ação no Juizado Especial.</p>
                        <p className="text-xs text-primary mt-1">Hoje, 10:30</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 relative">
                      <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0 z-10">
                        <CheckCircle2 className="w-4 h-4 text-white/50" />
                      </div>
                      <div>
                        <p className="font-bold text-white/70 text-lg">Pagamento Confirmado</p>
                        <p className="text-sm text-muted-foreground">Taxa de acesso liberada via PIX.</p>
                        <p className="text-xs text-white/40 mt-1">Há 2 dias</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 relative">
                      <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0 z-10">
                        <CheckCircle2 className="w-4 h-4 text-white/50" />
                      </div>
                      <div>
                        <p className="font-bold text-white/70 text-lg">Análise Concluída</p>
                        <p className="text-sm text-muted-foreground">Caso aceito pela inteligência da plataforma.</p>
                        <p className="text-xs text-white/40 mt-1">Há 2 dias</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold mb-1">Próximos Passos</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Aguarde a citação da empresa ré. Você receberá um aviso por WhatsApp assim que a data da audiência de conciliação for marcada pelo juiz.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-black/40 border-t border-white/5 text-center">
                <button 
                  onClick={() => setHasSearched(false)}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Fazer nova consulta
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}
