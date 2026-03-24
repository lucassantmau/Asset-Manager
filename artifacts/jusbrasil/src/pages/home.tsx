import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  AlertCircle,
  Lock,
  Star,
  ChevronDown,
  Building2,
  Users,
  FileText,
  Scale,
  ListOrdered,
  QrCode,
  CreditCard
} from "lucide-react";
import { useSubmitCase, useCreatePayment } from "@workspace/api-client-react";
import { Link } from "wouter";

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

type Step1Data = {
  description: string;
  evidences: string[];
  value: string;
};

type Step2Data = {
  name: string;
  whatsapp: string;
  email: string;
};

export default function Home() {
  const [step, setStep] = useState(1);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [pixCode, setPixCode] = useState<string | null>(null);

  const [step1Data, setStep1Data] = useState<Step1Data>({ description: "", evidences: [], value: "" });
  const [step2Data, setStep2Data] = useState<Step2Data>({ name: "", whatsapp: "", email: "" });
  const [cpf, setCpf] = useState("");
  const [payMethod, setPayMethod] = useState<"pix" | "credit_card">("pix");

  const [errors1, setErrors1] = useState<Partial<Record<keyof Step1Data, string>>>({});
  const [errors2, setErrors2] = useState<Partial<Record<keyof Step2Data, string>>>({});
  const [errorsCpf, setErrorsCpf] = useState("");

  const submitCaseMutation = useSubmitCase();
  const createPaymentMutation = useCreatePayment();

  const validateStep1 = () => {
    const errs: Partial<Record<keyof Step1Data, string>> = {};
    if (step1Data.description.length < 20) {
      errs.description = "Por favor, digite pelo menos 20 letras explicando o que aconteceu.";
    }
    setErrors1(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Partial<Record<keyof Step2Data, string>> = {};
    if (step2Data.name.length < 3) {
      errs.name = "Por favor, digite seu nome completo.";
    }
    if (step2Data.whatsapp.replace(/\D/g, "").length < 10) {
      errs.whatsapp = "Por favor, digite um número de WhatsApp válido.";
    }
    if (!step2Data.email.includes("@")) {
      errs.email = "Por favor, digite um e-mail válido.";
    }
    setErrors2(errs);
    return Object.keys(errs).length === 0;
  };

  const onStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const onStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;
    setStep(3);
    try {
      const result = await submitCaseMutation.mutateAsync({
        data: {
          description: step1Data.description,
          evidences: step1Data.evidences,
          value: step1Data.value ? parseFloat(step1Data.value) : null,
          name: step2Data.name,
          email: step2Data.email,
          whatsapp: step2Data.whatsapp,
        }
      });
      setCaseId(result.id);
      setTimeout(() => {
        setStep(4);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 2500);
    } catch (error) {
      console.error("Failed to submit case", error);
      setStep(2);
    }
  };

  const onPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId) return;
    if (cpf.replace(/\D/g, "").length < 11) {
      setErrorsCpf("Por favor, informe um CPF válido (11 dígitos).");
      return;
    }
    setErrorsCpf("");
    try {
      const result = await createPaymentMutation.mutateAsync({
        data: {
          caseId,
          email: step2Data.email,
          whatsapp: step2Data.whatsapp,
          cpf: cpf.replace(/\D/g, ""),
          method: payMethod as any,
        }
      });
      if (payMethod === "pix") {
        setPixCode(result.pixCode || "00020126360014br.gov.bcb.pix0114+5511999999999");
        setStep(5);
      } else {
        setStep(6);
      }
    } catch (error) {
      console.error("Payment failed", error);
    }
  };

  const toggleEvidence = (ev: string) => {
    setStep1Data(prev => ({
      ...prev,
      evidences: prev.evidences.includes(ev)
        ? prev.evidences.filter(e => e !== ev)
        : [...prev.evidences, ev]
    }));
  };

  return (
    <Layout>
      {/* HERO SECTION */}
      <section className="relative pt-12 pb-24 bg-white" id="avaliar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

            {/* Left Column — Hero copy + trust + steps */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="pt-4"
            >
              <h1 className="text-[42px] font-display font-bold leading-tight mb-8 text-foreground">
                Lesado? Nós buscamos seu direito.
              </h1>
              <p className="text-xl text-muted-foreground mb-12 max-w-lg leading-relaxed">
                Se você teve um problema como consumidor, não fique no prejuízo. Conectamos você a advogados especialistas de forma simples e segura.
              </p>

              <div className="space-y-4 mb-12">
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border-2 border-slate-200">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-xl">100% Seguro</p>
                    <p className="text-base text-muted-foreground">Seus dados estão protegidos por lei.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border-2 border-slate-200">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-xl">Advogados OAB</p>
                    <p className="text-base text-muted-foreground">Apenas profissionais registrados e verificados.</p>
                  </div>
                </div>
              </div>

              {/* Como Funciona */}
              <div className="bg-slate-50 border-4 border-slate-200 rounded-xl p-6 md:p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-foreground">
                  <ListOrdered className="w-7 h-7 text-primary" />
                  Como funciona?
                </h2>
                <ol className="space-y-6">
                  <li className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg flex-shrink-0">1</div>
                    <div>
                      <strong className="block text-foreground text-lg mb-1">Preencha o formulário</strong>
                      <span className="text-muted-foreground">Conte-nos o que aconteceu. Leva apenas 2 minutos.</span>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg flex-shrink-0">2</div>
                    <div>
                      <strong className="block text-foreground text-lg mb-1">Análise do caso</strong>
                      <span className="text-muted-foreground">Um advogado especialista avaliará seus direitos.</span>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg flex-shrink-0">3</div>
                    <div>
                      <strong className="block text-foreground text-lg mb-1">Início do processo</strong>
                      <span className="text-muted-foreground">Você recebe instruções claras sobre os próximos passos.</span>
                    </div>
                  </li>
                </ol>
              </div>
            </motion.div>

            {/* Right Column — Multi-step form */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="bg-white rounded-xl border-4 border-slate-200 shadow-xl overflow-hidden"
              role="region"
              aria-label="Formulário de avaliação de caso"
            >
              {/* Step badge header */}
              {step <= 3 && (
                <div className="bg-slate-100 border-b-4 border-slate-200 px-6 py-4 flex items-center justify-between">
                  <span className="text-lg font-bold text-foreground">
                    Etapa {step} de 3
                  </span>
                  <span className="text-base text-muted-foreground flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Triagem gratuita
                  </span>
                </div>
              )}

              <div className="p-6 md:p-8">
                <AnimatePresence mode="wait">

                  {/* STEP 1 — Problem description */}
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                    >
                      <h3 className="text-[28px] font-display font-bold text-foreground mb-8">
                        Conte o que aconteceu
                      </h3>

                      <form onSubmit={onStep1Submit} className="space-y-8" noValidate>
                        <div>
                          <label htmlFor="description" className="block text-xl font-bold text-foreground mb-3">
                            Descreva o seu problema *
                          </label>
                          <p className="text-base text-muted-foreground mb-3">
                            Detalhe os fatos importantes para que o advogado entenda sua situação.
                          </p>
                          <textarea
                            id="description"
                            value={step1Data.description}
                            onChange={e => setStep1Data(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full bg-white border-[3px] border-slate-400 rounded-lg p-4 text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[4px] focus:ring-primary/30 transition-all min-h-[200px] resize-y"
                            placeholder="Exemplo: Comprei um produto na internet que não foi entregue e a loja não responde..."
                            aria-invalid={!!errors1.description}
                            aria-describedby={errors1.description ? "desc-error" : undefined}
                          />
                          {errors1.description && (
                            <div id="desc-error" role="alert" className="flex items-center gap-2 text-red-700 mt-3 bg-red-50 p-3 rounded-lg border-2 border-red-300">
                              <AlertCircle className="w-6 h-6 flex-shrink-0" />
                              <span className="font-medium text-lg">{errors1.description}</span>
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground mt-2 text-right">
                            {step1Data.description.length} / 2000
                          </p>
                        </div>

                        <div>
                          <fieldset>
                            <legend className="block text-xl font-bold text-foreground mb-4">
                              Quais provas você tem do ocorrido? <span className="font-normal text-muted-foreground text-base">(opcional)</span>
                            </legend>
                            <div className="space-y-3">
                              {EVIDENCES.map(ev => {
                                const isSelected = step1Data.evidences.includes(ev);
                                return (
                                  <label key={ev} className="flex items-center gap-4 cursor-pointer p-2 hover:bg-slate-50 rounded-lg transition-colors">
                                    <div className={`w-8 h-8 border-[3px] rounded flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? "bg-primary border-primary" : "bg-white border-slate-400"}`}>
                                      {isSelected && <CheckCircle2 className="w-5 h-5 text-white" />}
                                    </div>
                                    <input
                                      type="checkbox"
                                      className="sr-only"
                                      checked={isSelected}
                                      onChange={() => toggleEvidence(ev)}
                                    />
                                    <span className="text-lg font-medium text-foreground">{ev}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </fieldset>
                        </div>

                        <div>
                          <label htmlFor="value" className="block text-xl font-bold text-foreground mb-3">
                            Qual valor você busca de indenização? <span className="font-normal text-muted-foreground text-base">(R$ - opcional)</span>
                          </label>
                          <input
                            id="value"
                            type="number"
                            value={step1Data.value}
                            onChange={e => setStep1Data(prev => ({ ...prev, value: e.target.value }))}
                            className="w-full h-14 bg-white border-[3px] border-slate-400 rounded-lg px-4 text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[4px] focus:ring-primary/30 transition-all"
                            placeholder="Apenas números. Exemplo: 5000"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full h-16 rounded-lg bg-primary text-primary-foreground text-xl font-bold hover:bg-primary/90 focus:outline-none focus:ring-[4px] focus:ring-primary/40 transition-all flex justify-center items-center gap-3"
                        >
                          Continuar para próxima etapa <ArrowRight className="w-6 h-6" />
                        </button>
                      </form>
                    </motion.div>
                  )}

                  {/* STEP 2 — Contact data */}
                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                    >
                      <button
                        onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        className="text-lg font-bold text-primary hover:text-primary/80 mb-8 flex items-center gap-2 underline decoration-2 underline-offset-4"
                      >
                        <ArrowRight className="w-5 h-5 rotate-180" /> Voltar para a etapa anterior
                      </button>

                      <h3 className="text-[28px] font-display font-bold text-foreground mb-8">
                        Seus Dados de Contato
                      </h3>

                      <form onSubmit={onStep2Submit} className="space-y-6" noValidate>
                        <div>
                          <label htmlFor="name" className="block text-xl font-bold text-foreground mb-3">
                            Nome completo *
                          </label>
                          <input
                            id="name"
                            value={step2Data.name}
                            onChange={e => setStep2Data(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full h-14 bg-white border-[3px] border-slate-400 rounded-lg px-4 text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[4px] focus:ring-primary/30 transition-all"
                            placeholder="Digite seu nome completo"
                            aria-invalid={!!errors2.name}
                            aria-describedby={errors2.name ? "name-error" : undefined}
                          />
                          {errors2.name && (
                            <div id="name-error" role="alert" className="flex items-center gap-2 text-red-700 mt-3 bg-red-50 p-3 rounded-lg border-2 border-red-300">
                              <AlertCircle className="w-6 h-6 flex-shrink-0" />
                              <span className="font-medium text-lg">{errors2.name}</span>
                            </div>
                          )}
                        </div>

                        <div>
                          <label htmlFor="whatsapp" className="block text-xl font-bold text-foreground mb-3">
                            Número do WhatsApp *
                          </label>
                          <input
                            id="whatsapp"
                            value={step2Data.whatsapp}
                            onChange={e => setStep2Data(prev => ({ ...prev, whatsapp: e.target.value }))}
                            className="w-full h-14 bg-white border-[3px] border-slate-400 rounded-lg px-4 text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[4px] focus:ring-primary/30 transition-all"
                            placeholder="Exemplo: (11) 99999-9999"
                            aria-invalid={!!errors2.whatsapp}
                            aria-describedby={errors2.whatsapp ? "wa-error" : undefined}
                          />
                          {errors2.whatsapp && (
                            <div id="wa-error" role="alert" className="flex items-center gap-2 text-red-700 mt-3 bg-red-50 p-3 rounded-lg border-2 border-red-300">
                              <AlertCircle className="w-6 h-6 flex-shrink-0" />
                              <span className="font-medium text-lg">{errors2.whatsapp}</span>
                            </div>
                          )}
                        </div>

                        <div>
                          <label htmlFor="email" className="block text-xl font-bold text-foreground mb-3">
                            E-mail *
                          </label>
                          <input
                            id="email"
                            type="email"
                            value={step2Data.email}
                            onChange={e => setStep2Data(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full h-14 bg-white border-[3px] border-slate-400 rounded-lg px-4 text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[4px] focus:ring-primary/30 transition-all"
                            placeholder="Exemplo: seuemail@dominio.com"
                            aria-invalid={!!errors2.email}
                            aria-describedby={errors2.email ? "email-error" : undefined}
                          />
                          {errors2.email && (
                            <div id="email-error" role="alert" className="flex items-center gap-2 text-red-700 mt-3 bg-red-50 p-3 rounded-lg border-2 border-red-300">
                              <AlertCircle className="w-6 h-6 flex-shrink-0" />
                              <span className="font-medium text-lg">{errors2.email}</span>
                            </div>
                          )}
                        </div>

                        <div className="bg-blue-50 border-2 border-primary/30 p-4 rounded-lg flex items-start gap-4 mt-2">
                          <Lock className="w-7 h-7 text-primary flex-shrink-0 mt-1" />
                          <p className="text-base text-foreground leading-relaxed">
                            <strong>Privacidade garantida:</strong> Ao enviar seus dados, você concorda com nossos{" "}
                            <Link href="/termos" className="text-primary font-medium hover:underline">Termos de Uso</Link>.
                            Suas informações serão mantidas em absoluto sigilo.
                          </p>
                        </div>

                        <button
                          type="submit"
                          disabled={submitCaseMutation.isPending}
                          className="w-full h-16 rounded-lg bg-primary text-primary-foreground text-xl font-bold hover:bg-primary/90 focus:outline-none focus:ring-[4px] focus:ring-primary/40 disabled:opacity-50 transition-all flex justify-center items-center gap-3"
                        >
                          {submitCaseMutation.isPending ? "Processando..." : <>Enviar para Análise Profissional <ArrowRight className="w-6 h-6" /></>}
                        </button>
                      </form>
                    </motion.div>
                  )}

                  {/* STEP 3 — Processing spinner */}
                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-16 flex flex-col items-center text-center"
                    >
                      <div className="w-24 h-24 border-[8px] border-slate-200 border-t-primary rounded-full animate-spin mb-10" role="status" aria-label="Analisando..." />
                      <h3 className="text-3xl font-display font-bold text-foreground mb-6">
                        Analisando seu caso...
                      </h3>
                      <p className="text-xl text-muted-foreground max-w-md mx-auto">
                        Por favor, não feche esta página. Estamos verificando os requisitos legais das informações enviadas.
                      </p>
                    </motion.div>
                  )}

                  {/* STEP 4 — Payment CTA */}
                  {step === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="py-8"
                    >
                      <div className="mb-8 text-center">
                        <div className="w-20 h-20 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto mb-6 border-4 border-green-200">
                          <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h3 className="text-[32px] font-display font-bold text-foreground mb-4">
                          Seu caso tem viabilidade!
                        </h3>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                          Identificamos fortes elementos para uma ação. Para conectar você a advogados interessados no seu caso, é necessário o pagamento de uma taxa única de acesso.
                        </p>
                      </div>

                      <div className="bg-slate-50 border-[3px] border-slate-200 rounded-xl p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                          <p className="text-lg text-muted-foreground mb-1 font-medium">Taxa Única de Acesso à Plataforma</p>
                          <p className="text-[40px] font-bold text-foreground">R$ 199,90</p>
                        </div>
                        <ShieldCheck className="w-14 h-14 text-primary flex-shrink-0" />
                      </div>

                      <form onSubmit={onPaymentSubmit} className="space-y-6" noValidate>
                        <div>
                          <label htmlFor="cpf" className="block text-xl font-bold text-foreground mb-3">CPF *</label>
                          <input
                            id="cpf"
                            value={cpf}
                            onChange={e => setCpf(e.target.value)}
                            className="w-full h-14 bg-white border-[3px] border-slate-400 rounded-lg px-4 text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[4px] focus:ring-primary/30 transition-all"
                            placeholder="000.000.000-00"
                            aria-invalid={!!errorsCpf}
                            aria-describedby={errorsCpf ? "cpf-error" : undefined}
                          />
                          {errorsCpf && (
                            <div id="cpf-error" role="alert" className="flex items-center gap-2 text-red-700 mt-3 bg-red-50 p-3 rounded-lg border-2 border-red-300">
                              <AlertCircle className="w-6 h-6 flex-shrink-0" />
                              <span className="font-medium text-lg">{errorsCpf}</span>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-xl font-bold text-foreground mb-3">Forma de Pagamento</label>
                          <div className="grid grid-cols-2 gap-3">
                            <label className={`border-[3px] rounded-xl p-4 cursor-pointer transition-all text-center flex flex-col items-center gap-2 ${payMethod === "pix" ? "border-primary bg-primary/10" : "border-slate-300 bg-white hover:bg-slate-50"}`}>
                              <input type="radio" value="pix" checked={payMethod === "pix"} onChange={() => setPayMethod("pix")} className="sr-only" />
                              <QrCode className={`w-6 h-6 ${payMethod === "pix" ? "text-primary" : "text-muted-foreground"}`} />
                              <span className="text-base font-bold">PIX</span>
                            </label>
                            <label className={`border-[3px] rounded-xl p-4 cursor-pointer transition-all text-center flex flex-col items-center gap-2 ${payMethod === "credit_card" ? "border-primary bg-primary/10" : "border-slate-300 bg-white hover:bg-slate-50"}`}>
                              <input type="radio" value="credit_card" checked={payMethod === "credit_card"} onChange={() => setPayMethod("credit_card")} className="sr-only" />
                              <CreditCard className={`w-6 h-6 ${payMethod === "credit_card" ? "text-primary" : "text-muted-foreground"}`} />
                              <span className="text-base font-bold">Cartão</span>
                            </label>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={createPaymentMutation.isPending}
                          className="w-full h-20 rounded-lg bg-green-600 text-white text-[22px] font-bold hover:bg-green-700 focus:outline-none focus:ring-[4px] focus:ring-green-600/40 disabled:opacity-50 transition-all flex justify-center items-center gap-3 shadow-lg"
                        >
                          <Lock className="w-7 h-7" />
                          {createPaymentMutation.isPending ? "Processando..." : "Pagar e Acessar Advogados"}
                        </button>
                        <p className="text-center text-base text-muted-foreground">Pagamento 100% seguro. Suporte online disponível.</p>
                      </form>
                    </motion.div>
                  )}

                  {/* STEP 5 — PIX code */}
                  {step === 5 && (
                    <motion.div
                      key="step5"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-6"
                    >
                      <h3 className="text-2xl font-display font-bold text-foreground mb-2">PIX Gerado!</h3>
                      <p className="text-muted-foreground mb-6">Escaneie o QR Code ou copie a chave.</p>
                      <div className="w-48 h-48 bg-white p-2 rounded-xl mx-auto mb-6 flex items-center justify-center border border-slate-200">
                        <QrCode className="w-full h-full text-black" />
                      </div>
                      <div className="bg-slate-50 border border-border rounded-xl p-3 mb-6 font-mono text-xs break-all text-muted-foreground">
                        {pixCode}
                      </div>
                      <button
                        onClick={() => { navigator.clipboard.writeText(pixCode || ""); alert("Código copiado!"); }}
                        className="w-full py-3 rounded-xl bg-slate-100 border border-border text-foreground font-medium hover:bg-slate-200 transition-all"
                      >
                        Copiar Chave PIX
                      </button>
                      <div className="mt-6 pt-6 border-t border-border">
                        <Link href="/area-do-cliente" className="text-primary hover:underline font-medium">
                          Ir para Área do Cliente
                        </Link>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 6 — Credit card success */}
                  {step === 6 && (
                    <motion.div
                      key="step6"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-10"
                    >
                      <div className="w-20 h-20 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto mb-6 border-4 border-green-200">
                        <CheckCircle2 className="w-10 h-10" />
                      </div>
                      <h3 className="text-2xl font-display font-bold text-foreground mb-4">Pagamento Aprovado!</h3>
                      <p className="text-muted-foreground mb-8">Seu caso já está disponível para os advogados da plataforma.</p>
                      <Link
                        href="/area-do-cliente"
                        className="inline-flex py-4 px-8 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all"
                      >
                        Acessar Área do Cliente
                      </Link>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
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
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
              Como a <span className="gold-gradient-text">Pequenas Causas</span> funciona
            </h2>
            <p className="text-lg text-muted-foreground">Conectamos você aos melhores advogados do Brasil de forma rápida, segura e 100% digital.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-px bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 z-0" />
            {[
              { icon: <FileText className="w-8 h-8" />, title: "1. Envie seu caso", desc: "Descreva o ocorrido em minutos, anexe provas e envie de forma totalmente online e gratuita." },
              { icon: <Users className="w-8 h-8" />, title: "2. Receba propostas", desc: "Advogados verificados analisam seu caso e enviam propostas, inclusive no modelo ad exitum (só paga se ganhar)." },
              { icon: <Scale className="w-8 h-8" />, title: "3. Resolva online", desc: "Acompanhe tudo pela plataforma. Sem filas, sem burocracia e com total transparência." }
            ].map((s, i) => (
              <div key={i} className="relative z-10 glass-panel p-8 rounded-2xl text-center hover-elevate">
                <div className="w-20 h-20 mx-auto rounded-full bg-background border border-primary/30 flex items-center justify-center text-primary mb-6 shadow-[0_0_30px_rgba(37,99,235,0.12)]">
                  {s.icon}
                </div>
                <h3 className="text-xl font-bold mb-4">{s.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MEDIA MENTIONS */}
      <section className="py-24 bg-slate-900 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
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
        <div className="absolute inset-0 bg-primary/5" />
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
