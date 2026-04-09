import React, { useState } from 'react';
import './_group.css';
import { 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  Check,
  Info
} from "lucide-react";

const EVIDENCES = [
  "Conversas (WhatsApp)", "Áudios / Gravações", "Fotos / Vídeos", 
  "E-mails", "Testemunhas", "Comprovantes", "Contrato / Documentos", 
  "Protocolos de Atendimento", "Boletim de Ocorrência", "Outros"
];

export function HierarchyFirst() {
  const [step, setStep] = useState(1);
  const [description, setDescription] = useState("");
  const [evidences, setEvidences] = useState<string[]>([]);
  const [value, setValue] = useState("");

  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");

  const handleEvidenceToggle = (ev: string) => {
    setEvidences(prev => 
      prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev]
    );
  };

  const steps = [
    { num: 1, label: "Descreva" },
    { num: 2, label: "Seus Dados" },
    { num: 3, label: "Acesso" }
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-start">
          
          {/* LEFT COLUMN: HERO + STEPPER */}
          <div className="lg:col-span-5 flex flex-col">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-tight mb-6">
              Seus direitos merecem <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">defesa de excelência.</span>
            </h1>
            
            <div className="flex flex-col sm:flex-row gap-6 mb-16">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">100% Seguro</p>
                  <p className="text-sm text-slate-500">Dados criptografados</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Advogados OAB</p>
                  <p className="text-sm text-slate-500">Profissionais verificados</p>
                </div>
              </div>
            </div>

            {/* Vertical Stepper */}
            <div className="hidden lg:flex flex-col gap-8 pl-2">
              {steps.map((s, idx) => {
                const isCompleted = step > s.num;
                const isActive = step === s.num;
                
                return (
                  <div key={s.num} className="flex items-start gap-4 relative">
                    {/* Connecting line */}
                    {idx < steps.length - 1 && (
                      <div className={`absolute left-4 top-10 w-0.5 h-12 -ml-[1px] ${isCompleted ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                    )}
                    
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-colors ${
                      isCompleted ? 'bg-emerald-500 text-white' : 
                      isActive ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 
                      'bg-slate-100 text-slate-400'
                    }`}>
                      {isCompleted ? <Check className="w-4 h-4" /> : <span className="text-sm font-bold">{s.num}</span>}
                    </div>
                    
                    <div className="pt-1">
                      <p className={`font-bold ${isActive ? 'text-blue-600 text-lg' : isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                        {s.label}
                      </p>
                      {isActive && <p className="text-sm text-slate-500 mt-1">
                        {s.num === 1 ? "Conte-nos detalhes do seu caso" : 
                         s.num === 2 ? "Como podemos contatar você" : 
                         "Receba propostas de advogados"}
                      </p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: FORM CARD */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 p-6 sm:p-10">
              
              {/* Form Header */}
              <div className="mb-10">
                <p className="text-[14px] uppercase tracking-[0.15em] text-blue-600 font-bold mb-3">
                  Etapa {step} de 3
                </p>
                <h2 className="text-[28px] font-display font-bold text-slate-900">
                  {step === 1 ? "Conte o que aconteceu" : 
                   step === 2 ? "Seus Dados de Contato" : 
                   "Acesso à Plataforma"}
                </h2>
              </div>

              {step === 1 && (
                <div className="space-y-10">
                  {/* Price transparency banner */}
                  <div className="flex items-start gap-2 bg-blue-950/40 border border-blue-800/30 rounded-lg px-3 py-2.5">
                    <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-200 leading-relaxed">
                      Triagem gratuita agora · Acesso aos advogados por apenas <strong className="text-yellow-400">R$149,99</strong> após a análise
                    </p>
                  </div>
                  {/* Field 1 */}
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.1em] text-slate-500 font-bold mb-3">
                      Ocorrido <span className="text-blue-600">*</span>
                    </label>
                    <textarea 
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all min-h-[140px] resize-none text-base"
                      placeholder="Detalhe os fatos. Ex: Comprei uma passagem e meu voo foi cancelado sem aviso..."
                    />
                  </div>

                  {/* Field 2 */}
                  <div>
                    <div className="mb-3">
                      <label className="block text-[11px] uppercase tracking-[0.1em] text-slate-500 font-bold">
                        Suas Provas
                      </label>
                      <p className="text-sm text-slate-500 mt-1">(selecione todos que se aplicam)</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {EVIDENCES.map(ev => {
                        const isSelected = evidences.includes(ev);
                        return (
                          <button
                            key={ev}
                            type="button"
                            onClick={() => handleEvidenceToggle(ev)}
                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                              isSelected 
                                ? "bg-blue-50 border-blue-600 text-blue-700 shadow-sm" 
                                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            {ev}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Field 3 */}
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.1em] text-slate-500 font-bold mb-3">
                      Valor Buscado (R$) <span className="text-slate-400 font-normal lowercase tracking-normal ml-1">- Opcional</span>
                    </label>
                    <input 
                      type="number"
                      value={value}
                      onChange={e => setValue(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all text-base"
                      placeholder="Ex: 5000"
                    />
                  </div>

                  {/* CTA */}
                  <div className="pt-4">
                    <button 
                      onClick={() => setStep(2)}
                      className="w-full py-5 rounded-xl bg-blue-600 text-white font-bold text-lg shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:bg-blue-700 hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2"
                    >
                      Continuar <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-10">
                  {/* Field 1 */}
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.1em] text-slate-500 font-bold mb-3">
                      Nome Completo <span className="text-blue-600">*</span>
                    </label>
                    <input 
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all text-base"
                      placeholder="Como podemos te chamar"
                    />
                  </div>

                  {/* Field 2 */}
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.1em] text-slate-500 font-bold mb-3">
                      WhatsApp <span className="text-blue-600">*</span>
                    </label>
                    <input 
                      type="text"
                      value={whatsapp}
                      onChange={e => setWhatsapp(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all text-base"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  
                  {/* Field 3 */}
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.1em] text-slate-500 font-bold mb-3">
                      E-mail <span className="text-blue-600">*</span>
                    </label>
                    <input 
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all text-base"
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      onClick={() => setStep(1)}
                      className="w-1/3 py-5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-lg hover:bg-slate-50 transition-all flex justify-center items-center"
                    >
                      Voltar
                    </button>
                    <button 
                      onClick={() => setStep(3)}
                      className="w-2/3 py-5 rounded-xl bg-blue-600 text-white font-bold text-lg shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:bg-blue-700 hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2"
                    >
                      Avançar <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 py-4">
                  {/* Persuasion block */}
                  <div className="text-left">
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
                  {/* Original success content */}
                  <div className="text-center">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Tudo Certo!</h3>
                  <p className="text-slate-600 max-w-sm mx-auto">
                    Seus dados foram recebidos. Este é apenas um mockup da etapa final para simular a conclusão.
                  </p>
                  <div className="pt-8">
                    <button 
                      onClick={() => setStep(1)}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      Começar novamente
                    </button>
                  </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
