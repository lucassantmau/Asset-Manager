import React from "react";
import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Plane, ArrowRight } from "lucide-react";
import { LandingTopicCrosslinks } from "./topic-crosslinks";

export default function LandingAtrasoVoo() {
  return (
    <Layout>
      <Helmet>
        <title>Atraso de Voo e Cancelamento | Pequenas Causas Processos</title>
        <meta
          name="description"
          content="Teve atraso ou cancelamento de voo? Saiba seus direitos e receba propostas de advogados parceiros para buscar indenização."
        />
        <link rel="canonical" href="https://pequenascausasprocessos.com.br/atraso-voo" />
      </Helmet>
      <section className="pt-24 pb-20 hero-gradient">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 text-xs font-semibold mb-5">
            <Plane className="w-3.5 h-3.5" /> Direitos do passageiro
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Atraso ou cancelamento de voo: entenda seus direitos
          </h1>
          <p className="text-white/75 text-lg max-w-3xl">
            Reacomodação, reembolso e assistência material são obrigações da companhia aérea. Em muitos casos, também é
            possível buscar indenização.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/#avaliar"
              className="inline-flex items-center gap-2 rounded-xl bg-[#fee001] text-[#716300] font-bold px-6 py-3"
            >
              Avaliar meu caso agora <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/blog/voo-cancelado-quais-sao-seus-direitos" className="inline-flex rounded-xl border border-white/25 px-6 py-3 font-semibold">
              Ler guia completo
            </Link>
          </div>
        </div>
      </section>
      <LandingTopicCrosslinks currentId="atraso-voo" />
    </Layout>
  );
}
