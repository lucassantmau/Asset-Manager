import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ShieldCheck, ArrowRight, MessageCircle, Lock, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative bg-background text-foreground">
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-xl shadow-ambient" : "bg-white/80 backdrop-blur-md"} py-4`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between lg:grid lg:grid-cols-[auto_1fr_auto] lg:gap-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <ShieldCheck className="w-7 h-7 text-[#001532]" />
              <span className="font-black text-lg tracking-tight text-[#001532] leading-none">
                Pequenas Causas <span className="text-[#001532]/60 font-semibold">Processos</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center justify-center gap-6">
              <Link href="/" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">Início</Link>
              <a href="/#como-funciona" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">Como Funciona</a>
              <a href="/#depoimentos" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">Depoimentos</a>
              <Link href="/advogado/signin" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">Área do Advogado</Link>
              <a href="/#perguntas-frequentes" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">FAQ</a>
              
              <Link href="/blog" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">Blog</Link>
              <Link href="/termos" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">Termos de Uso</Link>
            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center justify-end gap-3">
              <Link href="/area-do-cliente" className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors px-3 py-2">
                Área do Cliente
              </Link>
              <a
                href="/#avaliar"
                className="px-5 py-2.5 rounded-lg bg-[#fee001] text-[#716300] text-sm font-bold hover:bg-[#ffd000] transition-all flex items-center gap-1.5 shadow-[0_2px_0_0_#caa800]"
              >
                Falar com Advogado <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Mobile right side */}
            <div className="lg:hidden flex items-center gap-3">
              <a href="/#avaliar" className="px-4 py-2 rounded-lg bg-[#fee001] text-[#716300] text-xs font-bold">
                Avaliar Caso
              </a>
              <button
                className="p-2 text-foreground rounded-lg hover:bg-muted transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>
      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed inset-0 z-40 bg-white pt-20 pb-6 px-6 flex flex-col"
          >
            <nav className="flex flex-col gap-2 mt-6">
              <Link href="/" className="text-xl font-bold text-foreground py-4 border-b border-muted">Início</Link>
              <a href="/#como-funciona" className="text-xl font-bold text-foreground py-4 border-b border-muted" onClick={() => setMobileMenuOpen(false)}>Como Funciona</a>
              <a href="/#depoimentos" className="text-xl font-bold text-foreground py-4 border-b border-muted" onClick={() => setMobileMenuOpen(false)}>Depoimentos</a>
              <Link href="/advogado/signin" className="text-lg text-foreground/60 py-4 border-b border-muted">Área do Advogado</Link>
              <a
                href="/#perguntas-frequentes"
                className="text-lg text-foreground/60 py-4 border-b border-muted"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQ
              </a>
              
                <Link href="/blog" className="text-lg text-foreground/60 py-4 border-b border-muted" onClick={() => setMobileMenuOpen(false)}>
                  Blog
                </Link>
              <Link href="/termos" className="text-lg text-foreground/60 py-4 border-b border-muted" onClick={() => setMobileMenuOpen(false)}>
                Termos de Uso
              </Link>
              <Link href="/area-do-cliente" className="text-lg text-foreground/60 py-4 border-b border-muted">Área do Cliente</Link>
              <a
                href="/#avaliar"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-6 w-full py-4 rounded-xl bg-[#fee001] text-[#716300] font-bold text-center flex items-center justify-center gap-2 shadow-[0_4px_0_0_#caa800]"
              >
                Falar com Advogado <ArrowRight className="w-5 h-5" />
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
      <main className="flex-1 w-full pt-[68px]">
        {children}
      </main>
      {/* Floating WhatsApp */}
      <a
        href="https://api.whatsapp.com/send?phone=5511969284925"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#25D366] rounded-full shadow-ambient hover:-translate-y-1 transition-all flex items-center justify-center text-white"
        aria-label="Contato via WhatsApp"
      >
        <MessageCircle className="w-7 h-7" />
      </a>
      {/* Footer */}
      <footer className="bg-[#001532] text-white pt-16 pb-8 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-5">
                <ShieldCheck className="w-6 h-6 text-[#fee001]" />
                <span className="font-black text-xl text-white tracking-tight">
                  Pequenas Causas <span className="text-white/50 font-semibold">Processos</span>
                </span>
              </Link>
              <p className="text-white/50 text-base max-w-sm mb-6 leading-relaxed">
                Apoio às Pequenas Causas Online. A Pequenas Causas Processos é uma plataforma tecnológica privada que conecta cidadãos a advogados independentes verificados.
              </p>
              <div className="flex items-center gap-2 text-sm text-white/50 bg-white/5 w-fit px-4 py-2 rounded-full">
                <ShieldCheck className="w-4 h-4 text-[#fee001]" />
                Plataforma 100% Segura
              </div>
            </div>

            <div>
              <h4 className="font-bold text-base mb-5 text-white/80">Links Úteis</h4>
              <ul className="flex flex-col gap-4 text-sm text-white/40">
                <li><Link href="/blog" className="hover:text-[#fee001] transition-colors">Blog & Artigos</Link></li>
                <li><Link href="/advogado/signup" className="hover:text-[#fee001] transition-colors">Para Advogados</Link></li>
                <li><Link href="/area-do-cliente" className="hover:text-[#fee001] transition-colors">Acompanhar Processo</Link></li>
                <li><Link href="/termos" className="hover:text-[#fee001] transition-colors">Termos de Uso</Link></li>
                <li><Link href="/termos" className="hover:text-[#fee001] transition-colors">Política de Privacidade</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-base mb-5 text-white/80">Atendimento</h4>
              <a
                href="https://api.whatsapp.com/send?phone=5511969284925"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium text-white/70"
              >
                <MessageCircle className="w-5 h-5 text-[#25D366]" />
                Suporte WhatsApp
              </a>
              <a
                href="mailto:contato@pequenascausasprocessos.com.br"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium text-white/70 mt-3"
              >
                <Mail className="w-5 h-5 text-[#fee001]" />
                contato@pequenascausasprocessos.com.br
              </a>
              <p className="text-xs text-white/30 mt-4">
                Segunda a Sexta, das 09h às 18h.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-white/30">
              &copy; {new Date().getFullYear()} Pequenas Causas Processos. Todos os direitos reservados.
            </p>
            <p className="text-xs text-white/30">
              Não possuímos vínculo com o Poder Judiciário.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
