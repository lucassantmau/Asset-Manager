import React, { useEffect, useState, useCallback } from "react";
import { Layout } from "@/components/layout";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import {
  Loader2,
  LogOut,
  Briefcase,
  Scale,
  UserCheck,
  ChevronDown,
  ChevronUp,
  MapPin,
  FileText,
} from "lucide-react";

type LawyerProfile = {
  id: string;
  full_name: string;
  oab: string;
  phone: string;
  registration_status: string;
  city: string | null;
  state: string | null;
};

type SubmissionRow = Record<string, unknown> & {
  id: string;
  autor_nome?: string | null;
  autor_email?: string | null;
  autor_telefone?: string | null;
  reu_nome?: string | null;
  valor_estimado?: string | null;
  tipo_causa?: string | null;
  pretensao?: string | null;
  descricao_fatos?: string | null;
  pedido_ref?: string | null;
  protocolo?: string | null;
  status?: string | null;
  created_at?: string;
  assigned_lawyer_id?: string | null;
  disponivel_para_advogados?: boolean | null;
};

function statusLabel(s: string) {
  const m: Record<string, string> = {
    pending: "Em análise",
    approved: "Aprovado",
    rejected: "Não aprovado",
  };
  return m[s] ?? s;
}

function caseRef(r: SubmissionRow) {
  const p = r.pedido_ref ?? r.protocolo;
  if (p != null && String(p).trim()) return String(p);
  return String(r.id).slice(0, 8).toUpperCase();
}

