import React from "react";
import { Layout } from "@/components/layout";
import { FileText } from "lucide-react";

export default function Terms() {
  return (
    <Layout>
      <div className="pt-24 pb-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <FileText className="w-12 h-12 text-primary mx-auto mb-6" />
            <h1 className="text-4xl font-display font-bold mb-4">Termos de Uso</h1>
            <p className="text-muted-foreground">Última atualização: 15 de Outubro de 2025</p>
          </div>

          <div className="glass-panel p-8 md:p-12 rounded-3xl prose prose-invert prose-primary max-w-none">
            <h2>1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e utilizar a plataforma Pequenas Causas Processos ("Plataforma"), você concorda em cumprir e sujeitar-se a estes Termos de Uso. Se você não concorda com qualquer parte destes termos, não deverá utilizar nossos serviços.
            </p>

            <h2>2. Natureza do Serviço</h2>
            <p>
              A Pequenas Causas Processos é uma plataforma tecnológica privada, não governamental, que atua exclusivamente como intermediária (marketplace) conectando usuários (cidadãos) a advogados independentes devidamente registrados na OAB.
            </p>
            <ul>
              <li><strong>NÃO</strong> somos um escritório de advocacia.</li>
              <li><strong>NÃO</strong> possuímos vínculo com o Poder Judiciário, PROCON ou qualquer órgão governamental.</li>
              <li><strong>NÃO</strong> prestamos consultoria ou assessoria jurídica direta.</li>
            </ul>

            <h2>3. Taxa de Acesso à Tecnologia</h2>
            <p>
              Para liberar as propostas e o contato com os advogados na plataforma, o usuário concorda em pagar uma taxa única de tecnologia no valor estipulado no checkout. Esta taxa remunera exclusivamente o uso do software, infraestrutura, triagem e ambiente seguro da Pequenas Causas Processos. Esta taxa não constitui honorários advocatícios.
            </p>

            <h2>4. Relação Cliente-Advogado</h2>
            <p>
              A contratação de serviços jurídicos ocorre de forma independente entre o Usuário e o Advogado escolhido. Os honorários advocatícios (seja um valor fixo ou um percentual <em>ad exitum</em> / no êxito) são negociados e acordados diretamente entre as partes. A Pequenas Causas Processos não garante resultados em processos judiciais, pois decisões dependem exclusivamente do juízo competente.
            </p>

            <h2>5. Proteção de Dados e Privacidade</h2>
            <p>
              Tratamos seus dados com o mais alto nível de segurança, utilizando criptografia. Documentos e evidências enviados são mantidos em sigilo e são disponibilizados apenas aos advogados cadastrados e ao profissional escolhido para o seu caso. Conforme a LGPD (Lei Geral de Proteção de Dados), você tem direito de solicitar a exclusão dos seus dados a qualquer momento.
            </p>

            <h2>6. Responsabilidades do Advogado (Para Profissionais)</h2>
            <p>
              Advogados cadastrados comprometem-se a atuar com ética, em conformidade com o Estatuto da Advocacia e Código de Ética da OAB. A plataforma reserva-se o direito de banir profissionais que recebam reclamações fundamentadas de usuários ou que atuem em desconformidade com as regras da plataforma.
            </p>

            <h2>7. Foro</h2>
            <p>
              Fica eleito o foro da comarca de São Paulo/SP para dirimir quaisquer dúvidas oriundas deste documento, com renúncia a qualquer outro, por mais privilegiado que seja.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
