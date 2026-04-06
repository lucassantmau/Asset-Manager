import React from "react";
import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { ReceiptText, ArrowRight } from "lucide-react";

export default function LandingCobrancaIndevida() {
  return (
    <Layout>
      <Helmet>
        <title>Cobrança Indevida | Pequenas Causas Processos</title>
        <meta
          name="description"
          content="Foi cobrado indevidamente? Descubra como agir, quais provas reunir e quando pedir devolução e indenização."
        />
        <link rel="canonical" href="https://pequenascausasprocessos.com.br/cobranca-indevida" />
      </Helmet>
      <section className="pt-24 pb-20 hero-gradient">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 text-xs font-semibold mb-5">
            <ReceiptText className="w-3.5 h-3.5" /> Defesa do consumidor
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Cobrança indevida: como resolver com segurança</h1>
          <p className="text-white/75 text-lg max-w-3xl">
            Você pode contestar cobrança indevida, pedir devolução e, em alguns casos, buscar reparação por danos.
            Organize provas e entenda os próximos passos.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/#avaliar"
              className="inline-flex items-center gap-2 rounded-xl bg-[#fee001] text-[#716300] font-bold px-6 py-3"
            >
              Iniciar diagnóstico <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/blog/cobranca-indevida-o-que-e-e-como-resolver" className="inline-flex rounded-xl border border-white/25 px-6 py-3 font-semibold">
              Ver artigo completo
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
