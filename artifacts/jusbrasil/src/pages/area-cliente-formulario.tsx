import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle2, ChevronLeft, ChevronRight, Upload, X,
  Loader2, AlertCircle, User, Building2, Scale, FileText, Eye,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ESTADOS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-blue-200 uppercase tracking-wider">
        {label}{required && <span className="text-yellow-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </div>
  );
}

const inputCls = "h-11 rounded-xl border border-white/10 bg-white/8 px-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-yellow-400/60 focus:bg-white/12 transition-all backdrop-blur-sm";
const selectCls = inputCls + " appearance-none cursor-pointer";
const textareaCls = "rounded-xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-yellow-400/60 focus:bg-white/12 transition-all backdrop-blur-sm resize-y min-h-[120px]";

function Inp(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}
function Sel({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return <select {...props} className={selectCls}>{children}</select>;
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${textareaCls} ${props.className ?? ""}`} />;
}

// ─── File Upload ──────────────────────────────────────────────────────────────

function UploadField({ label, required, bucket, path, multi, onDone }: {
  label: string; required?: boolean; bucket: string; path: string;
  multi?: boolean; onDone: (files: { url: string; name: string }[]) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<{ url: string; name: string }[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    if (!list.length) return;
    setUploading(true); setErr(null);
    const results: { url: string; name: string }[] = [];
    for (const f of list) {
      const fp = `${path}/${Date.now()}_${f.name}`;
      const { error } = await supabase.storage.from(bucket).upload(fp, f, { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(fp);
        results.push({ url: data.publicUrl, name: f.name });
      }
    }
    const all = multi ? [...files, ...results] : results;
    setFiles(all); onDone(all); setUploading(false);
    if (ref.current) ref.current.value = "";
  };

  const remove = (i: number) => {
    const updated = files.filter((_, idx) => idx !== i);
    setFiles(updated); onDone(updated);
  };

  return (
    <Field label={label} required={required}>
      <div
        onClick={() => ref.current?.click()}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all text-sm
          ${files.length ? "border-yellow-400/40 bg-yellow-400/5 text-yellow-300" : "border-white/15 bg-white/5 hover:border-yellow-400/40 hover:bg-yellow-400/5 text-white/40"}`}
      >
        {uploading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
          : files.length && !multi
            ? <><CheckCircle2 className="w-4 h-4 text-yellow-400" /> {files[0].name}</>
            : <><Upload className="w-4 h-4" /> {multi ? "Selecionar arquivos" : "Selecionar arquivo"}</>}
      </div>
      {err && <span className="text-red-400 text-xs">{err}</span>}
      {multi && files.length > 0 && (
        <div className="flex flex-col gap-1 mt-1">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-yellow-300 bg-yellow-400/10 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
              <span className="truncate flex-1">{f.name}</span>
              <button type="button" onClick={() => remove(i)} className="text-white/40 hover:text-red-400 flex-shrink-0"><X className="w-3 h-3" /></button>
            </div>
          ))}
        </div>
      )}
      <input ref={ref} type="file" className="hidden" multiple={multi} accept="image/*,.pdf,.doc,.docx" onChange={handle} />
    </Field>
  );
}

// ─── Step Icons & Labels ──────────────────────────────────────────────────────

