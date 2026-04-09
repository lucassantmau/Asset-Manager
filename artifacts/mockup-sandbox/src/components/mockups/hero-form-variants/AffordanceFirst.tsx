import React, { useState } from 'react';
import './_group.css';
import { 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  HelpCircle,
  Circle,
  CheckCircle,
  ChevronRight,
  Info
} from 'lucide-react';

const EVIDENCES = [
  "Conversas (WhatsApp)", "Áudios / Gravações", "Fotos / Vídeos", 
  "E-mails", "Testemunhas", "Comprovantes", "Contrato / Documentos", 
  "Protocolos de Atendimento", "Boletim de Ocorrência", "Outros"
];

export function AffordanceFirst() {
  const [step, setStep] = useState(1);
  const [description, setDescription] = useState("");
  const [evidences, setEvidences] = useState<string[]>([]);
  
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        
        {/* Left Column - Hero */}
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-800 font-medium text-sm border border-blue-200 shadow-sm">
            <ShieldCheck className="w-4 h-4" />
            Plataforma N°1 em Pequenas Causas
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold font-display leading-tight text-slate-900">
            Seus direitos merecem <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">defesa de excelência.</span>
          </h1>
          
          <p className="text-xl text-slate-600 leading-relaxed">
            Mais de 6.000 brasileiros já buscaram seus direitos com advogados verificados. Simples, 100% online e seguro.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex-1">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-slate-900">100% Seguro</p>
                <p className="text-sm text-slate-500">Dados criptografados</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex-1">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Advogados OAB</p>
                <p className="text-sm text-slate-500">Profissionais verificados</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-8 relative">
          
          {/* Step Pills */}
          <div className="flex items-center justify-between mb-8 bg-slate-100 p-2 rounded-xl">
            {[
              { num: 1, label: "Caso" },
              { num: 2, label: "Dados" },
              { num: 3, label: "Acesso" }
            ].map((s, i) => (
              <React.Fragment key={s.num}>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                  step === s.num ? "bg-blue-600 text-white shadow-md" : 
                  step > s.num ? "bg-emerald-100 text-emerald-700" : "text-slate-500"
                }`}>
                  <span className="shrink-0">{s.num}</span>
                  <span>{s.label}</span>
                </div>
                {i < 2 && <ArrowRight className="w-4 h-4 text-slate-300 mx-1" />}
              </React.Fragment>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold font-display text-slate-900">Conte o que aconteceu</h2>
                <p className="text-slate-500">Descreva os detalhes para avaliação do seu caso.</p>
              </div>

              <div className="flex items-center gap-2 bg-blue-950/40 border border-blue-800/30 rounded-lg px-3 py-2 text-xs text-blue-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Triagem gratuita agora · Acesso aos advogados por apenas <strong className="text-yellow-400">R$149,99</strong> após a análise</span>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block font-bold text-slate-900 text-lg">
                    Descreva o ocorrido *
                  </label>
                  <div className="relative">
                    <textarea 
                      className="w-full min-h-[160px] p-5 rounded-xl border-2 border-blue-500 bg-blue-50/30 text-slate-900 placeholder:text-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 shadow-[inset_0_0_15px_rgba(37,99,235,0.1)] resize-y transition-all text-lg leading-relaxed"
                      placeholder="Clique aqui e descreva o que aconteceu..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                    {!description && (
                      <div className="absolute top-5 left-5 pointer-events-none text-blue-500 animate-pulse">
                        <ChevronRight className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block font-bold text-slate-900 text-lg">
                    Quais provas você tem? (opcional)
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {EVIDENCES.map(ev => {
                      const isSelected = evidences.includes(ev);
                      return (
                        <button
                          key={ev}
                          type="button"
                          onClick={() => {
                            if (isSelected) setEvidences(evidences.filter(e => e !== ev));
                            else setEvidences([...evidences, ev]);
                          }}
                          className={`flex items-center gap-3 px-4 py-3 rounded-full font-bold transition-all border-2 text-base ${
                            isSelected 
                              ? "bg-blue-600 border-blue-600 text-white shadow-md hover:bg-blue-700" 
                              : "bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50"
                          }`}
                        >
                          {isSelected ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                          {ev}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block font-bold text-slate-900 text-lg">
                    Qual valor você busca? (R$ - opcional)
                  </label>
                  <input 
                    type="number"
                    className="w-full h-14 px-5 rounded-xl border-2 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-lg"
                    placeholder="Ex: 5000"
                  />
                </div>

                <button 
                  onClick={() => setStep(2)}
                  className="w-full group relative py-5 px-6 rounded-xl bg-blue-600 text-white font-bold text-xl overflow-hidden transition-all hover:bg-blue-700 shadow-[0_8px_0_0_#1e40af] hover:shadow-[0_4px_0_0_#1e40af] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px] flex justify-center items-center gap-3"
                >
                  <span className="relative z-10">Continuar para Dados</span>
                  <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="flex items-center gap-4 mb-2">
                <button 
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-lg border-2 border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" /> Voltar
                </button>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold font-display text-slate-900">Seus Dados</h2>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block font-bold text-slate-900 text-lg">Nome completo *</label>
                  <input 
                    className="w-full h-14 px-5 rounded-xl border-2 border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-lg"
                    placeholder="Digite seu nome completo"
                  />
                </div>
                
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="block font-bold text-slate-900 text-lg">WhatsApp *</label>
                    <input 
                      className="w-full h-14 px-5 rounded-xl border-2 border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-lg"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block font-bold text-slate-900 text-lg">E-mail *</label>
                    <input 
                      type="email"
                      className="w-full h-14 px-5 rounded-xl border-2 border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-lg"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <label className="flex items-start gap-4 p-4 rounded-xl border-2 border-slate-200 bg-slate-50 cursor-pointer hover:border-blue-300 transition-colors mt-4">
                  <input type="checkbox" className="w-6 h-6 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-slate-700 leading-relaxed">
                    Confirmo que as informações são verdadeiras e aceito os <strong>Termos de Uso</strong> e <strong>Política de Privacidade</strong>.
                  </span>
                </label>

                <button 
                  onClick={() => setStep(3)}
                  className="w-full group relative py-5 px-6 rounded-xl bg-blue-600 text-white font-bold text-xl overflow-hidden transition-all hover:bg-blue-700 shadow-[0_8px_0_0_#1e40af] hover:shadow-[0_4px_0_0_#1e40af] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px] flex justify-center items-center gap-3 mt-6"
                >
                  <span className="relative z-10">Finalizar Envio</span>
                  <CheckCircle2 className="w-6 h-6 relative z-10" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in zoom-in-95 duration-500 py-4">
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
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-bold font-display text-slate-900">Tudo Certo!</h2>
              <p className="text-xl text-slate-600 max-w-sm mx-auto">
                Seu caso foi recebido com sucesso. Em breve um advogado parceiro entrará em contato.
              </p>
              <button 
                onClick={() => setStep(1)}
                className="mt-8 px-8 py-4 rounded-xl border-2 border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors inline-flex items-center gap-2"
              >
                Enviar Novo Caso
              </button>
              </div>
            </div>
          )}

          {/* Floating Help Badge */}
          <div className="absolute -bottom-5 -right-5 md:-right-8 md:bottom-8 bg-white border border-slate-200 shadow-xl rounded-2xl p-4 flex items-center gap-3 animate-bounce shadow-blue-500/10 z-10">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900">Precisa de ajuda?</p>
              <a href="#" className="text-sm text-blue-600 font-bold hover:underline">Fale no WhatsApp</a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default AffordanceFirst;
