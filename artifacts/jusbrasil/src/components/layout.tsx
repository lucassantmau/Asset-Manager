import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ShieldCheck, ArrowRight, MessageCircle, Lock, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col relative bg-white text-[#111111]">
      <header className="fixed top-0 inset-x-0 z-50 bg-primary text-white shadow-md py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <ShieldCheck className="w-8 h-8 text-white" />
              <span className="font-bold text-xl tracking-tight text-white leading-tight">
                Pequenas Causas <span className="opacity-80">Processos</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              <Link href="/" className="text-sm font-medium text-white/80 hover:text-white transition-colors">Início</Link>
              <a href="/#como-funciona" className="text-sm font-medium text-white/80 hover:text-white transition-colors">Como Funciona</a>
              <a href="/#depoimentos" className="text-sm font-medium text-white/80 hover:text-white transition-colors">Depoimentos</a>
              <Link href="/blog" className="text-sm font-medium text-white/80 hover:text-white transition-colors">Blog</Link>
            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-4">
              <Link href="/advogado/signin" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
                Área do Advogado
              </Link>
              <Link href="/area-do-cliente" className="px-4 py-2 rounded-full border-2 border-white/40 text-sm font-medium text-white hover:bg-white/10 transition-all">
                Área do Cliente
              </Link>
              <a href="/#avaliar" className="px-5 py-2.5 rounded-full bg-white text-primary text-sm font-bold hover:bg-white/90 transition-all flex items-center gap-1.5">
                Avaliar Caso <ArrowRight className="w-4 h-4" />
              </a>
              <div className="flex items-center gap-1.5 text-white/70 text-sm ml-2">
                <Lock className="w-4 h-4" />
                Site Seguro
              </div>
            </div>

            {/* Mobile right side */}
            <div className="lg:hidden flex items-center gap-3">
              <div className="flex items-center gap-1 text-white/70 text-xs">
                <Lock className="w-3.5 h-3.5" />
                Seguro
              </div>
              <button
                className="p-2 text-white rounded-lg hover:bg-white/10 transition-colors"
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
            <nav className="flex flex-col gap-5 mt-6">
              <Link href="/" className="text-xl font-bold text-[#111111] py-3 border-b border-slate-100">Início</Link>
              <a href="/#como-funciona" className="text-xl font-bold text-[#111111] py-3 border-b border-slate-100" onClick={() => setMobileMenuOpen(false)}>Como Funciona</a>
              <Link href="/blog" className="text-xl font-bold text-[#111111] py-3 border-b border-slate-100">Blog</Link>
              <Link href="/advogado/signin" className="text-lg text-[#555555] py-3 border-b border-slate-100">Login Advogado</Link>
              <Link href="/area-do-cliente" className="text-lg text-[#555555] py-3 border-b border-slate-100">Área do Cliente</Link>
              <a
                href="/#avaliar"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-4 w-full py-4 rounded-2xl bg-primary text-white font-bold text-center flex items-center justify-center gap-2 shadow-lg"
              >
                Enviar Meu Caso <ArrowRight className="w-5 h-5" />
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 w-full pt-[60px]">
        {children}
      </main>

      {/* Floating WhatsApp */}
      <a
        href="https://api.whatsapp.com/send?phone=5511963714953"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#25D366] rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center text-white"
        aria-label="Contato via WhatsApp"
      >
        <MessageCircle className="w-7 h-7" />
      </a>

      {/* Footer */}
      <footer className="bg-slate-900 text-white pt-16 pb-8 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-5">
                <ShieldCheck className="w-7 h-7 text-accent" />
                <span className="font-bold text-xl text-white">
                  Pequenas Causas <span className="text-accent">Processos</span>
                </span>
              </Link>
              <p className="text-slate-400 text-base max-w-sm mb-6 leading-relaxed">
                Apoio às Pequenas Causas Online. A Pequenas Causas Processos é uma plataforma tecnológica privada que conecta cidadãos a advogados independentes verificados.
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-800 w-fit px-4 py-2 rounded-full border border-slate-700">
                <ShieldCheck className="w-4 h-4 text-green-400" />
                Plataforma 100% Segura
              </div>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-5 text-white">Links Úteis</h4>
              <ul className="flex flex-col gap-4 text-base text-slate-400">
                <li><Link href="/blog" className="hover:text-accent transition-colors">Blog & Artigos</Link></li>
                <li><Link href="/advogado/signup" className="hover:text-accent transition-colors">Para Advogados</Link></li>
                <li><Link href="/area-do-cliente" className="hover:text-accent transition-colors">Acompanhar Processo</Link></li>
                <li><Link href="/termos" className="hover:text-accent transition-colors">Termos de Uso</Link></li>
                <li><Link href="/termos" className="hover:text-accent transition-colors">Política de Privacidade</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-5 text-white">Atendimento</h4>
              <a
                href="https://api.whatsapp.com/send?phone=5511963714953"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors text-base font-medium"
              >
                <MessageCircle className="w-5 h-5 text-green-400" />
                Suporte WhatsApp
              </a>
              <p className="text-sm text-slate-500 mt-4">
                Segunda a Sexta, das 09h às 18h.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} Pequenas Causas Processos. Todos os direitos reservados.
            </p>
            <p className="text-sm text-slate-500">
              Não possuímos vínculo com o Poder Judiciário.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
