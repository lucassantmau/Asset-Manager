import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import {
  LogOut,
  Upload,
  FileText,
  FolderOpen,
  User,
  ChevronDown,
  Plus,
  Pencil,
  Loader2,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";

const OAB_CONSULTA_URL =
  "https://www.oab.org.br/institucional/servicos/consulta-de-inscricoes";
const NOVO_CASO_KLIVO_URL = "https://go.klivopay.com.br/t45jsqe1qe";

/** Abre o checkout Klivo e dispara conversão Google Ads quando `gtag` existir. */
function openNovoCasoPaymentWithAdsConversion() {
  if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
    (window as any).gtag("event", "conversion", {
      send_to: "AW-16505818170/R7Z0CNvf_JYcELqYy749",
      value: 1.0,
      currency: "BRL",
    });
  }
  window.open(NOVO_CASO_KLIVO_URL, "_blank", "noopener,noreferrer");
}

type CaseRow = {
  id: string;
  autor_nome: string | null;
  autor_email: string | null;
  autor_telefone: string | null;
  tipo_causa: string | null;
  valor_estimado: string | null;
  reu_nome: string | null;
  status: string | null;
  protocolo: string | null;
  created_at: string;
  descricao_fatos?: string | null;
  pagamento_confirmado?: boolean | null;
  pedido_ref?: string | null;
  arquivos_urls?: Array<{ category: string; name: string; url: string; uploaded_at?: string }>;
  assigned_lawyer_id?: string | null;
  accepted_proposal_id?: string | null;
};

type ProposalRow = {
  id: string;
  submission_id: string;
  lawyer_id: string;
  fee_percentage: number | null;
  summary: string | null;
  terms: string | null;
  lawyer_name: string | null;
  lawyer_oab: string | null;
  lawyer_phone: string | null;
  status: string;
  created_at: string;
};

function normalizeEmail(e: string) {
  return e.trim().toLowerCase();
}

function formatCaseId(id: string) {
  const hex = id.replace(/-/g, "");
  if (hex.length >= 24) return hex.slice(0, 24);
  return hex;
}

function formatDisplayId(id: string) {
  const raw = formatCaseId(id);
  return raw.length >= 6 ? `#${raw.slice(-6).toUpperCase()}` : `#${raw.toUpperCase()}`;
}

function statusLabel(status: string | null | undefined) {
  const s = (status || "aguardando_analise").toLowerCase();
  const map: Record<string, string> = {
    aguardando_analise: "Aguardando análise",
    aguardando_propostas: "Aguardando propostas",
    com_propostas: "Propostas recebidas",
    proposta_aceita: "Proposta aceita",
    em_analise: "Em análise",
    advogado_designado: "Advogado designado",
    processo_aberto: "Processo aberto",
    concluido: "Concluído",
  };
  return map[s] || status || "—";
}

function formatDateBR(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return "—";
  }
}

