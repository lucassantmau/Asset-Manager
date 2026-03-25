import React from "react";
import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { CheckCircle2, Mail, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function ObrigadoPage() {
  return (
    <Layout>
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-16 hero-gradient">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md text-center"
        >
          <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-3xl font-black text-white mb-3">Pagamento confirmado!</h1>
          <p className="text-white/70 text-base mb-8 leading-relaxed max-w-sm mx-auto">
            Em instantes você receberá um e-mail com o link para criar seu acesso à plataforma.
          </p>

          <div className="bg-white/10 border border-white/20 rounded-2xl p-5 mb-8 flex items-start gap-3 text-left">
            <Mail className="w-5 h-5 text-[#fee001] flex-shrink-0 mt-0.5" />
            <p className="text-white/80 text-sm leading-relaxed">
              Verifique sua caixa de entrada e também a pasta de <strong className="text-white">spam</strong>. O link é válido por 48 horas.
            </p>
          </div>

          <Link
            href="/cadastrar"
            className="inline-flex items-center gap-2 w-full justify-center py-4 rounded-xl bg-[#fee001] text-[#716300] font-bold text-base shadow-[0_5px_0_0_#caa800] hover:shadow-[0_2px_0_0_#caa800] hover:translate-y-[3px] active:shadow-none active:translate-y-[5px] transition-all mb-4"
          >
            Criar meu acesso agora <ArrowRight className="w-4 h-4" />
          </Link>

          <p className="text-white/40 text-xs">
            (Em produção, o link chegará por e-mail automaticamente)
          </p>
        </motion.div>
      </div>
    </Layout>
  );
}
