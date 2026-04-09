import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  AlertCircle,
  FileText,
  CreditCard,
  QrCode,
  Lock,
  ListOrdered,
  Info
} from "lucide-react";
import './_group.css';

const EVIDENCES = [
  "Conversas (WhatsApp)", "Áudios / Gravações", "Fotos / Vídeos", 
  "E-mails", "Testemunhas", "Comprovantes", "Contrato / Documentos", 
  "Protocolos de Atendimento", "Boletim de Ocorrência", "Outros"
];

export function AccessibilityFirst() {
  const formCardRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(1);
  const [description, setDescription] = useState("");
  const [evidences, setEvidences] = useState<string[]>([]);
  const [value, setValue] = useState("");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (description.length < 20) {
      newErrors.description = "Por favor, digite pelo menos 20 letras explicando o que aconteceu.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (name.length < 3) {
      newErrors.name = "Por favor, digite seu nome completo.";
    }
    if (whatsapp.length < 10) {
      newErrors.whatsapp = "Por favor, digite um número de WhatsApp válido.";
    }
    if (!email.includes('@')) {
      newErrors.email = "Por favor, digite um e-mail válido.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const scrollToCard = () => {
    setTimeout(() => {
      formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const onStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
      scrollToCard();
    }
  };

  const onStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep2()) {
      setStep(3);
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setStep(4);
        scrollToCard();
      }, 2500);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#111111] text-lg leading-[1.75] font-sans">
      {/* HEADER BAR FOR ACCESSIBILITY */}
      <header className="bg-primary text-primary-foreground py-4 px-6 md:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-8 h-8" />
            <span className="font-bold text-xl tracking-tight">Pequenas Causas</span>
          </div>
          <div className="text-base font-medium flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Site Seguro
          </div>
        </div>
      </header>

      <section className="relative pt-12 pb-24" id="avaliar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            
            {/* Left Column - Hero */}
            <div className="pt-4">
              <h1 className="text-[42px] font-display font-bold leading-tight mb-8 text-[#111111]">
                Lesado? Nós buscamos seu direito.
              </h1>
              <p className="text-xl text-[#333333] mb-12 max-w-lg">
                Se você teve um problema como consumidor, não fique no prejuízo. Conectamos você a advogados especialistas de forma simples e segura.
              </p>

              <div className="space-y-6 mb-12">
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border-2 border-slate-200">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-[#111111] text-xl">100% Seguro</p>
                    <p className="text-base text-[#444444]">Seus dados estão protegidos por lei.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border-2 border-slate-200">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-[#111111] text-xl">Advogados OAB</p>
                    <p className="text-base text-[#444444]">Apenas profissionais registrados e verificados.</p>
                  </div>
                </div>
              </div>

              {/* Como Funciona Box */}
              <div className="bg-[#f8f9fa] border-4 border-[#e9ecef] rounded-xl p-6 md:p-8 mt-12">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <ListOrdered className="w-8 h-8 text-primary" />
                  Como funciona?
                </h2>
                <ol className="space-y-6">
                  <li className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl flex-shrink-0">1</div>
                    <div>
                      <strong className="block text-[#111111] text-xl mb-1">Preencha o formulário</strong>
                      <span className="text-[#333333]">Conte-nos o que aconteceu. Leva apenas 2 minutos.</span>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl flex-shrink-0">2</div>
                    <div>
                      <strong className="block text-[#111111] text-xl mb-1">Análise do caso</strong>
                      <span className="text-[#333333]">Um advogado especialista avaliará seus direitos.</span>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl flex-shrink-0">3</div>
                    <div>
                      <strong className="block text-[#111111] text-xl mb-1">Início do processo</strong>
                      <span className="text-[#333333]">Você recebe instruções claras sobre os próximos passos.</span>
                    </div>
                  </li>
                </ol>
              </div>
            </div>

            {/* Right Column - Form Card */}
            <div ref={formCardRef} className="bg-white rounded-xl border-4 border-[#e5e7eb] shadow-xl overflow-hidden" role="region" aria-label="Formulário de avaliação de caso">
              {/* ACCESSIBLE STEP BADGE */}
              <div className="bg-[#f3f4f6] border-b-4 border-[#e5e7eb] px-6 py-4 flex items-center justify-between">
                <span className="text-lg font-bold text-[#111111]">
                  Etapa {step} de 3
                </span>
                <span className="text-base text-[#444444] flex items-center gap-2">
                  <Clock className="w-5 h-5" /> 
                  Triagem gratuita
                </span>
              </div>

              <div className="p-6 md:p-8">
                {step === 1 && (
                  <div key="step1">
                    <h3 className="text-[28px] font-display font-bold text-[#111111] mb-4">
                      Conte o que aconteceu
                    </h3>

                    <div className="flex items-start gap-2 bg-blue-950/40 border border-blue-800/30 rounded-lg px-3 py-2.5 mb-5">
                      <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-200 leading-relaxed">
                        Triagem gratuita agora · Acesso aos advogados por apenas <strong className="text-yellow-400">R$149,99</strong> após a análise
                      </p>
                    </div>

                    <form onSubmit={onStep1Submit} className="space-y-8">
                      <div>
                        <label htmlFor="description" className="block text-xl font-bold text-[#111111] mb-3">
                          Descreva o seu problema *
                        </label>
                        <p className="text-base text-[#444444] mb-3">Detalhe os fatos importantes para que o advogado entenda sua situação.</p>
                        <textarea 
                          id="description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full bg-white border-[3px] border-[#9ca3af] rounded-lg p-4 text-lg text-[#111111] focus:outline-none focus:border-primary focus:ring-[4px] focus:ring-primary/40 transition-all min-h-[200px] resize-y"
                          placeholder="Exemplo: Comprei um produto na internet que não foi entregue e a loja não responde..."
                          aria-invalid={!!errors.description}
                          aria-describedby={errors.description ? "desc-error" : undefined}
                        />
                        {errors.description && (
                          <div id="desc-error" className="flex items-center gap-2 text-[#b91c1c] mt-3 bg-[#fef2f2] p-3 rounded-md border-2 border-[#fca5a5]">
                            <AlertCircle className="w-6 h-6 flex-shrink-0" />
                            <span className="font-medium text-lg">{errors.description}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xl font-bold text-[#111111] mb-4">
                          Quais provas você tem do ocorrido? (opcional)
                        </label>
                        <div className="space-y-4">
                          {EVIDENCES.map(ev => {
                            const isSelected = evidences.includes(ev);
                            return (
                              <label key={ev} className="flex items-center gap-4 cursor-pointer p-2 hover:bg-[#f3f4f6] rounded-md transition-colors">
                                <div className={`w-8 h-8 border-[3px] rounded flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-primary border-primary' : 'bg-white border-[#9ca3af]'}`}>
                                  {isSelected && <CheckCircle2 className="w-6 h-6 text-white" />}
                                </div>
                                <input 
                                  type="checkbox"
                                  className="sr-only"
                                  checked={isSelected}
                                  onChange={() => {
                                    if (isSelected) {
                                      setEvidences(evidences.filter(e => e !== ev));
                                    } else {
                                      setEvidences([...evidences, ev]);
                                    }
                                  }}
                                />
                                <span className="text-xl font-medium text-[#111111]">{ev}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="value" className="block text-xl font-bold text-[#111111] mb-3">
                          Qual valor você busca de indenização? (R$ - opcional)
                        </label>
                        <input 
                          id="value"
                          type="number"
                          value={value}
                          onChange={(e) => setValue(e.target.value)}
                          className="w-full h-14 bg-white border-[3px] border-[#9ca3af] rounded-lg p-4 text-lg text-[#111111] focus:outline-none focus:border-primary focus:ring-[4px] focus:ring-primary/40 transition-all"
                          placeholder="Apenas números. Exemplo: 5000"
                        />
                      </div>

                      <button 
                        type="submit"
                        className="w-full h-16 rounded-[4px] bg-primary text-white text-xl font-bold hover:bg-primary/90 focus:ring-[4px] focus:ring-primary/40 focus:outline-none transition-all flex justify-center items-center gap-3"
                      >
                        Continuar para próxima etapa <ArrowRight className="w-6 h-6" />
                      </button>
                    </form>
                  </div>
                )}

                {step === 2 && (
                  <div key="step2">
                    <button 
                      onClick={() => {
                        setStep(1);
                        scrollToCard();
                      }}
                      className="text-lg font-bold text-primary hover:text-primary/80 mb-8 flex items-center gap-2 underline decoration-2 underline-offset-4"
                    >
                      Voltar para a etapa anterior
                    </button>
                    
                    <h3 className="text-[28px] font-display font-bold text-[#111111] mb-8">
                      Seus Dados de Contato
                    </h3>

                    <form onSubmit={onStep2Submit} className="space-y-8">
                      <div>
                        <label htmlFor="name" className="block text-xl font-bold text-[#111111] mb-3">Nome completo *</label>
                        <input 
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full h-14 bg-white border-[3px] border-[#9ca3af] rounded-lg p-4 text-lg text-[#111111] focus:outline-none focus:border-primary focus:ring-[4px] focus:ring-primary/40 transition-all"
                          placeholder="Digite seu nome completo"
                        />
                        {errors.name && (
                          <div className="flex items-center gap-2 text-[#b91c1c] mt-3 bg-[#fef2f2] p-3 rounded-md border-2 border-[#fca5a5]">
                            <AlertCircle className="w-6 h-6 flex-shrink-0" />
                            <span className="font-medium text-lg">{errors.name}</span>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor="whatsapp" className="block text-xl font-bold text-[#111111] mb-3">Número do WhatsApp *</label>
                        <input 
                          id="whatsapp"
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          className="w-full h-14 bg-white border-[3px] border-[#9ca3af] rounded-lg p-4 text-lg text-[#111111] focus:outline-none focus:border-primary focus:ring-[4px] focus:ring-primary/40 transition-all"
                          placeholder="Exemplo: (11) 99999-9999"
                        />
                        {errors.whatsapp && (
                          <div className="flex items-center gap-2 text-[#b91c1c] mt-3 bg-[#fef2f2] p-3 rounded-md border-2 border-[#fca5a5]">
                            <AlertCircle className="w-6 h-6 flex-shrink-0" />
                            <span className="font-medium text-lg">{errors.whatsapp}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-xl font-bold text-[#111111] mb-3">E-mail *</label>
                        <input 
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full h-14 bg-white border-[3px] border-[#9ca3af] rounded-lg p-4 text-lg text-[#111111] focus:outline-none focus:border-primary focus:ring-[4px] focus:ring-primary/40 transition-all"
                          placeholder="Exemplo: seuemail@dominio.com"
                        />
                        {errors.email && (
                          <div className="flex items-center gap-2 text-[#b91c1c] mt-3 bg-[#fef2f2] p-3 rounded-md border-2 border-[#fca5a5]">
                            <AlertCircle className="w-6 h-6 flex-shrink-0" />
                            <span className="font-medium text-lg">{errors.email}</span>
                          </div>
                        )}
                      </div>

                      <div className="bg-[#e0f2fe] border-2 border-primary/30 p-4 rounded-lg flex items-start gap-4 mt-8">
                        <Lock className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                        <p className="text-lg text-[#111111]">
                          <strong>Privacidade garantida:</strong> Ao enviar seus dados, você concorda com nossos Termos de Uso. Suas informações serão mantidas em absoluto sigilo e usadas apenas para analisar seu caso.
                        </p>
                      </div>

                      <button 
                        type="submit"
                        className="w-full h-16 rounded-[4px] bg-primary text-white text-xl font-bold hover:bg-primary/90 focus:ring-[4px] focus:ring-primary/40 focus:outline-none transition-all flex justify-center items-center gap-3 mt-4"
                      >
                        Enviar para Análise Profissional <ArrowRight className="w-6 h-6" />
                      </button>
                    </form>
                  </div>
                )}

                {step === 3 && (
                  <div key="step3" className="py-16 flex flex-col items-center text-center">
                    <div className="w-24 h-24 border-[8px] border-[#e5e7eb] border-t-primary rounded-full animate-spin mb-10"></div>
                    <h3 className="text-3xl font-display font-bold text-[#111111] mb-6">
                      Analisando seu caso...
                    </h3>
                    <p className="text-xl text-[#333333] max-w-md mx-auto">
                      Por favor, não feche esta página. Estamos verificando os requisitos legais das informações enviadas.
                    </p>
                  </div>
                )}

                {step === 4 && (
                  <div key="step4" className="py-8">
                    {/* Persuasion block */}
                    <div className="text-left mb-6">
                      <div className="bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-t-lg text-center tracking-wide">
                        ⚠️ SEU CASO FOI ANALISADO COM SUCESSO
                      </div>
                      <div className="bg-slate-900 rounded-b-lg px-4 py-4 border border-slate-700">
                        <h3 className="text-white font-bold text-lg mb-3">
                          Falta apenas <span className="text-yellow-400">1 passo</span> para um advogado assumir seu caso.
                        </h3>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          <div className="bg-slate-800 rounded-lg p-3 text-center border border-slate-700">
                            <p className="text-xs text-slate-400 mb-1">Consulta particular</p>
                            <p className="text-red-400 font-bold text-base line-through">R$300-R$500</p>
                          </div>
                          <div className="bg-yellow-500 rounded-lg p-3 text-center">
                            <p className="text-xs text-slate-900 font-semibold mb-1">Pequenas Causas</p>
                            <p className="text-slate-900 font-bold text-base">R$149,99</p>
                            <p className="text-[10px] text-slate-800 mt-1">Acesso instantâneo ao advogado</p>
                          </div>
                        </div>
                        <ul className="space-y-1.5 mb-4">
                          {["Advogados verificados OAB", "3.000+ casos resolvidos", "Modelo ad exitum", "Resposta em horas"].map((item) => (
                            <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
                              <span className="text-green-400 font-bold">✓</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                        <div className="bg-orange-900/60 rounded-lg px-3 py-2 text-center">
                          <p className="text-yellow-400 text-xs font-medium">
                            Quanto mais você espera, mais difícil fica cobrar seus direitos
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mb-10 text-center">
                      <div className="w-20 h-20 rounded-full bg-[#dcfce7] text-[#166534] flex items-center justify-center mx-auto mb-6 border-4 border-[#bbf7d0]">
                        <CheckCircle2 className="w-10 h-10" />
                      </div>
                      <h3 className="text-[32px] font-display font-bold text-[#111111] mb-4">
                        Seu caso tem viabilidade!
                      </h3>
                      <p className="text-xl text-[#333333]">
                        Identificamos fortes elementos para uma ação. Para conectar você a advogados interessados no seu caso, é necessário o pagamento de uma taxa única de acesso.
                      </p>
                    </div>

                    <div className="bg-[#f8f9fa] border-[3px] border-[#e5e7eb] rounded-xl p-8 mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div>
                        <p className="text-xl text-[#444444] mb-2 font-medium">Taxa Única de Acesso à Plataforma</p>
                        <p className="text-[40px] font-bold text-[#111111]">R$ 199,90</p>
                      </div>
                      <ShieldCheck className="w-16 h-16 text-primary" />
                    </div>

                    <button 
                      onClick={() => alert("Simulação de pagamento no mockup de acessibilidade concluída.")}
                      className="w-full h-20 rounded-[4px] bg-[#16a34a] text-white text-[22px] font-bold hover:bg-[#15803d] focus:ring-[4px] focus:ring-[#16a34a]/40 focus:outline-none transition-all flex justify-center items-center gap-3 shadow-lg"
                    >
                      <Lock className="w-7 h-7" />
                      Pagar e Acessar Advogados
                    </button>
                    <p className="text-center text-base text-[#666666] mt-6">Pagamento 100% seguro. Suporte online disponível.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
