import React from "react";
import { Layout } from "@/components/layout";
import { Scale, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

/**
 * Termos de uso específicos para advogados cadastrados.
 * Texto alinhado ao modelo de intermediação tecnológica (não escritório de advocacia).
 */
export default function TermsAdvogadoPage() {
  return (
    <Layout>
      <div className="pt-24 pb-32 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/advogado/signup"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#001532]/70 hover:text-[#001532] mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao cadastro
          </Link>

          <div className="text-center mb-10">
            <Scale className="w-11 h-11 text-[#001532] mx-auto mb-4" />
            <h1 className="text-xl sm:text-2xl font-black text-[#001532] tracking-tight leading-snug">
              Termos de Uso – Advogados(as) cadastrados(as)
            </h1>
            <p className="text-sm text-muted-foreground mt-2">Plataforma Pequenas Causas Processos</p>
          </div>

          <article className="rounded-2xl border border-border bg-card/50 shadow-sm p-6 sm:p-10 text-foreground text-sm sm:text-[15px] leading-relaxed space-y-8">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#001532]">1. Introdução</h2>
              <p>
                Os presentes Termos de Uso regulam o acesso e a utilização da plataforma Pequenas Causas Processos
                pelos(as) advogados(as) cadastrados(as).
              </p>
              <p>
                Ao aderir a estes Termos, o(a) advogado(a) declara ciência de que a Pequenas Causas Processos
                constitui exclusivamente uma plataforma tecnológica de intermediação, não prestando serviços jurídicos,
                não se caracterizando como sociedade de advogados ou escritório de advocacia e não interferindo, sob
                qualquer forma, na condução técnica dos casos.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#001532]">2. Responsabilidades do(a) Advogado(a)</h2>
              <p>
                A atuação profissional do(a) advogado(a) é exercida de forma autônoma, independente e sem qualquer
                vínculo com a plataforma, cabendo-lhe, com exclusividade:
              </p>
              <ul className="list-none space-y-1.5 pl-0">
                <li>I – a análise jurídica do caso concreto;</li>
                <li>II – a definição de estratégia processual;</li>
                <li>III – a elaboração de peças, manifestações e orientações jurídicas;</li>
                <li>IV – a condução integral do atendimento ao cliente.</li>
              </ul>
              <p>
                O(a) advogado(a) é integralmente responsável pela veracidade, qualidade e adequação técnica das
                informações prestadas, bem como pelo cumprimento das normas legais, éticas e disciplinares aplicáveis à
                advocacia, especialmente aquelas estabelecidas pela Ordem dos Advogados do Brasil (OAB).
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#001532]">3. Ferramentas disponibilizadas pela plataforma</h2>
              <p>
                A Pequenas Causas Processos disponibiliza aos(às) advogados(as) cadastrados(as) recursos tecnológicos
                destinados a facilitar a interação com potenciais clientes, incluindo, mas não se limitando a:
              </p>
              <ul className="list-none space-y-1.5 pl-0">
                <li>
                  I – <strong>Comunicação com clientes:</strong> ambiente digital para troca de mensagens, envio de
                  propostas e compartilhamento de informações;
                </li>
                <li>
                  II – <strong>Gestão de documentos:</strong> ferramentas para solicitação, recebimento e organização de
                  arquivos enviados pelos clientes;
                </li>
              </ul>
              <p className="text-muted-foreground text-sm italic">
                Demais funcionalidades poderão ser atualizadas, sempre comunicadas na plataforma, sem prejuízo do caráter
                meramente instrumental da tecnologia.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#001532]">4. Análise e aprovação</h2>
              <p>
                O cadastro poderá ser analisado pela equipe da plataforma, inclusive com verificação de dados junto à
                OAB e sistemas de confirmação (ex.: confirmADV), quando aplicável. A aprovação não constitui endosso
                profissional, limitando-se à habilitação para uso dos recursos tecnológicos.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#001532]">5. Limitação de responsabilidade da plataforma</h2>
              <p>
                A Pequenas Causas Processos não responde por atos de advocacia, por resultados de processos ou por
                condutas de usuários ou de advogados. A plataforma não substitui o juízo de conveniência e oportunidade
                do profissional inscrito na OAB.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#001532]">6. Alterações</h2>
              <p>
                Estes Termos podem ser alterados. O uso continuado após a publicação da nova versão implica aceitação,
                salvo disposição em contrário.
              </p>
            </section>
          </article>
        </div>
      </div>
    </Layout>
  );
}
