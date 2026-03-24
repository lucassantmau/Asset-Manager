import { Clock, ShieldCheck, Circle, ArrowRight } from "lucide-react";

export default function OptionC() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-start justify-center p-8">
      <div className="w-full max-w-lg bg-white rounded-xl border-4 border-[#e5e7eb] shadow-xl overflow-hidden">

        {/* OPTION C — Soft green benefit block */}
        <div className="bg-emerald-50 border-b-4 border-emerald-200 px-6 py-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#111]">Conte o que aconteceu</h3>
            <span className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-sm">
              <Clock className="w-3.5 h-3.5" /> Triagem gratuita
            </span>
          </div>
          <p className="text-emerald-700 text-sm mt-1.5">Avaliamos seu caso sem custo. Leva apenas 2 minutos.</p>
        </div>

        {/* Form body */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-[#111] mb-1">Descreva o seu problema *</label>
            <p className="text-xs text-[#666] mb-2">Detalhe os fatos para que o advogado entenda sua situação.</p>
            <textarea
              className="w-full bg-white border-[3px] border-slate-300 rounded-xl p-4 text-[#111] placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 min-h-[130px] resize-y text-base"
              placeholder="Ex: Comprei uma passagem e meu voo foi cancelado sem aviso prévio..."
            />
            <p className="text-xs text-slate-400 mt-1 text-right">0 / 2000</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#111] mb-2">Quais provas você tem? <span className="font-normal text-slate-400">(opcional)</span></label>
            <div className="flex flex-wrap gap-2">
              {["Conversas (WhatsApp)", "Áudios / Gravações", "Fotos / Vídeos", "E-mails"].map(ev => (
                <button key={ev} type="button" className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border-2 border-slate-200 bg-white text-slate-500">
                  <Circle className="w-4 h-4" /> {ev}
                </button>
              ))}
            </div>
          </div>

          <button className="w-full py-4 rounded-xl bg-[hsl(214,82%,46%)] text-white font-bold text-base shadow-[0_6px_0_0_hsl(214,82%,36%)] hover:shadow-[0_3px_0_0_hsl(214,82%,36%)] hover:translate-y-[3px] transition-all flex justify-center items-center gap-2">
            Continuar para Meus Dados <ArrowRight className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-center gap-6 text-sm text-[#666] border-t-2 border-[#e5e7eb] pt-4">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[hsl(214,82%,46%)]" /> Dados Protegidos</span>
            <span className="flex items-center gap-1.5">✦ +3.000 Casos</span>
          </div>
        </div>
      </div>
    </div>
  );
}
