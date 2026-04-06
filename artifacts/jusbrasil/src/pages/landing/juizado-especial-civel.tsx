import React from "react";
import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Scale, ArrowRight } from "lucide-react";
import { LandingTopicCrosslinks } from "./topic-crosslinks";

export default function LandingJuizadoEspecial() {
  return (
    <Layout>
      <Helmet>
        <title>Juizado Especial Cível (JEC) | Pequenas Causas Processos</title>
        <meta
          name="description"
          content="Entenda como funciona o Juizado Especial Cível: limites de valor, quando precisa de advogado e como iniciar uma ação."
        />
        <link rel="canonical" href="https://pequenascausasprocessos.com.br/juizado-especial-civel" />
      </Helmet>
      <section className="pt-24 pb-20 hero-gradient">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 text-xs font-semibold mb-5">
            <Scale className="w-3.5 h-3.5" /> Guia prático
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Juizado Especial Cível: guia direto ao ponto</h1>
          <p className="text-white/75 text-lg max-w-3xl">
            Saiba quem pode usar o JEC, quais causas são aceitas e como se preparar para entrar com ação de forma mais
            eficiente.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/#avaliar"
              className="inline-flex items-center gap-2 rounded-xl bg-[#fee001] text-[#716300] font-bold px-6 py-3"
            >
              Avaliar meu caso <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/blog/juizado-especial-civel-como-funciona" className="inline-flex rounded-xl border border-white/25 px-6 py-3 font-semibold">
              Acessar conteúdo completo
            </Link>
          </div>
        </div>
      </section>
      <LandingTopicCrosslinks currentId="juizado-especial-civel" />
    </Layout>
  );
}