export default function ClientArea() {
  const [, navigate] = useLocation();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userIdShort, setUserIdShort] = useState<string>("");
  const [rows, setRows] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [selectedCategory, setSelectedCategory] = useState("geral");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [proposalsByCase, setProposalsByCase] = useState<Record<string, ProposalRow[]>>({});
  const [acceptingProposalId, setAcceptingProposalId] = useState<string | null>(null);

  const primaryRow = rows[0] ?? null;
  const openFormulario = (id: string) => navigate(`/formulario?id=${encodeURIComponent(id)}`);

  const isIntakeComplete = (r: CaseRow) =>
    Boolean(String(r.autor_nome ?? "").trim() && String(r.descricao_fatos ?? "").trim());

  const historico = rows.filter(isIntakeComplete);
  const pendentes = rows.filter((r) => !isIntakeComplete(r));
  const hasCompletedCase = historico.length > 0;
  const hasOpenFormSlot = pendentes.length > 0 || !hasCompletedCase;

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      if (!mounted) return;
      const email = session.user.email ?? null;
      setUserEmail(email);
      const uid = session.user.id || "";
      setUserIdShort(uid ? `#${uid.replace(/-/g, "").slice(0, 6).toUpperCase()}` : "");
      if (email) await loadRows(email);
      setLoading(false);
    })();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate("/login");
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadRows = async (email: string) => {
    setListLoading(true);
    const em = normalizeEmail(email);
    const { data, error } = await supabase
      .from("pequenas_causas_submissions")
      .select("*")
      .eq("autor_email", em)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const list = data as CaseRow[];
      setRows(list);
      await loadProposalsForCases(list);
    }
    setListLoading(false);
  };

  const loadProposalsForCases = async (caseRows: CaseRow[]) => {
    const ids = caseRows.map((r) => r.id);
    if (ids.length === 0) {
      setProposalsByCase({});
      return;
    }
    const { data: proposals } = await supabase
      .from("pequenas_causas_proposals")
      .select("id, submission_id, lawyer_id, fee_percentage, summary, terms, lawyer_name, lawyer_oab, lawyer_phone, status, created_at")
      .in("submission_id", ids)
      .order("created_at", { ascending: true });

    const grouped: Record<string, ProposalRow[]> = {};
    (proposals as ProposalRow[] | null)?.forEach((p) => {
      if (!grouped[p.submission_id]) grouped[p.submission_id] = [];
      grouped[p.submission_id].push(p);
    });
    setProposalsByCase(grouped);
  };

  const acceptProposal = async (row: CaseRow, proposal: ProposalRow) => {
    if (!userEmail) return;
    setAcceptingProposalId(proposal.id);
    const { error: updateCaseErr } = await supabase
      .from("pequenas_causas_submissions")
      .update({
        assigned_lawyer_id: proposal.lawyer_id,
        accepted_proposal_id: proposal.id,
        status: "proposta_aceita",
      })
      .eq("id", row.id);
    if (updateCaseErr) {
      setUploadError(updateCaseErr.message);
      setAcceptingProposalId(null);
      return;
    }

    await supabase
      .from("pequenas_causas_proposals")
      .update({ status: "rejected" })
      .eq("submission_id", row.id)
      .neq("id", proposal.id);
    await supabase.from("pequenas_causas_proposals").update({ status: "accepted" }).eq("id", proposal.id);
    await loadRows(userEmail);
    setAcceptingProposalId(null);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleExtraUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userEmail || !primaryRow) return;
    setUploadError(null);
    setUploading(true);
    const emailKey = userEmail.replace("@", "_at_");
    const safeName = file.name.replace(/\s+/g, "_");
    const path = `${emailKey}/${selectedCategory}/${Date.now()}_${safeName}`;
    const { error: uploadErr } = await supabase.storage.from("case-documents").upload(path, file, { upsert: false });
    if (uploadErr) {
      setUploadError("Erro ao enviar arquivo.");
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    const { data: publicData } = supabase.storage.from("case-documents").getPublicUrl(path);
    const prev = Array.isArray(primaryRow.arquivos_urls) ? primaryRow.arquivos_urls : [];
    const newEntry = {
      category: selectedCategory,
      name: file.name,
      url: publicData.publicUrl,
      uploaded_at: new Date().toISOString(),
    };
    const updated = [...prev, newEntry];
    await supabase.from("pequenas_causas_submissions").update({ arquivos_urls: updated }).eq("id", primaryRow.id);
    await loadRows(userEmail);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-9 h-9 text-[#1e3a8a] animate-spin" />
      </div>
    );
  }

  const cardClass =
    "bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Meus Casos</h1>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 pl-2 pr-3 py-2 hover:bg-slate-100 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[#1e3a8a] flex items-center justify-center text-white">
                <User className="w-5 h-5" />
              </div>
              <div className="text-left hidden sm:block min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate max-w-[200px]">{userEmail}</p>
                <p className="text-xs text-slate-500">ID: {userIdShort}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg py-1 z-50">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Golpe / OAB */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex gap-3 items-start">
          <span className="text-amber-600 text-lg leading-none mt-0.5">⚠️</span>
          <div className="text-sm text-amber-950 leading-relaxed">
            <p className="font-semibold text-amber-900">Atenção: Cuidado com golpes!</p>
            <p className="text-amber-900/90 mt-1">
              Nunca realize pagamentos a pessoas que se identifiquem como advogados sem{" "}
              <a href={OAB_CONSULTA_URL} target="_blank" rel="noopener noreferrer" className="text-blue-700 font-semibold underline underline-offset-2">
                confirmar a identidade na OAB
              </a>
              .
            </p>
          </div>
        </div>

        {/* Histórico */}
        <section className={cardClass}>
          <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">Histórico de Processos</h2>
            <button
              type="button"
              onClick={() => {
                if (!hasOpenFormSlot) {
                  openNovoCasoPaymentWithAdsConversion();
                  return;
                }
                navigate("/formulario");
              }}
              className="inline-flex items-center gap-2 rounded-full bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {hasOpenFormSlot ? "Enviar meu formulário" : "Pagar R$ 19,99 para novo caso"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-100">
                  <th className="text-left font-semibold px-5 py-3">Protocolo</th>
                  <th className="text-left font-semibold px-3 py-3">Status</th>
                  <th className="text-left font-semibold px-3 py-3">Data</th>
                  <th className="text-left font-semibold px-3 py-3">Valor</th>
                  <th className="text-right font-semibold px-5 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {listLoading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-700" />
                    </td>
                  </tr>
                ) : historico.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center">
                      <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">Nenhum pedido encontrado</p>
                    </td>
                  </tr>
                ) : (
                  historico.map((r) => (
                    <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                      <td className="px-5 py-3 font-mono text-xs text-slate-800">{r.protocolo || "—"}</td>
                      <td className="px-3 py-3 text-slate-700">{statusLabel(r.status)}</td>
                      <td className="px-3 py-3 text-slate-600">{formatDateBR(r.created_at)}</td>
                      <td className="px-3 py-3 text-slate-700">
                        {r.valor_estimado ? `R$ ${r.valor_estimado}` : "—"}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <span className="text-[11px] text-emerald-700 font-semibold">
                            {(proposalsByCase[r.id] ?? []).length} proposta(s)
                          </span>
                          <button
                            type="button"
                            onClick={() => openFormulario(r.id)}
                            className="text-blue-700 font-semibold text-xs hover:underline"
                          >
                            Ver / Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Propostas recebidas */}
        {primaryRow && isIntakeComplete(primaryRow) && (
          <section className={cardClass}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">Propostas Recebidas</h2>
              <span className="text-xs font-semibold text-emerald-700">
                {(proposalsByCase[primaryRow.id] ?? []).length} proposta(s)
              </span>
            </div>
            <div className="p-5 space-y-3">
              {(proposalsByCase[primaryRow.id] ?? []).length === 0 ? (
                <p className="text-sm text-slate-500">
                  Seu caso está aguardando propostas dos advogados parceiros.
                </p>
              ) : (
                (proposalsByCase[primaryRow.id] ?? []).map((p) => {
                  const accepted = p.status === "accepted";
                  return (
                    <div key={p.id} className="rounded-xl border border-slate-200 p-4 bg-white">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {p.lawyer_name ?? "Advogado parceiro"}
                          </p>
                          <p className="text-xs text-slate-500">
                            OAB {p.lawyer_oab ?? "—"} · enviado em {formatDateBR(p.created_at)}
                          </p>
                        </div>
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {p.fee_percentage != null ? `${p.fee_percentage}% sobre o ganho` : "Proposta personalizada"}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-700">{p.summary ?? "—"}</p>
                      {p.terms && <p className="mt-1 text-xs text-slate-500">{p.terms}</p>}

                      {accepted ? (
                        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Proposta aceita. WhatsApp do advogado: <strong>{p.lawyer_phone ?? "—"}</strong>
                        </div>
                      ) : primaryRow.status === "proposta_aceita" ? (
                        <p className="mt-3 text-xs text-slate-500">Outra proposta já foi aceita para este caso.</p>
                      ) : (
                        <button
                          type="button"
                          disabled={acceptingProposalId === p.id}
                          onClick={() => acceptProposal(primaryRow, p)}
                          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#1e3a8a] text-white text-sm font-semibold px-4 py-2 disabled:opacity-60"
                        >
                          {acceptingProposalId === p.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          Aceitar proposta
                        </button>
                      )}
                    </div>
                  );
                })
              )}

              {primaryRow.status === "proposta_aceita" && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 flex items-center justify-between gap-3">
                  <span>Contato do advogado liberado. Fale diretamente para iniciar o atendimento.</span>
                  <a
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white px-3 py-2 text-xs font-semibold"
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`https://wa.me/${((proposalsByCase[primaryRow.id] ?? []).find((p) => p.status === "accepted")?.lawyer_phone ?? "").replace(/\D/g, "")}`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Falar no WhatsApp
                  </a>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Pendentes */}
        <section className={cardClass}>
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Formulários Pendentes</h2>
            <p className="text-sm text-slate-500 mt-1">Preencha o(s) formulário(s)</p>
          </div>
          <div className="p-4 sm:p-5 space-y-3">
            {!listLoading && rows.length === 0 && (
              <div className="rounded-lg border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
                Nenhum registro encontrado para este e-mail. Para abrir um novo caso, conclua o pagamento da taxa de
                R$ 19,99 com o mesmo e-mail da conta.
                <button
                  type="button"
                  className="block mt-2 text-blue-800 font-semibold underline"
                  onClick={() => openNovoCasoPaymentWithAdsConversion()}
                >
                  Ir para pagamento
                </button>
              </div>
            )}
            {pendentes.length === 0 && rows.length > 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">Nenhum formulário pendente.</p>
            ) : pendentes.length === 0 ? null : (
              pendentes.map((r, idx) => {
                const ref = r.pedido_ref || formatCaseId(r.id);
                const payHash = ref.length >= 6 ? ref.slice(-6).toLowerCase() : ref;
                return (
                  <div
                    key={r.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-700 rounded-l-xl" />
                    <div className="flex items-start gap-3 pl-3">
                      <div className="w-9 h-9 rounded-full bg-[#1e3a8a] text-white flex items-center justify-center text-sm font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">Pagamento #{payHash}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {ref}</p>
                      </div>
                    </div>
                    <div className="sm:ml-auto pl-3 sm:pl-0">
                      <button
                        type="button"
                        onClick={() => openFormulario(r.id)}
                        className="inline-flex items-center gap-2 rounded-full bg-[#1e3a8a] hover:bg-[#172554] text-white text-sm font-semibold px-5 py-2.5 w-full sm:w-auto justify-center transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                        Completar Formulário
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Upload complementar */}
        {primaryRow && isIntakeComplete(primaryRow) && (
          <section className={cardClass}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-700" />
              <h2 className="text-lg font-bold text-slate-900">Enviar documentos complementares</h2>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600">Inclua arquivos adicionais em PDF ou imagem.</p>
              {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Categoria</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="mt-1 block rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    {[
                      ["geral", "Geral"],
                      ["identidade", "Identidade"],
                      ["residencia", "Residência"],
                      ["prova", "Prova"],
                      ["contrato", "Contrato"],
                      ["nota_fiscal", "Nota Fiscal"],
                      ["outro", "Outro"],
                    ].map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleExtraUpload}
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-700 text-white text-sm font-semibold px-4 py-2 disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Selecionar arquivo
                </button>
              </div>
              {primaryRow.arquivos_urls && primaryRow.arquivos_urls.length > 0 && (
                <ul className="divide-y divide-slate-100 border border-slate-100 rounded-lg max-h-48 overflow-y-auto">
                  {primaryRow.arquivos_urls.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 px-3 py-2 text-sm">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 truncate hover:underline">
                        {f.name}
                      </a>
                      <span className="text-xs text-slate-400 ml-auto shrink-0">{f.category}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
