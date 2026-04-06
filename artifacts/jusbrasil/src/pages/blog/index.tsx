import React, { useMemo } from "react";
import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { useGetBlogPosts } from "@workspace/api-client-react";
import { formatDate } from "@/lib/utils";
import { ArrowRight, BookOpen, Scale, Plane, ReceiptText } from "lucide-react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { STATIC_BLOG_POSTS } from "./static-posts";
import { SEO_TOPIC_HUBS } from "@/lib/seo-topic-hubs";

type BlogCardPost = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  publishedAt: string;
  imageUrl?: string | null;
};

function sortPostsDesc(posts: BlogCardPost[]): BlogCardPost[] {
  return [...posts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export default function BlogList() {
  const { data, isLoading, error } = useGetBlogPosts({ page: 1, limit: 10 });

  const posts = useMemo(() => {
    const apiList = data?.posts ?? [];
    const staticSlugs = new Set(STATIC_BLOG_POSTS.map((p) => p.slug));
    const filteredApi = apiList.filter((p: BlogCardPost) => !staticSlugs.has(p.slug));
    const staticAsBlog: BlogCardPost[] = STATIC_BLOG_POSTS.map((p) => ({ ...p }));
    return sortPostsDesc([...staticAsBlog, ...filteredApi]);
  }, [data?.posts]);

  return (
    <Layout>
      <Helmet>
        <title>Blog Jurídico | Pequenas Causas Processos</title>
        <meta
          name="description"
          content="Artigos práticos sobre pequenas causas, Juizado Especial Cível e direitos do consumidor para orientar suas decisões."
        />
        <link rel="canonical" href="https://pequenascausasprocessos.com.br/blog" />
      </Helmet>
      <div className="pt-24 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <BookOpen className="w-12 h-12 text-primary mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">Conhecimento Jurídico</h1>
            <p className="text-xl text-muted-foreground">
              Artigos, guias e notícias sobre direitos do consumidor e Juizado Especial.
            </p>
          </div>

          <div className="mb-16 rounded-2xl border border-white/10 bg-card/50 p-6 md:p-8">
            <p className="text-xs font-bold tracking-widest uppercase text-primary mb-4">Temas em destaque</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SEO_TOPIC_HUBS.map((hub) => {
                const Icon =
                  hub.id === "atraso-voo" ? Plane : hub.id === "cobranca-indevida" ? ReceiptText : Scale;
                return (
                  <div
                    key={hub.id}
                    className="rounded-xl border border-white/10 bg-background/80 p-5 flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-2 text-primary">
                      <Icon className="w-5 h-5 shrink-0" />
                      <span className="font-bold text-sm leading-snug text-foreground">{hub.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed flex-grow">{hub.blurb}</p>
                    <div className="flex flex-col gap-1.5 text-xs">
                      <Link href={hub.landingHref} className="font-semibold text-primary hover:underline inline-flex items-center gap-1">
                        Página do tema <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <Link href={`/blog/${hub.blogSlug}`} className="text-muted-foreground hover:text-primary">
                        Artigo completo
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-2xl border border-white/5 bg-white/5 animate-pulse h-96"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-400">
              Erro ao carregar artigos. Tente novamente mais tarde.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post, i) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group flex flex-col bg-card border border-white/5 rounded-2xl overflow-hidden hover:border-primary/30 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/5"
                >
                  <div className="aspect-video bg-white/5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-black mix-blend-overlay z-10"></div>
                    {post.imageUrl ? (
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-900 group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
                        <Scale className="w-12 h-12 text-white/10" />
                      </div>
                    )}
                  </div>

                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-3 text-xs font-medium text-primary mb-3">
                      <span className="uppercase tracking-wider px-2 py-1 rounded bg-primary/10">{post.category}</span>
                      <span className="text-muted-foreground">{formatDate(post.publishedAt)}</span>
                    </div>

                    <h3 className="text-xl font-display font-bold mb-3 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>

                    <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-grow">{post.summary}</p>

                    <div className="flex flex-col gap-2 mt-auto">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="inline-flex items-center gap-2 text-sm font-bold text-foreground group-hover:text-primary transition-colors"
                      >
                        Ler artigo completo <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
