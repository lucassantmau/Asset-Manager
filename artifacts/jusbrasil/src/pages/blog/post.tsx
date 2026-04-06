import React, { useMemo } from "react";
import { Layout } from "@/components/layout";
import { Link, useRoute } from "wouter";
import { useGetBlogPost } from "@workspace/api-client-react";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Scale, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { STATIC_BLOG_POSTS } from "./static-posts";
import { getLandingHrefForBlogSlug, SEO_TOPIC_HUBS } from "@/lib/seo-topic-hubs";

export default function BlogPost() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug || "";

  const staticPost = useMemo(
    () => STATIC_BLOG_POSTS.find((p) => p.slug === slug),
    [slug],
  );

  const { data: apiPost, isLoading, error } = useGetBlogPost(slug, {
    query: { enabled: Boolean(slug) && !staticPost },
  });

  const post = staticPost ?? apiPost;
  const loading = Boolean(slug) && !staticPost && isLoading;
  const notFound = Boolean(slug) && !loading && (!post || error);

  const relatedLanding = slug ? getLandingHrefForBlogSlug(slug) : undefined;

  if (!slug) {
    return (
      <Layout>
        <div className="pt-32 pb-32 text-center">
          <Link href="/blog" className="text-primary hover:underline">
            Voltar para o Blog
          </Link>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="pt-32 pb-32 max-w-3xl mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-32 bg-white/10 rounded"></div>
            <div className="h-16 w-full bg-white/10 rounded"></div>
            <div className="h-64 w-full bg-white/10 rounded-2xl my-8"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-4 w-full bg-white/10 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (notFound) {
    return (
      <Layout>
        <div className="pt-32 pb-32 text-center">
          <h1 className="text-2xl font-bold mb-4">Artigo não encontrado</h1>
          <Link href="/blog" className="text-primary hover:underline">
            Voltar para o Blog
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>{post.title} | Blog Jurídico</title>
        <meta name="description" content={post.summary} />
        <link rel="canonical" href={`https://pequenascausasprocessos.com.br/blog/${post.slug}`} />
      </Helmet>
      <article className="pt-24 pb-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-10"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para Artigos
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 text-sm font-medium mb-6">
              <span className="uppercase tracking-wider px-3 py-1 rounded bg-primary/10 text-primary">
                {post.category}
              </span>
              <span className="text-muted-foreground">{formatDate(post.publishedAt)}</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-display font-bold leading-tight mb-8">{post.title}</h1>

            {post.imageUrl ? (
              <div className="w-full aspect-[21/9] rounded-2xl overflow-hidden mb-12 border border-white/10">
                <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-full aspect-[21/9] rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-12">
                <Scale className="w-16 h-16 text-white/10" />
              </div>
            )}

            <div
              className="prose prose-invert prose-lg prose-headings:font-display prose-headings:font-bold prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-xl max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </motion.div>

          {relatedLanding && (
            <div className="mt-14 rounded-2xl border border-primary/25 bg-primary/5 p-6">
              <p className="text-sm font-bold text-foreground mb-1">Resumo rápido do mesmo tema</p>
              <p className="text-sm text-muted-foreground mb-4">
                Confira uma página objetiva com os pontos principais antes de avaliar seu caso.
              </p>
              <Link
                href={relatedLanding}
                className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
              >
                Abrir página do tema <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          <div className="mt-16 pt-8 border-t border-white/10 text-center">
            <h3 className="text-2xl font-display font-bold mb-4">Precisa de ajuda com um caso similar?</h3>
            <Link
              href="/#avaliar"
              className="inline-flex py-4 px-8 rounded-full bg-primary text-primary-foreground font-bold hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all"
            >
              Avaliar Meu Caso Gratuitamente
            </Link>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-3">Outros temas</p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-x-6 text-sm">
              {SEO_TOPIC_HUBS.map((h) => (
                <Link key={h.id} href={h.landingHref} className="text-muted-foreground hover:text-primary">
                  {h.title} →
                </Link>
              ))}
            </div>
          </div>
        </div>
      </article>
    </Layout>
  );
}
