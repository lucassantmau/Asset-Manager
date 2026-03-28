import React from "react";
import { Layout } from "@/components/layout";
import { FileText } from "lucide-react";

export default function Terms() {
  return (
    <Layout>
      <div className="pt-24 pb-32 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <FileText className="w-11 h-11 text-[#001532] mx-auto mb-4" />
            <h1 className="text-2xl sm:text-3xl font-black text-[#001532] tracking-tight leading-snug">
              Termos de Uso – Plataforma Pequenas Causas Processos
            </h1>
            <p className="text-sm text-muted-foreground mt-3">
              Documento de referência para uso da plataforma. Leia com atenção.
            </p>
          </div>

          <article className="rounded-2xl border border-border bg-card/50 shadow-sm p-6 sm:p-10 text-foreground text-sm sm:text-[15px] leading-relaxed space-y-8">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#001532]">1. Objeto</h2>
              <p>
                Os presentes Termos de Uso têm por objeto regular o acesso e a utilização da plataforma digital Pequenas
                Causas Processos, disponibilizada aos usuários com a finalidade exclusiva de viabilizar a aproximação
                entre pessoas físicas ou jurídicas e advogados(as) regularmente inscritos(as) na Ordem dos Advogados do
                Brasil (OAB).
              </p>
              <p>
                A plataforma não presta serviços jurídicos, não se caracteriza como sociedade de advogados ou escritório
                de advocacia e não realiza qualquer forma de consultoria, assessoria ou análise jurídica individualizada.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#001532]">2. Natureza da Atividade</h2>
              <p>
                A Pequenas Causas Processos atua exclusivamente como intermediadora tecnológica, limitando-se à
                disponibilização de ambiente digital para conexão entre usuários e advogados(as) independentes.
              </p>
              <p>
                Não há qualquer vínculo societário, empregatício ou de subordinação entre a plataforma e os(as)
                advogados(as) cadastrados(as), os quais atuam de forma autônoma e independente, sendo integralmente
                responsáveis por suas condutas profissionais.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#001532]">3. Funcionamento da Plataforma</h2>
              <p>O usuário deverá preencher formulário eletrônico com informações relacionadas ao seu caso concreto.</p>
              <p>
                As informações fornecidas poderão ser disponibilizadas a advogados(as) cadastrados(as) e previamente
                verificados(as), inclusive por meio de validação junto ao sistema confirmADV (OAB), para que, a seu
                exclusivo critério, apresentem propostas de prestação de serviços advocatícios.
              </p>
              <p>A Pequenas Causas Processos não garante:</p>
              <ul className="list-none space-y-1.5 pl-0">
                <li>I – o recebimento de propostas;</li>
                <li>II – a aceitação do caso por advogados(as);</li>
                <li>III – a adequação ou viabilidade jurídica da demanda apresentada.</li>
              </ul>
              <p>
                A eventual contratação ocorrerá diretamente entre usuário e advogado(a), sem qualquer intervenção da
                plataforma.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#001532]">4. Análise Preliminar Automatizada</h2>
              <p>
                A plataforma poderá realizar análise preliminar automatizada, limitada à verificação de critérios
                objetivos relacionados à competência dos Juizados Especiais, tais como valor da causa e natureza da
                demanda.
              </p>
              <p>
                Tal verificação possui caráter meramente informativo, não configurando aconselhamento jurídico, análise
                de mérito ou qualquer manifestação técnica, nos termos do Estatuto da Advocacia (Lei nº 8.906/94).
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#001532]">5. Limitação de Responsabilidade Técnica</h2>
              <p>
                A Pequenas Causas Processos não elabora peças processuais, não emite pareceres jurídicos e não participa
                da condução dos processos.
              </p>
              <p>Toda atividade jurídica é de responsabilidade exclusiva do(a) advogado(a) contratado(a), inclusive no que se refere a:</p>
              <ul className="list-none space-y-1.5 pl-0">
                <li>I – estratégia processual;</li>
                <li>II – prazos;</li>
                <li>III – conteúdo de petições;</li>
                <li>IV – orientações fornecidas ao cliente;</li>
                <li>V – resultados obtidos na demanda.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#001532]">6. Comunicação e Armazenamento de Dados</h2>
              <p>
                A plataforma poderá disponibilizar ambiente digital para troca de mensagens e envio de documentos, de
                utilização facultativa pelas partes.
              </p>
              <p>
                Os documentos eventualmente inseridos pelo usuário serão armazenados pelo prazo de até 3 (três) meses,
                contados do último envio, sendo automaticamente excluídos de forma definitiva e irreversível após esse
                período, sem possibilidade de recuperação.
              </p>
              <p>A plataforma não se responsabiliza pela guarda de documentos fora desse prazo.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#001532]">7. Honorários Advocatícios</h2>
              <p>
                A definição de honorários é de competência exclusiva do(a) advogado(a), em observância às normas da
                Ordem dos Advogados do Brasil (OAB).
              </p>
              <p>
                A Pequenas Causas Processos não interfere, sugere ou estabelece valores, podendo as propostas contemplar
                modalidades diversas, inclusive honorários condicionados ao êxito (quota litis/ad exitum), conforme
                legislação aplicável.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#001532]">8. Política de Reembolso</h2>
              <p>
                O valor pago pelo usuário refere-se exclusivamente à disponibilização de sua demanda na plataforma e à
                utilização da infraestrutura tecnológica oferecida.
              </p>
              <p>
                Não haverá reembolso em caso de contratação de advogado(a), por caracterizar o cumprimento integral da
                finalidade do serviço.
              </p>
              <p>O reembolso integral será admitido exclusivamente na seguinte hipótese:</p>
              <ul className="list-none space-y-1.5 pl-0">
                <li>
                  I – ausência de propostas adequadas no prazo de até 7 (sete) dias corridos, mediante solicitação
                  expressa do usuário.
                </li>
              </ul>
              <p>Fora dessas hipóteses, não haverá devolução de valores.</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#001532]">9. Obrigações do Usuário</h2>
              <p>Constituem obrigações do usuário:</p>
              <ul className="list-none space-y-1.5 pl-0">
                <li>I – prestar informações verídicas, completas e atualizadas;</li>
                <li>II – manter a confidencialidade de suas credenciais de acesso;</li>
                <li>
                  III – utilizar a plataforma em conformidade com a legislação vigente, abstendo-se de condutas
                  ilícitas, abusivas ou fraudulentas.
                </li>
              </ul>
              <p>
                O fornecimento de informações falsas poderá inviabilizar a utilização da plataforma, sem prejuízo das
                medidas legais cabíveis.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#001532]">10. Proteção de Dados Pessoais</h2>
              <p>
                O tratamento de dados pessoais observará a legislação aplicável, em especial a Lei nº 13.709/2018 (Lei
                Geral de Proteção de Dados – LGPD).
              </p>
              <p>Os dados poderão ser compartilhados com advogados(as) nas seguintes hipóteses:</p>
              <ul className="list-none space-y-1.5 pl-0">
                <li>I – para elaboração de propostas;</li>
                <li>II – após a contratação, para execução dos serviços jurídicos.</li>
              </ul>
              <p>
                A Pequenas Causas Processos não realiza tratamento de dados com a finalidade de análise jurídica de
                mérito, limitando-se à operacionalização da plataforma.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#001532]">11. Limitação Geral de Responsabilidade</h2>
              <p>A Pequenas Causas Processos não se responsabiliza:</p>
              <ul className="list-none space-y-1.5 pl-0">
                <li>I – pelo conteúdo das propostas apresentadas;</li>
                <li>II – pela conduta profissional dos(as) advogados(as);</li>
                <li>III – por eventuais prejuízos decorrentes da atuação técnica contratada;</li>
                <li>IV – por perdas de prazos, direitos ou expectativas jurídicas.</li>
              </ul>
              <p>
                Eventuais indisponibilidades técnicas serão tratadas com diligência, não implicando responsabilidade por
                danos indiretos ou lucros cessantes.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#001532]">12. Alterações dos Termos</h2>
              <p>A Pequenas Causas Processos poderá, a qualquer tempo, alterar os presentes Termos de Uso.</p>
              <p>
                As alterações entrarão em vigor a partir de sua disponibilização na plataforma, sendo o uso continuado
                considerado como manifestação inequívoca de concordância.
              </p>
            </section>
          </article>
        </div>
      </div>
    </Layout>
  );
}