const STEPS = [
  { label: "Autor",     icon: User },
  { label: "Réu",      icon: Building2 },
  { label: "Causa",    icon: Scale },
  { label: "Docs",     icon: FileText },
  { label: "Revisão",  icon: Eye },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AreaClienteFormulario() {
  const [step, setStep] = useState(0);
  const [clientEmail, setClientEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Step 1 — Autor
  const [autor, setAutor] = useState({
    nome: "", cpf: "", rg: "", telefone: "", email: "",
    cep: "", endereco: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "",
  });

  // Step 2 — Réu
  const [reu, setReu] = useState({
    nome: "", cpf: "", telefone: "", email: "",
    cep: "", endereco: "", numero: "", bairro: "", cidade: "", estado: "",
  });

  // Step 3 — Causa
  const [causa, setCausa] = useState({ valor: "", fatos: "", pedido: "" });

  // Step 4 — Docs
  const [docIdentidade, setDocIdentidade] = useState<{ url: string; name: string }[]>([]);
  const [docResidencia, setDocResidencia] = useState<{ url: string; name: string }[]>([]);
  const [provas, setProvas] = useState<{ url: string; name: string }[]>([]);

  useEffect(() => {
    try {
      const s = localStorage.getItem("client_session") || localStorage.getItem("user") || "{}";
      const p = JSON.parse(s);
      if (p.email) { setClientEmail(p.email); setAutor(a => ({ ...a, email: p.email })); }
      if (p.name)  setAutor(a => ({ ...a, nome: p.name }));
    } catch {}
  }, []);

  // ─── Validation per step ───────────────────────────────────────────────────

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (step === 0) {
      if (!autor.nome.trim())     errs.nome = "Obrigatório";
      if (!autor.cpf.trim())      errs.cpf = "Obrigatório";
      if (!autor.telefone.trim()) errs.telefone = "Obrigatório";
      if (!autor.email.trim())    errs.email = "Obrigatório";
      if (!autor.cep.trim())      errs.cep = "Obrigatório";
      if (!autor.endereco.trim()) errs.endereco = "Obrigatório";
      if (!autor.numero.trim())   errs.numero = "Obrigatório";
      if (!autor.bairro.trim())   errs.bairro = "Obrigatório";
      if (!autor.cidade.trim())   errs.cidade = "Obrigatório";
      if (!autor.estado)          errs.estado = "Obrigatório";
    }
    if (step === 1) {
      if (!reu.nome.trim())     errs["reu.nome"] = "Obrigatório";
      if (!reu.cpf.trim())      errs["reu.cpf"] = "Obrigatório";
      if (!reu.telefone.trim()) errs["reu.telefone"] = "Obrigatório";
    }
    if (step === 2) {
      if (!causa.valor.trim()) errs.valor = "Obrigatório";
      if (!causa.fatos.trim()) errs.fatos = "Obrigatório";
      if (!causa.pedido.trim()) errs.pedido = "Obrigatório";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => { if (validate()) { setStep(s => s + 1); window.scrollTo({ top: 0, behavior: "smooth" }); } };
  const back = () => { setFieldErrors({}); setStep(s => s - 1); window.scrollTo({ top: 0, behavior: "smooth" }); };

  // ─── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setSubmitting(true); setSubmitError(null);
    const { error } = await supabase.from("case_submissions").insert({
      client_email: clientEmail || autor.email,
      autores: [autor],
      reus: [reu],
      testemunhas: [],
      detalhes_causa: causa,
      provas_links: [],
      documentos_autor: {
        identidade: docIdentidade[0] ?? null,
        residencia: docResidencia[0] ?? null,
      },
      provas_documentais: provas,
      status: "pendente",
    });
    setSubmitting(false);
    if (error) setSubmitError(`Erro: ${error.message}`);
    else setSubmitted(true);
  };

  // ─── Success ───────────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div style={{ background: "linear-gradient(160deg,#032956 0%,#001532 100%)" }} className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-yellow-400/15 border-2 border-yellow-400/40 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-yellow-400" />
          </div>
          <h1 className="text-3xl font-black text-white mb-3">Caso enviado!</h1>
          <p className="text-blue-200 mb-6 leading-relaxed">Seu caso foi submetido com sucesso. Nossa equipe irá analisar e entrar em contato em breve pelo e-mail cadastrado.</p>
          <div className="bg-white/8 border border-white/10 rounded-2xl p-5 text-left space-y-3 mb-8">
            <Row label="Status"  value={<span className="text-yellow-400 font-bold text-xs bg-yellow-400/10 px-3 py-1 rounded-full">Aguardando análise</span>} />
            <Row label="E-mail"  value={clientEmail || autor.email} />
            <Row label="Autor"   value={autor.nome} />
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: "linear-gradient(160deg,#032956 0%,#001532 100%)" }} className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-1">Pequenas Causas Processos</p>
          <h1 className="text-2xl font-black text-white">Submissão de Caso</h1>
          <p className="text-blue-200/70 text-sm mt-1">Preencha os dados para iniciar seu processo</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-0 mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = i === step;
            const done = i < step;
            return (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all mb-1.5
                    ${done  ? "bg-yellow-400 border-yellow-400 text-[#001532]"
                    : active ? "bg-yellow-400/15 border-yellow-400 text-yellow-400"
                    :         "bg-white/5 border-white/15 text-white/30"}`}>
                    {done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wide ${active ? "text-yellow-400" : done ? "text-yellow-400/70" : "text-white/25"}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-px flex-1 max-w-[32px] mb-5 transition-all ${done ? "bg-yellow-400/60" : "bg-white/10"}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white/6 border border-white/10 rounded-3xl backdrop-blur-md shadow-2xl overflow-hidden">

          {/* Gold top bar */}
          <div className="h-1 bg-gradient-to-r from-yellow-400 to-yellow-300" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />

          <div className="p-6 sm:p-8">

            {/* ─── Step 0: Autor ────────────────────────────────────────── */}
            {step === 0 && (
              <StepSection title="Dados do Autor" subtitle="Quem está entrando com o processo">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Field label="Nome completo" required error={fieldErrors.nome}>
                      <Inp value={autor.nome} onChange={e => setAutor(a => ({...a, nome: e.target.value}))} placeholder="Seu nome completo" />
                    </Field>
                  </div>
                  <Field label="CPF / CNPJ" required error={fieldErrors.cpf}>
                    <Inp value={autor.cpf} onChange={e => setAutor(a => ({...a, cpf: e.target.value}))} placeholder="000.000.000-00" />
                  </Field>
                  <Field label="RG">
                    <Inp value={autor.rg} onChange={e => setAutor(a => ({...a, rg: e.target.value}))} placeholder="RG" />
                  </Field>
                  <Field label="Telefone / WhatsApp" required error={fieldErrors.telefone}>
                    <Inp value={autor.telefone} onChange={e => setAutor(a => ({...a, telefone: e.target.value}))} placeholder="(11) 99999-9999" />
                  </Field>
                  <Field label="E-mail" required error={fieldErrors.email}>
                    <Inp type="email" value={autor.email} onChange={e => setAutor(a => ({...a, email: e.target.value}))} placeholder="email@exemplo.com" />
                  </Field>
                  <Field label="CEP" required error={fieldErrors.cep}>
                    <Inp value={autor.cep} onChange={e => setAutor(a => ({...a, cep: e.target.value}))} placeholder="00000-000" />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Endereço" required error={fieldErrors.endereco}>
                      <Inp value={autor.endereco} onChange={e => setAutor(a => ({...a, endereco: e.target.value}))} placeholder="Rua, Avenida..." />
                    </Field>
                  </div>
                  <Field label="Número" required error={fieldErrors.numero}>
                    <Inp value={autor.numero} onChange={e => setAutor(a => ({...a, numero: e.target.value}))} placeholder="N°" />
                  </Field>
                  <Field label="Complemento">
                    <Inp value={autor.complemento} onChange={e => setAutor(a => ({...a, complemento: e.target.value}))} placeholder="Apto, bloco..." />
                  </Field>
                  <Field label="Bairro" required error={fieldErrors.bairro}>
                    <Inp value={autor.bairro} onChange={e => setAutor(a => ({...a, bairro: e.target.value}))} placeholder="Bairro" />
                  </Field>
                  <Field label="Cidade" required error={fieldErrors.cidade}>
                    <Inp value={autor.cidade} onChange={e => setAutor(a => ({...a, cidade: e.target.value}))} placeholder="Cidade" />
                  </Field>
                  <Field label="Estado" required error={fieldErrors.estado}>
                    <Sel value={autor.estado} onChange={e => setAutor(a => ({...a, estado: e.target.value}))}>
                      <option value="">Selecione a UF</option>
                      {ESTADOS.map(uf => <option key={uf}>{uf}</option>)}
                    </Sel>
                  </Field>
                </div>
              </StepSection>
            )}

            {/* ─── Step 1: Réu ─────────────────────────────────────────── */}
            {step === 1 && (
              <StepSection title="Dados do Réu" subtitle="A parte contra quem você está processando">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Field label="Nome / Razão Social" required error={fieldErrors["reu.nome"]}>
                      <Inp value={reu.nome} onChange={e => setReu(r => ({...r, nome: e.target.value}))} placeholder="Nome da empresa ou pessoa" />
                    </Field>
                  </div>
                  <Field label="CPF / CNPJ" required error={fieldErrors["reu.cpf"]}>
                    <Inp value={reu.cpf} onChange={e => setReu(r => ({...r, cpf: e.target.value}))} placeholder="000.000.000-00 ou CNPJ" />
                  </Field>
                  <Field label="Telefone" required error={fieldErrors["reu.telefone"]}>
                    <Inp value={reu.telefone} onChange={e => setReu(r => ({...r, telefone: e.target.value}))} placeholder="(11) 99999-9999" />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="E-mail">
                      <Inp type="email" value={reu.email} onChange={e => setReu(r => ({...r, email: e.target.value}))} placeholder="email@exemplo.com (se souber)" />
                    </Field>
                  </div>
                  <Field label="CEP">
                    <Inp value={reu.cep} onChange={e => setReu(r => ({...r, cep: e.target.value}))} placeholder="00000-000" />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Endereço">
                      <Inp value={reu.endereco} onChange={e => setReu(r => ({...r, endereco: e.target.value}))} placeholder="Endereço completo" />
                    </Field>
                  </div>
                  <Field label="Número">
                    <Inp value={reu.numero} onChange={e => setReu(r => ({...r, numero: e.target.value}))} placeholder="N°" />
                  </Field>
                  <Field label="Bairro">
                    <Inp value={reu.bairro} onChange={e => setReu(r => ({...r, bairro: e.target.value}))} placeholder="Bairro" />
                  </Field>
                  <Field label="Cidade">
                    <Inp value={reu.cidade} onChange={e => setReu(r => ({...r, cidade: e.target.value}))} placeholder="Cidade" />
                  </Field>
                  <Field label="Estado">
                    <Sel value={reu.estado} onChange={e => setReu(r => ({...r, estado: e.target.value}))}>
                      <option value="">Selecione a UF</option>
                      {ESTADOS.map(uf => <option key={uf}>{uf}</option>)}
                    </Sel>
                  </Field>
                </div>
              </StepSection>
            )}

            {/* ─── Step 2: Causa ───────────────────────────────────────── */}
            {step === 2 && (
              <StepSection title="Detalhes da Causa" subtitle="Descreva o ocorrido e o que você busca">
                <div className="flex flex-col gap-5">
                  <Field label="Valor da causa (R$)" required error={fieldErrors.valor}>
                    <Inp
                      value={causa.valor}
                      onChange={e => setCausa(c => ({...c, valor: e.target.value}))}
                      placeholder="Ex: 5.000,00"
                    />
                  </Field>
                  <Field label="Fatos — o que aconteceu?" required error={fieldErrors.fatos}>
                    <Textarea
                      value={causa.fatos}
                      onChange={e => setCausa(c => ({...c, fatos: e.target.value}))}
                      rows={7}
                      placeholder="Descreva detalhadamente os fatos que motivaram a ação. Quanto mais detalhes, melhor para o seu caso..."
                    />
                  </Field>
                  <Field label="Pedido — o que você quer que o juiz decida?" required error={fieldErrors.pedido}>
                    <Textarea
                      value={causa.pedido}
                      onChange={e => setCausa(c => ({...c, pedido: e.target.value}))}
                      rows={4}
                      placeholder="Ex: Que o réu seja condenado a pagar indenização de R$ X por danos morais e materiais..."
                    />
                  </Field>
                </div>
              </StepSection>
            )}

            {/* ─── Step 3: Documentos ──────────────────────────────────── */}
            {step === 3 && (
              <StepSection title="Documentos" subtitle="Envie seus documentos e provas">
                <div className="flex flex-col gap-5">
                  <div className="bg-yellow-400/8 border border-yellow-400/20 rounded-xl p-4 text-sm text-yellow-200/80 leading-relaxed">
                    <strong className="text-yellow-400">Dica:</strong> Envie documentos nítidos em formato PDF, JPG ou PNG.
                    Quanto mais provas, mais forte é o seu caso.
                  </div>
                  <UploadField
                    label="CNH, CPF ou RG (documento de identidade)"
                    required bucket="case-documents" path={clientEmail || "anon"}
                    onDone={setDocIdentidade}
                  />
                  <UploadField
                    label="Comprovante de Residência"
                    required bucket="case-documents" path={clientEmail || "anon"}
                    onDone={setDocResidencia}
                  />
                  <UploadField
                    label="Provas (fotos, prints, contratos, notas fiscais...)"
                    bucket="case-provas" path={clientEmail || "anon"}
                    multi onDone={setProvas}
                  />
                </div>
              </StepSection>
            )}

            {/* ─── Step 4: Revisão ─────────────────────────────────────── */}
            {step === 4 && (
              <StepSection title="Revisão e Confirmação" subtitle="Confira os dados antes de enviar">
                <div className="space-y-5">
                  <ReviewBlock title="Autor">
                    <Row label="Nome"      value={autor.nome} />
                    <Row label="CPF/CNPJ"  value={autor.cpf} />
                    <Row label="Telefone"  value={autor.telefone} />
                    <Row label="E-mail"    value={autor.email} />
                    <Row label="Endereço"  value={`${autor.endereco}, ${autor.numero}${autor.complemento ? ` - ${autor.complemento}` : ""}, ${autor.bairro}, ${autor.cidade} - ${autor.estado}, ${autor.cep}`} />
                  </ReviewBlock>
                  <ReviewBlock title="Réu">
                    <Row label="Nome"      value={reu.nome} />
                    <Row label="CPF/CNPJ"  value={reu.cpf} />
                    <Row label="Telefone"  value={reu.telefone} />
                    {reu.email && <Row label="E-mail" value={reu.email} />}
                    {reu.cidade && <Row label="Localização" value={`${reu.cidade} - ${reu.estado}`} />}
                  </ReviewBlock>
                  <ReviewBlock title="Causa">
                    <Row label="Valor"  value={`R$ ${causa.valor}`} />
                    <Row label="Fatos"  value={causa.fatos} wrap />
                    <Row label="Pedido" value={causa.pedido} wrap />
                  </ReviewBlock>
                  <ReviewBlock title="Documentos">
                    <Row label="Identidade"   value={docIdentidade[0]?.name  || "—"} />
                    <Row label="Residência"   value={docResidencia[0]?.name  || "—"} />
                    <Row label="Provas"       value={provas.length > 0 ? `${provas.length} arquivo(s)` : "—"} />
                  </ReviewBlock>

                  {submitError && (
                    <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {submitError}
                    </div>
                  )}

                  <p className="text-xs text-white/30 text-center leading-relaxed">
                    Ao confirmar, você declara que os dados fornecidos são verdadeiros.
                    Após o envio não será possível alterar as informações.
                  </p>
                </div>
              </StepSection>
            )}

            {/* ─── Navigation ──────────────────────────────────────────── */}
            <div className={`flex gap-3 mt-8 ${step === 0 ? "justify-end" : "justify-between"}`}>
              {step > 0 && (
                <button type="button" onClick={back}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/15 text-white/70 text-sm font-semibold hover:border-white/30 hover:text-white transition-all">
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
              )}
              {step < 4 ? (
                <button type="button" onClick={next}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-yellow-400 text-[#001532] text-sm font-black shadow-[0_4px_0_0_#b8a000] hover:shadow-[0_2px_0_0_#b8a000] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all">
                  Próximo <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={submitting}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-yellow-400 text-[#001532] text-sm font-black shadow-[0_4px_0_0_#b8a000] hover:shadow-[0_2px_0_0_#b8a000] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all disabled:opacity-60 disabled:pointer-events-none">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : <><CheckCircle2 className="w-4 h-4" /> Confirmar Envio</>}
                </button>
              )}
            </div>

          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          Etapa {step + 1} de {STEPS.length} · Pequenas Causas Processos
        </p>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepSection({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-black text-white">{title}</h2>
        <p className="text-blue-200/60 text-sm mt-0.5">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function ReviewBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="px-4 py-2.5 bg-white/5 border-b border-white/8">
        <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider">{title}</p>
      </div>
      <div className="px-4 py-3 space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value, wrap }: { label: string; value: React.ReactNode; wrap?: boolean }) {
  return (
    <div className={`flex ${wrap ? "flex-col gap-1" : "items-start justify-between gap-4"}`}>
      <span className="text-xs text-white/40 font-medium flex-shrink-0">{label}</span>
      <span className={`text-sm text-white/80 font-medium ${wrap ? "" : "text-right"}`}>{value || "—"}</span>
    </div>
  );
}
