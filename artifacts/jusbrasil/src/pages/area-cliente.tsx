import React, { useEffect, useState, useRef } from "react";
import { Layout } from "@/components/layout";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import {
  CheckCircle2,
  Clock,
  FileText,
  Upload,
  LogOut,
  Loader2,
  AlertCircle,
  Scale,
  Users,
} from "lucide-react";

interface CaseData {
  id: string;
  case_description: string;
  claim_value: number | null;
  full_name: string;
  whatsapp: string;
  email: string;
  state: string | null;
  city: string | null;
  created_at: string;
}

const TIMELINE_STEPS = [
  { label: "Caso Enviado", icon: <CheckCircle2 className="w-4 h-4" />, done: true },
  { label: "Pagamento", icon: <Clock className="w-4 h-4" />, done: false },
  { label: "Em Análise", icon: <FileText className="w-4 h-4" />, done: false },
  { label: "Advogado", icon: <Users className="w-4 h-4" />, done: false },
  { label: "Processo Aberto", icon: <Scale className="w-4 h-4" />, done: false },
];

export default function AreaClientePage() {
  const [, navigate] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingCase, setLoadingCase] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
      } else {
        setUser(session.user);
        setLoadingSession(false);
        fetchCase(session.user.email!);
      }
    });
  }, []);

  const fetchCase = async (email: string) => {
    setLoadingCase(true);
    const { data, error } = await supabase
      .from("cases")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    setLoadingCase(false);
    if (!error && data) setCaseData(data);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    setUploadError(null);

    const path = `${user.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage
      .from("case-documents")
      .upload(path, file, { upsert: false });

    setUploading(false);
    if (error) {
      setUploadError("Erro ao enviar arquivo. Tente novamente.");
    } else {
      setUploadedFiles((prev) => [...prev, file.name]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (loadingSession) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#425f8e]" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[80vh] bg-muted py-10 px-4">
        <div className="max-w-3xl mx-auto space-y-6">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-foreground">Minha Área</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-red-600 transition-colors font-medium"
            >
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-5">Status do Processo</h2>
            <div className="flex items-center gap-0">
              {TIMELINE_STEPS.map((step, i) => (
                <React.Fragment key={i}>
                  <div className="flex flex-col items-center flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 flex-shrink-0 ${step.done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                      {step.icon}
                    </div>
                    <span className={`text-[10px] font-semibold text-center leading-tight ${step.done ? "text-emerald-600" : "text-slate-400"}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < TIMELINE_STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 max-w-[40px] mb-6 ${step.done ? "bg-emerald-400" : "bg-slate-200"}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Case Info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Dados do Caso</h2>
            {loadingCase ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Buscando caso...
              </div>
            ) : caseData ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-0.5">Nome</p>
                  <p className="text-sm font-semibold">{caseData.full_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-0.5">Descrição do Caso</p>
                  <p className="text-sm text-foreground leading-relaxed">{caseData.case_description}</p>
                </div>
                {caseData.claim_value && caseData.claim_value > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-0.5">Valor Buscado</p>
                    <p className="text-sm font-semibold text-emerald-700">
                      R$ {caseData.claim_value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
                {(caseData.city || caseData.state) && (
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-0.5">Localização</p>
                    <p className="text-sm">{[caseData.city, caseData.state].filter(Boolean).join(", ")}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-0.5">Enviado em</p>
                  <p className="text-sm">{new Date(caseData.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum caso encontrado para este e-mail.</p>
            )}
          </div>

          {/* Document Upload */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Enviar Documentos</h2>
            <p className="text-sm text-muted-foreground mb-4">Envie comprovantes, prints ou qualquer documento relevante para o seu caso.</p>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-dashed border-slate-300 text-sm font-medium text-muted-foreground hover:border-[#425f8e] hover:text-[#425f8e] transition-all disabled:opacity-50 w-full justify-center"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? "Enviando..." : "Selecionar Arquivo"}
            </button>

            {uploadError && (
              <div className="flex items-center gap-2 mt-3 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {uploadError}
              </div>
            )}

            {uploadedFiles.length > 0 && (
              <ul className="mt-4 space-y-1.5">
                {uploadedFiles.map((name, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {name}
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
}
