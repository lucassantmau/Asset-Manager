export type StaticBlogPost = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  content: string;
  publishedAt: string;
  imageUrl?: string | null;
};

export const STATIC_BLOG_POSTS: StaticBlogPost[] = [
  {
    id: "static-voo-cancelado-direitos",
    slug: "voo-cancelado-quais-sao-seus-direitos",
    title: "Voo cancelado: quais são os seus direitos?",
    summary:
      "Entenda as obrigações das companhias aéreas, assistência material, reembolso, reacomodação e quando cabe indenização.",
    category: "Direito do Consumidor",
    publishedAt: "2026-04-06T10:00:00.000Z",
    imageUrl: "/blog/capa-voo-cancelado.svg",
    content: `
      <p>Quando um voo é cancelado, a companhia aérea não pode simplesmente deixar o passageiro sem solução. A legislação brasileira garante alternativas obrigatórias, independentemente do motivo do cancelamento.</p>
      <p>De acordo com a Resolução nº 400/2016 da ANAC, a empresa deve oferecer três opções:</p>
      <ul>
        <li><strong>Reacomodação:</strong> em outro voo da mesma companhia ou parceira, no primeiro horário disponível ou em data escolhida pelo passageiro;</li>
        <li><strong>Reembolso total:</strong> devolução integral do valor pago, incluindo taxas, em até 7 dias;</li>
        <li><strong>Transporte por outro meio:</strong> como ônibus, quando o trajeto permitir.</li>
      </ul>
      <p>Além disso, existe o dever de assistência ao passageiro enquanto ele aguarda uma solução.</p>

      <h2>Assistência obrigatória durante a espera</h2>
      <ul>
        <li><strong>A partir de 1 hora:</strong> acesso a meios de comunicação (internet ou telefone);</li>
        <li><strong>A partir de 2 horas:</strong> alimentação (voucher, refeição etc.);</li>
        <li><strong>A partir de 4 horas:</strong> hospedagem e transporte (quando houver necessidade de pernoite).</li>
      </ul>
      <p>Se o passageiro estiver na própria cidade, a empresa pode oferecer apenas o transporte de ida e volta até o aeroporto, sem obrigação de hotel.</p>

      <h2>A empresa precisa avisar com antecedência?</h2>
      <p>Sim. A companhia deve informar alterações com pelo menos 72 horas de antecedência. Se o aviso não ocorrer e o passageiro já estiver no aeroporto, continuam valendo as opções de reacomodação, reembolso ou transporte alternativo, além da assistência material.</p>

      <h2>Quando há direito à indenização?</h2>
      <p>Nem todo cancelamento gera automaticamente indenização por danos morais. Em geral, os tribunais reconhecem quando há algo além do mero aborrecimento, como:</p>
      <ul>
        <li>atrasos prolongados (normalmente acima de 4 horas);</li>
        <li>perda de compromissos importantes;</li>
        <li>falta de assistência adequada;</li>
        <li>falta de informação clara.</li>
      </ul>
      <p>Pelo Código de Defesa do Consumidor, a responsabilidade da companhia é objetiva: basta comprovar dano e nexo com o serviço.</p>

      <h2>Qual o valor da indenização?</h2>
      <p>Não existe valor fixo. Em decisões recentes, é comum ver faixas entre <strong>R$ 3 mil e R$ 15 mil</strong> em casos individuais, além de possível ressarcimento de despesas comprovadas (hospedagem, alimentação, transporte, diárias extras etc.).</p>

      <h2>Por que voos são cancelados?</h2>
      <ul>
        <li>problemas técnicos ou manutenção (responsabilidade da companhia);</li>
        <li>falhas operacionais (tripulação, troca de aeronave, atrasos em cadeia);</li>
        <li>baixa demanda (decisão comercial);</li>
        <li>condições climáticas (geralmente sem indenização, mas com assistência obrigatória);</li>
        <li>greves e eventos extraordinários (podem configurar força maior).</li>
      </ul>

      <h2>O que fazer se seu voo for cancelado</h2>
      <ol>
        <li>Peça informações por escrito;</li>
        <li>Anote protocolos, nomes e horários;</li>
        <li>Exija assistência conforme o tempo de espera;</li>
        <li>Escolha entre reembolso e reacomodação (a decisão é sua);</li>
        <li>Guarde comprovantes de todos os gastos;</li>
        <li>Registre reclamação em canais oficiais (ANAC, Consumidor.gov.br);</li>
        <li>Busque orientação jurídica em caso de prejuízo.</li>
      </ol>

      <h2>Documentos importantes</h2>
      <ul>
        <li>passagem e cartão de embarque;</li>
        <li>mensagens/e-mails sobre o cancelamento;</li>
        <li>protocolos de atendimento;</li>
        <li>fotos do painel do aeroporto;</li>
        <li>notas fiscais de despesas extras;</li>
        <li>comprovantes de compromissos afetados.</li>
      </ul>

      <h2>Juizado Especial e prazos</h2>
      <p>No Juizado Especial Cível, em regra:</p>
      <ul>
        <li>até 20 salários mínimos: sem advogado;</li>
        <li>até 40 salários mínimos: com advogado.</li>
      </ul>
      <p>Prazo para ação:</p>
      <ul>
        <li>voos nacionais: até 5 anos;</li>
        <li>voos internacionais: até 2 anos.</li>
      </ul>
      <p>Quanto antes você agir, melhor para preservar provas.</p>
    `,
  },
  {
    id: "static-cobranca-indevida",
    slug: "cobranca-indevida-o-que-e-e-como-resolver",
    title: "Cobrança indevida: o que é e como resolver",
    summary:
      "Saiba identificar cobrança indevida, conhecer seus direitos no CDC e agir para recuperar valores e buscar indenização.",
    category: "Direito do Consumidor",
    publishedAt: "2026-04-05T10:00:00.000Z",
    imageUrl: "/blog/capa-cobranca-indevida.svg",
    content: `
      <p>Receber uma cobrança que você não deveria pagar é mais comum do que parece — e, além de injusto, é prática irregular à luz do Código de Defesa do Consumidor (CDC).</p>
      <p>Muitas pessoas não percebem cobranças indevidas por falta de controle detalhado das finanças. Entender como identificar e reagir é essencial para evitar prejuízos.</p>

      <h2>O que caracteriza cobrança indevida?</h2>
      <ul>
        <li>conta já quitada cobrada novamente;</li>
        <li>débito automático sem autorização;</li>
        <li>serviços não contratados em fatura;</li>
        <li>cobranças decorrentes de golpes/fraudes;</li>
        <li>tarifas bancárias ou de telefonia não contratadas.</li>
      </ul>

      <h2>Cobrança indevida x cobrança abusiva</h2>
      <p>Mesmo quando a dívida existe, o consumidor não pode ser exposto a constrangimento. Ameaças, insistência excessiva, exposição ao ridículo e pressão desproporcional são condutas proibidas.</p>

      <h2>O que diz o CDC</h2>
      <p>O art. 42 do CDC prevê que quem pagou valor indevido pode receber em dobro o que pagou a mais, com correção monetária e juros, salvo erro justificável.</p>

      <h2>Como agir na prática</h2>
      <ol>
        <li>Entre em contato com a empresa e registre a reclamação;</li>
        <li>Anote protocolos, datas e horários;</li>
        <li>Guarde comprovantes e documentos.</li>
      </ol>
      <p>Se não resolver, procure Procon, Senacon, Defensoria Pública, Ministério Público ou Juizado Especial Cível.</p>

      <h2>Sou obrigado a pagar?</h2>
      <p>Não. O consumidor não é obrigado a pagar cobrança indevida. Se pagou, pode exigir devolução (inclusive em dobro, quando aplicável).</p>

      <h2>Prazos mais comuns</h2>
      <ul>
        <li>até 10 anos para reaver valores em alguns contextos consolidados na jurisprudência;</li>
        <li>até 5 anos para reparação por falha na prestação de serviço (art. 27 do CDC);</li>
        <li>até 90 dias para vícios aparentes em serviços/produtos duráveis (art. 26 do CDC).</li>
      </ul>

      <h2>Posso pedir indenização?</h2>
      <p>Sim, especialmente quando há negativação indevida ou outros prejuízos materiais e morais. Será necessário comprovar a cobrança indevida e o dano sofrido.</p>
    `,
  },
  {
    id: "static-jec-guia",
    slug: "juizado-especial-civel-como-funciona",
    title: "Juizado Especial Cível: como funciona na prática",
    summary:
      "Guia completo sobre o JEC: quem pode usar, limites de valor, tipos de ação, necessidade de advogado e protocolo online.",
    category: "Juizado Especial",
    publishedAt: "2026-04-04T10:00:00.000Z",
    imageUrl: "/blog/capa-juizado-especial.svg",
    content: `
      <p>O Juizado Especial Cível (JEC), criado pela Lei nº 9.099/95, foi pensado para resolver conflitos de menor complexidade com mais rapidez e menos burocracia.</p>

      <h2>O que é o Juizado Especial Cível?</h2>
      <p>É um órgão do Judiciário para causas simples, como cobranças, dívidas e falhas em produtos/serviços. A prioridade é a conciliação; sem acordo, o juiz decide.</p>
      <p>Até 20 salários mínimos, em regra, a pessoa pode atuar sem advogado (jus postulandi). Ainda assim, apoio jurídico costuma aumentar a segurança estratégica.</p>

      <h2>Quem pode usar</h2>
      <ul>
        <li>pessoas físicas maiores e capazes;</li>
        <li>microempresas (ME) e empresas de pequeno porte (EPP);</li>
        <li>OSCIPs.</li>
      </ul>

      <h2>Quem não pode usar</h2>
      <ul>
        <li>menores, incapazes e pessoas privadas de liberdade;</li>
        <li>entes públicos e empresas públicas federais;</li>
        <li>massa falida, insolventes civis e grandes empresas;</li>
        <li>cessionários de direitos de pessoa jurídica.</li>
      </ul>

      <h2>Limites de valor</h2>
      <ul>
        <li>até 20 salários mínimos: sem advogado;</li>
        <li>de 20 a 40 salários mínimos: com advogado;</li>
        <li>acima de 40: só com renúncia ao excedente (no JEC).</li>
      </ul>

      <h2>Casos comuns</h2>
      <ul>
        <li>cobrança indevida/duplicada;</li>
        <li>negativação indevida;</li>
        <li>produto com defeito sem solução;</li>
        <li>serviço contratado e não executado;</li>
        <li>atraso de entrega;</li>
        <li>problemas com companhias aéreas (inclusive bagagem).</li>
      </ul>

      <h2>Casos que não entram no JEC</h2>
      <ul>
        <li>trabalho e acidente de trabalho;</li>
        <li>família (divórcio, guarda, alimentos);</li>
        <li>inventário/herança/testamento;</li>
        <li>matérias criminais;</li>
        <li>demandas federais específicas (ex.: INSS, Caixa), em regra do Juizado Federal.</li>
      </ul>

      <h2>É possível entrar online?</h2>
      <p>Em alguns estados, sim. Mas na prática pode exigir cadastro prévio, certificado digital e domínio do PJe, além de cuidados formais para evitar extinção sem julgamento do mérito.</p>

      <h2>Conclusão</h2>
      <p>O JEC amplia o acesso à Justiça e pode ser um caminho eficiente para conflitos cotidianos. Mesmo com rito simplificado, organização de provas e orientação adequada fazem diferença no resultado.</p>
    `,
  },
];
