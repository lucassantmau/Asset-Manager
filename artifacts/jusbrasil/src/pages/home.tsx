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
      const result = await submitCaseMutation.mutateAsync({
        data: {
          description: step1Data.description,
          evidences: step1Data.evidences,
          value: step1Data.value,
          name: data.name,
          email: data.email,
          whatsapp: data.whatsapp,
          state: data.state,
          city: data.city,
        }
      });
      setCaseId(result.id);
      setTimeout(() => setStep(4), 2000); // Simulate analysis time, then go to checkout
    } catch (error) {
      console.error("Failed to submit case", error);
      setStep(2); // Go back on error
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
      <section className="relative pt-24 pb-32 overflow-hidden hero-gradient" id="avaliar">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#EEF2FF_0%,_transparent_60%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_#FFF8ED_0%,_transparent_60%)]"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Hero Copy */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
                <Scale className="w-4 h-4" />
                Plataforma N°1 em Pequenas Causas
              </div>
              <h1 className="text-5xl lg:text-7xl font-display font-bold leading-tight mb-6">
                Seus direitos merecem <span className="gold-gradient-text">defesa de excelência.</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-10 max-w-lg leading-relaxed">
                Mais de 6.000 brasileiros já buscaram seus direitos com advogados verificados. Simples, 100% online e seguro.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <div className="flex items-center gap-3 bg-white border border-border rounded-xl p-4 flex-1 shadow-sm">
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">100% Seguro</p>
                    <p className="text-sm text-muted-foreground">Dados criptografados</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white border border-border rounded-xl p-4 flex-1 shadow-sm">
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Advogados OAB</p>
                    <p className="text-sm text-muted-foreground">Profissionais verificados</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border-2 border-border rounded-xl p-6">
                <h2 className="text-base font-bold mb-5 flex items-center gap-2 text-foreground">
                  <ListOrdered className="w-5 h-5 text-primary" />
                  Como funciona?
                </h2>
                <ol className="space-y-4">
                  <li className="flex gap-4">
                    <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                    <div>
                      <strong className="block text-foreground text-sm mb-0.5">Preencha o formulário</strong>
                      <span className="text-muted-foreground text-sm">Conte-nos o que aconteceu. Leva 2 minutos.</span>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                    <div>
                      <strong className="block text-foreground text-sm mb-0.5">Análise do caso</strong>
                      <span className="text-muted-foreground text-sm">Um advogado especialista avaliará seus direitos.</span>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                    <div>
                      <strong className="block text-foreground text-sm mb-0.5">Início do processo</strong>
                      <span className="text-muted-foreground text-sm">Você recebe instruções claras sobre os próximos passos.</span>
                    </div>
                  </li>
                </ol>
              </div>
            </motion.div>

            {/* FORM CARD */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="glass-panel rounded-2xl p-6 sm:p-8 relative overflow-hidden"
            >
              {/* Step Pills */}
              {step <= 2 && (
                <div className="flex items-center justify-between mb-8 bg-slate-100 p-2 rounded-xl">
                  {[
                    { num: 1, label: "Caso" },
                    { num: 2, label: "Dados" },
                    { num: 3, label: "Acesso" }
                  ].map((s, i) => (
                    <React.Fragment key={s.num}>
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                        step === s.num ? "bg-primary text-white shadow-md" :
                        step > s.num ? "bg-emerald-100 text-emerald-700" : "text-muted-foreground"
                      }`}>
                        <span>{s.num}</span>
                        <span>{s.label}</span>
                      </div>
                      {i < 2 && <ArrowRight className="w-4 h-4 text-muted-foreground/40 mx-1 flex-shrink-0" />}
                    </React.Fragment>
                  ))}
                </div>
              )}

              <AnimatePresence mode="wait">
                {/* STEP 1: Description */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div className="mb-6">
                      <h3 className="text-2xl font-display font-bold text-foreground mb-1">Conte o que aconteceu</h3>
                      <p className="text-muted-foreground text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Triagem gratuita
                      </p>
                    </div>

                    <form onSubmit={form1.handleSubmit(onStep1Submit)} className="space-y-6">
                      <div>
                        <label htmlFor="description" className="block text-sm font-bold text-foreground mb-2">
                          Descreva o seu problema *
                        </label>
                        <p className="text-xs text-muted-foreground mb-2">Detalhe os fatos importantes para que o advogado entenda sua situação.</p>
                        <textarea 
                          id="description"
                          {...form1.register("description")}
                          className="w-full bg-white border-[3px] border-slate-300 rounded-xl p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[4px] focus:ring-primary/20 transition-all min-h-[160px] resize-y text-base leading-relaxed"
                          placeholder="Ex: Comprei uma passagem e meu voo foi cancelado sem aviso prévio..."
                        ></textarea>
                        {form1.formState.errors.description ? (
                          <div className="flex items-center gap-2 text-red-700 mt-2 bg-red-50 p-3 rounded-lg border border-red-200">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm font-medium">{form1.formState.errors.description.message}</span>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-2 text-right">
                            {form1.watch("description")?.length || 0} / 2000
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-foreground mb-3">Quais provas você tem? <span className="font-normal text-muted-foreground">(opcional)</span></label>
                        <div className="flex flex-wrap gap-2">
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
                                className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                                  isSelected 
                                    ? "bg-primary border-primary text-white shadow-sm" 
                                    : "bg-white border-slate-200 text-muted-foreground hover:border-primary/50 hover:bg-primary/5"
                                }`}
                              >
                                {isSelected
                                  ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                  : <Circle className="w-4 h-4 flex-shrink-0" />
                                }
                                {ev}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="value" className="block text-sm font-bold text-foreground mb-2">Qual valor você busca de indenização? <span className="font-normal text-muted-foreground">(R$ - opcional)</span></label>
                        <input 
                          id="value"
                          type="number"
                          {...form1.register("value")}
                          className="w-full h-12 bg-white border-[3px] border-slate-300 rounded-xl px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[4px] focus:ring-primary/20 transition-all text-base"
                          placeholder="Apenas números. Ex: 5000"
                        />
                      </div>

                      <button 
                        type="submit"
                        className="group w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-[0_6px_0_0_hsl(214,82%,36%)] hover:shadow-[0_3px_0_0_hsl(214,82%,36%)] hover:translate-y-[3px] active:shadow-none active:translate-y-[6px] transition-all flex justify-center items-center gap-2"
                      >
                        Continuar para Meus Dados
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
                    className="py-12 flex flex-col items-center text-center"
                  >
                    <div className="w-20 h-20 border-4 border-slate-200 border-t-primary rounded-full animate-spin mb-8"></div>
                    <h3 className="text-2xl font-display font-bold mb-3">Análise em Andamento</h3>
                    <p className="text-muted-foreground">
                      Aguarde enquanto nossa inteligência artificial avalia os requisitos do seu caso...
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
                    <div className="mb-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h3 className="text-2xl font-display font-bold text-foreground mb-2">Caso Aceito</h3>
                      <p className="text-muted-foreground text-sm">Libere o acesso para receber propostas.</p>
                    </div>

                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Taxa Única de Acesso</p>
                        <p className="text-2xl font-bold text-primary">R$ 199,90</p>
                      </div>
                      <ShieldCheck className="w-8 h-8 text-primary/30" />
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
                    className="text-center py-6"
                  >
                    <h3 className="text-2xl font-display font-bold text-foreground mb-2">PIX Gerado!</h3>
                    <p className="text-muted-foreground text-sm mb-6">Escaneie o QR Code ou copie a chave.</p>
                    
                    <div className="w-48 h-48 bg-white p-2 rounded-xl mx-auto mb-6 flex items-center justify-center">
                      <QrCode className="w-full h-full text-black" />
                    </div>

                    <div className="bg-slate-50 border border-border rounded-xl p-3 mb-6 font-mono text-xs break-all text-muted-foreground">
                      {pixCode}
                    </div>

                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(pixCode || "");
                        alert("Código copiado!");
                      }}
                      className="w-full py-3 rounded-xl bg-secondary border border-border text-foreground font-medium hover:bg-slate-200 transition-all"
                    >
                      Copiar Chave PIX
                    </button>
                    
                    <div className="mt-6 pt-6 border-t border-border">
                      <Link href="/area-do-cliente" className="text-primary hover:underline text-sm font-medium">
                        Ir para Área do Cliente
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
                    className="text-center py-10"
                  >
                    <div className="w-20 h-20 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-foreground mb-4">Pagamento Aprovado!</h3>
                    <p className="text-muted-foreground mb-8">Seu caso já está disponível para os advogados da plataforma.</p>
                    
                    <Link 
                      href="/area-do-cliente"
                      className="inline-flex py-4 px-8 rounded-xl bg-primary text-primary-foreground font-bold hover:shadow-[0_0_20px_rgba(37,99,235,0.35)] transition-all"
                    >
                      Acessar Área do Cliente
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>

              {step <= 2 && (
                <div className="mt-8 flex items-center justify-center gap-4 text-xs text-muted-foreground border-t border-border pt-6">
                  <div className="flex items-center gap-1"><Lock className="w-3 h-3 text-primary" /> Dados Protegidos</div>
                  <div className="flex items-center gap-1"><Star className="w-3 h-3 text-primary" /> +3.000 Casos</div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CAUSE CATEGORIES */}
      <section className="py-12 border-y border-border bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-sm font-bold tracking-widest uppercase text-muted-foreground mb-6 text-center">Principais Causas</h3>
          <div className="flex overflow-x-auto gap-3 pb-4 no-scrollbar">
            {CAUSES.map((cause, i) => (
              <a 
                key={i} 
                href="#avaliar"
                className="whitespace-nowrap px-4 py-2 rounded-full bg-white border border-border shadow-sm hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-all text-sm font-medium"
              >
                {cause}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-32" id="como-funciona">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">Como a <span className="gold-gradient-text">Pequenas Causas</span> funciona</h2>
            <p className="text-lg text-muted-foreground">Conectamos você aos melhores advogados do Brasil de forma rápida, segura e 100% digital.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting lines for desktop */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-px bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 z-0"></div>
            
            {[
              { 
                icon: <FileText className="w-8 h-8" />, 
                title: "1. Envie seu caso", 
                desc: "Descreva o ocorrido em minutos, anexe provas e envie de forma totalmente online e gratuita." 
              },
              { 
                icon: <Users className="w-8 h-8" />, 
                title: "2. Receba propostas", 
                desc: "Advogados verificados analisam seu caso e enviam propostas, inclusive no modelo ad exitum (só paga se ganhar)." 
              },
              { 
                icon: <Scale className="w-8 h-8" />, 
                title: "3. Resolva online", 
                desc: "Acompanhe tudo pela plataforma. Sem filas, sem burocracia e com total transparência." 
              }
            ].map((step, i) => (
              <div key={i} className="relative z-10 glass-panel p-8 rounded-2xl text-center hover-elevate">
                <div className="w-20 h-20 mx-auto rounded-full bg-background border border-primary/30 flex items-center justify-center text-primary mb-6 shadow-[0_0_30px_rgba(37,99,235,0.12)]">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold mb-4">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MEDIA MENTIONS */}
      <section className="py-24 bg-slate-900 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="text-primary font-semibold tracking-wider text-sm uppercase">Reconhecimento Nacional</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold mt-4 text-white">Somos destaque na mídia</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { source: "O Globo", date: "Dezembro 2025", title: '"Pequenas Causas Processos propõe maior segurança ao acesso à Justiça online"' },
              { source: "Valor Econômico", date: "Maio 2025", title: '"A plataforma conecta cidadãos a advogados de forma ágil e acessível."' },
              { source: "Terra", date: "Maio 2025", title: '"Pequenas Causas Processos facilita acesso ao Juizado Especial Cível"' }
            ].map((mention, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-primary/50 transition-all group">
                <div className="font-display text-2xl font-bold text-white/50 group-hover:text-primary transition-colors mb-6">{mention.source}</div>
                <p className="text-lg font-medium mb-8 leading-snug text-white/80">{mention.title}</p>
                <div className="flex justify-between items-center text-sm text-white/40">
                  <span>{mention.date}</span>
                  <span className="flex items-center gap-1 group-hover:text-primary transition-colors">Leia mais <ArrowRight className="w-4 h-4" /></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-32" id="depoimentos">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">O que dizem sobre a Pequenas Causas</h2>
            <div className="flex items-center justify-center gap-2 text-xl font-semibold">
              <span className="text-foreground">Google Avaliações</span>
              <span className="text-primary">5.0</span>
              <div className="flex text-primary">
                {[1,2,3,4,5].map(star => <Star key={star} className="w-5 h-5 fill-current" />)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Vlamir Constin", text: "O site muito prático e fácil de usar. Tudo é muito transparente, simples de entender e objetivo. Me senti seguro para dar entrada no processo." },
              { name: "Julia Araújo", text: "Excelente! Eu não podia usar defensoria e o advogado da Pequenas Causas Processos deu entrada no juizado e paguei baratinho, não tive trabalho nenhum." },
              { name: "Leonardo Rodrigues", text: "Incrível a Assessoria e a atenção que recebi no meu caso, desde o primeiro momento me instruiu passo a passo. Parabéns pelo ótimo serviço." },
              { name: "Vinicius Viana", text: "Gostei bastante, após preencher o formulário é possível acompanhar o processo na área do cliente. O atendimento da equipe é excelente!" }
            ].map((review, i) => (
              <div key={i} className="glass-panel p-6 rounded-2xl flex flex-col h-full">
                <div className="flex text-primary mb-4">
                  {[1,2,3,4,5].map(star => <Star key={star} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-grow">"{review.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center font-bold text-primary">
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
            <a href="#avaliar" className="inline-flex py-4 px-8 rounded-full bg-primary text-primary-foreground font-bold shadow-[0_0_20px_rgba(37,99,235,0.25)] hover:shadow-[0_0_30px_rgba(37,99,235,0.45)] hover:-translate-y-1 transition-all">
              ENVIAR MEU CASO AGORA
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-slate-50 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-12 text-center">Fui lesado, e agora?</h2>
          
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <details key={i} className="group bg-white border border-border shadow-sm rounded-xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between p-6 cursor-pointer font-medium text-lg hover:text-primary transition-colors">
                  {faq.q}
                  <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180" />
                </summary>
                <div className="p-6 pt-0 text-muted-foreground leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* LAWYER CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5"></div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <Building2 className="w-16 h-16 text-primary mx-auto mb-8" />
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">Advogado, cadastre-se aqui</h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Receba pedidos de propostas diariamente e amplie sua carteira de clientes. Cadastro 100% gratuito.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-background/80 border border-primary/20 rounded-xl p-6">
              <ShieldCheck className="w-8 h-8 text-primary mb-4 mx-auto" />
              <h4 className="font-bold mb-2">Verificação Rigorosa</h4>
              <p className="text-sm text-muted-foreground">Validação direta na OAB</p>
            </div>
            <div className="bg-background/80 border border-primary/20 rounded-xl p-6">
              <FileText className="w-8 h-8 text-primary mb-4 mx-auto" />
              <h4 className="font-bold mb-2">Casos Qualificados</h4>
              <p className="text-sm text-muted-foreground">Clientes pré-filtrados</p>
            </div>
            <div className="bg-background/80 border border-primary/20 rounded-xl p-6">
              <Users className="w-8 h-8 text-primary mb-4 mx-auto" />
              <h4 className="font-bold mb-2">Crescimento</h4>
              <p className="text-sm text-muted-foreground">Expansão da clientela</p>
            </div>
          </div>
          
          <Link 
            href="/advogado/signup"
            className="inline-flex py-4 px-10 rounded-full border-2 border-primary text-primary font-bold hover:bg-primary hover:text-primary-foreground transition-all"
          >
            Cadastrar como Advogado
          </Link>
          <p className="text-xs text-muted-foreground mt-6">Habilitação profissional sujeita a verificação</p>
        </div>
      </section>

    </Layout>
  );
}
