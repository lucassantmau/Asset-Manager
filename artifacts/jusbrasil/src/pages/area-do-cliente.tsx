/**
 * area-do-cliente.tsx
 * Portal do cliente — requer autenticação via Supabase Auth.
 * Mostra status do caso e permite upload de documentos.
 */

import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { createClient } from "@supabase/supabase-js";

// ── Supabase ──────────────────────────────────────────────────
const SUPABASE_URL = "https://ollfczufqavxzgvktvkb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sbGZjenVmcWF2eHpndmt0dmtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNjA2ODUsImV4cCI6MjA4OTkzNjY4NX0.wVEYoQv8epExO-WSCihojxt3Ti3pQkBjmvdCiV_fiKo";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Design tokens ─────────────────────────────────────────────
const C = {
  bg: "#f1f5f9",
  card: "#ffffff",
  accent: "#1e40af",
  accentLight: "#3b82f6",
  text: "#0f172a",
  textMuted: "#64748b",
  border: "#e2e8f0",
  borderFocus: "#3b82f6",
  error: "#dc2626",
  errorBg: "rgba(220,38,38,0.06)",
  success: "#16a34a",
  successBg: "rgba(22,163,74,0.08)",
  warn: "#d97706",
  warnBg: "rgba(217,119,6,0.08)",
};

// ── Status pipeline ───────────────────────────────────────────
const STATUS_STEPS = [
  { key: "aguardando_analise", label: "Aguardando Análise" },
  { key: "em_analise",         label: "Em Análise" },
  { key: "advogado_designado", label: "Advogado Designado" },
  { key: "processo_aberto",    label: "Processo Aberto" },
  { key: "concluido",          label: "Concluído" },
];

function stepIndex(status: string) {
  return STATUS_STEPS.findIndex((s) => s.key === status);
}

// ── File icons ────────────────────────────────────────────────
function fileIcon(type: string) {
  if (type.includes("pdf")) return "📄";
  if (type.includes("image")) return "🖼️";
  return "📎";
}

// ── Upload progress state ─────────────────────────────────────
interface UploadItem {
  file: File;
  category: string;
  progress: number; // 0–100
  done: boolean;
  error: string;
  url: string;
}

