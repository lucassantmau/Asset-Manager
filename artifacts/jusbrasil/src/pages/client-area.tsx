import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { createClient } from "@supabase/supabase-js";
import {
  LogOut,
  CheckCircle2,
  Circle,
  Upload,
  FileText,
  AlertCircle,
  User,
  Phone,
  Mail,
  Scale,
  DollarSign,
  UserX,
  Loader2,
  X,
} from "lucide-react";

const SUPABASE_URL = "https://ollfczufqavxzgvktvkb.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sbGZjenVmcWF2eHpndmt0dmtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNjA2ODUsImV4cCI6MjA4OTkzNjY4NX0.wVEYoQv8epExO-WSCihojxt3Ti3pQkBjmvdCiV_fiKo";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PIPELINE_STEPS = [
  { key: "aguardando_analise", label: "Aguardando Análise" },
  { key: "em_analise", label: "Em Análise" },
  { key: "advogado_designado", label: "Advogado Designado" },
  { key: "processo_aberto", label: "Processo Aberto" },
  { key: "concluido", label: "Concluído" },
];

const STATUS_INDEX: Record<string, number> = {
  aguardando_analise: 0,
  em_analise: 1,
  advogado_designado: 2,
  processo_aberto: 3,
  concluido: 4,
};

const CATEGORIES = [
  { value: "geral", label: "Geral" },
  { value: "identidade", label: "Identidade" },
  { value: "residencia", label: "Residência" },
  { value: "prova", label: "Prova" },
  { value: "contrato", label: "Contrato" },
  { value: "nota_fiscal", label: "Nota Fiscal" },
  { value: "outro", label: "Outro" },
];

type CaseData = {
  id: string;
  autor_nome: string;
  autor_cpf: string;
  autor_email: string;
  autor_telefone: string;
  tipo_causa: string;
  valor_estimado: string;
  reu_nome: string;
  status: string;
  protocolo: string;
  created_at: string;
  arquivos_urls: Array<{ category: string; name: string; url: string; uploaded_at: string }>;
};

type UploadingFile = {
  id: string;
  name: string;
  progress: "uploading" | "done" | "error";
  error?: string;
};

