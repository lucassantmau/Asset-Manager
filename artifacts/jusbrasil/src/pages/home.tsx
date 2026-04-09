import React, { useState, useRef } from "react";
import { Layout } from "@/components/layout";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  Clock, 
  Scale, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  CreditCard,
  QrCode,
  Lock,
  Star,
  ChevronDown,
  AlertCircle,
  Circle,
  CheckCircle,
  ListOrdered,
  Plane,
  ReceiptText
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSubmitCase, useCreatePayment } from "@workspace/api-client-react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { Helmet } from "react-helmet-async";
import { SEO_TOPIC_HUBS } from "@/lib/seo-topic-hubs";

/** Link de checkout (Klivo). Altere aqui se o gateway mudar. */
const PAGAMENTO_KLIVO_URL = "https://go.klivopay.com.br/t45jsqe1qe";

// Form schemas
const caseStep1Schema = z.object({
  description: z.string().min(20, "Mínimo de 20 caracteres necessários"),
  evidences: z.array(z.string()).optional(),
  value: z.coerce.number().optional().nullable(),
});

const caseStep2Schema = z.object({
  name: z.string().min(3, "Nome é obrigatório"),
  whatsapp: z.string().min(10, "WhatsApp válido é obrigatório"),
  email: z.string().email("E-mail inválido"),
  state: z.string().optional(),
  city: z.string().optional(),
  terms: z.boolean().refine(val => val === true, "Você deve aceitar os termos"),
});

const checkoutSchema = z.object({
  method: z.enum(["pix", "credit_card", "debit_card"]),
  cpf: z.string().min(11, "CPF inválido"),
});

const EVIDENCES = [
  "Conversas e mensagens", "Áudios", "Fotos e vídeos", 
  "E-mails", "Testemunhas", "Comprovantes de pagamento", "Contrato ou proposta", 
  "Protocolos de atendimento", "Boletim de ocorrência", "Outros documentos"
];

const CAUSES = [
  "Cobrança Indevida", "Negativação Indevida", "Atraso de Vôo", 
  "Extravio de Bagagem", "Plano de Saúde", "Pacotes de Viagem", 
  "Cancelamento e Reembolso", "Golpes contra o Consumidor", 
  "Acidente de Trânsito", "Desconto Indevido INSS", "Danos Morais", 
  "Contas (Água, Luz, Telefone)", "Cobrança de Dívidas", "Problemas de Vizinhança"
];

const FAQS = [
  { q: "Quanto tempo demora uma ação no Juizado Especial?", a: "Em média o processo leva de 3 a 6 meses. Com nosso acompanhamento especializado cuidamos de toda a burocracia." },
  { q: "Preciso ir ao fórum ou fazer algo presencialmente?", a: "Na maioria dos casos não. O processo é 100% digital. Nossos advogados cuidam de tudo online." },
  { q: "E se eu perder a ação, preciso pagar algo?", a: "No Juizado Especial não há custas processuais na primeira instância. O valor de R$149,99 é apenas pelos honorários para dar entrada no processo." },
  { q: "Por que contratar vocês em vez de ir ao PROCON?", a: "O PROCON é mediação sem poder para obrigar empresas a pagar indenização. No Juizado o juiz pode condenar a empresa. Com a Pequenas Causas você tem advogados especializados por apenas R$149,99." },
  { q: "Quais tipos de problemas vocês resolvem?", a: "Cobranças indevidas, nome negativado, problemas com companhias aéreas, falhas em produtos ou serviços. Faça a avaliação gratuita." },
];

const JOURNEY_STEPS = [
  { id: 1, label: "Diagnóstico" },
  { id: 2, label: "Identificação" },
  { id: 3, label: "Ativação" },
];
const FORM_TITLE_CLASS = "text-2xl md:text-[30px] font-black tracking-[-0.03em] text-foreground leading-tight";

