import React from "react";
import { Link } from "wouter";
import { getSiblingHubLandings, type SeoTopicHub } from "@/lib/seo-topic-hubs";
import { ArrowRight } from "lucide-react";

type Props = { currentId: SeoTopicHub["id"] };

export function LandingTopicCrosslinks({ currentId }: Props) {
  const siblings = getSiblingHubLandings(currentId);
  return (
    <section className="py-14 bg-[#021a33] text-white border-t border-white/10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-bold tracking-widest uppercase text-white/50 mb-4">Continue navegando</p>
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:items-center sm:justify-between">
          <Link href="/blog" className="text-sm font-semibold text-[#fee001] hover:underline">
            Todos os artigos do blog
          </Link>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm text-white/80">
            {siblings.map((h) => (
              <Link key={h.id} href={h.landingHref} className="inline-flex items-center gap-1 hover:text-white">
                {h.title} <ArrowRight className="w-3.5 h-3.5 opacity-70" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
