import React, { useState } from "react";
import { Layout } from "@/components/layout";
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
  Building2,
  Users,
  AlertCircle,
  Circle,
  CheckCircle,
  ListOrdered
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSubmitCase, useCreatePayment } from "@workspace/api-client-react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";

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
  "Conversas (WhatsApp)", "Áudios / Gravações", "Fotos / Vídeos", 
  "E-mails", "Testemunhas", "Comprovantes", "Contrato / Documentos", 
  "Protocolos de Atendimento", "Boletim de Ocorrência", "Outros"
];

const CAUSES = [
  "Cobrança Indevida", "Negativação Indevida", "Atraso de Vôo", 
  "Extravio de Bagagem", "Plano de Saúde", "Pacotes de Viagem", 
  "Cancelamento e Reembolso", "Golpes contra o Consumidor", 
  "Acidente de Trânsito", "Desconto Indevido INSS", "Danos Morais", 
  "Contas (Água, Luz, Telefone)", "Cobrança de Dívidas", "Problemas de Vizinhança"
];

const FAQS = [
  { q: "Devo reclamar no PROCON?", a: "Sim, o PROCON é um órgão de proteção ao consumidor que visa resolver conflitos de consumo." },
  { q: "A reclamação no PROCON resolve meu problema?", a: "Nem sempre. Embora ajude a reforçar provas e viabilize a punição administrativa do fornecedor, só reclamar não garante reparação." },
  { q: "O que o PROCON e sites de reclamação oferecem?", a: "Plataformas para solucionar problemas de consumo, com consequência sobre a reputação da empresa e possível penalização administrativa. Mas não garantem reembolso." },
  { q: "Como obter solução real e eficaz?", a: "Busque o Juizado Especial Cível (Pequenas Causas), somente a Justiça pode criar obrigações e estabelecer condenações." },
  { q: "O processo é rápido?", a: "O processo de pequenas causas foi criado para ser simples e rápido (Lei 9.099/95)." },
  { q: "A Pequenas Causas Processos é um serviço oficial da Justiça?", a: "Não. A Pequenas Causas Processos é uma plataforma digital privada que conecta pessoas a advogados independentes. Não temos vínculo com o Poder Judiciário." }
];

