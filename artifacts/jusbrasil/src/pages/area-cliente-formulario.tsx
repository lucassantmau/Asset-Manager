import React, { useState, useCallback, useRef, useEffect, ChangeEvent, DragEvent } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import {
  Check,
  ChevronLeft,
  FileText,
  Headphones,
  Home,
  Loader2,
  MapPin,
  User,
  Building2,
  CreditCard,
  Mail,
  Phone,
  Heart,
  Briefcase,
  Video,
  FileStack,
  Car,
  CloudUpload,
} from "lucide-react";

function maskCPF(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}
function maskCNPJ(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/(\d{4})(\d)/, "$1-$2");
}
function maskCpfCnpj(raw: string) {
  const d = raw.replace(/\D/g, "");
  if (d.length <= 11) return maskCPF(raw);
  return maskCNPJ(raw);
}
function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}
function maskCEP(v: string) {
  return v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
}
function maskCurrency(v: string) {
  const d = v.replace(/\D/g, "");
  if (!d) return "";
  const num = parseInt(d, 10) / 100;
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function digitsLen(v: string) {
  return v.replace(/\D/g, "").length;
}
function normalizeEmail(e: string) {
  return e.trim().toLowerCase();
}

/** Evita caracteres em protocolo que quebram o path do Storage ou geram chaves inválidas. */
function sanitizeStorageKeySegment(s: string) {
  const t = s.trim().replace(/[^a-zA-Z0-9._-]/g, "_");
  return t.slice(0, 200) || "protocolo";
}

function supabaseErrorMessage(err: unknown): string {
  if (err == null) return "Erro desconhecido.";
  if (typeof err === "object") {
    const o = err as {
      message?: string;
      statusCode?: string;
      code?: string;
      error?: string;
      details?: string;
      hint?: string;
    };
    const parts = [o.message, o.details, o.hint, o.code, o.statusCode, o.error].filter(
      (x): x is string => typeof x === "string" && x.length > 0,
    );
    if (parts.length) return parts.join(" — ");
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

async function fetchViaCEP(cep: string) {
  const c = cep.replace(/\D/g, "");
  if (c.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${c}/json/`);
    const d = await res.json();
    if (d.erro) return null;
    return d as { logradouro: string; bairro: string; localidade: string; uf: string };
  } catch {
    return null;
  }
}

type DbSubmission = Record<string, unknown>;

interface FormState {
  autorNome: string;
  autorDocumento: string;
  autorRG: string;
  autorEmail: string;
  autorTelefone: string;
  autorEstadoCivil: string;
  autorProfissao: string;
  autorCEP: string;
  autorRua: string;
  autorNumero: string;
  autorComplemento: string;
  autorBairro: string;
  autorCidade: string;
  autorEstado: string;
  reuNome: string;
  reuDocumento: string;
  reuRG: string;
  reuTelefone: string;
  reuTelefone2: string;
  reuEmail: string;
  reuCEP: string;
  reuRua: string;
  reuNumero: string;
  reuComplemento: string;
  reuBairro: string;
  reuCidade: string;
  reuEstado: string;
  valorEstimado: string;
  descricaoFatos: string;
  pretensao: string;
  incluirTestemunhas: boolean;
  envolveVeiculo: boolean;
}

const FORM0: FormState = {
  autorNome: "",
  autorDocumento: "",
  autorRG: "",
  autorEmail: "",
  autorTelefone: "",
  autorEstadoCivil: "",
  autorProfissao: "",
  autorCEP: "",
  autorRua: "",
  autorNumero: "",
  autorComplemento: "",
  autorBairro: "",
  autorCidade: "",
  autorEstado: "",
  reuNome: "",
  reuDocumento: "",
  reuRG: "",
  reuTelefone: "",
  reuTelefone2: "",
  reuEmail: "",
  reuCEP: "",
  reuRua: "",
  reuNumero: "",
  reuComplemento: "",
  reuBairro: "",
  reuCidade: "",
  reuEstado: "",
  valorEstimado: "",
  descricaoFatos: "",
  pretensao: "",
  incluirTestemunhas: false,
  envolveVeiculo: false,
};

function parseStoredLinks(v: unknown): string[] {
  if (v == null) return [""];
  if (Array.isArray(v)) {
    const a = v.map(String).filter(Boolean);
    return a.length ? [...a, ""] : [""];
  }
  const s = String(v).trim();
  if (!s) return [""];
  try {
    const j = JSON.parse(s);
    if (Array.isArray(j)) {
      const a = j.map(String).filter(Boolean);
      return a.length ? [...a, ""] : [""];
    }
  } catch {
    /* ignore */
  }
  const lines = s.split(/\n/).map((x) => x.trim()).filter(Boolean);
  return lines.length ? [...lines, ""] : [""];
}

function rowToFormState(row: DbSubmission): FormState {
  const reuCpf = String(row.reu_cpf ?? "").trim();
  const reuCnpj = String(row.reu_cnpj ?? "").trim();
  const reuDocumento = reuCnpj || reuCpf;
  const autorCpf = String(row.autor_cpf ?? "").trim();
  const autorCnpj = String(row.autor_cnpj ?? "").trim();
  const autorDocumento = autorCnpj || autorCpf;

  return {
    autorNome: String(row.autor_nome ?? ""),
    autorDocumento,
    autorRG: String(row.autor_rg ?? ""),
    autorEmail: String(row.autor_email ?? ""),
    autorTelefone: String(row.autor_telefone ?? ""),
    autorEstadoCivil: String(row.autor_estado_civil ?? ""),
    autorProfissao: String(row.autor_profissao ?? ""),
    autorCEP: String(row.autor_cep ?? ""),
    autorRua: String(row.autor_rua ?? ""),
    autorNumero: String(row.autor_numero ?? ""),
    autorComplemento: String(row.autor_complemento ?? ""),
    autorBairro: String(row.autor_bairro ?? ""),
    autorCidade: String(row.autor_cidade ?? ""),
    autorEstado: String(row.autor_estado_uf ?? ""),
    reuNome: String(row.reu_nome ?? ""),
    reuDocumento,
    reuRG: String(row.reu_rg ?? ""),
    reuTelefone: String(row.reu_telefone ?? ""),
    reuTelefone2: String(row.reu_telefone_2 ?? ""),
    reuEmail: String(row.reu_email ?? ""),
    reuCEP: String(row.reu_cep ?? ""),
    reuRua: String(row.reu_rua ?? ""),
    reuNumero: String(row.reu_numero ?? ""),
    reuComplemento: String(row.reu_complemento ?? ""),
    reuBairro: String(row.reu_bairro ?? ""),
    reuCidade: String(row.reu_cidade ?? ""),
    reuEstado: String(row.reu_estado_uf ?? ""),
    valorEstimado: String(row.valor_estimado ?? ""),
    descricaoFatos: String(row.descricao_fatos ?? ""),
    pretensao: String(row.pretensao ?? ""),
    incluirTestemunhas: Boolean(row.incluir_testemunhas) || String(row.incluir_testemunhas) === "sim",
    envolveVeiculo:
      Boolean(row.envolve_veiculo) ||
      String(row.envolve_veiculo) === "sim" ||
      (Array.isArray(row.arquivos_urls) &&
        (row.arquivos_urls as { category?: string }[]).some((a) => a.category === "documento_veiculo")),
  };
}

function readLinkFields(row: DbSubmission): { video: string[]; doc: string[] } {
  return {
    video: parseStoredLinks(row.links_midia ?? row.links_video_audio ?? row.prova_midia_links),
    doc: parseStoredLinks(row.links_documentais ?? row.links_documentais_proc ?? row.prova_doc_links),
  };
}

interface FileEntry {
  file: File;
  category: string;
  name: string;
}

const ESTADOS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

const ESTADO_CIVIL = ["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União Estável", "Separado(a)"];

const MULTI_FILE_CATEGORIES = new Set(["provas_documentais", "contrato_nota", "prints", "fotos", "outros"]);

type StoredAttachment = { category: string; name: string; url: string; uploaded_at?: string };

function mergeAttachments(
  existing: StoredAttachment[],
  uploaded: { category: string; name: string; url: string }[],
): StoredAttachment[] {
  let out = [...existing];
  const now = new Date().toISOString();
  for (const u of uploaded) {
    if (MULTI_FILE_CATEGORIES.has(u.category)) {
      out.push({ ...u, uploaded_at: now });
    } else {
      out = out.filter((x) => x.category !== u.category);
      out.push({ ...u, uploaded_at: now });
    }
  }
  return out;
}

const MAX_FILE_MB = 5;

function LightField({
  label,
  req,
  err,
  hint,
  icon,
  children,
}: {
  label: string;
  req?: boolean;
  err?: string;
  hint?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5" data-field-error={err ? "true" : undefined}>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
        {icon && <span className="text-rose-800/80 shrink-0">{icon}</span>}
        <span>
          {label}
          {req && <span className="text-red-600"> *</span>}
        </span>
      </label>
      {children}
      {hint && !err && <p className="text-xs text-slate-500">{hint}</p>}
      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
}

function LightDropzone({
  label,
  req,
  err,
  hint,
  sub,
  icon,
  category,
  multi,
  onAdd,
  compactIcon,
}: {
  label: string;
  req?: boolean;
  err?: string;
  hint: string;
  sub?: string;
  icon?: React.ReactNode;
  category: string;
  multi?: boolean;
  onAdd: (entries: FileEntry[]) => void;
  compactIcon?: React.ReactNode;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [names, setNames] = useState<string[]>([]);
  const [drag, setDrag] = useState(false);

  const handle = useCallback(
    (fileList: File[]) => {
      if (!fileList.length) return;
      const maxB = MAX_FILE_MB * 1024 * 1024;
      const valid = fileList.filter((f) => {
        if (f.size > maxB) {
          alert(`"${f.name}" excede ${MAX_FILE_MB} MB.`);
          return false;
        }
        return true;
      });
      if (!valid.length) return;
      const entries: FileEntry[] = valid.map((f) => ({ file: f, category, name: f.name }));
      setNames((prev) => (multi ? [...prev, ...valid.map((f) => f.name)] : valid.map((f) => f.name)));
      onAdd(entries);
      if (ref.current) ref.current.value = "";
    },
    [category, multi, onAdd],
  );

  return (
    <div className="space-y-1.5">
      <label className="flex items-start gap-2 text-sm font-medium text-slate-800">
        {compactIcon && <span className="text-blue-700 shrink-0 mt-0.5">{compactIcon}</span>}
        <span>
          {label}
          {req && <span className="text-red-600"> *</span>}
        </span>
      </label>
      <div
        role="button"
        tabIndex={0}
        onClick={() => ref.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && ref.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e: DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          setDrag(false);
          handle(Array.from(e.dataTransfer.files));
        }}
        className={`rounded-xl border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-colors ${
          drag ? "border-emerald-500 bg-emerald-50/50" : "border-slate-300 bg-slate-50/80 hover:border-slate-400"
        }`}
      >
        <div className="flex justify-center mb-3 text-emerald-600">{icon || <CloudUpload className="w-10 h-10" />}</div>
        <p className="text-slate-700 font-medium">{hint}</p>
        {sub && <p className="text-xs text-slate-500 mt-2">{sub}</p>}
      </div>
      {multi &&
        names.map((n, i) => (
          <div key={i} className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <Check className="w-3.5 h-3.5" /> {n}
          </div>
        ))}
      {!multi && names.length === 1 && (
        <p className="text-xs text-emerald-700 flex items-center gap-1">
          <Check className="w-3.5 h-3.5" /> {names[0]}
        </p>
      )}
      <input
        ref={ref}
        type="file"
        multiple={multi}
        accept=".pdf,.jpg,.jpeg,.png,image/*"
        className="hidden"
        onChange={(e: ChangeEvent<HTMLInputElement>) => handle(Array.from(e.target.files || []))}
      />
      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
}

export default function AreaClienteFormulario() {
  const [, navigate] = useLocation();
  const [authChecking, setAuthChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [protocol, setProtocol] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [form, setForm] = useState<FormState>(FORM0);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [existingSubmissionId, setExistingSubmissionId] = useState<string | null>(null);
  const [existingArquivos, setExistingArquivos] = useState<StoredAttachment[]>([]);
  const [savedProtocol, setSavedProtocol] = useState<string | null>(null);
  const [videoLinks, setVideoLinks] = useState<string[]>([""]);
  const [docProvasLinks, setDocProvasLinks] = useState<string[]>([""]);
  const [aceiteTermos, setAceiteTermos] = useState(false);
  const [aceiteDados, setAceiteDados] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sf = (field: keyof FormState) => (value: string | boolean) =>
    setForm((x) => ({ ...x, [field]: value as never }));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        navigate("/login");
        return;
      }
      const email = normalizeEmail(session.user.email);
      setClientEmail(email);

      // ilike = igual ao e-mail ignorando maiúsculas (evita falha se a linha foi gravada com casing diferente)
      const { data: row, error } = await supabase
        .from("pequenas_causas_submissions")
        .select("*")
        .ilike("autor_email", email)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (error || !row) {
        console.warn("pequenas_causas_submissions load:", error?.message ?? "sem linha");
        setAuthChecking(false);
        navigate("/login");
        return;
      }

      setExistingSubmissionId(String(row.id));
      const prot = row.protocolo ?? row.protocol ?? row.pedido_ref;
      setSavedProtocol(prot != null && String(prot).trim() ? String(prot) : null);
      const mapped = rowToFormState(row);
      setForm((prev) => ({ ...prev, ...mapped, autorEmail: email }));
      const urls = row.arquivos_urls;
      setExistingArquivos(Array.isArray(urls) ? (urls as StoredAttachment[]) : []);
      const { video, doc } = readLinkFields(row as DbSubmission);
      setVideoLinks(video);
      setDocProvasLinks(doc);
      setAuthChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const addFiles = useCallback((entries: FileEntry[]) => {
    setFiles((prev) => {
      const cats = new Set(entries.map((e) => e.category));
      return [...prev.filter((e) => !cats.has(e.category)), ...entries];
    });
  }, []);

  const addFilesMulti = useCallback((entries: FileEntry[]) => {
    setFiles((prev) => [...prev, ...entries]);
  }, []);

  const handleAutorCEPBlur = async () => {
    const data = await fetchViaCEP(form.autorCEP);
    if (data)
      setForm((x) => ({
        ...x,
        autorRua: data.logradouro,
        autorBairro: data.bairro,
        autorCidade: data.localidade,
        autorEstado: data.uf,
      }));
  };

  const handleReuCEPBlur = async () => {
    const data = await fetchViaCEP(form.reuCEP);
    if (data)
      setForm((x) => ({
        ...x,
        reuRua: data.logradouro,
        reuBairro: data.bairro,
        reuCidade: data.localidade,
        reuEstado: data.uf,
      }));
  };

  const validateForm = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.autorNome.trim()) e.autorNome = "Obrigatório";
    const ad = digitsLen(form.autorDocumento);
    if (!form.autorDocumento.trim()) e.autorDocumento = "Obrigatório";
    else if (ad !== 11 && ad !== 14) e.autorDocumento = "Informe CPF (11 dígitos) ou CNPJ (14 dígitos)";
    if (!form.autorRG.trim()) e.autorRG = "Obrigatório";
    if (!form.autorEmail.trim()) e.autorEmail = "Obrigatório";
    if (!form.autorTelefone.trim()) e.autorTelefone = "Obrigatório";
    if (!form.autorEstadoCivil) e.autorEstadoCivil = "Selecione";
    if (!form.autorProfissao.trim()) e.autorProfissao = "Obrigatório";
    if (!form.autorCEP.trim()) e.autorCEP = "Obrigatório";
    if (!form.autorRua.trim()) e.autorRua = "Obrigatório";
    if (!form.autorNumero.trim()) e.autorNumero = "Obrigatório";
    if (!form.autorBairro.trim()) e.autorBairro = "Obrigatório";
    if (!form.autorCidade.trim()) e.autorCidade = "Obrigatório";
    if (!form.autorEstado) e.autorEstado = "Obrigatório";

    if (!form.reuNome.trim()) e.reuNome = "Obrigatório";
    const rd = digitsLen(form.reuDocumento);
    if (!form.reuDocumento.trim()) e.reuDocumento = "Obrigatório";
    else if (rd !== 11 && rd !== 14) e.reuDocumento = "CPF ou CNPJ inválido";
    if (!form.reuTelefone.trim()) e.reuTelefone = "Obrigatório";
    if (!form.reuCEP.trim()) e.reuCEP = "Obrigatório";

    if (!form.valorEstimado.trim()) e.valorEstimado = "Obrigatório";
    if (!form.descricaoFatos.trim()) e.descricaoFatos = "Obrigatório";
    else if (form.descricaoFatos.trim().length < 50) e.descricaoFatos = "Descreva os fatos com mais detalhes (mín. 50 caracteres)";
    if (!form.pretensao.trim()) e.pretensao = "Obrigatório";

    const hasIdent =
      files.some((f) => f.category === "identidade") || existingArquivos.some((a) => a.category === "identidade");
    const hasRes =
      files.some((f) => f.category === "residencia") || existingArquivos.some((a) => a.category === "residencia");
    if (!hasIdent) e.identidade = "Envie o documento (CNH / CPF / RG)";
    if (!hasRes) e.residencia = "Envie o comprovante de residência";

    const hasDocLinks = docProvasLinks.some((s) => s.trim());
    const hasGeral =
      hasDocLinks ||
      files.some((f) => f.category === "provas_documentais") ||
      existingArquivos.some((a) => a.category === "provas_documentais");
    if (!hasGeral) e.provas_documentais = "Envie arquivos ou informe ao menos um link em provas documentais";

    if (form.envolveVeiculo) {
      const hasV =
        files.some((f) => f.category === "documento_veiculo") ||
        existingArquivos.some((a) => a.category === "documento_veiculo");
      if (!hasV) e.documento_veiculo = "Envie CRV, CRLV ou fotos do veículo";
    }

    if (!aceiteTermos) e.aceiteTermos = "Aceite os termos";
    if (!aceiteDados) e.aceiteDados = "Confirme a veracidade";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildPayload = (
    arquivos_urls: StoredAttachment[],
    proto: string,
    linksMidia: string[],
    linksDoc: string[],
    /** Sempre o e-mail da sessão — necessário para satisfazer RLS (UPDATE só na linha do JWT). */
    sessionEmail: string,
    /** Colunas json/jsonb aceitam array; se a tabela for `text`, use true para gravar string JSON. */
    linksAsJsonStrings: boolean,
  ) => {
    const ad = form.autorDocumento.replace(/\D/g, "");
    const autorIsCnpj = ad.length > 11;
    const rd = form.reuDocumento.replace(/\D/g, "");
    const reuIsPj = rd.length > 11;

    const linksMidiaVal =
      linksMidia.length === 0 ? null : linksAsJsonStrings ? JSON.stringify(linksMidia) : linksMidia;
    const linksDocVal =
      linksDoc.length === 0 ? null : linksAsJsonStrings ? JSON.stringify(linksDoc) : linksDoc;

    const base: Record<string, unknown> = {
      // Coluna criada na migration do portal; muitas bases não têm "protocolo" (PGRST204).
      pedido_ref: proto,
      status: "aguardando_propostas",
      autor_nome: form.autorNome,
      autor_cpf: autorIsCnpj ? null : maskCPF(form.autorDocumento),
      autor_cnpj: autorIsCnpj ? maskCNPJ(form.autorDocumento) : null,
      autor_rg: form.autorRG,
      autor_nascimento: null,
      autor_estado_civil: form.autorEstadoCivil || null,
      autor_profissao: form.autorProfissao || null,
      autor_email: normalizeEmail(sessionEmail),
      autor_telefone: form.autorTelefone,
      autor_whatsapp: null,
      autor_cep: form.autorCEP,
      autor_rua: form.autorRua,
      autor_numero: form.autorNumero,
      autor_complemento: form.autorComplemento || null,
      autor_bairro: form.autorBairro,
      autor_cidade: form.autorCidade,
      autor_estado_uf: form.autorEstado,
      reu_tipo: reuIsPj ? "PJ" : "PF",
      reu_nome: form.reuNome,
      reu_cpf: reuIsPj ? null : maskCPF(form.reuDocumento),
      reu_cnpj: reuIsPj ? maskCNPJ(form.reuDocumento) : null,
      reu_rg: form.reuRG || null,
      reu_cep: form.reuCEP,
      reu_rua: form.reuRua || null,
      reu_numero: form.reuNumero || null,
      reu_complemento: form.reuComplemento || null,
      reu_bairro: form.reuBairro || null,
      reu_cidade: form.reuCidade || null,
      reu_estado_uf: form.reuEstado || null,
      reu_telefone: form.reuTelefone,
      reu_telefone_2: form.reuTelefone2 || null,
      reu_email: form.reuEmail || null,
      tipo_causa: "Outros serviços",
      tipo_causa_outro: null,
      valor_estimado: form.valorEstimado,
      descricao_fatos: form.descricaoFatos,
      pretensao: form.pretensao,
      tentou_resolver: "não",
      descricao_tentativa: null,
      registrou_procon: "não",
      arquivos_urls,
      incluir_testemunhas: form.incluirTestemunhas,
      envolve_veiculo: form.envolveVeiculo,
      links_midia: linksMidiaVal,
      links_documentais: linksDocVal,
      disponivel_para_advogados: true,
      formulario_enviado_em: new Date().toISOString(),
    };
    return base;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      const el = document.querySelector<HTMLElement>("[data-field-error='true']");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!existingSubmissionId) {
      setErrors({ submit: "Sessão inválida." });
      return;
    }
    if (!clientEmail.trim()) {
      setErrors({ submit: "Sessão inválida (e-mail não encontrado)." });
      return;
    }

    setSubmitting(true);
    try {
      const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession();
      if (refreshErr || !refreshData.session?.user?.email) {
        throw new Error(refreshErr?.message ?? "Sessão expirada. Faça login novamente.");
      }
      const sessionEmail = normalizeEmail(refreshData.session.user.email);
      setClientEmail(sessionEmail);

      const proto =
        (savedProtocol && savedProtocol.trim()) || "PCC-" + Date.now().toString(36).toUpperCase().slice(-8);
      const pathPrefix = sanitizeStorageKeySegment(proto);

      const newPieces: { category: string; name: string; url: string }[] = [];
      for (const f of files) {
        const safeName = f.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${pathPrefix}/${f.category}/${Date.now()}_${safeName}`;
        const { error: upErr } = await supabase.storage.from("pequenas-causas-docs").upload(path, f.file, {
          upsert: true,
          contentType: f.file.type || "application/octet-stream",
        });
        if (upErr) {
          throw new Error(`${supabaseErrorMessage(upErr)} (arquivo: ${f.file.name})`);
        }
        const { data: pub } = supabase.storage.from("pequenas-causas-docs").getPublicUrl(path);
        newPieces.push({ category: f.category, name: f.file.name, url: pub.publicUrl });
      }

      const arquivos_urls = mergeAttachments(existingArquivos, newPieces);
      const linksMidia = videoLinks.map((s) => s.trim()).filter(Boolean);
      const linksDoc = docProvasLinks.map((s) => s.trim()).filter(Boolean);

      let payload = buildPayload(arquivos_urls, proto, linksMidia, linksDoc, sessionEmail, false);

      const tryUpdate = async (p: Record<string, unknown>) => {
        return supabase
          .from("pequenas_causas_submissions")
          .update(p)
          .eq("id", existingSubmissionId)
          .ilike("autor_email", sessionEmail);
      };

      let { error: upRowErr } = await tryUpdate(payload);
      if (upRowErr) {
        const strip = { ...payload };
        delete strip.links_midia;
        delete strip.links_documentais;
        delete strip.incluir_testemunhas;
        delete strip.envolve_veiculo;
        delete strip.reu_rg;
        delete strip.reu_telefone_2;
        delete strip.autor_cnpj;
        if (digitsLen(form.autorDocumento) > 11) {
          strip.autor_cpf = maskCNPJ(form.autorDocumento);
        }
        const retry = await tryUpdate(strip);
        upRowErr = retry.error;
        if (!upRowErr) payload = strip;
      }

      if (upRowErr) {
        const minimal = { ...payload };
        delete minimal.status;
        delete minimal.tipo_causa;
        delete minimal.tipo_causa_outro;
        delete minimal.tentou_resolver;
        delete minimal.descricao_tentativa;
        delete minimal.registrou_procon;
        delete minimal.links_midia;
        delete minimal.links_documentais;
        delete minimal.incluir_testemunhas;
        delete minimal.envolve_veiculo;
        delete minimal.reu_rg;
        delete minimal.reu_telefone_2;
        delete minimal.autor_cnpj;
        if (digitsLen(form.autorDocumento) > 11) {
          minimal.autor_cpf = maskCNPJ(form.autorDocumento);
        }
        const third = await tryUpdate(minimal);
        upRowErr = third.error;
        if (!upRowErr) payload = minimal;
      }

      if (upRowErr) {
        const minimalJsonLinks = buildPayload(arquivos_urls, proto, linksMidia, linksDoc, sessionEmail, true);
        const m = { ...minimalJsonLinks };
        delete m.status;
        delete m.tipo_causa;
        delete m.tipo_causa_outro;
        delete m.tentou_resolver;
        delete m.descricao_tentativa;
        delete m.registrou_procon;
        if (digitsLen(form.autorDocumento) > 11) {
          m.autor_cpf = maskCNPJ(form.autorDocumento);
          m.autor_cnpj = null;
        }
        const fourth = await tryUpdate(m);
        upRowErr = fourth.error;
        if (!upRowErr) payload = m;
      }

      if (upRowErr) throw upRowErr;

      setExistingArquivos(arquivos_urls);
      setSavedProtocol(proto);
      setFiles([]);
      setProtocol(proto);
      setSubmitted(true);
    } catch (err) {
      console.error("area-cliente-formulario submit:", err);
      setErrors({
        submit: `Erro ao enviar: ${supabaseErrorMessage(err)}`,
      });
    }
    setSubmitting(false);
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-800 animate-spin" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-3xl mb-4">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Caso enviado!</h1>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            Nossa equipe irá analisar e entrar em contato pelo e-mail cadastrado em até 2 dias úteis.
          </p>
          <div className="text-left text-sm space-y-2 border border-slate-100 rounded-xl p-4 mb-6 bg-slate-50">
            <p>
              <span className="text-slate-500">Protocolo:</span>{" "}
              <span className="font-mono font-bold text-blue-900">{protocol}</span>
            </p>
            <p>
              <span className="text-slate-500">E-mail:</span> {clientEmail}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/area-do-cliente")}
            className="w-full rounded-xl bg-[#1e3a8a] hover:bg-[#172554] text-white font-semibold py-3.5"
          >
            Voltar para Meus Casos
          </button>
        </div>
      </div>
    );
  }

  const sectionTitle = (text: string) => (
    <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2 mb-6">{text}</h2>
  );

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-slate-900 pb-24">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/area-do-cliente")}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
            aria-label="Voltar"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide">Pequenas causas</p>
            <h1 className="text-lg font-bold text-slate-900">Completar formulário</h1>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 pt-8 space-y-10">
        {/* Orientações */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-indigo-950">Orientações importantes</h2>
          <div className="flex gap-3 text-sm">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold text-slate-800">Preencha com tranquilidade!</p>
              <p className="text-slate-600 mt-1 text-xs sm:text-sm">
                Seu progresso pode ser salvo ao enviar o formulário ao final. Você pode iniciar agora e revisar antes de concluir.
              </p>
            </div>
          </div>
          <div className="flex gap-3 text-sm">
            <Headphones className="w-5 h-5 text-violet-600 shrink-0" />
            <div>
              <p className="font-semibold text-slate-800">Suporte durante o preenchimento</p>
              <p className="text-slate-600 text-xs sm:text-sm">Em caso de dúvidas, fale conosco pelo WhatsApp do site.</p>
            </div>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p className="font-semibold flex gap-2 items-center">
              <span>⚠️</span> Sua atenção é fundamental
            </p>
            <ul className="list-disc ml-5 mt-2 space-y-1 text-amber-900/90 text-xs sm:text-sm">
              <li>Verifique cuidadosamente todas as informações</li>
              <li>Calcule e anexe todos os documentos necessários</li>
            </ul>
          </div>
          <p className="text-xs text-red-600 font-medium">* Campos obrigatórios</p>
        </section>

        {/* Autor 1 */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          {sectionTitle("Autor 1")}
          <div className="grid sm:grid-cols-2 gap-5">
            <LightField label="Nome completo" req err={errors.autorNome} icon={<User className="w-4 h-4" />}>
              <input
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                value={form.autorNome}
                onChange={(e) => sf("autorNome")(e.target.value)}
                placeholder="Nome completo"
              />
            </LightField>
            <LightField label="CPF / CNPJ" req err={errors.autorDocumento} icon={<CreditCard className="w-4 h-4" />}>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                value={form.autorDocumento}
                onChange={(e) => sf("autorDocumento")(maskCpfCnpj(e.target.value))}
                placeholder="Digite o CPF ou CNPJ"
              />
            </LightField>
            <LightField label="RG" req err={errors.autorRG} icon={<CreditCard className="w-4 h-4" />}>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                value={form.autorRG}
                onChange={(e) => sf("autorRG")(e.target.value)}
                placeholder="Informe o RG"
              />
            </LightField>
            <LightField label="E-mail" req err={errors.autorEmail} icon={<Mail className="w-4 h-4" />}>
              <input
                type="email"
                readOnly
                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-700"
                value={form.autorEmail}
              />
            </LightField>
            <LightField label="Telefone" req err={errors.autorTelefone} icon={<Phone className="w-4 h-4" />}>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                value={form.autorTelefone}
                onChange={(e) => sf("autorTelefone")(maskPhone(e.target.value))}
                placeholder="(00) 00000-0000"
              />
            </LightField>
            <LightField label="Estado civil" req err={errors.autorEstadoCivil} icon={<Heart className="w-4 h-4" />}>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                value={form.autorEstadoCivil}
                onChange={(e) => sf("autorEstadoCivil")(e.target.value)}
              >
                <option value="">Selecione</option>
                {ESTADO_CIVIL.map((ec) => (
                  <option key={ec} value={ec}>
                    {ec}
                  </option>
                ))}
              </select>
            </LightField>
            <div className="sm:col-span-2">
              <LightField label="Profissão" req err={errors.autorProfissao} icon={<Briefcase className="w-4 h-4" />}>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  value={form.autorProfissao}
                  onChange={(e) => sf("autorProfissao")(e.target.value)}
                  placeholder="Informe sua profissão"
                />
              </LightField>
            </div>
          </div>
        </section>

        {/* Endereço */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          {sectionTitle("Seu endereço")}
          <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,140px)_1fr] gap-5">
            <LightField label="CEP" req err={errors.autorCEP} icon={<MapPin className="w-4 h-4" />}>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                value={form.autorCEP}
                onChange={(e) => sf("autorCEP")(maskCEP(e.target.value))}
                onBlur={handleAutorCEPBlur}
                placeholder="00000-000"
              />
            </LightField>
            <div className="sm:col-span-1 space-y-5 sm:col-start-2">
              <LightField label="Estado (UF)" req err={errors.autorEstado} icon={<MapPin className="w-4 h-4" />}>
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                  value={form.autorEstado}
                  onChange={(e) => sf("autorEstado")(e.target.value)}
                >
                  <option value="">Selecione</option>
                  {ESTADOS.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </LightField>
              <LightField label="Cidade" req err={errors.autorCidade} icon={<MapPin className="w-4 h-4" />}>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  value={form.autorCidade}
                  onChange={(e) => sf("autorCidade")(e.target.value)}
                  placeholder="Cidade"
                />
              </LightField>
              <LightField label="Bairro" req err={errors.autorBairro} icon={<Building2 className="w-4 h-4" />}>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  value={form.autorBairro}
                  onChange={(e) => sf("autorBairro")(e.target.value)}
                  placeholder="Bairro"
                />
              </LightField>
              <LightField label="Endereço" req err={errors.autorRua} icon={<MapPin className="w-4 h-4" />}>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  value={form.autorRua}
                  onChange={(e) => sf("autorRua")(e.target.value)}
                  placeholder="Rua, Avenida"
                />
              </LightField>
              <div className="grid sm:grid-cols-2 gap-5">
                <LightField label="Número" req err={errors.autorNumero} icon={<span className="text-slate-500">#</span>}>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    value={form.autorNumero}
                    onChange={(e) => sf("autorNumero")(e.target.value)}
                    placeholder="Número"
                  />
                </LightField>
                <LightField label="Complemento" icon={<span className="text-slate-400 text-xs">—</span>}>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    value={form.autorComplemento}
                    onChange={(e) => sf("autorComplemento")(e.target.value)}
                    placeholder="Bloco, apartamento, referência..."
                  />
                </LightField>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-sky-100 bg-sky-50 px-4 py-2.5 text-xs text-sky-900 flex items-start gap-2">
            <span className="font-bold">i</span>
            <span>Tamanho máximo por arquivo: {MAX_FILE_MB}MB (PDF, JPG, PNG)</span>
          </div>

          <div className="mt-6 grid gap-8">
            <LightDropzone
              label="Documento (CNH / CPF / RG)"
              req
              err={errors.identidade}
              category="identidade"
              hint="Clique ou arraste para enviar seu documento"
              sub="(Formatos aceitos: PDF, JPG, PNG)"
              icon={<CreditCard className="w-10 h-10" />}
              compactIcon={<CreditCard className="w-4 h-4" />}
              onAdd={addFiles}
            />
            <LightDropzone
              label="Comprovante de residência (água, luz ou telefone — até 60 dias)"
              req
              err={errors.residencia}
              category="residencia"
              hint="Tire uma foto ou envie o comprovante"
              sub="(Formatos aceitos: PDF, JPG, PNG)"
              icon={
                <span className="flex gap-1 justify-center">
                  <FileText className="w-8 h-8" />
                  <Home className="w-8 h-8" />
                </span>
              }
              compactIcon={<Home className="w-4 h-4" />}
              onAdd={addFiles}
            />
          </div>

          <button
            type="button"
            className="mt-6 text-sm font-semibold text-violet-700 hover:underline"
            onClick={() => alert("Múltiplos autores: em breve ou informe na descrição dos fatos.")}
          >
            + Adicionar outro Autor
          </button>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-base font-bold text-slate-900 mb-3">Testemunhas</p>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.incluirTestemunhas}
                onChange={(e) => sf("incluirTestemunhas")(e.target.checked)}
                className="rounded border-slate-300"
              />
              Deseja incluir dados de testemunhas?
            </label>
            {form.incluirTestemunhas && (
              <p className="text-xs text-slate-500 mt-2">
                Descreva nome e contato das testemunhas no campo FATOS, abaixo, ou envie documento em “provas documentais”.
              </p>
            )}
          </div>
        </section>

        {/* Réu */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-6">
          {sectionTitle("Réu 1")}
          <div className="grid sm:grid-cols-2 gap-5">
            <LightField label="Réu(s) / Reclamado(s)" req err={errors.reuNome} icon={<User className="w-4 h-4" />}>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                value={form.reuNome}
                onChange={(e) => sf("reuNome")(e.target.value)}
                placeholder="Nome completo do réu/reclamado"
              />
            </LightField>
            <LightField label="CPF / CNPJ" req err={errors.reuDocumento} icon={<CreditCard className="w-4 h-4" />}>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                value={form.reuDocumento}
                onChange={(e) => sf("reuDocumento")(maskCpfCnpj(e.target.value))}
                placeholder="Digite o CPF ou CNPJ"
              />
            </LightField>
            <LightField label="RG (caso pessoa física)" icon={<CreditCard className="w-4 h-4" />}>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                value={form.reuRG}
                onChange={(e) => sf("reuRG")(e.target.value)}
                placeholder="Informe o RG"
              />
            </LightField>
            <LightField label="Telefone 1" req err={errors.reuTelefone} icon={<Phone className="w-4 h-4" />}>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                value={form.reuTelefone}
                onChange={(e) => sf("reuTelefone")(maskPhone(e.target.value))}
                placeholder="(00) 00000-0000"
              />
            </LightField>
            <LightField label="Telefone 2" icon={<Phone className="w-4 h-4" />}>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                value={form.reuTelefone2}
                onChange={(e) => sf("reuTelefone2")(maskPhone(e.target.value))}
                placeholder="(00) 00000-0000"
              />
            </LightField>
            <LightField label="E-mail" icon={<Mail className="w-4 h-4" />}>
              <input
                type="email"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                value={form.reuEmail}
                onChange={(e) => sf("reuEmail")(e.target.value)}
                placeholder="exemplo@email.com"
              />
            </LightField>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4">Endereço do Réu / Reclamado</h3>
            <div className="grid sm:grid-cols-2 gap-5 max-w-xl">
              <LightField label="CEP" req err={errors.reuCEP} icon={<MapPin className="w-4 h-4" />}>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  value={form.reuCEP}
                  onChange={(e) => sf("reuCEP")(maskCEP(e.target.value))}
                  onBlur={handleReuCEPBlur}
                  placeholder="Digite o CEP"
                />
              </LightField>
            </div>
            <div className="grid sm:grid-cols-2 gap-5 mt-5">
              <LightField label="Endereço">
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  value={form.reuRua}
                  onChange={(e) => sf("reuRua")(e.target.value)}
                  placeholder="Logradouro"
                />
              </LightField>
              <LightField label="Número">
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  value={form.reuNumero}
                  onChange={(e) => sf("reuNumero")(e.target.value)}
                  placeholder="Nº"
                />
              </LightField>
              <LightField label="Bairro">
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  value={form.reuBairro}
                  onChange={(e) => sf("reuBairro")(e.target.value)}
                />
              </LightField>
              <LightField label="Cidade">
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  value={form.reuCidade}
                  onChange={(e) => sf("reuCidade")(e.target.value)}
                />
              </LightField>
              <LightField label="UF">
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                  value={form.reuEstado}
                  onChange={(e) => sf("reuEstado")(e.target.value)}
                >
                  <option value="">Selecione</option>
                  {ESTADOS.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </LightField>
              <LightField label="Complemento">
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  value={form.reuComplemento}
                  onChange={(e) => sf("reuComplemento")(e.target.value)}
                />
              </LightField>
            </div>
          </div>

          <button
            type="button"
            className="text-sm font-semibold text-amber-900 bg-amber-100 border border-amber-200 rounded-lg px-4 py-2 hover:bg-amber-200/50"
            onClick={() => alert("Múltiplos réus: descreva no campo FATOS ou entre em contato com o suporte.")}
          >
            + Adicionar outro Réu
          </button>
        </section>

        {/* Detalhes da causa */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
          {sectionTitle("Detalhes da causa")}
          <LightField
            label="Qual o valor que você pretende receber na justiça (R$)?"
            req
            err={errors.valorEstimado}
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
              <input
                className="w-full rounded-lg border border-slate-200 pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                value={form.valorEstimado}
                onChange={(e) => sf("valorEstimado")(maskCurrency(e.target.value))}
                placeholder="0,00"
              />
            </div>
          </LightField>
          <LightField
            label="FATOS: Descreva em detalhes, de forma exaustiva, tudo o que aconteceu. Informe datas, nomes e valores (se houver). O sucesso da sua causa depende muito do que você escreve aqui."
            req
            err={errors.descricaoFatos}
          >
            <textarea
              className="w-full min-h-[160px] rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              value={form.descricaoFatos}
              onChange={(e) => sf("descricaoFatos")(e.target.value)}
              placeholder="Exemplo: No dia 15/01/2024, comprei um produto da loja X no valor de R$ 500,00..."
            />
          </LightField>
          <LightField label="Pedido (o que você deseja conseguir na justiça?)" req err={errors.pretensao}>
            <textarea
              className="w-full min-h-[100px] rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              value={form.pretensao}
              onChange={(e) => sf("pretensao")(e.target.value)}
              placeholder="Exemplo: Solicito o reembolso do valor pago, acrescido de danos morais..."
            />
          </LightField>
        </section>

        {/* Vídeo / áudio */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-violet-800">
            <Video className="w-5 h-5" />
            <h2 className="text-lg font-bold">Provas em vídeos e áudios</h2>
          </div>
          <p className="text-sm text-slate-600">
            Cole links do Google Drive, OneDrive, etc. (Formato: MP3, MP4, WAV, AVI).
          </p>
          <p className="text-sm font-bold text-red-800">Não serão aceitos outros formatos!</p>
          {videoLinks.map((link, i) => (
            <div key={i}>
              <label className="text-xs font-medium text-slate-500">Link {String(i + 1).padStart(2, "0")}</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-200"
                value={link}
                onChange={(e) => {
                  const next = [...videoLinks];
                  next[i] = e.target.value;
                  setVideoLinks(next);
                }}
                placeholder="Ex: https://drive.google.com/..."
              />
            </div>
          ))}
          <button
            type="button"
            className="text-sm font-semibold text-violet-700 hover:underline"
            onClick={() => setVideoLinks([...videoLinks, ""])}
          >
            + Adicionar outro link
          </button>
        </section>

        {/* Provas documentais */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-emerald-800">
            <FileStack className="w-5 h-5" />
            <h2 className="text-lg font-bold text-slate-900">Provas documentais</h2>
          </div>

          <button
            type="button"
            className="text-sm font-semibold text-violet-700 hover:underline"
            onClick={() => setDocProvasLinks([...docProvasLinks, ""])}
          >
            + Adicionar outro link
          </button>
          <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-950 flex gap-2">
            <span>⚠️</span>
            <span>
              Você é responsável pelos links: devem estar acessíveis sem senha, não corrompidos e com permissão de
              visualização.
            </span>
          </div>

          {docProvasLinks.map((link, i) => (
            <div key={i}>
              <label className="text-xs font-medium text-slate-500">Link documental {i + 1}</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                value={link}
                onChange={(e) => {
                  const next = [...docProvasLinks];
                  next[i] = e.target.value;
                  setDocProvasLinks(next);
                }}
                placeholder="https://..."
              />
            </div>
          ))}

          <LightDropzone
            label="1. Fotos, prints, contratos, notas fiscais e/ou outros documentos"
            req
            err={errors.provas_documentais}
            category="provas_documentais"
            multi
            hint="Arraste arquivos ou clique para selecionar"
            sub="(Formatos aceitos: PDF, JPG, PNG)"
            icon={<CloudUpload className="w-10 h-10" />}
            onAdd={addFilesMulti}
          />

          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.envolveVeiculo}
              onChange={(e) => sf("envolveVeiculo")(e.target.checked)}
              className="rounded border-slate-300"
            />
            Caso envolve trânsito ou compra/venda de veículo (exige documento do veículo)
          </label>

          <LightDropzone
            label="2. Documento do veículo (CRV, CRLV, fotos do veículo)"
            req={form.envolveVeiculo}
            err={errors.documento_veiculo}
            category="documento_veiculo"
            hint="CRV, CRLV, fotos do veículo"
            sub="(Apenas para casos de trânsito / veículo)"
            icon={<Car className="w-10 h-10" />}
            onAdd={addFiles}
          />

          <div className="rounded-lg border border-sky-100 bg-sky-50 px-4 py-2.5 text-xs text-sky-900 flex items-start gap-2">
            <span className="font-bold">i</span>
            <span>Tamanho máximo por arquivo: {MAX_FILE_MB}MB</span>
          </div>
        </section>

        {/* Aceite */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-3">
          <label className="flex items-start gap-3 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={aceiteTermos}
              onChange={(e) => setAceiteTermos(e.target.checked)}
              className="mt-1 rounded border-slate-300"
            />
            <span>
              Li e aceito os <span className="text-blue-800 font-semibold">Termos de Uso</span> e a{" "}
              <span className="text-blue-800 font-semibold">Política de Privacidade</span>.
            </span>
          </label>
          {errors.aceiteTermos && <p className="text-xs text-red-600">{errors.aceiteTermos}</p>}
          <label className="flex items-start gap-3 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={aceiteDados}
              onChange={(e) => setAceiteDados(e.target.checked)}
              className="mt-1 rounded border-slate-300"
            />
            <span>Declaro que as informações são verdadeiras e de minha responsabilidade.</span>
          </label>
          {errors.aceiteDados && <p className="text-xs text-red-600">{errors.aceiteDados}</p>}
        </section>

        {errors.submit && (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3">{errors.submit}</div>
        )}

        <div className="flex justify-end pb-8">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-[#1e3a8a] hover:bg-[#172554] disabled:opacity-60 text-white font-bold px-10 py-3.5 shadow-sm"
          >
            {submitting ? "Enviando…" : "Enviar formulário"}
          </button>
        </div>
      </form>
    </div>
  );
}
