import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <Layout>
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <AlertCircle className="w-16 h-16 text-primary mb-6" />
        <h1 className="text-4xl font-display font-bold mb-4">Página não encontrada</h1>
        <p className="text-muted-foreground text-lg mb-8 max-w-md">
          A página que você está procurando pode ter sido removida, mudado de nome ou está temporariamente indisponível.
        </p>
        <Link 
          href="/" 
          className="inline-flex py-3 px-8 rounded-full bg-primary text-primary-foreground font-bold hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all"
        >
          Voltar para o Início
        </Link>
      </div>
    </Layout>
  );
}