function formatDate(iso: string | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default function LawyerArea() {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<LawyerProfile | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [cases, setCases] = useState<SubmissionRow[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadCases = useCallback(async () => {
    setCasesLoading(true);
    setErrorMsg(null);
    const { data, error } = await supabase
      .from("pequenas_causas_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setErrorMsg(error.message);
      setCases([]);
    } else {
      setCases((data as SubmissionRow[]) ?? []);
    }
    setCasesLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/advogado/signin");
        return;
      }
      if (!mounted) return;
      setEmail(session.user.email ?? null);

      const role = session.user.user_metadata?.user_role;
      const { data: row, error } = await supabase
        .from("lawyer_profiles")
        .select("id, full_name, oab, phone, registration_status, city, state")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) console.warn("lawyer_profiles:", error);
      if (!mounted) return;

      if (row) setProfile(row as LawyerProfile);
      else if (role !== "lawyer") {
        navigate("/");
        return;
      }

      setLoading(false);
      if (row && (row as LawyerProfile).registration_status === "approved") {
        await loadCases();
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate("/advogado/signin");
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, loadCases]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/advogado/signin");
  };

  const claimCase = async (row: SubmissionRow) => {
    if (!profile?.id) return;
    setClaimingId(row.id);
    setErrorMsg(null);
    const { data, error } = await supabase
      .from("pequenas_causas_submissions")
      .update({
        assigned_lawyer_id: profile.id,
        status: "advogado_designado",
      })
      .eq("id", row.id)
      .is("assigned_lawyer_id", null)
      .select("id")
      .maybeSingle();

    setClaimingId(null);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    if (!data) {
      setErrorMsg("Este caso já foi atribuído a outro advogado. Atualize a lista.");
      await loadCases();
      return;
    }
    await loadCases();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-9 h-9 text-[#001532] animate-spin" />
      </div>
    );
  }

  const pool = cases.filter((c) => !c.assigned_lawyer_id);
  const mine = cases.filter((c) => c.assigned_lawyer_id === profile?.id);

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#001532] flex items-center justify-center">
                <Scale className="w-6 h-6 text-[#fee001]" />
              </div>
              <div>
                <h1 className="text-xl font-black text-[#001532]">Área do Advogado</h1>
                <p className="text-sm text-muted-foreground">
                  {profile?.full_name ?? "Advogado(a)"}
                  {email ? ` · ${email}` : ""}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>

          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm mb-8">
            <h2 className="text-sm font-bold text-[#001532] mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Seu cadastro
            </h2>
            {profile ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">OAB</dt>
                    <dd className="font-medium">{profile.oab}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">WhatsApp</dt>
                    <dd className="font-medium">{profile.phone}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Status do cadastro</dt>
                    <dd>
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-[#001532]">
                        {statusLabel(profile.registration_status)}
                      </span>
                    </dd>
                  </div>
                </dl>
                {profile.registration_status !== "approved" && (
                  <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 max-w-md">
                    Só advogados com cadastro <strong>aprovado</strong> veem a fila de casos. Peça à equipe para
                    aprovar seu perfil no painel (ou atualize <code className="text-xs">registration_status</code> no
                    Supabase para testes).
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Complete o cadastro em /advogado/signup. Se já concluiu, aplique as migrations SQL (tabela{" "}
                <span className="font-mono text-xs">lawyer_profiles</span>).
              </p>
            )}
          </div>

          {profile?.registration_status === "approved" && (
            <>
              {errorMsg && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3">
                  {errorMsg}
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#001532]">Casos para atendimento</h2>
                <button
                  type="button"
                  onClick={() => loadCases()}
                  disabled={casesLoading}
                  className="text-sm font-medium text-[#001532] underline disabled:opacity-50"
                >
                  {casesLoading ? "Atualizando…" : "Atualizar lista"}
                </button>
              </div>

              <section className="mb-10">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Disponíveis ({pool.length})
                </h3>
                {pool.length === 0 && !casesLoading ? (
                  <p className="text-sm text-muted-foreground border border-dashed rounded-xl p-6 text-center">
                    Nenhum caso novo na fila. Clientes aparecem aqui após enviarem o formulário completo na área
                    logada.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {pool.map((c) => (
                      <li key={c.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <p className="font-mono text-xs text-slate-500">{caseRef(c)}</p>
                            <p className="font-semibold text-[#001532]">{c.autor_nome ?? "Autor"}</p>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {c.pretensao ?? c.descricao_fatos ?? "—"}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">{formatDate(c.created_at as string)}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setExpandedId((x) => (x === c.id ? null : c.id))}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium"
                            >
                              {expandedId === c.id ? (
                                <>
                                  Ocultar <ChevronUp className="w-4 h-4" />
                                </>
                              ) : (
                                <>
                                  Ver detalhes <ChevronDown className="w-4 h-4" />
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              disabled={claimingId === c.id}
                              onClick={() => claimCase(c)}
                              className="inline-flex items-center gap-2 rounded-lg bg-[#001532] text-white px-4 py-2 text-sm font-bold disabled:opacity-50"
                            >
                              {claimingId === c.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <UserCheck className="w-4 h-4" />
                              )}
                              Assumir este caso
                            </button>
                          </div>
                        </div>
                        {expandedId === c.id && (
                          <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-4 text-sm space-y-3">
                            <SummaryBlock c={c} />
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Meus casos ({mine.length})
                </h3>
                {mine.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Você ainda não assumiu nenhum caso.</p>
                ) : (
                  <ul className="space-y-3">
                    {mine.map((c) => (
                      <li key={c.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="font-mono text-xs text-slate-500">{caseRef(c)}</p>
                        <p className="font-semibold text-[#001532]">{c.autor_nome}</p>
                        <p className="text-xs text-emerald-700 font-medium mt-1">Status: {c.status ?? "—"}</p>
                        <button
                          type="button"
                          onClick={() => setExpandedId((x) => (x === c.id ? null : c.id))}
                          className="text-sm text-[#001532] font-medium mt-2 underline"
                        >
                          {expandedId === c.id ? "Ocultar" : "Ver detalhes"}
                        </button>
                        {expandedId === c.id && (
                          <div className="mt-3 pt-3 border-t border-slate-100 text-sm space-y-3">
                            <SummaryBlock c={c} />
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

function SummaryBlock({ c }: { c: SubmissionRow }) {
  return (
    <>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <FileText className="w-3 h-3" /> Réu / reclamado
          </p>
          <p>{c.reu_nome ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500">Valor estimado</p>
          <p>{c.valor_estimado ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500">E-mail autor</p>
          <p className="break-all">{c.autor_email ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500">Telefone autor</p>
          <p>{c.autor_telefone ?? "—"}</p>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500">Pedido / pretensão</p>
        <p className="whitespace-pre-wrap">{c.pretensao ?? "—"}</p>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
          <MapPin className="w-3 h-3" /> Descrição dos fatos
        </p>
        <p className="whitespace-pre-wrap text-slate-700">{c.descricao_fatos ?? "—"}</p>
      </div>
      <p className="text-xs text-slate-500">
        URLs de arquivos estão em <span className="font-mono">arquivos_urls</span> (JSON). Abra cada link no
        navegador.
      </p>
    </>
  );
}
