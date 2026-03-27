import React, { useEffect, useState, useRef } from "react";
import { Layout } from "@/components/layout";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle2, Clock, FileText, Upload, LogOut,
  Loader2, AlertCircle, Scale, Users, ChevronRight, ChevronLeft,
  MessageSquare, Mic, Image as ImageIcon, File, User, MapPin, Phone
} from "lucide-react";

interface ClientSession { email: string; name: string; uuid: string; }
interface CaseData {
  id: string; case_description: string; claim_value: number | null;
  full_name: string; whatsapp: string; email: string;
  state: string | null; city: string | null; created_at: string;
}

const TIMELINE_STEPS = [
  { label: "Caso Enviado",   icon: <CheckCircle2 className="w-4 h-4" />, done: true },
  { label: "Pagamento",      icon: <Clock        className="w-4 h-4" />, done: false },
  { label: "Em Análise",     icon: <FileText     className="w-4 h-4" />, done: false },
  { label: "Advogado",       icon: <Users        className="w-4 h-4" />, done: false },
  { label: "Processo Aberto",icon: <Scale        className="w-4 h-4" />, done: false },
];

const EVIDENCE_OPTIONS = [
  { id: 'whatsapp', label: 'Conversas (WhatsApp)', icon: <MessageSquare className="w-5 h-5" /> },
  { id: 'audio', label: 'Áudios / Gravações', icon: <Mic className="w-5 h-5" /> },
  { id: 'media', label: 'Fotos / Vídeos', icon: <ImageIcon className="w-5 h-5" /> },
  { id: 'email', label: 'E-mails', icon: <File className="w-5 h-5" /> },
  { id: 'witness', label: 'Testemunhas', icon: <Users className="w-5 h-5" /> },
  { id: 'receipt', label: 'Comprovantes', icon: <FileText className="w-5 h-5" /> },
  { id: 'contract', label: 'Contrato / Documentos', icon: <File className="w-5 h-5" /> },
  { id: 'protocol', label: 'Protocolos de Atendimento', icon: <FileText className="w-5 h-5" /> },
  { id: 'police', label: 'Boletim de Ocorrência', icon: <AlertCircle className="w-5 h-5" /> },
  { id: 'other', label: 'Outros', icon: <File className="w-5 h-5" /> },
];

