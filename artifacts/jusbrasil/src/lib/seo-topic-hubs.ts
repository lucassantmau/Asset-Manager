/**
 * Hubs de conteúdo: páginas de conversão (landing) ↔ artigos do blog.
 * Usado para interlinking interno (SEO + navegação).
 */
export type SeoTopicHub = {
  id: "atraso-voo" | "cobranca-indevida" | "juizado-especial-civel";
  title: string;
  blurb: string;
  landingHref: string;
  blogSlug: string;
};

export const SEO_TOPIC_HUBS: SeoTopicHub[] = [
  {
    id: "atraso-voo",
    title: "Atraso e cancelamento de voo",
    blurb: "Reacomodação, reembolso, assistência material e quando buscar indenização.",
    landingHref: "/atraso-voo",
    blogSlug: "voo-cancelado-quais-sao-seus-direitos",
  },
  {
    id: "cobranca-indevida",
    title: "Cobrança indevida",
    blurb: "Como contestar, quais provas guardar e direitos previstos no CDC.",
    landingHref: "/cobranca-indevida",
    blogSlug: "cobranca-indevida-o-que-e-e-como-resolver",
  },
  {
    id: "juizado-especial-civel",
    title: "Juizado Especial Cível",
    blurb: "Limites de valor, quando há jus postulandi e causas mais comuns no JEC.",
    landingHref: "/juizado-especial-civel",
    blogSlug: "juizado-especial-civel-como-funciona",
  },
];

export function getLandingHrefForBlogSlug(slug: string): string | undefined {
  return SEO_TOPIC_HUBS.find((h) => h.blogSlug === slug)?.landingHref;
}

export function getSiblingHubLandings(excludeId: SeoTopicHub["id"]): SeoTopicHub[] {
  return SEO_TOPIC_HUBS.filter((h) => h.id !== excludeId);
}