export default function Home() {
  const [step, setStep] = useState(1);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [pixCode, setPixCode] = useState<string | null>(null);
  
  const submitCaseMutation = useSubmitCase();
  const createPaymentMutation = useCreatePayment();

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
  };

  const onStep2Submit = async (data: z.infer<typeof caseStep2Schema>) => {
    setStep(3); // Loading / Analyzing state
    try {
      const step1Data = form1.getValues();
      const evidences = step1Data.evidences || [];

      const { error } = await supabase.from("cases").insert({
        case_description: step1Data.description,
        evidence_conversas: evidences.includes("Conversas (WhatsApp)"),
        evidence_audios: evidences.includes("Áudios / Gravações"),
        evidence_fotos: evidences.includes("Fotos / Vídeos"),
        evidence_emails: evidences.includes("E-mails"),
        evidence_testemunhas: evidences.includes("Testemunhas"),
        evidence_comprovantes: evidences.includes("Comprovantes"),
        evidence_contrato: evidences.includes("Contrato / Documentos"),
        evidence_protocolos: evidences.includes("Protocolos de Atendimento"),
        evidence_boletim: evidences.includes("Boletim de Ocorrência"),
        evidence_outros: evidences.includes("Outros"),
        claim_value: (() => { const v = parseFloat(String(step1Data.value ?? "")); return isNaN(v) ? null : v; })(),
        full_name: data.name,
        whatsapp: data.whatsapp,
        email: data.email,
        state: data.state ?? null,
        city: data.city ?? null,
        accepted_terms: data.terms,
      });

      if (error) throw error;

      setTimeout(() => setStep(7), 2000);
    } catch (error) {
      console.error("Failed to submit case", error);
      setStep(2);
    }
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
                Seus Direitos<br />
                <span className="text-[#fee001]">Defendidos</span> Sem<br />
                Sair de Casa.
              </h1>
              <p className="text-white/65 mb-3 max-w-lg text-[15px]">Atendimento jurídico 100% digital. Conectamos seu caso a advogados para avaliação e, se cabível, ação no Juizado Especial Cível</p>

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-1.5 flex-1 content-between">
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
                    <p className="font-bold text-foreground text-sm leading-tight">Etapas do processo</p>
                    <p className="text-muted-foreground text-xs leading-tight">Triagem gratuita → Análise da causa → Advogado ingressa com processo, se cabível</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* FORM CARD — Editorial Juris */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="bg-white rounded-xl shadow-[0_8px_48px_0_rgba(0,0,0,0.28)] overflow-hidden"
              role="region"
              aria-label="Formulário de avaliação de caso"
            >
              <div className="p-5">
              <AnimatePresence mode="wait">
                {/* STEP 1: Description */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div className="bg-gradient-to-r from-[#001532] to-[#032956] -mx-5 -mt-5 px-5 py-3.5 mb-5 border-t-[3px] border-[#fee001] rounded-t-xl">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white">Conte o que aconteceu</h3>
                        <span className="inline-flex items-center gap-1 bg-[#fee001] text-[#716300] text-xs font-bold px-2.5 py-1 rounded-full">
                          <Clock className="w-3 h-3" /> Consulta gratuita
                        </span>
                      </div>
                      <p className="text-white/55 text-xs mt-1">Avaliamos seu caso sem custo. Leva apenas 2 minutos.</p>
                    </div>

                    <form onSubmit={form1.handleSubmit(onStep1Submit)} className="space-y-4">
                      <div>
                        <label htmlFor="description" className="block text-xs font-bold text-foreground mb-1.5">
                          Descreva o seu problema *
                        </label>
                        <textarea 
                          id="description"
                          {...form1.register("description")}
                          className="w-full bg-white border-2 border-slate-200 rounded-xl p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#425f8e] focus:ring-[3px] focus:ring-[#425f8e]/10 transition-all min-h-[100px] resize-y text-sm leading-relaxed"
                          placeholder="Ex: Comprei uma passagem e meu voo foi cancelado sem aviso prévio..."
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
                        <label className="block text-xs font-bold text-foreground mb-2">Quais provas você tem? <span className="font-normal text-muted-foreground">(opcional)</span></label>
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
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
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
                        <label htmlFor="value" className="block text-xs font-bold text-foreground mb-1.5">Valor da indenização buscada <span className="font-normal text-muted-foreground">(R$ - opcional)</span></label>
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
                        className="group w-full py-3.5 rounded-xl bg-[#fee001] text-[#716300] font-bold text-sm shadow-[0_5px_0_0_#caa800] hover:shadow-[0_2px_0_0_#caa800] hover:translate-y-[3px] active:shadow-none active:translate-y-[5px] transition-all flex justify-center items-center gap-2"
                      >
                        Continuar para Meus Dados
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* STEP 2: Personal Data */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <button 
                        onClick={() => setStep(1)}
                        className="px-4 py-2 rounded-lg border-2 border-slate-200 font-bold text-sm text-muted-foreground hover:bg-slate-50 transition-colors flex items-center gap-2"
                      >
                        <ArrowRight className="w-4 h-4 rotate-180" /> Voltar
                      </button>
                      <div>
                        <h3 className="text-2xl font-display font-bold text-foreground leading-tight">Seus Dados</h3>
                        <p className="text-muted-foreground text-xs">Sigilo absoluto</p>
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
                          <strong>Privacidade garantida:</strong> Seus dados são protegidos por lei e usados exclusivamente para análise do seu caso.
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
                          Confirmo que as informações são verdadeiras e aceito os <Link href="/termos" className="text-primary font-medium hover:underline">Termos de Uso</Link> e Política de Privacidade.
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
                        className="group w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-[0_6px_0_0_hsl(214,82%,36%)] hover:shadow-[0_3px_0_0_hsl(214,82%,36%)] hover:translate-y-[3px] active:shadow-none active:translate-y-[6px] disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 transition-all flex justify-center items-center gap-2 mt-2"
                      >
                        {submitCaseMutation.isPending ? "Processando..." : <>Enviar para Análise Profissional <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* STEP 3: Analyzing Loading state */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-16 flex flex-col items-center text-center"
                  >
                    <div className="w-24 h-24 border-[8px] border-[#e5e7eb] border-t-primary rounded-full animate-spin mb-10"></div>
                    <h3 className="text-2xl font-display font-bold text-[#111111] mb-4">Analisando seu caso...</h3>
                    <p className="text-lg text-[#333333] max-w-sm">
                      Por favor, não feche esta página. Estamos verificando os requisitos legais das informações enviadas.
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
                    className="text-center py-10"
                  >
                    <div className="w-20 h-20 rounded-full bg-[#dcfce7] text-[#166534] flex items-center justify-center mx-auto mb-6 border-4 border-[#bbf7d0]">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-[#111111] mb-3">Caso enviado com sucesso!</h3>
                    <p className="text-base text-[#444444] mb-2 max-w-sm mx-auto leading-relaxed">
                      Recebemos as informações do seu caso. Nossa equipe irá analisar e entrar em contato em breve pelo WhatsApp ou e-mail informado.
                    </p>
                    <p className="text-sm text-muted-foreground mb-8">Prazo de resposta: até 1 dia útil.</p>

                    <div className="bg-[#f8f9fa] border border-slate-200 rounded-xl p-4 text-left mb-8 max-w-xs mx-auto">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Próximos passos</p>
                      <ol className="space-y-2 text-sm text-[#333]">
                        <li className="flex items-start gap-2"><span className="w-5 h-5 rounded-full bg-[#fee001] text-[#716300] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>Análise do seu caso por advogado especialista</li>
                        <li className="flex items-start gap-2"><span className="w-5 h-5 rounded-full bg-[#fee001] text-[#716300] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>Contato via WhatsApp com orientações</li>
                        <li className="flex items-start gap-2"><span className="w-5 h-5 rounded-full bg-[#fee001] text-[#716300] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>Se cabível, ingresso com a ação no Juizado Especial</li>
                      </ol>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Lock className="w-3.5 h-3.5 text-[#425f8e]" />
                      <span>Seus dados estão protegidos e em sigilo absoluto</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {step <= 2 && (
                <div className="mt-4 flex items-center justify-center gap-5 text-xs text-muted-foreground border-t border-muted pt-4">
                  <div className="flex items-center gap-1"><Lock className="w-3.5 h-3.5 text-[#425f8e]" /> Dados Protegidos</div>
                  <div className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-[#fee001]" /> +3.000 Casos</div>
                </div>
              )}
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
      {/* HOW IT WORKS */}
      <section className="py-32 bg-background" id="como-funciona">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">Nossas <span className="gold-gradient-text">Especialidades</span></h2>
            <p className="text-lg text-muted-foreground leading-[1.6]">Resolvemos conflitos do cidadão com a precisão de uma consultoria de elite, focados na reparação rápida do seu dano moral e material.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-14 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-[#fee001]/40 to-transparent z-0" />
            
            {[
              { 
                icon: <FileText className="w-7 h-7" />, 
                title: "1. Envie seu caso", 
                desc: "Descreva o ocorrido em minutos, anexe provas e envie de forma totalmente online e gratuita." 
              },
              { 
                icon: <Users className="w-7 h-7" />, 
                title: "2. Receba propostas", 
                desc: "Advogados verificados analisam seu caso e enviam propostas, inclusive no modelo ad exitum (só paga se ganhar)." 
              },
              { 
                icon: <Scale className="w-7 h-7" />, 
                title: "3. Resolva online", 
                desc: "Acompanhe tudo pela plataforma. Sem filas, sem burocracia e com total transparência." 
              }
            ].map((step, i) => (
              <div key={i} className="relative z-10 bg-card p-8 rounded-xl shadow-ambient text-center hover-elevate">
                <div className="w-16 h-16 mx-auto rounded-xl bg-[#fee001] flex items-center justify-center text-[#716300] mb-6">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold mb-4 tracking-tight">{step.title}</h3>
                <p className="text-muted-foreground leading-[1.6] text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* MEDIA MENTIONS */}
      <section className="py-24 bg-[#001532] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,#032956_0%,transparent_60%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="text-[#fee001] font-bold tracking-widest text-xs uppercase">Reconhecimento Nacional</span>
            <h2 className="text-3xl md:text-4xl font-black mt-3 text-white tracking-tight">Quem já recuperou seus direitos conosco.</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { source: "O Globo", date: "Dezembro 2025", title: '"Pequenas Causas Processos propõe maior segurança ao acesso à Justiça online"' },
              { source: "Valor Econômico", date: "Maio 2025", title: '"A plataforma conecta cidadãos a advogados de forma ágil e acessível."' },
              { source: "Terra", date: "Maio 2025", title: '"Pequenas Causas Processos facilita acesso ao Juizado Especial Cível"' }
            ].map((mention, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-8 hover:bg-white/10 transition-all group">
                <div className="text-2xl font-black text-white/40 group-hover:text-[#fee001] transition-colors mb-6 tracking-tight">{mention.source}</div>
                <p className="text-base font-medium mb-8 leading-relaxed text-white/70">{mention.title}</p>
                <div className="flex justify-between items-center text-sm text-white/30">
                  <span>{mention.date}</span>
                  <span className="flex items-center gap-1 group-hover:text-[#fee001] transition-colors">Leia mais <ArrowRight className="w-4 h-4" /></span>
                </div>
              </div>
            ))}
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
      {/* FAQ */}
      <section className="py-24 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Perguntas Frequentes</span>
            <h2 className="text-3xl md:text-4xl font-black mt-3 tracking-tight">Fui lesado, e agora?</h2>
          </div>
          
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <details key={i} className="group bg-card shadow-ambient rounded-xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between p-6 cursor-pointer font-semibold text-base hover:text-[#001532] transition-colors">
                  {faq.q}
                  <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180 flex-shrink-0 ml-4" />
                </summary>
                <div className="px-6 pb-6 text-muted-foreground leading-[1.6] text-sm">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
      {/* LAWYER CTA */}
      <section className="py-32 relative overflow-hidden hero-gradient">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,#032956_0%,transparent_60%)] pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="text-[#fee001] text-xs font-bold tracking-widest uppercase">Para Advogados</span>
          <h2 className="text-4xl md:text-5xl font-black mb-6 mt-3 text-white tracking-tight">Pare de perder dinheiro <br className="hidden md:block" />para grandes empresas.</h2>
          <p className="text-lg text-white/60 mb-12 max-w-2xl mx-auto leading-[1.6]">
            Receba pedidos de propostas diariamente e amplie sua carteira de clientes. Cadastro 100% gratuito.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
            <div className="bg-white/5 rounded-xl p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#fee001] flex items-center justify-center text-[#716300] mx-auto mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-bold mb-2 text-white text-sm">Verificação Rigorosa</h4>
              <p className="text-xs text-white/40">Validação direta na OAB</p>
            </div>
            <div className="bg-white/5 rounded-xl p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#fee001] flex items-center justify-center text-[#716300] mx-auto mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="font-bold mb-2 text-white text-sm">Casos Qualificados</h4>
              <p className="text-xs text-white/40">Clientes pré-filtrados</p>
            </div>
            <div className="bg-white/5 rounded-xl p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#fee001] flex items-center justify-center text-[#716300] mx-auto mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="font-bold mb-2 text-white text-sm">Crescimento</h4>
              <p className="text-xs text-white/40">Expansão da clientela</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#avaliar" className="px-8 py-4 rounded-xl bg-[#fee001] text-[#716300] font-bold text-base shadow-[0_6px_0_0_#caa800] hover:shadow-[0_3px_0_0_#caa800] hover:translate-y-[3px] transition-all">
              Recuperar Meus Direitos Agora
            </a>
            <Link 
              href="/advogado/signup"
              className="px-8 py-4 rounded-xl border border-white/20 text-white/80 font-medium text-base hover:bg-white/10 transition-all"
            >
              Ligar para um Especialista
            </Link>
          </div>
          <p className="text-xs text-white/25 mt-8">Habilitação profissional sujeita a verificação</p>
        </div>
      </section>
    </Layout>
  );
}