export default function AreaClientePage() {
  const [, navigate] = useLocation();
  const [session, setSession] = useState<ClientSession | null>(null);
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingCase, setLoadingCase] = useState(false);
  const [step, setStep] = useState(1);
  
  const [description, setDescription] = useState("");
  const [selectedEvidences, setSelectedEvidences] = useState<string[]>([]);
  const [claimValue, setClaimValue] = useState("");
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("client_session");
    if (!stored) { navigate("/login"); return; }
    try {
      const parsed = JSON.parse(stored);
      setSession(parsed);
      setEmail(parsed.email);
      setFullName(parsed.name || "");
      setLoadingSession(false);
      fetchCase(parsed.email);
    } catch { navigate("/login"); }
  }, []);

  const fetchCase = async (email) => {
    setLoadingCase(true);
    const { data, error } = await supabase
      .from("cases").select("*").eq("email", email)
      .order("created_at", { ascending: false }).limit(1).single();
    setLoadingCase(false);
    if (!error && data) {
      setCaseData(data);
      setDescription(data.case_description || "");
      setClaimValue(data.claim_value?.toString() || "");
      setFullName(data.full_name || "");
      setWhatsapp(data.whatsapp || "");
      setState(data.state || "");
      setCity(data.city || "");
    }
  };

  const handleSignOut = () => { localStorage.removeItem("client_session"); navigate("/login"); };

  const toggleEvidence = (id) => {
    setSelectedEvidences(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !session) return;
    setUploading(true); setUploadError(null);
    const path = `${session.uuid}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("case-documents").upload(path, file, { upsert: false });
    setUploading(false);
    if (error) { setUploadError("Erro ao enviar arquivo. Tente novamente."); }
  };

  const handleSaveCase = async () => {
    if (!session) return;
    setLoadingCase(true);
    const payload = {
      case_description: description,
      claim_value: claimValue ? parseFloat(claimValue.replace(',', '.')) : null,
      full_name: fullName,
      whatsapp: whatsapp,
      email: email,
      state: state,
      city: city,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from("cases")
      .upsert({ ...payload, email: session.email });

    setLoadingCase(false);
    if (!error) {
      alert("Caso registrado com sucesso!");
      fetchCase(session.email);
    } else {
      alert("Erro ao salvar o caso.");
    }
  };

  if (loadingSession) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Área do Cliente</h1>
            <p className="text-gray-600">Olá, {session?.name}</p>
          </div>
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex justify-between items-center relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0" />
            {TIMELINE_STEPS.map((s, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${s.done ? 'bg-primary text-white' : 'bg-white border-2 border-gray-200 text-gray-400'}`}>
                  {s.icon}
                </div>
                <span className="text-xs font-medium text-gray-500">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-primary/5 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">
                {step === 1 && "Conte o que aconteceu"}
                {step === 2 && "Provas e Valores"}
                {step === 3 && "Seus dados"}
              </h2>
              <p className="text-xs text-gray-500">Etapa {step} de 3</p>
            </div>
          </div>

          <div className="p-6">
            {step === 1 && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Descreva o que aconteceu *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Exemplo: comprei um produto que nunca chegou. Quero saber se posso pedir o reembolso e indenização por danos morais no Juizado Especial."
                  className="w-full h-48 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                />
                <p className="text-xs text-gray-400 text-right">{description.length}/2000</p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">Quais evidências você possui? (opcional)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {EVIDENCE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => toggleEvidence(opt.id)}
                        className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                          selectedEvidences.includes(opt.id) 
                          ? 'border-primary bg-primary/5 text-primary shadow-sm' 
                          : 'border-gray-100 hover:border-gray-200 text-gray-600'
                        }`}
                      >
                        {opt.icon}
                        <span className="text-sm font-medium">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-50">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Qual o valor que você busca? (opcional)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">R$</span>
                    <input
                      type="text"
                      value={claimValue}
                      onChange={(e) => setClaimValue(e.target.value)}
                      placeholder="0,00"
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Valor de reembolso, indenização por danos morais ou materiais, etc.</p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <User className="w-4 h-4 text-gray-400" /> Nome completo *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Digite seu nome completo"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Phone className="w-4 h-4 text-gray-400" /> WhatsApp *
                  </label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FileText className="w-4 h-4 text-gray-400" /> E-mail *
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <MapPin className="w-4 h-4 text-gray-400" /> Estado
                    </label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="UF"
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Sua cidade"
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                  </div>
                </div>
                <div className="md:col-span-2 flex items-start gap-3 pt-4">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600">
                    Ao enviar o formulário, você aceita os <a href="#" className="text-primary hover:underline">Termos de Uso</a> e <a href="#" className="text-primary hover:underline">Política de Privacidade</a>
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 text-gray-600 font-medium hover:text-gray-900 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" /> Voltar
              </button>
            ) : <div />}

            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && description.length < 20}
                className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20"
              >
                Continuar <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSaveCase}
                disabled={!termsAccepted || loadingCase}
                className="flex items-center gap-2 bg-primary text-white px-8 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20"
              >
                {loadingCase ? <Loader2 className="w-5 h-5 animate-spin" /> : "Registrar caso"}
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" /> Enviar Documentos
            </h3>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Selecionar arquivo
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4">Envie fotos, PDFs ou áudios que comprovem o seu caso.</p>
          {uploadError && <p className="text-sm text-red-500 mb-4">{uploadError}</p>}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 border border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-sm italic">
              Nenhum arquivo enviado ainda
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}