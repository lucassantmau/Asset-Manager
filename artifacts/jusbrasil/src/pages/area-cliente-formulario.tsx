import { useState, useCallback, useRef, useEffect, ChangeEvent, DragEvent } from "react";
const SUPABASE_URL = "https://ollfczufqavxzgvktvkb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sbGZjenVmcWF2eHpndmt0dmtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNjA2ODUsImV4cCI6MjA4OTkzNjY4NX0.wVEYoQv8epExO-WSCihojxt3Ti3pQkBjmvdCiV_fiKo";
async function supabaseFrom(table: string, payload: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "Prefer": "return=minimal" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
}
async function supabaseUpload(bucket: string, path: string, file: File): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": file.type || "application/octet-stream", "x-upsert": "true" },
    body: file,
  });
  if (!res.ok) throw new Error(await res.text());
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

// ─── Masks ────────────────────────────────────────────────────────────────────

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
function validCPF(v: string) { return v.replace(/\D/g, "").length === 11; }
function validCNPJ(v: string) { return v.replace(/\D/g, "").length === 14; }

async function fetchViaCEP(cep: string) {
  const c = cep.replace(/\D/g, "");
  if (c.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${c}/json/`);
    const d = await res.json();
    if (d.erro) return null;
    return d as { logradouro: string; bairro: string; localidade: string; uf: string };
  } catch { return null; }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  autorNome: string; autorCPF: string; autorRG: string;
  autorNascimento: string; autorEstadoCivil: string; autorProfissao: string;
  autorEmail: string; autorTelefone: string; autorWhatsApp: string;
  autorCEP: string; autorRua: string; autorNumero: string;
  autorComplemento: string; autorBairro: string; autorCidade: string; autorEstado: string;
  reuTipo: "PF" | "PJ";
  reuNome: string; reuCPF: string; reuCNPJ: string;
  reuCEP: string; reuRua: string; reuNumero: string;
  reuComplemento: string; reuBairro: string; reuCidade: string; reuEstado: string;
  reuTelefone: string; reuEmail: string;
  tipoCausa: string; tipoCausaOutro: string;
  valorEstimado: string; descricaoFatos: string; pretensao: string;
  tentouResolver: string; descricaoTentativa: string; registrouProcon: string;
}

const FORM0: FormState = {
  autorNome: "", autorCPF: "", autorRG: "",
  autorNascimento: "", autorEstadoCivil: "", autorProfissao: "",
  autorEmail: "", autorTelefone: "", autorWhatsApp: "",
  autorCEP: "", autorRua: "", autorNumero: "",
  autorComplemento: "", autorBairro: "", autorCidade: "", autorEstado: "",
  reuTipo: "PJ",
  reuNome: "", reuCPF: "", reuCNPJ: "",
  reuCEP: "", reuRua: "", reuNumero: "",
  reuComplemento: "", reuBairro: "", reuCidade: "", reuEstado: "",
  reuTelefone: "", reuEmail: "",
  tipoCausa: "", tipoCausaOutro: "",
  valorEstimado: "", descricaoFatos: "", pretensao: "",
  tentouResolver: "", descricaoTentativa: "", registrouProcon: "",
};

interface FileEntry { file: File; category: string; name: string; }

const ESTADOS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const ESTADO_CIVIL = ["Solteiro(a)","Casado(a)","Divorciado(a)","Viúvo(a)","União Estável","Separado(a)"];

const TIPOS_CAUSA = [
  "Consumidor (compra/serviço)", "Cobrança indevida", "Banco / financeira",
  "Plano de saúde", "Seguro", "Negativa de crédito", "Telefonia / internet",
  "Energia elétrica / água", "Locação de imóvel", "Condomínio",
  "Acidente de trânsito", "Danos materiais", "Danos morais",
  "Relação de trabalho (informal)", "Outros serviços", "Outro",
];

const STEPS = ["Autor","Réu","Causa","Documentos","Revisão"] as const;

// ─── UI primitives ────────────────────────────────────────────────────────────

const gold = "#fee001";
const dark = "#001532";

function F({ label, req, err, hint, children }: { label: string; req?: boolean; err?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
      <label style={{ fontSize:11, fontWeight:700, color:"rgba(200,220,255,0.75)", textTransform:"uppercase", letterSpacing:"0.05em" }}>
        {label}{req && <span style={{ color:"#f87171", marginLeft:2 }}>*</span>}
      </label>
      {children}
      {hint && !err && <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{hint}</span>}
      {err && <span style={{ fontSize:11, color:"#f87171" }}>{err}</span>}
    </div>
  );
}

const inp: React.CSSProperties = {
  height:44, borderRadius:12, border:"1.5px solid rgba(255,255,255,0.1)",
  background:"rgba(255,255,255,0.06)", padding:"0 16px", fontSize:14,
  color:"white", outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"inherit",
};
const Inp = (p: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...p} style={{ ...inp, ...p.style }}
    onFocus={e => { e.currentTarget.style.borderColor="rgba(254,224,1,0.5)"; e.currentTarget.style.background="rgba(255,255,255,0.1)"; }}
    onBlur={e  => { e.currentTarget.style.borderColor="rgba(255,255,255,0.1)"; e.currentTarget.style.background="rgba(255,255,255,0.06)"; if (p.onBlur) p.onBlur(e); }}
  />
);
const Sel = ({ children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) => (
  <select {...p} style={{ ...inp, cursor:"pointer" }}>{children}</select>
);
const TA = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...p} style={{ ...inp, height:"auto", minHeight:120, padding:"12px 16px", resize:"vertical", lineHeight:1.6, ...p.style }}
    onFocus={e => { e.currentTarget.style.borderColor="rgba(254,224,1,0.5)"; }}
    onBlur={e  => { e.currentTarget.style.borderColor="rgba(255,255,255,0.1)"; }}
  />
);

function Toggle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display:"flex", gap:8 }}>
      {["sim","não"].map(opt => (
        <button key={opt} type="button" onClick={() => onChange(opt)} style={{
          flex:1, height:44, borderRadius:12, border:`1.5px solid ${value===opt ? gold : "rgba(255,255,255,0.1)"}`,
          background: value===opt ? "rgba(254,224,1,0.12)" : "rgba(255,255,255,0.04)",
          color: value===opt ? gold : "rgba(255,255,255,0.4)", fontSize:14, fontWeight:700,
          cursor:"pointer", fontFamily:"inherit", textTransform:"capitalize", transition:"all 0.2s",
        }}>{opt.charAt(0).toUpperCase()+opt.slice(1)}</button>
      ))}
    </div>
  );
}

// ─── Upload field ─────────────────────────────────────────────────────────────

function UploadField({ label, req, category, multi, onAdd }: {
  label: string; req?: boolean; category: string; multi?: boolean;
  onAdd: (entries: FileEntry[]) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [names, setNames] = useState<string[]>([]);
  const [drag, setDrag] = useState(false);

  const handle = useCallback((fileList: File[]) => {
    if (!fileList.length) return;
    const MAX = 10 * 1024 * 1024;
    const valid = fileList.filter(f => {
      if (f.size > MAX) { alert(`"${f.name}" excede 10 MB e foi ignorado.`); return false; }
      return true;
    });
    if (!valid.length) return;
    const entries: FileEntry[] = valid.map(f => ({ file: f, category, name: f.name }));
    setNames(prev => multi ? [...prev, ...valid.map(f => f.name)] : valid.map(f => f.name));
    onAdd(entries);
    if (ref.current) ref.current.value = "";
  }, [category, multi, onAdd]);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => handle(Array.from(e.target.files || []));
  const onDrop   = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDrag(false); handle(Array.from(e.dataTransfer.files)); };
  const hasFiles = names.length > 0;

  return (
    <F label={label} req={req}>
      <div
        onClick={() => ref.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        style={{
          display:"flex", alignItems:"center", gap:10, padding:"12px 16px",
          borderRadius:12, border:`2px dashed ${drag ? gold : hasFiles ? "rgba(254,224,1,0.4)" : "rgba(255,255,255,0.12)"}`,
          background: drag ? "rgba(254,224,1,0.06)" : hasFiles ? "rgba(254,224,1,0.04)" : "rgba(255,255,255,0.03)",
          cursor:"pointer", fontSize:13, color: hasFiles ? gold : "rgba(255,255,255,0.4)", transition:"all 0.2s",
        }}
      >
        {hasFiles && !multi ? `✓ ${names[0]}` : `📎 ${multi ? "Selecionar arquivos" : "Selecionar arquivo"}`}
      </div>
      {multi && names.map((n, i) => (
        <div key={i} style={{ fontSize:12, color:gold, background:"rgba(254,224,1,0.06)", padding:"5px 12px", borderRadius:8, marginTop:4 }}>✓ {n}</div>
      ))}
      <input ref={ref} type="file" multiple={multi} accept="image/*,.pdf,.webp" style={{ display:"none" }} onChange={onChange} />
    </F>
  );
}

// ─── Review helpers ───────────────────────────────────────────────────────────

function RR({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display:"flex", gap:12, padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
      <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)", fontWeight:600, minWidth:100, flexShrink:0, paddingTop:2 }}>{label}</span>
      <span style={{ fontSize:13, color:"rgba(255,255,255,0.8)", lineHeight:1.5 }}>{value || "—"}</span>
    </div>
  );
}
function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, overflow:"hidden", marginBottom:12 }}>
      <div style={{ background:"rgba(254,224,1,0.07)", borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"8px 16px" }}>
        <span style={{ fontSize:10, fontWeight:800, color:gold, textTransform:"uppercase", letterSpacing:"0.08em" }}>{title}</span>
      </div>
      <div style={{ padding:"4px 16px 12px" }}>{children}</div>
    </div>
  );
}

const G2 = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>{children}</div>
);
const G1 = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:16 }}>{children}</div>
);
const Full = ({ children }: { children: React.ReactNode }) => (
  <div style={{ gridColumn:"1 / -1" }}>{children}</div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

import React from "react";

export default function AreaClienteFormulario() {
  const [step, setStep]             = useState(0);
  const [errors, setErrors]         = useState<Record<string,string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [protocol, setProtocol]     = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [form, setForm]             = useState<FormState>(FORM0);
  const [files, setFiles]           = useState<FileEntry[]>([]);
  const [aceiteTermos, setAceiteTermos]   = useState(false);
  const [aceiteDados, setAceiteDados]     = useState(false);

  const sf = (field: keyof FormState) => (value: string) =>
    setForm(x => ({ ...x, [field]: value }));

  useEffect(() => {
    try {
      const s = localStorage.getItem("client_session") || localStorage.getItem("user") || "{}";
      const p = JSON.parse(s);
      if (p.email) { setClientEmail(p.email); setForm(x => ({ ...x, autorEmail: p.email })); }
      if (p.name)  setForm(x => ({ ...x, autorNome: p.name }));
    } catch {}
  }, []);

  const addFiles = useCallback((entries: FileEntry[]) => {
    setFiles(prev => {
      const cats = new Set(entries.map(e => e.category));
      return [...prev.filter(e => !cats.has(e.category)), ...entries];
    });
  }, []);

  const addFilesMulti = useCallback((entries: FileEntry[]) => {
    setFiles(prev => [...prev, ...entries]);
  }, []);

  // ─── ViaCEP ─────────────────────────────────────────────────────────────────

  const handleAutorCEPBlur = async () => {
    const data = await fetchViaCEP(form.autorCEP);
    if (data) setForm(x => ({ ...x, autorRua: data.logradouro, autorBairro: data.bairro, autorCidade: data.localidade, autorEstado: data.uf }));
  };
  const handleReuCEPBlur = async () => {
    const data = await fetchViaCEP(form.reuCEP);
    if (data) setForm(x => ({ ...x, reuRua: data.logradouro, reuBairro: data.bairro, reuCidade: data.localidade, reuEstado: data.uf }));
  };

  // ─── Validate ────────────────────────────────────────────────────────────────

  const validate = (stepNum: number): boolean => {
    const e: Record<string,string> = {};
    if (stepNum === 0 || stepNum === 5) {
      if (!form.autorNome.trim())     e.autorNome     = "Obrigatório";
      if (!form.autorCPF.trim())      e.autorCPF      = "Obrigatório";
      else if (!validCPF(form.autorCPF)) e.autorCPF  = "CPF inválido";
      if (!form.autorEmail.trim())    e.autorEmail    = "Obrigatório";
      if (!form.autorTelefone.trim()) e.autorTelefone = "Obrigatório";
      if (!form.autorCEP.trim())      e.autorCEP      = "Obrigatório";
      if (!form.autorRua.trim())      e.autorRua      = "Obrigatório";
      if (!form.autorNumero.trim())   e.autorNumero   = "Obrigatório";
      if (!form.autorBairro.trim())   e.autorBairro   = "Obrigatório";
      if (!form.autorCidade.trim())   e.autorCidade   = "Obrigatório";
      if (!form.autorEstado)          e.autorEstado   = "Obrigatório";
    }
    if (stepNum === 1 || stepNum === 5) {
      if (!form.reuNome.trim()) e.reuNome = "Obrigatório";
      if (form.reuTipo === "PF") {
        if (!form.reuCPF.trim())      e.reuCPF  = "Obrigatório";
        else if (!validCPF(form.reuCPF)) e.reuCPF = "CPF inválido";
      } else {
        if (!form.reuCNPJ.trim())     e.reuCNPJ = "Obrigatório";
        else if (!validCNPJ(form.reuCNPJ)) e.reuCNPJ = "CNPJ inválido";
      }
    }
    if (stepNum === 2 || stepNum === 5) {
      if (!form.tipoCausa)             e.tipoCausa      = "Selecione o tipo de causa";
      if (!form.valorEstimado.trim())  e.valorEstimado  = "Obrigatório";
      if (!form.descricaoFatos.trim()) e.descricaoFatos = "Obrigatório";
      else if (form.descricaoFatos.trim().length < 100) e.descricaoFatos = "Mínimo 100 caracteres";
      if (!form.pretensao.trim())      e.pretensao      = "Obrigatório";
      if (!form.tentouResolver)        e.tentouResolver = "Selecione uma opção";
      if (!form.registrouProcon)       e.registrouProcon = "Selecione uma opção";
    }
    if (stepNum === 4 || stepNum === 5) {
      if (!aceiteTermos) e.aceiteTermos = "Aceite os termos para continuar";
      if (!aceiteDados)  e.aceiteDados  = "Confirme a veracidade dos dados";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validate(step)) {
      setStep(s => s + 1);
      window.scrollTo({ top:0, behavior:"smooth" });
    }
  };
  const back = () => {
    setErrors({});
    setStep(s => s - 1);
    window.scrollTo({ top:0, behavior:"smooth" });
  };

  const handleSubmit = async () => {
    if (!validate(5)) return;
    setSubmitting(true);
    try {
      const proto = "PCC-" + Date.now().toString(36).toUpperCase().slice(-8);
      const uploadedFiles: { category: string; name: string; url: string }[] = [];
      for (const f of files) {
        const safeName = f.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const url = await supabaseUpload("pequenas-causas-docs", `${proto}/${f.category}/${safeName}`, f.file);
        uploadedFiles.push({ category: f.category, name: f.file.name, url });
      }
      await supabaseFrom("pequenas_causas_submissions", {
        protocol: proto, status: "aguardando_analise",
        autor_nome: form.autorNome, autor_cpf: form.autorCPF, autor_rg: form.autorRG,
        autor_nascimento: form.autorNascimento, autor_estado_civil: form.autorEstadoCivil,
        autor_profissao: form.autorProfissao, autor_email: form.autorEmail,
        autor_telefone: form.autorTelefone, autor_whatsapp: form.autorWhatsApp,
        autor_cep: form.autorCEP, autor_rua: form.autorRua, autor_numero: form.autorNumero,
        autor_complemento: form.autorComplemento, autor_bairro: form.autorBairro,
        autor_cidade: form.autorCidade, autor_estado_uf: form.autorEstado,
        reu_tipo: form.reuTipo, reu_nome: form.reuNome, reu_cpf: form.reuCPF, reu_cnpj: form.reuCNPJ,
        reu_cep: form.reuCEP, reu_rua: form.reuRua, reu_numero: form.reuNumero,
        reu_complemento: form.reuComplemento, reu_bairro: form.reuBairro,
        reu_cidade: form.reuCidade, reu_estado_uf: form.reuEstado,
        reu_telefone: form.reuTelefone, reu_email: form.reuEmail,
        tipo_causa: form.tipoCausa, tipo_causa_outro: form.tipoCausaOutro,
        valor_estimado: form.valorEstimado, descricao_fatos: form.descricaoFatos,
        pretensao: form.pretensao, tentou_resolver: form.tentouResolver,
        descricao_tentativa: form.descricaoTentativa, registrou_procon: form.registrouProcon,
        arquivos_urls: uploadedFiles,
      });
      setProtocol(proto);
      setSubmitted(true);
    } catch (err) {
      setErrors({ submit: "Erro ao enviar. Tente novamente." });
    }
    setSubmitting(false);
  };

  // ─── Success ──────────────────────────────────────────────────────────────────
  if (submitted) return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(160deg,#032956,${dark})`, display:"flex", alignItems:"center", justifyContent:"center", padding:"32px 16px" }}>
      <div style={{ maxWidth:440, width:"100%", textAlign:"center" }}>
        <div style={{ width:80, height:80, borderRadius:"50%", background:"rgba(254,224,1,0.12)", border:`2px solid rgba(254,224,1,0.4)`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px", fontSize:36 }}>✓</div>
        <h1 style={{ color:"white", fontSize:28, fontWeight:900, margin:"0 0 8px" }}>Caso enviado!</h1>
        <p style={{ color:"rgba(180,210,255,0.7)", fontSize:14, lineHeight:1.7, margin:"0 0 24px" }}>
          Nossa equipe irá analisar e entrar em contato pelo e-mail cadastrado em até 2 dias úteis.
        </p>
        <div style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:"16px 20px", textAlign:"left" }}>
          <RR label="Protocolo" value={<span style={{ color:gold, fontWeight:800, letterSpacing:"0.05em" }}>{protocol}</span>} />
          <RR label="Status"    value={<span style={{ color:"#4ade80" }}>Aguardando análise</span>} />
          <RR label="E-mail"    value={clientEmail || form.autorEmail} />
          <RR label="Autor"     value={form.autorNome} />
        </div>
      </div>
    </div>
  );

  // ─── Form ─────────────────────────────────────────────────────────────────────
  const pct = ((step+1)/STEPS.length)*100;

  return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(160deg,#032956,${dark})`, padding:"32px 16px", fontFamily:"'Inter',system-ui,sans-serif" }}>
      <div style={{ maxWidth:680, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <p style={{ color:gold, fontSize:11, fontWeight:800, letterSpacing:"0.12em", textTransform:"uppercase", margin:"0 0 6px" }}>Pequenas Causas Processos</p>
          <h1 style={{ color:"white", fontSize:26, fontWeight:900, margin:"0 0 4px" }}>Submissão de Caso</h1>
          <p style={{ color:"rgba(180,210,255,0.6)", fontSize:13, margin:0 }}>Preencha os dados para iniciar seu processo</p>
        </div>

        {/* Steps */}
        <div style={{ display:"flex", alignItems:"center", marginBottom:28 }}>
          {STEPS.map((label, i) => {
            const isDone = i < step, isActive = i === step;
            return (
              <React.Fragment key={i}>
                <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                  <div style={{
                    width:40, height:40, borderRadius:"50%",
                    border:`2px solid ${isDone||isActive ? gold : "rgba(255,255,255,0.12)"}`,
                    background: isDone ? gold : isActive ? "rgba(254,224,1,0.12)" : "rgba(255,255,255,0.04)",
                    color: isDone ? dark : isActive ? gold : "rgba(255,255,255,0.25)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize: isDone ? 18 : 13, fontWeight:800, transition:"all 0.3s",
                  }}>
                    {isDone ? "✓" : i+1}
                  </div>
                  <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", color: isActive ? gold : isDone ? "rgba(254,224,1,0.6)" : "rgba(255,255,255,0.2)" }}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length-1 && <div style={{ height:1, flex:1, maxWidth:32, marginBottom:20, background: i<step ? "rgba(254,224,1,0.5)" : "rgba(255,255,255,0.08)", transition:"all 0.3s" }} />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Card */}
        <div style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:24, overflow:"hidden", backdropFilter:"blur(12px)" }}>
          <div style={{ height:3, background:`linear-gradient(90deg,${gold},#fbbf24)`, width:`${pct}%`, transition:"width 0.4s ease" }} />
          <div style={{ padding:"28px 28px 32px" }}>

            {/* ── Step 0: Autor ─────────────────────────────────── */}
            {step === 0 && <>
              <h2 style={{ color:"white", fontSize:20, fontWeight:900, margin:"0 0 4px" }}>Dados do Autor</h2>
              <p style={{ color:"rgba(180,210,255,0.5)", fontSize:13, margin:"0 0 24px" }}>Quem está entrando com o processo</p>
              <G1>
                <F label="Nome completo" req err={errors.autorNome}>
                  <Inp value={form.autorNome} onChange={e => sf("autorNome")(e.target.value)} placeholder="Seu nome completo" />
                </F>
              </G1>
              <div style={{ height:16 }} />
              <G2>
                <F label="CPF" req err={errors.autorCPF}>
                  <Inp value={form.autorCPF} onChange={e => sf("autorCPF")(maskCPF(e.target.value))} placeholder="000.000.000-00" maxLength={14} />
                </F>
                <F label="RG">
                  <Inp value={form.autorRG} onChange={e => sf("autorRG")(e.target.value)} placeholder="RG" />
                </F>
                <F label="Data de nascimento">
                  <Inp type="date" value={form.autorNascimento} onChange={e => sf("autorNascimento")(e.target.value)} style={{ colorScheme:"dark" }} />
                </F>
                <F label="Estado civil">
                  <Sel value={form.autorEstadoCivil} onChange={e => sf("autorEstadoCivil")(e.target.value)}>
                    <option value="">Selecione</option>
                    {ESTADO_CIVIL.map(ec => <option key={ec}>{ec}</option>)}
                  </Sel>
                </F>
                <Full>
                  <F label="Profissão">
                    <Inp value={form.autorProfissao} onChange={e => sf("autorProfissao")(e.target.value)} placeholder="Ex: Advogado, Engenheiro..." />
                  </F>
                </Full>
                <F label="E-mail" req err={errors.autorEmail}>
                  <Inp type="email" value={form.autorEmail} onChange={e => sf("autorEmail")(e.target.value)} placeholder="email@exemplo.com" />
                </F>
                <F label="Telefone" req err={errors.autorTelefone}>
                  <Inp value={form.autorTelefone} onChange={e => sf("autorTelefone")(maskPhone(e.target.value))} placeholder="(11) 99999-9999" maxLength={15} />
                </F>
                <Full>
                  <F label="WhatsApp">
                    <Inp value={form.autorWhatsApp} onChange={e => sf("autorWhatsApp")(maskPhone(e.target.value))} placeholder="(11) 99999-9999 (se diferente do telefone)" maxLength={15} />
                  </F>
                </Full>
                <F label="CEP" req err={errors.autorCEP} hint="Preenchimento automático">
                  <Inp
                    value={form.autorCEP}
                    onChange={e => sf("autorCEP")(maskCEP(e.target.value))}
                    onBlur={handleAutorCEPBlur}
                    placeholder="00000-000" maxLength={9}
                  />
                </F>
                <Full>
                  <F label="Rua / Logradouro" req err={errors.autorRua}>
                    <Inp value={form.autorRua} onChange={e => sf("autorRua")(e.target.value)} placeholder="Rua, Avenida..." />
                  </F>
                </Full>
                <F label="Número" req err={errors.autorNumero}>
                  <Inp value={form.autorNumero} onChange={e => sf("autorNumero")(e.target.value)} placeholder="N°" />
                </F>
                <F label="Complemento">
                  <Inp value={form.autorComplemento} onChange={e => sf("autorComplemento")(e.target.value)} placeholder="Apto, bloco..." />
                </F>
                <F label="Bairro" req err={errors.autorBairro}>
                  <Inp value={form.autorBairro} onChange={e => sf("autorBairro")(e.target.value)} placeholder="Bairro" />
                </F>
                <F label="Cidade" req err={errors.autorCidade}>
                  <Inp value={form.autorCidade} onChange={e => sf("autorCidade")(e.target.value)} placeholder="Cidade" />
                </F>
                <F label="Estado (UF)" req err={errors.autorEstado}>
                  <Sel value={form.autorEstado} onChange={e => sf("autorEstado")(e.target.value)}>
                    <option value="">Selecione</option>
                    {ESTADOS.map(uf => <option key={uf}>{uf}</option>)}
                  </Sel>
                </F>
              </G2>
            </>}

            {/* ── Step 1: Réu ───────────────────────────────────── */}
            {step === 1 && <>
              <h2 style={{ color:"white", fontSize:20, fontWeight:900, margin:"0 0 4px" }}>Dados do Réu</h2>
              <p style={{ color:"rgba(180,210,255,0.5)", fontSize:13, margin:"0 0 20px" }}>A parte contra quem você está processando</p>

              {/* PF / PJ toggle */}
              <div style={{ marginBottom:20 }}>
                <label style={{ fontSize:11, fontWeight:700, color:"rgba(200,220,255,0.75)", textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:8 }}>
                  Tipo de pessoa
                </label>
                <div style={{ display:"flex", gap:8 }}>
                  {(["PF","PJ"] as const).map(t => (
                    <button key={t} type="button" onClick={() => setForm(x => ({ ...x, reuTipo: t, reuCPF:"", reuCNPJ:"" }))} style={{
                      flex:1, height:44, borderRadius:12, border:`1.5px solid ${form.reuTipo===t ? gold : "rgba(255,255,255,0.1)"}`,
                      background: form.reuTipo===t ? "rgba(254,224,1,0.12)" : "rgba(255,255,255,0.04)",
                      color: form.reuTipo===t ? gold : "rgba(255,255,255,0.4)", fontSize:14, fontWeight:700,
                      cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s",
                    }}>
                      {t === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}
                    </button>
                  ))}
                </div>
              </div>

              <G1>
                <F label={form.reuTipo === "PJ" ? "Razão Social / Nome da Empresa" : "Nome completo"} req err={errors.reuNome}>
                  <Inp value={form.reuNome} onChange={e => sf("reuNome")(e.target.value)} placeholder={form.reuTipo === "PJ" ? "Ex: Empresa LTDA" : "Nome da pessoa"} />
                </F>
              </G1>
              <div style={{ height:16 }} />
              <G2>
                {form.reuTipo === "PF" ? (
                  <F label="CPF" req err={errors.reuCPF}>
                    <Inp value={form.reuCPF} onChange={e => sf("reuCPF")(maskCPF(e.target.value))} placeholder="000.000.000-00" maxLength={14} />
                  </F>
                ) : (
                  <F label="CNPJ" req err={errors.reuCNPJ}>
                    <Inp value={form.reuCNPJ} onChange={e => sf("reuCNPJ")(maskCNPJ(e.target.value))} placeholder="00.000.000/0001-00" maxLength={18} />
                  </F>
                )}
                <F label="Telefone">
                  <Inp value={form.reuTelefone} onChange={e => sf("reuTelefone")(maskPhone(e.target.value))} placeholder="(11) 99999-9999" maxLength={15} />
                </F>
                <Full>
                  <F label="E-mail">
                    <Inp type="email" value={form.reuEmail} onChange={e => sf("reuEmail")(e.target.value)} placeholder="email@exemplo.com (se souber)" />
                  </F>
                </Full>
                <Full>
                  <p style={{ fontSize:12, color:"rgba(255,255,255,0.3)", margin:"4px 0 8px", lineHeight:1.5 }}>
                    Endereço do réu (opcional — preencha o CEP para autocompletar)
                  </p>
                </Full>
                <F label="CEP" hint="Opcional">
                  <Inp
                    value={form.reuCEP}
                    onChange={e => sf("reuCEP")(maskCEP(e.target.value))}
                    onBlur={handleReuCEPBlur}
                    placeholder="00000-000" maxLength={9}
                  />
                </F>
                <Full>
                  <F label="Rua / Logradouro">
                    <Inp value={form.reuRua} onChange={e => sf("reuRua")(e.target.value)} placeholder="Rua, Avenida..." />
                  </F>
                </Full>
                <F label="Número">
                  <Inp value={form.reuNumero} onChange={e => sf("reuNumero")(e.target.value)} placeholder="N°" />
                </F>
                <F label="Complemento">
                  <Inp value={form.reuComplemento} onChange={e => sf("reuComplemento")(e.target.value)} placeholder="Apto, sala..." />
                </F>
                <F label="Bairro">
                  <Inp value={form.reuBairro} onChange={e => sf("reuBairro")(e.target.value)} placeholder="Bairro" />
                </F>
                <F label="Cidade">
                  <Inp value={form.reuCidade} onChange={e => sf("reuCidade")(e.target.value)} placeholder="Cidade" />
                </F>
                <F label="Estado (UF)">
                  <Sel value={form.reuEstado} onChange={e => sf("reuEstado")(e.target.value)}>
                    <option value="">Selecione</option>
                    {ESTADOS.map(uf => <option key={uf}>{uf}</option>)}
                  </Sel>
                </F>
              </G2>
            </>}

            {/* ── Step 2: Causa ─────────────────────────────────── */}
            {step === 2 && <>
              <h2 style={{ color:"white", fontSize:20, fontWeight:900, margin:"0 0 4px" }}>Detalhes da Causa</h2>
              <p style={{ color:"rgba(180,210,255,0.5)", fontSize:13, margin:"0 0 24px" }}>Descreva o ocorrido e o que você busca</p>
              <G1>
                <F label="Tipo de causa" req err={errors.tipoCausa}>
                  <Sel value={form.tipoCausa} onChange={e => sf("tipoCausa")(e.target.value)}>
                    <option value="">Selecione o tipo</option>
                    {TIPOS_CAUSA.map(t => <option key={t}>{t}</option>)}
                  </Sel>
                </F>
                {form.tipoCausa === "Outro" && (
                  <F label="Especifique o tipo de causa" req>
                    <Inp value={form.tipoCausaOutro} onChange={e => sf("tipoCausaOutro")(e.target.value)} placeholder="Descreva o tipo de causa" />
                  </F>
                )}
                <F label="Valor estimado da causa" req err={errors.valorEstimado} hint="Ex: 5.000,00">
                  <div style={{ position:"relative" }}>
                    <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:14, color:"rgba(255,255,255,0.5)", pointerEvents:"none" }}>R$</span>
                    <Inp
                      value={form.valorEstimado}
                      onChange={e => sf("valorEstimado")(maskCurrency(e.target.value))}
                      placeholder="0,00" style={{ paddingLeft:36 }}
                    />
                  </div>
                </F>
                <F label="Descrição dos fatos — o que aconteceu?" req err={errors.descricaoFatos}
                  hint={`${form.descricaoFatos.trim().length}/100 caracteres mínimos`}>
                  <TA
                    value={form.descricaoFatos}
                    onChange={e => sf("descricaoFatos")(e.target.value)}
                    rows={8}
                    placeholder="Descreva detalhadamente os fatos que motivaram a ação. Inclua datas, valores e o que aconteceu..."
                  />
                </F>
                <F label="Pretensão — o que você quer que o juiz decida?" req err={errors.pretensao}>
                  <TA
                    value={form.pretensao}
                    onChange={e => sf("pretensao")(e.target.value)}
                    rows={4}
                    placeholder="Ex: Que o réu seja condenado a pagar indenização de R$ X por danos morais..."
                  />
                </F>
                <F label="Tentou resolver antes de processar?" req err={errors.tentouResolver}>
                  <Toggle value={form.tentouResolver} onChange={sf("tentouResolver")} />
                </F>
                {form.tentouResolver === "sim" && (
                  <F label="Como tentou resolver?">
                    <TA
                      value={form.descricaoTentativa}
                      onChange={e => sf("descricaoTentativa")(e.target.value)}
                      rows={3}
                      placeholder="Ex: Entrei em contato pelo SAC, fui à loja..."
                    />
                  </F>
                )}
                <F label="Registrou reclamação no PROCON?" req err={errors.registrouProcon}>
                  <Toggle value={form.registrouProcon} onChange={sf("registrouProcon")} />
                </F>
              </G1>
            </>}

            {/* ── Step 3: Documentos ────────────────────────────── */}
            {step === 3 && <>
              <h2 style={{ color:"white", fontSize:20, fontWeight:900, margin:"0 0 4px" }}>Documentos</h2>
              <p style={{ color:"rgba(180,210,255,0.5)", fontSize:13, margin:"0 0 16px" }}>Envie seus documentos e provas</p>
              <div style={{ background:"rgba(254,224,1,0.06)", border:"1px solid rgba(254,224,1,0.18)", borderRadius:12, padding:"12px 16px", fontSize:13, color:"rgba(254,224,1,0.8)", lineHeight:1.6, marginBottom:20 }}>
                <strong style={{ color:gold }}>Dica:</strong> Envie documentos nítidos em PDF, JPG, PNG ou WEBP (máx. 10 MB cada). Quanto mais provas, mais forte é o seu caso.
              </div>
              <p style={{ fontSize:11, fontWeight:700, color:"rgba(200,220,255,0.75)", textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 12px" }}>Obrigatórios</p>
              <G1>
                <UploadField label="RG ou CNH (documento de identidade)" req category="identidade" onAdd={addFiles} />
                <UploadField label="Comprovante de Residência" req category="residencia" onAdd={addFiles} />
              </G1>
              <p style={{ fontSize:11, fontWeight:700, color:"rgba(200,220,255,0.75)", textTransform:"uppercase", letterSpacing:"0.08em", margin:"20px 0 12px" }}>Opcionais — provas e documentos adicionais</p>
              <G1>
                <UploadField label="Contrato / Nota Fiscal" category="contrato_nota" multi onAdd={addFilesMulti} />
                <UploadField label="Prints de conversas / telas" category="prints" multi onAdd={addFilesMulti} />
                <UploadField label="Fotos" category="fotos" multi onAdd={addFilesMulti} />
                <UploadField label="Boletim de Ocorrência" category="boletim" onAdd={addFiles} />
                <UploadField label="Outros documentos" category="outros" multi onAdd={addFilesMulti} />
              </G1>
            </>}

            {/* ── Step 4: Revisão ───────────────────────────────── */}
            {step === 4 && <>
              <h2 style={{ color:"white", fontSize:20, fontWeight:900, margin:"0 0 4px" }}>Revisão e Confirmação</h2>
              <p style={{ color:"rgba(180,210,255,0.5)", fontSize:13, margin:"0 0 20px" }}>Confira os dados antes de enviar</p>
              <Block title="Autor">
                <RR label="Nome"          value={form.autorNome} />
                <RR label="CPF"           value={form.autorCPF} />
                {form.autorRG && <RR label="RG" value={form.autorRG} />}
                {form.autorNascimento && <RR label="Nascimento" value={form.autorNascimento} />}
                {form.autorEstadoCivil && <RR label="Estado civil" value={form.autorEstadoCivil} />}
                <RR label="E-mail"        value={form.autorEmail} />
                <RR label="Telefone"      value={form.autorTelefone} />
                {form.autorWhatsApp && <RR label="WhatsApp" value={form.autorWhatsApp} />}
                <RR label="Endereço"      value={`${form.autorRua}, ${form.autorNumero}${form.autorComplemento?` - ${form.autorComplemento}`:""}, ${form.autorBairro}, ${form.autorCidade} - ${form.autorEstado}`} />
              </Block>
              <Block title="Réu">
                <RR label="Tipo"          value={form.reuTipo === "PF" ? "Pessoa Física" : "Pessoa Jurídica"} />
                <RR label="Nome"          value={form.reuNome} />
                {form.reuTipo === "PF"
                  ? <RR label="CPF"  value={form.reuCPF} />
                  : <RR label="CNPJ" value={form.reuCNPJ} />
                }
                {form.reuTelefone && <RR label="Telefone" value={form.reuTelefone} />}
                {form.reuEmail    && <RR label="E-mail"   value={form.reuEmail} />}
                {form.reuCidade   && <RR label="Localização" value={`${form.reuCidade} - ${form.reuEstado}`} />}
              </Block>
              <Block title="Causa">
                <RR label="Tipo"          value={form.tipoCausa === "Outro" ? form.tipoCausaOutro : form.tipoCausa} />
                <RR label="Valor"         value={`R$ ${form.valorEstimado}`} />
                <RR label="Fatos"         value={<span style={{ whiteSpace:"pre-wrap" }}>{form.descricaoFatos}</span>} />
                <RR label="Pretensão"     value={<span style={{ whiteSpace:"pre-wrap" }}>{form.pretensao}</span>} />
                <RR label="Tentou resolver" value={form.tentouResolver} />
                {form.tentouResolver === "sim" && form.descricaoTentativa && <RR label="Como tentou" value={form.descricaoTentativa} />}
                <RR label="PROCON"        value={form.registrouProcon} />
              </Block>
              <Block title="Documentos">
                {files.length === 0
                  ? <RR label="Arquivos" value="Nenhum arquivo selecionado" />
                  : files.map((f,i) => <RR key={i} label={f.category} value={f.name} />)
                }
              </Block>
              {/* Checkboxes de aceite */}
              <div style={{ display:"flex", flexDirection:"column", gap:10, margin:"16px 0 4px" }}>
                <label style={{ display:"flex", alignItems:"flex-start", gap:10, cursor:"pointer" }}>
                  <input
                    type="checkbox" checked={aceiteTermos} onChange={e => setAceiteTermos(e.target.checked)}
                    style={{ width:18, height:18, marginTop:1, accentColor:gold, cursor:"pointer", flexShrink:0 }}
                  />
                  <span style={{ fontSize:13, color:"rgba(255,255,255,0.7)", lineHeight:1.5 }}>
                    Li e aceito os <span style={{ color:gold }}>Termos de Uso</span> e a <span style={{ color:gold }}>Política de Privacidade</span>.
                  </span>
                </label>
                {errors.aceiteTermos && <span style={{ fontSize:11, color:"#f87171", marginLeft:28 }}>{errors.aceiteTermos}</span>}
                <label style={{ display:"flex", alignItems:"flex-start", gap:10, cursor:"pointer" }}>
                  <input
                    type="checkbox" checked={aceiteDados} onChange={e => setAceiteDados(e.target.checked)}
                    style={{ width:18, height:18, marginTop:1, accentColor:gold, cursor:"pointer", flexShrink:0 }}
                  />
                  <span style={{ fontSize:13, color:"rgba(255,255,255,0.7)", lineHeight:1.5 }}>
                    Declaro que todas as informações fornecidas são verdadeiras e de minha responsabilidade.
                  </span>
                </label>
                {errors.aceiteDados && <span style={{ fontSize:11, color:"#f87171", marginLeft:28 }}>{errors.aceiteDados}</span>}
              </div>
              {errors.submit && (
                <div style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.3)", borderRadius:12, padding:"12px 16px", fontSize:13, color:"#fca5a5", marginBottom:12 }}>
                  ⚠️ {errors.submit}
                </div>
              )}
            </>}

            {/* Navigation */}
            <div style={{ display:"flex", justifyContent: step===0 ? "flex-end" : "space-between", gap:12, marginTop:28 }}>
              {step > 0 && (
                <button type="button" onClick={back} style={{
                  display:"flex", alignItems:"center", gap:8, padding:"12px 20px",
                  borderRadius:12, border:"1.5px solid rgba(255,255,255,0.14)", background:"transparent",
                  color:"rgba(255,255,255,0.65)", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                }}>
                  ← Voltar
                </button>
              )}
              {step < STEPS.length-1 ? (
                <button type="button" onClick={next} style={{
                  padding:"12px 28px", borderRadius:12, background:gold, color:dark,
                  fontSize:13, fontWeight:900, cursor:"pointer", border:"none",
                  boxShadow:`0 4px 0 0 #b8a000`, fontFamily:"inherit",
                }}>
                  Próximo →
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={submitting} style={{
                  display:"flex", alignItems:"center", gap:8, padding:"12px 28px",
                  borderRadius:12, background: submitting ? "rgba(254,224,1,0.5)" : gold,
                  color:dark, fontSize:13, fontWeight:900,
                  cursor: submitting ? "not-allowed" : "pointer",
                  border:"none", boxShadow:`0 4px 0 0 #b8a000`, fontFamily:"inherit",
                }}>
                  {submitting ? "⏳ Enviando..." : "Enviar Caso"}
                </button>
              )}
            </div>

          </div>
        </div>

        <p style={{ textAlign:"center", color:"rgba(255,255,255,0.18)", fontSize:11, marginTop:20 }}>
          Etapa {step+1} de {STEPS.length} · Pequenas Causas Processos
        </p>
      </div>
    </div>
  );
}
