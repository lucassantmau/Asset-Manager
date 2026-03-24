import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Scale, ArrowRight, ShieldCheck, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col relative">
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b",
          isScrolled 
            ? "bg-background/80 backdrop-blur-lg border-white/10 shadow-lg shadow-black/50 py-3" 
            : "bg-transparent border-transparent py-5"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-background shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all">
                <Scale className="w-5 h-5" />
              </div>
              <span className="font-display font-bold text-2xl tracking-wide text-foreground">
                Procjus <span className="gold-gradient-text">Premium</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Início</Link>
              <a href="/#como-funciona" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Como Funciona</a>
              <a href="/#depoimentos" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Depoimentos</a>
              <Link href="/blog" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Blog</Link>
            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-4">
              <Link href="/advogado/signin" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Área do Advogado
              </Link>
              <Link href="/area-do-cliente" className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-foreground hover:bg-white/10 transition-all">
                Área do Cliente
              </Link>
              <a 
                href="/#avaliar" 
                className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                Avaliar Caso <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              className="lg:hidden p-2 text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl pt-24 pb-6 px-4 flex flex-col"
          >
            <nav className="flex flex-col gap-6 items-center text-lg mt-8">
              <Link href="/" className="font-display text-xl">Início</Link>
              <a href="/#como-funciona" className="font-display text-xl" onClick={() => setMobileMenuOpen(false)}>Como Funciona</a>
              <Link href="/blog" className="font-display text-xl">Blog</Link>
              <div className="w-full h-px bg-white/10 my-4"></div>
              <Link href="/advogado/signin" className="text-muted-foreground">Login Advogado</Link>
              <Link href="/area-do-cliente" className="text-muted-foreground">Área do Cliente</Link>
              <a 
                href="/#avaliar" 
                onClick={() => setMobileMenuOpen(false)}
                className="mt-4 w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-center flex items-center justify-center gap-2"
              >
                Enviar Meu Caso <ArrowRight className="w-5 h-5" />
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 w-full pt-20">
        {children}
      </main>

      {/* Floating WhatsApp CTA */}
      <a 
        href="#"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-green-500 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] hover:-translate-y-1 transition-all flex items-center justify-center text-white"
        aria-label="Contato via WhatsApp"
      >
        <MessageCircle className="w-7 h-7" />
      </a>

      {/* Footer */}
      <footer className="bg-black border-t border-white/5 pt-16 pb-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-6">
                <Scale className="w-6 h-6 text-primary" />
                <span className="font-display font-bold text-xl text-foreground">
                  Procjus <span className="text-primary">Premium</span>
                </span>
              </Link>
              <p className="text-muted-foreground text-sm max-w-sm mb-6 leading-relaxed">
                Apoio às Pequenas Causas Online. A Procjus é uma plataforma tecnológica privada que conecta cidadãos a advogados independentes verificados. Não somos um escritório de advocacia.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white/5 w-fit px-3 py-1.5 rounded-full border border-white/10">
                <ShieldCheck className="w-4 h-4 text-green-400" />
                Plataforma 100% Segura
              </div>
            </div>
            
            <div>
              <h4 className="font-display font-semibold text-lg mb-6 text-foreground">Links Úteis</h4>
              <ul className="flex flex-col gap-4 text-sm text-muted-foreground">
                <li><Link href="/blog" className="hover:text-primary transition-colors">Blog & Artigos</Link></li>
                <li><Link href="/advogado/signup" className="hover:text-primary transition-colors">Para Advogados</Link></li>
                <li><Link href="/area-do-cliente" className="hover:text-primary transition-colors">Acompanhar Processo</Link></li>
                <li><Link href="/termos" className="hover:text-primary transition-colors">Termos de Uso</Link></li>
                <li><Link href="/termos" className="hover:text-primary transition-colors">Política de Privacidade</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-display font-semibold text-lg mb-6 text-foreground">Atendimento</h4>
              <a 
                href="#" 
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm font-medium"
              >
                <MessageCircle className="w-5 h-5 text-green-400" />
                Suporte WhatsApp
              </a>
              <p className="text-xs text-muted-foreground mt-4">
                Segunda a Sexta, das 09h às 18h.
              </p>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Procjus Premium. Todos os direitos reservados.
            </p>
            <p className="text-xs text-muted-foreground">
              Não possuímos vínculo com o Poder Judiciário.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