export default function ClientArea() {
  const [, navigate] = useLocation();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [caseLoading, setCaseLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("geral");
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<CaseData["arquivos_urls"]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      if (!mounted) return;
      const email = session.user.email ?? null;
      setUserEmail(email);
      if (email) await loadCase(email);
      setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/login");
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadCase = async (email: string) => {
    setCaseLoading(true);
    const { data, error } = await supabase
      .from("pequenas_causas_submissions")
      .select("*")
      .eq("autor_email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setCaseData(data as CaseData);
      setUploadedFiles(data.arquivos_urls ?? []);
    }
    setCaseLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !userEmail || !caseData) return;
    setUploadError(null);

    const emailKey = userEmail.replace("@", "_at_");

    for (const file of files) {
      const uid = crypto.randomUUID();
      const timestamp = Date.now();
      const safeName = file.name.replace(/\s+/g, "_");
      const path = `${emailKey}/${selectedCategory}/${timestamp}_${safeName}`;

      setUploadingFiles((prev) => [
        ...prev,
        { id: uid, name: file.name, progress: "uploading" },
      ]);

      const { error: uploadErr } = await supabase.storage
        .from("case-documents")
        .upload(path, file, { upsert: false });

      if (uploadErr) {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uid ? { ...f, progress: "error", error: uploadErr.message } : f
          )
        );
        continue;
      }

      const { data: publicData } = supabase.storage
        .from("case-documents")
        .getPublicUrl(path);

      const newEntry = {
        category: selectedCategory,
        name: file.name,
        url: publicData.publicUrl,
        uploaded_at: new Date().toISOString(),
      };

      const updatedFiles = [...uploadedFiles, newEntry];
      setUploadedFiles(updatedFiles);

      await supabase
        .from("pequenas_causas_submissions")
        .update({ arquivos_urls: updatedFiles })
        .eq("id", caseData.id);

      setUploadingFiles((prev) =>
        prev.map((f) => (f.id === uid ? { ...f, progress: "done" } : f))
      );
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const statusIndex = STATUS_INDEX[caseData?.status ?? "aguardando_analise"] ?? 0;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#032956,#001532)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="w-8 h-8 text-[#fee001] animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#032956 0%,#001532 100%)", fontFamily: "Inter,sans-serif" }}>
      {/* NAVBAR */}
      <nav style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.08)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: "#fee001", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Scale style={{ width: 18, height: 18, color: "#716300" }} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 15, color: "#fff", letterSpacing: "-0.02em" }}>
              Pequenas Causas Processos
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{userEmail}</span>
            <button
              onClick={handleSignOut}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              <LogOut style={{ width: 14, height: 14 }} />
              Sair
            </button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" }}>
        {/* HEADER */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", marginBottom: 6 }}>
            Área do Cliente
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
            Acompanhe o status do seu caso e envie documentos adicionais.
          </p>
        </div>

        {caseLoading ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <Loader2 className="w-8 h-8 text-[#fee001] animate-spin mx-auto" />
          </div>
        ) : !caseData ? (
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 40, textAlign: "center" }}>
            <AlertCircle style={{ width: 40, height: 40, color: "#fee001", margin: "0 auto 16px" }} />
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15 }}>
              Nenhum caso encontrado para este e-mail.
            </p>
          </div>
        ) : (
          <>
            {/* PIPELINE */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "32px 28px", marginBottom: 24 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 28 }}>
                Status do Processo
              </h2>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 0, overflowX: "auto" }}>
                {PIPELINE_STEPS.map((step, i) => {
                  const completed = i <= statusIndex;
                  const active = i === statusIndex;
                  return (
                    <React.Fragment key={step.key}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 100, flex: 1 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: "50%",
                          background: completed ? "#fee001" : "rgba(255,255,255,0.06)",
                          border: active ? "2px solid #fee001" : completed ? "none" : "1px solid rgba(255,255,255,0.15)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          boxShadow: active ? "0 0 16px rgba(254,224,1,0.4)" : "none",
                          transition: "all 0.3s",
                        }}>
                          {completed
                            ? <CheckCircle2 style={{ width: 20, height: 20, color: "#716300" }} />
                            : <Circle style={{ width: 20, height: 20, color: "rgba(255,255,255,0.2)" }} />}
                        </div>
                        <p style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: completed ? "#fee001" : "rgba(255,255,255,0.35)", textAlign: "center", marginTop: 10, lineHeight: 1.3 }}>
                          {step.label}
                        </p>
                      </div>
                      {i < PIPELINE_STEPS.length - 1 && (
                        <div style={{ flex: 1, height: 2, background: i < statusIndex ? "#fee001" : "rgba(255,255,255,0.08)", marginTop: 19, transition: "background 0.3s" }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* CASE INFO GRID */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "28px", marginBottom: 24 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 24 }}>
                Dados do Caso
              </h2>
              {caseData.protocolo && (
                <div style={{ background: "rgba(254,224,1,0.07)", border: "1px solid rgba(254,224,1,0.2)", borderRadius: 10, padding: "10px 16px", marginBottom: 20, display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "#fee001", fontWeight: 700 }}>Protocolo:</span>
                  <span style={{ fontSize: 13, color: "#fee001", fontWeight: 800, fontFamily: "monospace" }}>{caseData.protocolo}</span>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
                {[
                  { icon: <User style={{ width: 14, height: 14 }} />, label: "Nome do Autor", value: caseData.autor_nome },
                  { icon: <FileText style={{ width: 14, height: 14 }} />, label: "CPF", value: caseData.autor_cpf },
                  { icon: <Mail style={{ width: 14, height: 14 }} />, label: "E-mail", value: caseData.autor_email },
                  { icon: <Phone style={{ width: 14, height: 14 }} />, label: "Telefone", value: caseData.autor_telefone },
                  { icon: <Scale style={{ width: 14, height: 14 }} />, label: "Tipo de Causa", value: caseData.tipo_causa },
                  { icon: <DollarSign style={{ width: 14, height: 14 }} />, label: "Valor Estimado", value: caseData.valor_estimado },
                  { icon: <UserX style={{ width: 14, height: 14 }} />, label: "Nome do Réu", value: caseData.reu_nome },
                ].map((item, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, color: "rgba(255,255,255,0.4)" }}>
                      {item.icon}
                      <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{item.label}</span>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: item.value ? "#fff" : "rgba(255,255,255,0.25)" }}>
                      {item.value || "—"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* FILE UPLOAD */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "28px" }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                Enviar Documentos
              </h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 24 }}>
                Adicione arquivos complementares ao seu processo.
              </p>

              {uploadError && (
                <div style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.25)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#f87171" }}>
                  {uploadError}
                </div>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.45)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Categoria
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 14, cursor: "pointer", outline: "none" }}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value} style={{ background: "#032956" }}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#fee001", color: "#716300", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer" }}
                  >
                    <Upload style={{ width: 16, height: 16 }} />
                    Selecionar Arquivos
                  </label>
                </div>
              </div>

              {/* Uploading status */}
              {uploadingFiles.length > 0 && (
                <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                  {uploadingFiles.map((f) => (
                    <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "10px 14px" }}>
                      {f.progress === "uploading" && <Loader2 style={{ width: 14, height: 14, color: "#fee001" }} className="animate-spin" />}
                      {f.progress === "done" && <CheckCircle2 style={{ width: 14, height: 14, color: "#4ade80" }} />}
                      {f.progress === "error" && <X style={{ width: 14, height: 14, color: "#f87171" }} />}
                      <span style={{ fontSize: 13, color: f.progress === "error" ? "#f87171" : f.progress === "done" ? "#4ade80" : "rgba(255,255,255,0.7)" }}>
                        {f.name} {f.progress === "uploading" ? "— enviando…" : f.progress === "done" ? "— enviado!" : `— erro: ${f.error}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Uploaded files list */}
              {uploadedFiles.length > 0 && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                    Arquivos Enviados ({uploadedFiles.length})
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {uploadedFiles.map((f, i) => (
                      <a
                        key={i}
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "10px 14px", textDecoration: "none" }}
                      >
                        <FileText style={{ width: 14, height: 14, color: "#fee001", flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.06)", borderRadius: 6, padding: "2px 8px", flexShrink: 0 }}>{f.category}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