export default function Home() {
  const formCardRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(1);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [pixCode, setPixCode] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const submitCaseMutation = useSubmitCase();
  const createPaymentMutation = useCreatePayment();

  const scrollToCard = () => {
    setTimeout(() => {
      formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Form states
  const form1 = useForm<z.infer<typeof caseStep1Schema>>({
    resolver: zodResolver(caseStep1Schema),
    defaultValues: { evidences: [] }
  });
  
  const form2 = useForm<z.infer<typeof caseStep2Schema>>({
    resolver: zodResolver(caseStep2Schema)
  });

  const checkoutForm = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { method: "pix" }
  });

  const onStep1Submit = (data: z.infer<typeof caseStep1Schema>) => {
    setStep(2);
    scrollToCard();
  };

  const onStep2Submit = async (data: z.infer<typeof caseStep2Schema>) => {
    setStep(3); // Loading / Analyzing state
    const step1Data = form1.getValues();
    const evidences = step1Data.evidences || [];

    try {
      const { error } = await supabase.from("cases").insert({
        case_description: step1Data.description,
        evidence_conversas: evidences.includes("Conversas e mensagens"),
        evidence_audios: evidences.includes("Áudios"),
        evidence_fotos: evidences.includes("Fotos e vídeos"),
        evidence_emails: evidences.includes("E-mails"),
        evidence_testemunhas: evidences.includes("Testemunhas"),
        evidence_comprovantes: evidences.includes("Comprovantes de pagamento"),
        evidence_contrato: evidences.includes("Contrato ou proposta"),
        evidence_protocolos: evidences.includes("Protocolos de atendimento"),
        evidence_boletim: evidences.includes("Boletim de ocorrência"),
        evidence_outros: evidences.includes("Outros documentos"),
        claim_value: parseFloat(String(step1Data.value)) || 0,
        full_name: data.name,
        whatsapp: data.whatsapp,
        email: data.email,
        state: data.state ?? null,
        city: data.city ?? null,
        accepted_terms: data.terms,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Failed to submit case (continua para pagamento mesmo assim)", error);
    }

    // Sempre leva ao passo do pagamento (link Klivo), para o cliente não ficar bloqueado
    // se a tabela `cases` estiver indisponível no Supabase.
    window.setTimeout(() => { setStep(7); scrollToCard(); }, 2000);
  };

  const onCheckoutSubmit = async (data: z.infer<typeof checkoutSchema>) => {
    if (!caseId) return;
    const step2Data = form2.getValues();
    
    try {
      const result = await createPaymentMutation.mutateAsync({
        data: {
          caseId,
          email: step2Data.email,
          whatsapp: step2Data.whatsapp,
          cpf: data.cpf,
          method: data.method as any,
        }
      });
      
      // Google Ads Conversion Tracking
      if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
        (window as any).gtag('event', 'conversion', {
          'send_to': 'AW-16505818170/R7Z0CNvf_JYcELqYy749',
          'value': 1.0,
          'currency': 'BRL'
        });
      }

      if (data.method === 'pix') {
        setPixCode(result.pixCode || "00020126360014br.gov.bcb.pix0114+5511999999999");
        setStep(5);
      } else {
        setStep(6); // Success credit card
      }
    } catch (error) {
      console.error("Payment failed", error);
    }
  };

  return (
    <Layout>
      <Helmet>
        <title>Pequenas Causas | Advogados Especialistas em Juizado Especial - R$149,99</title>
        <meta name="description" content="Conectamos seu caso a advogados especialistas em Pequenas Causas e Juizado Especial Civel. Atendimento 100% digital por apenas R$149,99. Advogados que so cobram se voce ganhar." />
        <meta name="keywords" content="pequenas causas, juizado especial, advogado online, advogado pequenas causas, juizado especial civel, processo pequenas causas, advogado digital" />
        <link rel="canonical" href="https://pequenascausasprocessos.com.br" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://pequenascausasprocessos.com.br" />
        <meta property="og:title" content="Pequenas Causas | Advogados Especialistas - Atendimento Digital" />
        <meta property="og:description" content="Acesse nossa rede de advogados especialistas em Pequenas Causas por apenas R$149,99. 100% digital, advogados que so cobram no exito da causa." />
        <meta property="og:locale" content="pt_BR" />
        <meta property="og:site_name" content="Pequenas Causas Processos" />
        <meta property="og:image" content="https://cdn.jsdelivr.net/gh/lucassantmau/Asset-Manager@main/artifacts/mockup-sandbox/public/og-image.png" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pequenas Causas | Advogados Especialistas - R$149,99" />
        <meta name="twitter:description" content="Conectamos seu caso a advogados especialistas em Pequenas Causas. 100% digital, so paga se ganhar." />

        <meta name="twitter:image" content="https://cdn.jsdelivr.net/gh/lucassantmau/Asset-Manager@main/artifacts/mockup-sandbox/public/og-image.png" />
        {/* Structured Data - LegalService */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LegalService",
            "name": "Pequenas Causas Processos",
            "description": "Plataforma digital que conecta clientes a advogados especialistas em Pequenas Causas e Juizado Especial Civel",
            "url": "https://pequenascausasprocessos.com.br",
            "areaServed": { "@type": "Country", "name": "Brazil" },
            "serviceType": "Assessoria Juridica em Pequenas Causas",
            "priceRange": "R$149,99",
            "availableChannel": {
              "@type": "ServiceChannel",
              "serviceType": "Online",
              "availableLanguage": { "@type": "Language", "name": "Portuguese" }
            }
          })}
        </script>

        {/* Structured Data - FAQ */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Quanto custa para acessar a rede de advogados?",
                "acceptedAnswer": { "@type": "Answer", "text": "O acesso a nossa rede de advogados especialistas em pequenas causas custa apenas R$149,99. Apos o pagamento, voce envia seu caso e recebe propostas de advogados que trabalham no modelo ad exitum (so cobram se ganharem)." }
              },
              {
                "@type": "Question",
                "name": "O que sao pequenas causas?",
                "acceptedAnswer": { "@type": "Answer", "text": "Pequenas causas sao processos tramitados no Juizado Especial Civel, para causas de ate 40 salarios minimos. Sao mais rapidos e simples que processos na justica comum." }
              },
              {
                "@type": "Question",
                "name": "Como funciona o atendimento?",
                "acceptedAnswer": { "@type": "Answer", "text": "Apos o pagamento de R$149,99, voce faz upload do seu processo e aguarda propostas de advogados da nossa rede. Os advogados trabalham no modelo ad exitum: so cobram honorarios se ganharem a causa." }
              }
            ]
          })}
        </script>
      </Helmet>
      {/* HERO SECTION */}
      <section className="relative pt-8 pb-12 hero-gradient" id="avaliar">
        {/* Subtle top-right glow */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#032956] rounded-full opacity-40 blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
            {/* Hero Copy — Editorial Juris */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="pt-2 flex flex-col"
            >
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 mb-4">
                <ShieldCheck className="w-3.5 h-3.5 text-[#fee001]" />
                <span className="text-white/80 text-xs font-medium">Advogados verificados OAB</span>
              </div>
              <h1 className="text-[40px] md:text-[48px] font-black leading-[1.05] tracking-tight mb-4 text-white">
                Seus Direitos{" "}
                <span className="text-[#fee001]">Defendidos</span>{" "}
                Sem Sair de Casa.
              </h1>
              <p className="text-white/65 mb-2 max-w-lg text-[15px]">Atendimento jurídico 100% digital. Conectamos seu caso a advogados para avaliação e, se cabível, ação no Juizado Especial Cível</p>
              <p className="text-white/35 mb-3 max-w-lg text-[11px]">Somos uma plataforma de intermediação. Não prestamos serviços jurídicos diretamente.</p>

              {/* Mobile-only compact trust pills */}
              <div className="lg:hidden flex flex-wrap gap-2 mb-3">
                <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#fee001] flex-shrink-0" />
                  <span className="text-white/80 text-xs font-medium">100% Seguro</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#fee001] flex-shrink-0" />
                  <span className="text-white/80 text-xs font-medium">Advogados OAB</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#fee001] flex-shrink-0" />
                  <span className="text-white/80 text-xs font-medium">Triagem Gratuita</span>
                </div>
              </div>

              {/* Trust badges — hidden on mobile so form is visible sooner */}
              <div className="hidden lg:grid grid-cols-2 gap-1.5 flex-1 content-between">
                <div className="flex items-center gap-3 glass-panel p-3 rounded-xl col-span-2">
                  <div className="w-9 h-9 rounded-lg bg-[#fee001] flex items-center justify-center text-[#716300] flex-shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm leading-tight">100% Seguro e Sigiloso</p>
                    <p className="text-muted-foreground text-xs leading-tight">Seus dados estão protegidos por lei.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 glass-panel p-3 rounded-xl col-span-2">
                  <div className="w-9 h-9 rounded-lg bg-[#fee001] flex items-center justify-center text-[#716300] flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm leading-tight">Advogados OAB Verificados</p>
                    <p className="text-muted-foreground text-xs leading-tight">Apenas profissionais registrados.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 glass-panel p-3 rounded-xl col-span-2">
                  <div className="w-9 h-9 rounded-lg bg-[#fee001] flex items-center justify-center text-[#716300] flex-shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm leading-tight">Triagem gratuita do seu caso</p>
                    <p className="text-muted-foreground text-xs leading-tight">Avaliamos sem custo. Leva 2 minutos.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 glass-panel p-3 rounded-xl col-span-2">
                  <div className="w-9 h-9 rounded-lg bg-[#fee001] flex items-center justify-center text-[#716300] flex-shrink-0">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm leading-tight">Plataforma que conecta você</p>
                    <p className="text-muted-foreground text-xs leading-tight">a advogados de pequenas causas, com rapidez e segurança.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 glass-panel p-3 rounded-xl col-span-2">
                  <div className="w-9 h-9 rounded-lg bg-[#fee001] flex items-center justify-center text-[#716300] flex-shrink-0">
                    <ListOrdered className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm leading-tight">Jornada de atendimento</p>
                    <p className="text-muted-foreground text-xs leading-tight">Diagnóstico inicial → Organização do caso → Propostas de advogados parceiros</p>
                  </div>
                </div>
              </div>

              <a href="#avaliar" className="md:hidden mt-6 inline-block w-full text-center bg-yellow-400 hover:bg-yellow-500 text-[#001532] font-bold py-4 px-6 rounded-xl text-lg transition-all">
                Avaliar meu caso grátis →
              </a>
            </motion.div>

            {/* FORM CARD — Editorial Juris */}
            <motion.div 
              ref={formCardRef}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, type: "spring", stiffness: 90, damping: 16 }}
              className="bg-white rounded-2xl border-2 border-slate-200 shadow-[0_14px_46px_0_rgba(15,23,42,0.16)] overflow-hidden"
              role="region"
              aria-label="Formulário de diagnóstico do caso"
            >
              <div className="p-5">
              <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
                  Etapas do atendimento
                </p>
                <div className="flex items-center justify-between gap-2">
                  {JOURNEY_STEPS.map((s, idx) => {
                    const stepNum = idx + 1;
                    const active = s.id === 1 ? step === 1 : s.id === 2 ? step === 2 : step >= 3;
                    const done = s.id === 1 ? step > 1 : s.id === 2 ? step > 2 : false;
                    return (
                      <div key={s.id} className="flex items-center gap-2 min-w-0">
                        <motion.div
                          initial={false}
                          animate={active ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                          transition={{ duration: 0.35 }}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                            active
                              ? "bg-[#001532] text-white"
                              : done
                                ? "bg-emerald-600 text-white"
                                : "bg-white border border-slate-300 text-slate-500"
                          }`}
                        >
                          {stepNum}
                        </motion.div>
                        <span className={`text-xs font-semibold transition-colors ${active ? "text-[#001532]" : "text-slate-500"}`}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
              <AnimatePresence mode="wait">
                {/* STEP 1: Caso e contexto */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div className="bg-gradient-to-r from-[#001532] to-[#032956] -mx-5 -mt-5 px-5 py-3.5 mb-5 border-t-[3px] border-[#fee001] rounded-t-xl">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white tracking-wide">Diagnóstico inicial do caso</h3>
                        <span className="inline-flex items-center gap-1 bg-[#fee001] text-[#716300] text-xs font-bold px-2.5 py-1 rounded-full">
                          <Clock className="w-3 h-3" /> Sem custo nesta etapa
                        </span>
                      </div>
                      <p className="text-white/55 text-xs mt-1">Explique o contexto para montarmos a melhor estratégia com advogados parceiros.</p>
                    </div>

                    <div className="flex items-center gap-2 bg-blue-950/40 border border-blue-800/30 rounded-lg px-3 py-2 text-xs text-blue-200 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span>Triagem gratuita agora · Acesso aos advogados por apenas <strong className="text-yellow-400">R$149,99</strong> após a análise</span>
                    </div>

                    <form onSubmit={form1.handleSubmit(onStep1Submit)} className="space-y-4">
                      <div>
                        <label htmlFor="description" className="block text-xs font-bold text-foreground mb-1.5">
                          Resumo objetivo do que aconteceu *
                        </label>
                        <textarea 
                          id="description"
                          {...form1.register("description")}
                          className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#425f8e] focus:ring-[3px] focus:ring-[#425f8e]/10 transition-all min-h-[100px] resize-y text-sm leading-relaxed"
                          placeholder="Ex: Contratei um serviço, paguei, e a empresa não entregou o que foi prometido..."
                        ></textarea>
                        {form1.formState.errors.description ? (
                          <div className="flex items-center gap-1.5 text-red-700 mt-1.5 bg-red-50 px-3 py-2 rounded-lg">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="text-xs font-medium">{form1.formState.errors.description.message}</span>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1 text-right">
                            {form1.watch("description")?.length || 0} / 2000
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-foreground mb-2">Quais elementos você já possui? <span className="font-normal text-muted-foreground">(opcional)</span></label>
                        <div className="flex flex-wrap gap-1.5">
                          {EVIDENCES.map(ev => {
                            const selected = form1.watch("evidences") || [];
                            const isSelected = selected.includes(ev);
                            return (
                              <button
                                key={ev}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    form1.setValue("evidences", selected.filter(e => e !== ev));
                                  } else {
                                    form1.setValue("evidences", [...selected, ev]);
                                  }
                                }}
                                className={`flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-full text-xs font-medium border transition-all ${
                                  isSelected 
                                    ? "bg-[#001532] border-[#001532] text-white" 
                                    : "bg-white border-muted text-muted-foreground hover:border-[#001532]/30 hover:bg-muted"
                                }`}
                              >
                                {isSelected
                                  ? <CheckCircle className="w-3 h-3 flex-shrink-0" />
                                  : <Circle className="w-3 h-3 flex-shrink-0" />
                                }
                                {ev}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="value" className="block text-xs font-bold text-foreground mb-1.5">Faixa de valor discutido no caso <span className="font-normal text-muted-foreground">(R$ - opcional)</span></label>
                        <input 
                          id="value"
                          type="number"
                          {...form1.register("value")}
                          className="w-full h-10 bg-white border-2 border-slate-200 rounded-xl px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#425f8e] focus:ring-[3px] focus:ring-[#425f8e]/10 transition-all text-sm"
                          placeholder="Ex: 5000"
                        />
                      </div>

                      <button 
                        type="submit"
                        className="group w-full py-3.5 rounded-xl bg-[#001532] text-white font-bold text-sm hover:bg-[#032956] transition-all flex justify-center items-center gap-2"
                      >
                        Avançar para identificação
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* STEP 2: Identificação e contato */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <button 
                        onClick={() => { setStep(1); scrollToCard(); }}
                        className="px-4 py-2 rounded-lg border-2 border-slate-200 font-bold text-sm text-muted-foreground hover:bg-slate-50 transition-colors flex items-center gap-2"
                      >
                        <ArrowRight className="w-4 h-4 rotate-180" /> Voltar
                      </button>
                      <div>
                        <h3 className={FORM_TITLE_CLASS}>Identificação do solicitante</h3>
                        <p className="text-muted-foreground text-xs">Dados usados somente para contato e validação</p>
                      </div>
                    </div>

                    <form onSubmit={form2.handleSubmit(onStep2Submit)} className="space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-bold text-foreground mb-2">Nome completo *</label>
                        <input 
                          id="name"
                          {...form2.register("name")}
                          className="w-full h-12 bg-white border-[3px] border-slate-300 rounded-xl px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[4px] focus:ring-primary/20 transition-all text-base"
                          placeholder="Digite seu nome completo"
                        />
                        {form2.formState.errors.name && (
                          <div className="flex items-center gap-2 text-red-700 mt-2 bg-red-50 p-2.5 rounded-lg border border-red-200">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm font-medium">{form2.formState.errors.name.message}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="whatsapp" className="block text-sm font-bold text-foreground mb-2">WhatsApp *</label>
                          <input 
                            id="whatsapp"
                            {...form2.register("whatsapp")}
                            className="w-full h-12 bg-white border-[3px] border-slate-300 rounded-xl px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[4px] focus:ring-primary/20 transition-all text-base"
                            placeholder="(11) 99999-9999"
                          />
                          {form2.formState.errors.whatsapp && (
                            <div className="flex items-center gap-2 text-red-700 mt-2 bg-red-50 p-2.5 rounded-lg border border-red-200">
                              <AlertCircle className="w-4 h-4 flex-shrink-0" />
                              <span className="text-sm font-medium">{form2.formState.errors.whatsapp.message}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-bold text-foreground mb-2">E-mail *</label>
                          <input 
                            id="email"
                            {...form2.register("email")}
                            type="email"
                            className="w-full h-12 bg-white border-[3px] border-slate-300 rounded-xl px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[4px] focus:ring-primary/20 transition-all text-base"
                            placeholder="seu@email.com"
                          />
                          {form2.formState.errors.email && (
                            <div className="flex items-center gap-2 text-red-700 mt-2 bg-red-50 p-2.5 rounded-lg border border-red-200">
                              <AlertCircle className="w-4 h-4 flex-shrink-0" />
                              <span className="text-sm font-medium">{form2.formState.errors.email.message}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="state" className="block text-sm font-bold text-foreground mb-2">Estado <span className="font-normal text-muted-foreground">(opcional)</span></label>
                          <input 
                            id="state"
                            {...form2.register("state")}
                            className="w-full h-12 bg-white border-[3px] border-slate-300 rounded-xl px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[4px] focus:ring-primary/20 transition-all text-base"
                            placeholder="Ex: SP"
                          />
                        </div>
                        <div>
                          <label htmlFor="city" className="block text-sm font-bold text-foreground mb-2">Cidade <span className="font-normal text-muted-foreground">(opcional)</span></label>
                          <input 
                            id="city"
                            {...form2.register("city")}
                            className="w-full h-12 bg-white border-[3px] border-slate-300 rounded-xl px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[4px] focus:ring-primary/20 transition-all text-base"
                            placeholder="Ex: São Paulo"
                          />
                        </div>
                      </div>

                      <div className="bg-blue-50 border-2 border-primary/20 p-4 rounded-xl flex items-start gap-3">
                        <Lock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground leading-relaxed">
                          <strong>Privacidade e uso responsável:</strong> seus dados são tratados com base na LGPD e utilizados apenas para o fluxo do seu atendimento.
                        </p>
                      </div>

                      <div className="flex items-start gap-3 py-1">
                        <input 
                          type="checkbox" 
                          {...form2.register("terms")}
                          id="terms"
                          className="mt-1 w-5 h-5 rounded border-slate-300 bg-white text-primary focus:ring-primary accent-primary cursor-pointer"
                        />
                        <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                          Declaro que as informações prestadas são verdadeiras e concordo com os <Link href="/termos" className="text-primary font-medium hover:underline">Termos de Uso</Link> e a Política de Privacidade.
                        </label>
                      </div>
                      {form2.formState.errors.terms && (
                        <div className="flex items-center gap-2 text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-200">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm font-medium">{form2.formState.errors.terms.message}</span>
                        </div>
                      )}

                      <button 
                        type="submit"
                        disabled={submitCaseMutation.isPending}
                        className="group w-full py-4 rounded-xl bg-[#0f766e] text-white font-bold text-base hover:bg-[#115e59] disabled:opacity-50 transition-all flex justify-center items-center gap-2 mt-2"
                      >
                        {submitCaseMutation.isPending ? "Processando..." : <>Finalizar diagnóstico e seguir para pagamento <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* STEP 3: Processamento interno */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-16 flex flex-col items-center text-center"
                  >
                    <div className="w-24 h-24 border-[8px] border-[#e5e7eb] border-t-primary rounded-full animate-spin mb-10"></div>
                    <h3 className={FORM_TITLE_CLASS}>Organizando seu atendimento...</h3>
                    <p className="text-lg text-[#333333] max-w-sm">
                      Por favor, aguarde alguns segundos. Estamos validando os dados para liberar a próxima etapa.
                    </p>
                  </motion.div>
                )}

                {/* STEP 4: Checkout */}
                {step === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="mb-8 text-center">
                      <div className="w-20 h-20 rounded-full bg-[#dcfce7] text-[#166534] flex items-center justify-center mx-auto mb-5 border-4 border-[#bbf7d0]">
                        <CheckCircle2 className="w-10 h-10" />
                      </div>
                      <h3 className="text-[28px] font-display font-bold text-[#111111] mb-3">Seu caso tem viabilidade!</h3>
                      <p className="text-lg text-[#333333]">Identificamos fortes elementos para uma ação. Para conectar você a advogados, é necessário o pagamento de uma taxa única de acesso.</p>
                    </div>

                    <div className="bg-[#f8f9fa] border-[3px] border-[#e5e7eb] rounded-xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div>
                        <p className="text-base text-[#444444] mb-1 font-medium">Taxa Única de Acesso à Plataforma</p>
                        <p className="text-[36px] font-bold text-[#111111]">R$ 199,90</p>
                      </div>
                      <ShieldCheck className="w-14 h-14 text-primary" />
                    </div>

                    <form onSubmit={checkoutForm.handleSubmit(onCheckoutSubmit)} className="space-y-4">
                      <div>
                        <label htmlFor="cpf" className="block text-sm font-bold text-foreground mb-2">CPF *</label>
                        <input 
                          id="cpf"
                          {...checkoutForm.register("cpf")}
                          className="w-full h-12 bg-white border-[3px] border-slate-300 rounded-xl px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[4px] focus:ring-primary/20 transition-all text-base"
                          placeholder="000.000.000-00"
                        />
                        {checkoutForm.formState.errors.cpf && (
                          <div className="flex items-center gap-2 text-red-700 mt-2 bg-red-50 p-2.5 rounded-lg border border-red-200">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm font-medium">{checkoutForm.formState.errors.cpf.message}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-foreground mb-2">Forma de Pagamento</label>
                        <div className="grid grid-cols-2 gap-3">
                          <label className={`border-2 rounded-xl p-4 cursor-pointer transition-all text-center flex flex-col items-center gap-2 ${checkoutForm.watch("method") === "pix" ? "border-primary bg-primary/10" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                            <input type="radio" value="pix" {...checkoutForm.register("method")} className="hidden" />
                            <QrCode className={`w-6 h-6 ${checkoutForm.watch("method") === "pix" ? "text-primary" : "text-muted-foreground"}`} />
                            <span className="text-sm font-bold">PIX</span>
                          </label>
                          <label className={`border-2 rounded-xl p-4 cursor-pointer transition-all text-center flex flex-col items-center gap-2 ${checkoutForm.watch("method") === "credit_card" ? "border-primary bg-primary/10" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                            <input type="radio" value="credit_card" {...checkoutForm.register("method")} className="hidden" />
                            <CreditCard className={`w-6 h-6 ${checkoutForm.watch("method") === "credit_card" ? "text-primary" : "text-muted-foreground"}`} />
                            <span className="text-sm font-bold">Cartão</span>
                          </label>
                        </div>
                      </div>

                      <button 
                        type="submit"
                        disabled={createPaymentMutation.isPending}
                        className="w-full py-4 rounded-xl bg-emerald-600 text-white font-bold text-base shadow-[0_6px_0_0_#15803d] hover:shadow-[0_3px_0_0_#15803d] hover:translate-y-[3px] active:shadow-none active:translate-y-[6px] disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 transition-all flex justify-center items-center gap-2 mt-2"
                      >
                        <Lock className="w-5 h-5" />
                        {createPaymentMutation.isPending ? "Processando..." : "Pagar e Acessar Advogados"}
                      </button>
                      <p className="text-center text-xs text-muted-foreground">Pagamento 100% seguro. Suporte online disponível.</p>
                    </form>
                  </motion.div>
                )}

                {/* STEP 5: PIX CODE */}
                {step === 5 && (
                  <motion.div
                    key="step5"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <h3 className="text-[28px] font-display font-bold text-[#111111] mb-2">PIX Gerado!</h3>
                    <p className="text-lg text-[#333333] mb-8">Escaneie o QR Code ou copie a chave abaixo.</p>
                    
                    <div className="w-52 h-52 bg-white border-4 border-[#e5e7eb] rounded-xl mx-auto mb-6 flex items-center justify-center">
                      <QrCode className="w-40 h-40 text-black" />
                    </div>

                    <div className="bg-[#f3f4f6] border-2 border-[#e5e7eb] rounded-xl p-4 mb-6 font-mono text-sm break-all text-[#444444]">
                      {pixCode}
                    </div>

                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(pixCode || "");
                        alert("Código copiado!");
                      }}
                      className="w-full h-14 rounded-xl bg-slate-100 border-2 border-slate-300 text-[#111111] font-bold text-lg hover:bg-slate-200 transition-all"
                    >
                      Copiar Chave PIX
                    </button>
                    
                    <div className="mt-8 pt-6 border-t-2 border-[#e5e7eb]">
                      <Link href="/area-do-cliente" className="text-primary hover:underline text-lg font-bold">
                        Ir para Área do Cliente →
                      </Link>
                    </div>
                  </motion.div>
                )}
                
                {/* STEP 6: Success Credit Card */}
                {step === 6 && (
                  <motion.div
                    key="step6"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 rounded-full bg-[#dcfce7] text-[#166534] flex items-center justify-center mx-auto mb-6 border-4 border-[#bbf7d0]">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="text-[32px] font-display font-bold text-[#111111] mb-4">Pagamento Aprovado!</h3>
                    <p className="text-lg text-[#333333] mb-10">Seu caso já está disponível para os advogados da plataforma.</p>
                    
                    <Link 
                      href="/area-do-cliente"
                      className="inline-flex h-16 px-10 rounded-xl bg-primary text-white font-bold text-xl items-center justify-center hover:bg-primary/90 transition-all"
                    >
                      Acessar Área do Cliente
                    </Link>
                  </motion.div>
                )}

                {/* STEP 7: Supabase submission confirmation */}
                {step === 7 && (
                  <motion.div
                    key="step7"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <div className="w-20 h-20 rounded-full bg-[#dcfce7] text-[#166534] flex items-center justify-center mx-auto mb-5 border-4 border-[#bbf7d0]">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className={FORM_TITLE_CLASS + " mb-2"}>Diagnóstico concluído. Próximo passo: ativação</h3>
                    <p className="text-sm text-[#555] mb-6 max-w-xs mx-auto leading-relaxed">
                      Para liberar sua área de acompanhamento e receber propostas de advogados, conclua a taxa de ativação abaixo.
                    </p>

                    <div className="space-y-4 text-left mb-6">
                      <div className="bg-red-600 text-white text-center py-2.5 px-4 rounded-xl text-sm font-bold">⚠️ SEU CASO FOI ANALISADO COM SUCESSO</div>
                      <p className="text-2xl font-bold text-foreground leading-tight">Falta apenas <span className="text-yellow-400">1 passo</span> para um advogado assumir seu caso.</p>
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Compare e decida:</p>
                        <div className="flex gap-3">
                          <div className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-center">
                            <p className="text-xs text-muted-foreground">Consulta particular</p>
                            <p className="text-xl font-bold text-red-500 line-through mt-1">R$300 – R$500</p>
                            <p className="text-[10px] text-muted-foreground mt-1">Sem garantia de resultado</p>
                          </div>
                          <div className="flex-1 bg-yellow-500 rounded-xl p-3 text-center">
                            <p className="text-xs font-bold text-[#001532]">Pequenas Causas</p>
                            <p className="text-2xl font-bold text-[#001532] mt-1">R$149,99</p>
                            <p className="text-[10px] font-bold text-[#001532]/70 mt-1">Acesso instantâneo ao advogado</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2.5">
                        {[
                          {title:"Advogados verificados OAB", desc:"Profissionais reais, não robôs"},
                          {title:"3.000+ casos resolvidos", desc:"Experiência comprovada"},
                          {title:"Modelo ad exitum", desc:"Você só paga honorários se ganhar"},
                          {title:"Resposta em horas", desc:"Nada de semanas de espera"}
                        ].map((item, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-foreground">{item.title}</p>
                              <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="bg-orange-100 dark:bg-orange-900/60 border border-orange-200 dark:border-orange-800/50 rounded-lg py-2.5 px-3 text-center">
                        <p className="text-xs font-bold text-orange-600 dark:text-yellow-400">⏰ Quanto mais você espera, mais difícil fica cobrar seus direitos</p>
                      </div>
                    </div>

                    <a
                      href={PAGAMENTO_KLIVO_URL}
                      onClick={() => {
                        if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
                          (window as any).gtag('event', 'conversion', { 'send_to': 'AW-16505818170/R7Z0CNvf_JYcELqYy749', 'value': 1.0, 'currency': 'BRL' });
                        }
                        setStep(8);
                      }}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-emerald-600 text-white font-bold text-base shadow-[0_5px_0_0_#15803d] hover:shadow-[0_2px_0_0_#15803d] hover:translate-y-[3px] active:shadow-none active:translate-y-[5px] transition-all mb-4"
                    >
                      <Lock className="w-4 h-4" /> Ativar acesso agora
                    </a>

                    <Link
                      href={`/obrigado?email=${encodeURIComponent(form2.getValues("email") || "")}`}
                      className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Já paguei → Criar conta e senha
                    </Link>
                  </motion.div>
                )}

                {/* STEP 8 — Confirmação pós-clique no pagamento */}
                {step === 8 && (
                  <motion.div
                    key="step8"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-5 border-4 border-blue-200">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className={FORM_TITLE_CLASS + " mb-2"}>Finalizou o pagamento?</h3>
                    <p className="text-sm text-[#555] mb-6 max-w-xs mx-auto leading-relaxed">
                      Se já concluiu o pagamento, clique abaixo para criar sua conta e acompanhar seu caso.
                    </p>

                    <Link
                      href={`/obrigado?email=${encodeURIComponent(form2.getValues("email") || "")}`}
                      className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-blue-600 text-white font-bold text-base shadow-[0_5px_0_0_#1d4ed8] hover:shadow-[0_2px_0_0_#1d4ed8] hover:translate-y-[3px] active:shadow-none active:translate-y-[5px] transition-all mb-4"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Já paguei — Criar minha conta
                    </Link>

                    <a
                      href={PAGAMENTO_KLIVO_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Ainda não paguei → Abrir página de pagamento
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>

              {step <= 2 && (
                <div className="mt-4 flex items-center justify-center gap-5 text-xs text-muted-foreground border-t border-muted pt-4">
                  <div className="flex items-center gap-1"><Lock className="w-3.5 h-3.5 text-[#425f8e]" /> Dados Protegidos</div>
                  <div className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-[#fee001]" /> +3.000 Casos</div>
                </div>
              )}
              </div>
              </div>{/* end p-6 sm:p-8 */}
            </motion.div>
          </div>
        </div>
      </section>
      {/* CAUSE CATEGORIES */}
      <section className="py-12 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-6 text-center">Principais Causas que Atendemos</h3>
          <div className="flex overflow-x-auto gap-3 pb-4 no-scrollbar">
            {CAUSES.map((cause, i) => (
              <a 
                key={i} 
                href="#avaliar"
                className="whitespace-nowrap px-4 py-2 rounded-full bg-white ghost-border shadow-ambient hover:bg-[#001532] hover:text-white transition-all text-sm font-medium text-foreground"
              >
                {cause}
              </a>
            ))}
          </div>
        </div>
      </section>
      {/* NOSSA EQUIPE */}
      <section className="py-20 bg-[#001532]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-[#fee001] text-xs font-bold tracking-widest uppercase">Nossa Equipe</span>
            <h2 className="text-3xl md:text-4xl font-black mt-3 tracking-tight text-white">Advogados prontos para seu caso</h2>
            <p className="text-white/50 text-sm mt-3">Profissionais verificados OAB, especializados em Juizado Especial Cível.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                photo: "https://randomuser.me/api/portraits/men/75.jpg",
                name: "Dr. Ricardo Almeida",
                specialty: "Direito do Consumidor",
                oab: "OAB/SP 342.187"
              },
              {
                photo: "https://randomuser.me/api/portraits/women/65.jpg",
                name: "Dra. Fernanda Reis",
                specialty: "Juizado Especial",
                oab: "OAB/RJ 218.453"
              },
              {
                photo: "https://randomuser.me/api/portraits/men/41.jpg",
                name: "Dr. Paulo Mendes",
                specialty: "Defesa do Consumidor",
                oab: "OAB/MG 195.762"
              }
            ].map((adv, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center gap-4">
                <img
                  src={adv.photo}
                  alt={adv.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-[#fee001]"
                />
                <div>
                  <p className="font-bold text-white text-base">{adv.name}</p>
                  <p className="text-[#fee001] text-sm font-semibold mt-1">{adv.specialty}</p>
                  <p className="text-white/40 text-xs mt-1">{adv.oab}</p>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1 mt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#fee001]" />
                  <span className="text-white/70 text-xs font-medium">Verificado OAB</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOBRE NÓS */}
      <section className="py-16 bg-background" id="como-funciona">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Foto profissional */}
            <div className="relative order-2 lg:order-1">
              <img
                src="https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?w=700&auto=format&fit=crop&q=80"
                alt="Equipe jurídica especializada"
                className="w-full rounded-2xl object-cover shadow-2xl"
                style={{ maxHeight: "480px" }}
              />
              <div className="absolute bottom-4 left-4 bg-[#001532]/90 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#fee001] flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-[#001532]" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">+3.000 casos resolvidos</p>
                  <p className="text-white/50 text-xs">Advogados OAB verificados</p>
                </div>
              </div>
            </div>

            {/* Texto */}
            <div className="order-1 lg:order-2 space-y-6">
              <div>
                <span className="text-[#fee001] font-bold tracking-widest text-xs uppercase">Sobre nós</span>
                <h2 className="text-3xl md:text-4xl font-black mt-3 tracking-tight leading-tight">
                  Cansado de burocracia para encontrar um advogado?{" "}
                  <span className="gold-gradient-text">Nós resolvemos isso.</span>
                </h2>
              </div>

              <div className="space-y-5 text-base text-muted-foreground leading-[1.8]">
                <p>
                  Somos uma plataforma privada que conecta você, de forma rápida e direta, a advogados independentes prontos para assumir o seu caso. Em poucos minutos, você recebe propostas de diferentes profissionais — inclusive no modelo <strong className="text-foreground">ad exitum</strong>, onde você só paga se ganhar.
                </p>

                <div className="border-l-4 border-[#fee001] pl-5 py-1">
                  <p className="font-bold text-foreground text-lg">Sem complicação. Sem perda de tempo.</p>
                </div>

                <p>
                  Nossa triagem identifica se o seu caso atende aos critérios do Juizado Especial (JEC). Você começa sabendo se vale a pena seguir em frente.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: <Scale className="w-5 h-5" />, text: "Mais agilidade" },
                  { icon: <FileText className="w-5 h-5" />, text: "Mais clareza" },
                  { icon: <ShieldCheck className="w-5 h-5" />, text: "Mais segurança" },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 bg-[#fee001]/8 border border-[#fee001]/20 rounded-xl px-3 py-4 text-center">
                    <span className="text-[#fee001]">{item.icon}</span>
                    <span className="font-bold text-foreground text-xs">{item.text}</span>
                  </div>
                ))}
              </div>

              <div className="bg-card border border-border rounded-xl p-5 text-sm text-muted-foreground leading-[1.7]">
                <strong className="text-foreground">Importante:</strong> nossa análise é informativa e não substitui a avaliação completa de um advogado — mas acelera o seu caminho.
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* TESTIMONIALS */}
      <section className="py-32 bg-muted" id="depoimentos">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">O que dizem sobre a <br className="hidden md:block" />Pequenas Causas</h2>
            <div className="flex items-center justify-center gap-2 text-base font-semibold">
              <span className="text-foreground">Google Avaliações</span>
              <span className="text-[#716300] font-black">4,5/5</span>
              <div className="flex text-[#fee001]">
                {[1,2,3,4,5].map(star => <Star key={star} className="w-5 h-5 fill-current" />)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { name: "Vlamir Constin", text: "O site muito prático e fácil de usar. Tudo é muito transparente, simples de entender e objetivo. Me senti seguro para dar entrada no processo." },
              { name: "Julia Araújo", text: "Excelente! Eu não podia usar defensoria e o advogado da Pequenas Causas Processos deu entrada no juizado e paguei baratinho, não tive trabalho nenhum." },
              { name: "Leonardo Rodrigues", text: "Incrível a Assessoria e a atenção que recebi no meu caso, desde o primeiro momento me instruiu passo a passo. Parabéns pelo ótimo serviço." },
              { name: "Vinicius Viana", text: "Gostei bastante, após preencher o formulário é possível acompanhar o processo na área do cliente. O atendimento da equipe é excelente!" }
            ].map((review, i) => (
              <div key={i} className="bg-card p-6 rounded-xl shadow-ambient flex flex-col h-full">
                <div className="flex text-[#fee001] mb-4">
                  {[1,2,3,4,5].map(star => <Star key={star} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-muted-foreground text-sm leading-[1.6] mb-6 flex-grow">"{review.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#fee001]/20 flex items-center justify-center font-black text-[#716300]">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{review.name}</p>
                    <p className="text-xs text-muted-foreground">Google Review</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <a href="#avaliar" className="inline-flex py-4 px-10 rounded-xl bg-[#fee001] text-[#716300] font-bold text-base shadow-[0_6px_0_0_#caa800] hover:shadow-[0_3px_0_0_#caa800] hover:translate-y-[3px] transition-all">
              ENVIAR MEU CASO AGORA
            </a>
          </div>
        </div>
      </section>
      {/* DEPOIMENTOS — seção dark antes do FAQ */}
      <section className="py-20 bg-[#001532]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-[#fee001] text-xs font-bold tracking-widest uppercase">Depoimentos</span>
            <h2 className="text-3xl md:text-4xl font-black mt-3 tracking-tight text-white">O que nossos clientes dizem</h2>
            <p className="text-white/50 text-sm mt-3">Histórias reais de quem recuperou seus direitos com nossa ajuda.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                photo: "https://randomuser.me/api/portraits/men/32.jpg",
                name: "Marcos S.",
                text: "Fui cobrado indevidamente por um serviço que cancelei. Em menos de 4 meses o juiz condenou a empresa a me devolver tudo com danos morais. Valeu muito a pena!"
              },
              {
                photo: "https://randomuser.me/api/portraits/women/44.jpg",
                name: "Ana R.",
                text: "Minha bagagem foi extraviada pela companhia aérea e eles não queriam me indenizar. O advogado cuidou de tudo online e consegui a indenização sem sair de casa."
              },
              {
                photo: "https://randomuser.me/api/portraits/men/67.jpg",
                name: "Carlos L.",
                text: "Estava com o nome negativado indevidamente há meses. Contratei o serviço, o advogado entrou com ação e em poucos meses limparam meu nome e ainda recebi compensação."
              }
            ].map((dep, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={dep.photo}
                    alt={dep.name}
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0 border-2 border-[#fee001]"
                  />
                  <div>
                    <p className="font-bold text-white text-sm">{dep.name}</p>
                    <div className="flex text-[#fee001] mt-0.5">
                      {[1,2,3,4,5].map(s => (
                        <svg key={s} className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-white/70 text-sm leading-relaxed">"{dep.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ — âncora para link "FAQ" no header (Perguntas Frequentes / Fui lesado, e agora?) */}
      <section id="perguntas-frequentes" className="py-24 bg-background scroll-mt-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Perguntas Frequentes</span>
            <h2 className="text-3xl md:text-4xl font-black mt-3 tracking-tight">Entenda seus próximos passos</h2>
            <p className="text-sm text-muted-foreground mt-3">
              Respostas objetivas para você decidir com clareza e segurança.
            </p>
          </div>
          
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className={`rounded-xl border transition-all ${
                  openFaqIndex === i
                    ? "border-[#001532]/25 bg-[#001532]/[0.02] shadow-[0_10px_30px_rgba(2,8,23,0.08)]"
                    : "border-slate-200 bg-card hover:border-slate-300"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex((prev) => (prev === i ? null : i))}
                  aria-expanded={openFaqIndex === i}
                  className="w-full text-left flex items-center justify-between gap-4 p-5"
                >
                  <span className="font-semibold text-[15px] leading-snug">{faq.q}</span>
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      openFaqIndex === i ? "bg-[#001532] text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${openFaqIndex === i ? "rotate-180" : ""}`}
                    />
                  </span>
                </button>
                {openFaqIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="px-5 pb-5 text-muted-foreground leading-[1.7] text-sm"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="guias-por-tema" className="py-20 bg-muted/30 scroll-mt-24 border-y border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Conteúdo jurídico</span>
            <h2 className="text-3xl md:text-4xl font-black mt-3 tracking-tight">Guias por tema</h2>
            <p className="text-sm text-muted-foreground mt-3">
              Páginas resumidas e artigos completos sobre os temas mais comuns em pequenas causas.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SEO_TOPIC_HUBS.map((hub) => {
              const Icon =
                hub.id === "atraso-voo" ? Plane : hub.id === "cobranca-indevida" ? ReceiptText : Scale;
              return (
                <div
                  key={hub.id}
                  className="rounded-2xl border border-border bg-card p-6 flex flex-col shadow-sm hover:border-primary/25 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{hub.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-grow mb-5">{hub.blurb}</p>
                  <div className="flex flex-col gap-2 mt-auto">
                    <Link
                      href={hub.landingHref}
                      className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                    >
                      Página do tema <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/blog/${hub.blogSlug}`}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      Ler artigo no blog
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-center mt-10">
            <Link
              href="/blog"
              className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
            >
              Ver todos os artigos do blog →
            </Link>
          </p>
        </div>
      </section>
      {/* CTA FINAL — clientes */}
      <section className="py-20 relative overflow-hidden hero-gradient">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,#032956_0%,transparent_60%)] pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="text-[#fee001] text-xs font-bold tracking-widest uppercase">Pronto para resolver seu problema?</span>
          <h2 className="text-3xl md:text-4xl font-black mb-4 mt-3 text-white tracking-tight">Avalie seu caso agora — é gratuito</h2>
          <p className="text-base text-white/60 mb-8 max-w-xl mx-auto leading-[1.6]">
            Em 2 minutos você descobre se tem direito à indenização e conecta seu caso a advogados especializados por apenas R$149,99.
          </p>
          <a href="#avaliar" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#fee001] text-[#716300] font-bold text-base shadow-[0_6px_0_0_#caa800] hover:shadow-[0_3px_0_0_#caa800] hover:translate-y-[3px] transition-all">
            Avaliar meu caso grátis <ArrowRight className="w-5 h-5" />
          </a>
          <p className="text-xs text-white/30 mt-5">Triagem gratuita · Sem compromisso · 100% digital</p>
        </div>
      </section>
      {/* Spacer mobile para não ficar atrás da sticky bar */}
      <div className="h-20 md:hidden" aria-hidden="true" />

      {/* Sticky CTA bottom bar — mobile only */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#001532] border-t border-blue-800/30 px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <div className="text-white text-xs leading-tight">
          <span className="font-bold">Triagem gratuita</span>
          <br/>
          <span className="text-blue-300">Advogados por R$149,99</span>
        </div>
        <a href="#avaliar" className="bg-yellow-400 hover:bg-yellow-500 text-[#001532] font-bold py-2.5 px-5 rounded-lg text-sm whitespace-nowrap transition-all flex-shrink-0">
          Avaliar caso →
        </a>
      </div>

      <ExitIntentPopup />
    </Layout>
  );
}
