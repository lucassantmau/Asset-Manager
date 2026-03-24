import { db, blogPostsTable } from "@workspace/db";
import { randomUUID } from "crypto";

const posts = [
  {
    uuid: randomUUID(),
    slug: "problemas-com-voo",
    title: "Problemas com voo? Saiba seus direitos e como ser indenizado",
    summary:
      "Se você passou por atraso ou cancelamento de voo, overbooking ou extravio de bagagem, pode ter direito a indenização por danos morais e materiais.",
    content: `
# Problemas com voo? Saiba seus direitos e como ser indenizado

Se você passou por **atraso ou cancelamento de voo**, **overbooking** ou **extravio de bagagem**, pode ter direito a **indenização por danos morais e materiais**.

## O que diz a lei?

O Código de Defesa do Consumidor (CDC) e as resoluções da ANAC garantem direitos aos passageiros em casos de problemas com voos. Entre os direitos mais importantes estão:

- **Atraso superior a 1 hora**: direito a comunicação (internet, telefone)
- **Atraso superior a 2 horas**: direito a alimentação (voucher)
- **Atraso superior a 4 horas**: direito a acomodação ou reacomodação em outro voo
- **Cancelamento**: direito a reembolso integral ou reacomodação

## Quanto posso receber de indenização?

Os valores variam de acordo com o caso, mas indenizações por danos morais em casos de atraso de voo costumam variar entre R$ 3.000 e R$ 15.000.

## Como entrar com ação?

O Juizado Especial Cível (Pequenas Causas) é o caminho ideal para buscar indenização por problemas com voos. O processo é simples, rápido e gratuito para causas de até 20 salários mínimos.

A Procjus conecta você a advogados especializados que podem analisar seu caso e apresentar propostas, inclusive no modelo ad exitum (só cobra se ganhar).
    `,
    category: "Aviação",
    imageUrl: null,
    publishedAt: new Date("2025-09-18"),
  },
  {
    uuid: randomUUID(),
    slug: "juizado-especial-civel",
    title: "Juizado Especial Cível: tudo que você precisa saber sobre as Pequenas Causas",
    summary:
      "O Juizado Especial Cível (JEC) é uma das portas mais acessíveis da Justiça brasileira. Criado pela Lei nº 9.099/95, resolve pequenas causas de forma rápida e simplificada.",
    content: `
# Juizado Especial Cível: tudo que você precisa saber

O **Juizado Especial Cível (JEC)** é uma das portas mais acessíveis da Justiça brasileira. Criado pela **Lei nº 9.099/95**, ele foi pensado para resolver **pequenas causas** de forma rápida e simplificada.

## O que é o Juizado Especial?

O Juizado Especial Cível é um órgão da Justiça Estadual criado para julgar causas de menor complexidade, com valor de até **40 salários mínimos** (ou 20 SM para empresas).

## Quem pode usar o Juizado Especial?

- Qualquer pessoa física maior de 18 anos
- Micro e pequenas empresas (como autores da ação)

## Quais causas podem ser julgadas?

- Problemas com produtos e serviços (CDC)
- Cobranças indevidas
- Danos morais e materiais
- Problemas com planos de saúde
- Questões de vizinhança
- E muitas outras

## Preciso de advogado?

Para causas de até **20 salários mínimos**, não é obrigatório ter advogado. Para causas de 20 a 40 SM, a representação por advogado é obrigatória.

Mesmo não sendo obrigatório, contar com um advogado especializado aumenta significativamente suas chances de sucesso.
    `,
    category: "Pequenas Causas",
    imageUrl: null,
    publishedAt: new Date("2025-09-18"),
  },
  {
    uuid: randomUUID(),
    slug: "procon-ou-juizado-especial",
    title: "PROCON ou Juizado Especial? Entenda a diferença e faça a escolha certa",
    summary:
      "Você teve um problema com uma empresa e não sabe para onde ir: PROCON ou Juizado Especial? Entenda as diferenças e qual é o melhor caminho para o seu caso.",
    content: `
# PROCON ou Juizado Especial? Entenda a diferença

Você teve um problema com uma empresa, tentou resolver e não conseguiu? É comum surgir a dúvida: vale mais a pena procurar o **PROCON** ou entrar com ação no **Juizado Especial**?

## O que é o PROCON?

O PROCON é um órgão de proteção e defesa do consumidor. Ele atua como mediador entre consumidor e empresa, buscando uma solução amigável.

### Vantagens do PROCON:
- Gratuito
- Rápido para resoluções simples
- Pode pressionar a empresa administrativamente

### Desvantagens do PROCON:
- **Não garante indenização**
- A empresa pode simplesmente ignorar
- Não tem poder de obrigar pagamentos

## O que é o Juizado Especial?

O Juizado Especial Cível é um órgão do Poder Judiciário. Ele pode **condenar** a empresa ao pagamento de indenizações e multas.

### Vantagens do Juizado Especial:
- **Pode garantir indenização real**
- Decisão com força judicial
- Processo gratuito para causas simples

### Quando usar cada um?

| Situação | Melhor opção |
|----------|-------------|
| Problema simples, quer resolver rápido | PROCON |
| Quer garantir indenização | Juizado Especial |
| Empresa não responde ao PROCON | Juizado Especial |

**Conclusão:** Se você quer uma **solução real com indenização**, o Juizado Especial é o caminho certo.
    `,
    category: "PROCON",
    imageUrl: null,
    publishedAt: new Date("2025-09-18"),
  },
];

async function seed() {
  console.log("Seeding blog posts...");
  for (const post of posts) {
    try {
      await db.insert(blogPostsTable).values(post).onConflictDoNothing();
      console.log(`✓ Inserted: ${post.title}`);
    } catch (e) {
      console.error(`✗ Failed to insert: ${post.title}`, e);
    }
  }
  console.log("Done!");
  process.exit(0);
}

seed();