export default function AreaDoCliente() {
  const [, navigate] = useLocation();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Dados do caso
  const [caseData, setCaseData] = useState<any>(null);
  const [caseLoading, setCaseLoading] = useState(false);

  // Upload
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState("geral");

  // ── Auth check ────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate("/login");
      } else {
        setUserEmail(data.session.user.email ?? null);
        setAuthLoading(false);
        loadCase(data.session.user.email ?? "");
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/login");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // ── Load case ─────────────────────────────────────────────
  async function loadCase(email: string) {
    setCaseLoading(true);
    const { data } = await supabase
      .from("pequenas_causas_submissions")
      .select("*")
      .eq("autor_email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setCaseData(data);
    setCaseLoading(false);
  }

  // ── Upload files ──────────────────────────────────────────
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(e.target.files || []);
    if (!chosen.length) return;
    const items: UploadItem[] = chosen.map((f) => ({
      file: f,
      category,
      progress: 0,
      done: false,
      error: "",
      url: "",
    }));
    setUploads((prev) => [...prev, ...items]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeUpload(idx: number) {
    setUploads((prev) => prev.filter((_, i) => i !== idx));
  }

  async function submitUploads() {
    if (!userEmail) return;
    const pending = uploads.filter((u) => !u.done && !u.error);
    if (!pending.length) return;

    setUploading(true);
    setUploadSuccess(false);

    for (let i = 0; i < uploads.length; i++) {
      const item = uploads[i];
      if (item.done || item.error) continue;

      const safeName = item.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${userEmail.replace("@", "_at_")}/${item.category}/${Date.now()}_${safeName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("case-documents")
        .upload(path, item.file, { upsert: true });

      setUploads((prev) =>
        prev.map((u, idx) => {
          if (idx !== i) return u;
          if (error) return { ...u, error: error.message, progress: 0 };
          const { data: urlData } = supabase.storage.from("case-documents").getPublicUrl(data.path);
          return { ...u, done: true, progress: 100, url: urlData.publicUrl };
        })
      );
    }

    // Register uploads in DB
    const successItems = uploads.filter((u) => u.done);
    if (successItems.length > 0 && caseData) {
      const existing = Array.isArray(caseData.arquivos_urls) ? caseData.arquivos_urls : [];
      const newEntries = successItems.map((u) => ({
        category: u.category,
        name: u.file.name,
        url: u.url,
        uploaded_at: new Date().toISOString(),
      }));
      await supabase
        .from("pequenas_causas_submissions")
        .update({ arquivos_urls: [...existing, ...newEntries] })
        .eq("id", caseData.id);

      // Refresh case data
      loadCase(userEmail);
    }

    setUploading(false);
    setUploadSuccess(true);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  // ── Loading ───────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: C.textMuted, fontSize: 15 }}>Verificando sessão...</div>
      </div>
    );
  }

  const currentStatus = caseData?.status ?? "";
  const currentStep = stepIndex(currentStatus);
  const uploadedFiles: any[] = Array.isArray(caseData?.arquivos_urls) ? caseData.arquivos_urls : [];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* Top bar */}
      <div style={{ background: "#0f172a", padding: "0 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 17, letterSpacing: "-0.5px" }}>
            Pequenas <span style={{ color: C.accentLight }}>Causas</span>
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ color: "#94a3b8", fontSize: 13 }}>{userEmail}</span>
            <button
              onClick={() => navigate("/client-area")}
              style={{
                background: "rgba(59,130,246,0.18)", border: "1px solid rgba(59,130,246,0.3)",
                borderRadius: 8, padding: "6px 14px", color: "#93c5fd",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              📝 Meu Formulário
            </button>
            <button
              onClick={handleLogout}
              style={{
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8, padding: "6px 14px", color: "#cbd5e1",
                fontSize: 13, cursor: "pointer",
              }}
            >
              Sair
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: "0 0 6px" }}>
            Portal do Cliente
          </h1>
          <p style={{ color: C.textMuted, fontSize: 14, margin: 0 }}>
            Acompanhe seu processo e envie documentos adicionais.
          </p>
        </div>

        {caseLoading && (
          <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>
            Carregando informações do caso...
          </div>
        )}

        {!caseLoading && !caseData && (
          <div style={{
            background: C.card, borderRadius: 14, padding: 32,
            border: `1px solid ${C.border}`, textAlign: "center", marginBottom: 24,
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>
              Nenhum processo encontrado
            </h2>
            <p style={{ color: C.textMuted, fontSize: 14, lineHeight: 1.6 }}>
              Não encontramos um processo vinculado ao e-mail{" "}
              <strong>{userEmail}</strong>.<br />
              Se você preencheu o formulário com outro e-mail, entre em contato com nossa equipe.
            </p>
            <button
              onClick={() => navigate("/client-area")}
              style={{
                display: "inline-block", marginTop: 20, padding: "10px 24px",
                background: C.accent, color: "#fff", borderRadius: 8,
                fontSize: 14, fontWeight: 600, cursor: "pointer", border: "none",
              }}
            >
              📝 Preencher formulário do caso
            </button>
          </div>
        )}

        {caseData && (
          <>
            {/* Banner de acesso ao formulário */}
            <div style={{
              background: "rgba(30,64,175,0.06)", border: "1px solid rgba(30,64,175,0.15)",
              borderRadius: 12, padding: "14px 20px", marginBottom: 20,
              display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
            }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.accent }}>
                  📝 Formulário do caso
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: C.textMuted }}>
                  Preencha ou atualize os dados dos autores, réus e documentos do seu processo.
                </p>
              </div>
              <button
                onClick={() => navigate("/client-area")}
                style={{
                  padding: "8px 20px", borderRadius: 8, border: "none",
                  background: C.accent, color: "#fff", fontSize: 13,
                  fontWeight: 700, cursor: "pointer", flexShrink: 0,
                }}
              >
                Abrir formulário →
              </button>
            </div>

            {/* Status do Processo */}
            <div style={{
              background: C.card, borderRadius: 14, padding: "24px 28px",
              border: `1px solid ${C.border}`, marginBottom: 20,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>
                    Protocolo
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 800, color: C.accent, letterSpacing: 1 }}>
                    {caseData.protocol || "—"}
                  </p>
                </div>
                <span style={{
                  padding: "5px 14px", borderRadius: 20,
                  background: currentStep >= 0 ? "rgba(30,64,175,0.1)" : "rgba(100,116,139,0.1)",
                  color: currentStep >= 0 ? C.accent : C.textMuted,
                  fontSize: 12, fontWeight: 700,
                }}>
                  {STATUS_STEPS[currentStep]?.label ?? "Aguardando Análise"}
                </span>
              </div>

              {/* Progress bar steps */}
              <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                {STATUS_STEPS.map((step, i) => {
                  const done = i <= currentStep;
                  const active = i === currentStep;
                  return (
                    <div key={step.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                        {i > 0 && (
                          <div style={{
                            flex: 1, height: 3,
                            background: done ? C.accent : C.border,
                          }} />
                        )}
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                          background: done ? C.accent : C.border,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          border: active ? `3px solid ${C.accentLight}` : "none",
                          color: done ? "#fff" : C.textMuted,
                          fontSize: 11, fontWeight: 700,
                        }}>
                          {done && i < currentStep ? "✓" : i + 1}
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div style={{
                            flex: 1, height: 3,
                            background: i < currentStep ? C.accent : C.border,
                          }} />
                        )}
                      </div>
                      <p style={{
                        fontSize: 10, color: done ? C.accent : C.textMuted,
                        fontWeight: done ? 700 : 400, marginTop: 6, textAlign: "center",
                        lineHeight: 1.3,
                      }}>
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Informações do caso */}
            <div style={{
              background: C.card, borderRadius: 14, padding: "24px 28px",
              border: `1px solid ${C.border}`, marginBottom: 20,
            }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16, marginTop: 0 }}>
                📋 Dados do Caso
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px 20px" }}>
                {[
                  { label: "Autor", value: caseData.autor_nome },
                  { label: "CPF", value: caseData.autor_cpf },
                  { label: "E-mail", value: caseData.autor_email },
                  { label: "Telefone", value: caseData.autor_telefone },
                  { label: "Tipo de Causa", value: caseData.tipo_causa },
                  { label: "Valor Estimado", value: caseData.valor_estimado ? `R$ ${caseData.valor_estimado}` : "—" },
                  { label: "Réu", value: caseData.reu_nome },
                ].filter((f) => f.value).map((field) => (
                  <div key={field.label}>
                    <p style={{ margin: 0, fontSize: 11, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {field.label}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: C.text, fontWeight: 500 }}>
                      {field.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Upload de documentos */}
            <div style={{
              background: C.card, borderRadius: 14, padding: "24px 28px",
              border: `1px solid ${C.border}`, marginBottom: 20,
            }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6, marginTop: 0 }}>
                📁 Enviar Documentos
              </h2>
              <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 20, marginTop: 0 }}>
                Adicione documentos, provas ou arquivos relacionados ao seu caso.
              </p>

              {/* Categoria */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>
                  Categoria do documento
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`,
                    fontSize: 13, color: C.text, background: "#fff", outline: "none", cursor: "pointer",
                  }}
                >
                  <option value="geral">Geral</option>
                  <option value="identidade">Documento de Identidade</option>
                  <option value="residencia">Comprovante de Residência</option>
                  <option value="prova">Prova / Evidência</option>
                  <option value="contrato">Contrato</option>
                  <option value="nota_fiscal">Nota Fiscal / Recibo</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${C.border}`, borderRadius: 12,
                  padding: "28px 20px", textAlign: "center",
                  cursor: "pointer", transition: "border-color 0.15s",
                  marginBottom: 16,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.accentLight)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />
                <div style={{ fontSize: 32, marginBottom: 8 }}>📤</div>
                <p style={{ margin: 0, fontWeight: 600, color: C.text, fontSize: 14 }}>
                  Clique para selecionar arquivos
                </p>
                <p style={{ margin: "4px 0 0", color: C.textMuted, fontSize: 12 }}>
                  PDF, JPG, PNG, DOCX · máx. 10 MB por arquivo
                </p>
              </div>

              {/* Files queued */}
              {uploads.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  {uploads.map((item, idx) => (
                    <div key={idx} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "8px 12px", borderRadius: 8,
                      background: item.done ? C.successBg : item.error ? C.errorBg : "#f8fafc",
                      border: `1px solid ${item.done ? "rgba(22,163,74,0.2)" : item.error ? "rgba(220,38,38,0.2)" : C.border}`,
                      marginBottom: 6,
                    }}>
                      <span style={{ fontSize: 18 }}>{fileIcon(item.file.type)}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, color: C.text, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {item.file.name}
                        </p>
                        {item.error && (
                          <p style={{ margin: 0, fontSize: 11, color: C.error }}>Erro: {item.error}</p>
                        )}
                        {item.done && (
                          <p style={{ margin: 0, fontSize: 11, color: C.success }}>✓ Enviado</p>
                        )}
                      </div>
                      <span style={{ fontSize: 11, color: C.textMuted, flexShrink: 0 }}>
                        {item.category}
                      </span>
                      {!item.done && (
                        <button
                          onClick={() => removeUpload(idx)}
                          style={{ background: "none", border: "none", color: C.error, cursor: "pointer", fontSize: 16, padding: 0 }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {uploadSuccess && (
                <div style={{
                  background: C.successBg, border: "1px solid rgba(22,163,74,0.25)",
                  borderRadius: 8, padding: "10px 14px", marginBottom: 12,
                }}>
                  <p style={{ margin: 0, color: C.success, fontSize: 13, fontWeight: 600 }}>
                    ✅ Documentos enviados com sucesso!
                  </p>
                </div>
              )}

              <button
                onClick={submitUploads}
                disabled={uploading || uploads.filter((u) => !u.done && !u.error).length === 0}
                style={{
                  padding: "11px 24px", borderRadius: 9, border: "none",
                  background: C.accent, color: "#fff", fontSize: 14, fontWeight: 700,
                  cursor: uploading ? "not-allowed" : "pointer",
                  opacity: (uploading || uploads.filter((u) => !u.done && !u.error).length === 0) ? 0.5 : 1,
                }}
              >
                {uploading ? "Enviando..." : "Enviar documentos"}
              </button>
            </div>

            {/* Documentos já enviados */}
            {uploadedFiles.length > 0 && (
              <div style={{
                background: C.card, borderRadius: 14, padding: "24px 28px",
                border: `1px solid ${C.border}`,
              }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16, marginTop: 0 }}>
                  ✅ Documentos Enviados ({uploadedFiles.length})
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {uploadedFiles.map((f: any, i: number) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                      background: "#f8fafc", borderRadius: 8, border: `1px solid ${C.border}`,
                    }}>
                      <span style={{ fontSize: 20 }}>📄</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, color: C.text, fontWeight: 500 }}>
                          {f.name || f.path || "Documento"}
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: C.textMuted }}>
                          {f.category || "geral"}
                          {f.uploaded_at && ` · ${new Date(f.uploaded_at).toLocaleDateString("pt-BR")}`}
                        </p>
                      </div>
                      {f.url && (
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: 12, color: C.accentLight, fontWeight: 600, textDecoration: "none" }}
                        >
                          Ver
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @media (max-width: 600px) {
          div[style*="grid-template-columns"] { grid-template-columns: 1fr 1fr !important; }
        }
        button:hover { opacity: 0.88 !important; }
      `}</style>
    </div>
  );
}
