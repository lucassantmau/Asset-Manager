import { useState, useCallback, useRef, useEffect, ChangeEvent, DragEvent } from "react";
const SUPABASE_URL = "https://ollfczufqavxzgvktvkb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sbGZjenVmcWF2eHpndmt0dmtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNjY2ODUsImV4cCI6MjA4OTkzNjY4NX0.wVEYoQv8epExO-WSCihojxt3Ti3pQkBjmvdCiV_fiKo";
async function supabaseFrom(table: string, payload: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "Prefer": "return=minimal" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || "Erro ao salvar");
  return data;
}

async function supabaseSelect(table: string, filter: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}&limit=1`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  return res.json() as Promise<Record<string, unknown>[]>;
}

async function supabaseUpload(bucket: string, path: string, file: File): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "true",
    },
    body: file,
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message || "Erro no upload"); }
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Autor {
  nome: string; cpf: string; rg: string; telefone: string; email: string;
  cep: string; endereco: string; numero: string; complemento: string;
  bairro: string; cidade: string; estado: string;
}
interface Reu {
  nome: string; cpf: string; telefone: string; email: string;
  cep: string; endereco: string; numero: string; bairro: string; cidade: string; estado: string;
}
interface FileRef { url: string; name: string; }

const ESTADOS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const STEPS = ["Autor","Réu","Causa","Documentos","Revisão"] as const;

// ─── Tiny UI primitives ───────────────────────────────────────────────────────

const gold = "#fee001";
const dark = "#001532";

function F({ label, req, err, children }: { label: string; req?: boolean; err?: string; children: React.ReactNode }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
      <label style={{ fontSize:11, fontWeight:700, color:"rgba(200,220,255,0.75)", textTransform:"uppercase", letterSpacing:"0.05em" }}>
        {label}{req && <span style={{ color:"#f87171", marginLeft:2 }}>*</span>}
      </label>
      {children}
      {err && <span style={{ fontSize:11, color:"#f87171" }}>{err}</span>}
    </div>
  );
}

const inp: React.CSSProperties = {
  height:44, borderRadius:12, border:"1.5px solid rgba(255,255,255,0.1)",
  background:"rgba(255,255,255,0.06)", padding:"0 16px", fontSize:14,
  color:"white", outline:"none", width:"100%", boxSizing:"border-box",
  fontFamily:"inherit",
};
const Inp = (p: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...p} style={{ ...inp, ...p.style }}
    onFocus={e => { e.currentTarget.style.borderColor = "rgba(254,224,1,0.5)"; e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
    onBlur={e  => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
  />
);
const Sel = ({ children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) => (
  <select {...p} style={{ ...inp, cursor:"pointer", appearance:"none" as any }}>{children}</select>
);
const TA = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...p} style={{ ...inp, height:"auto", minHeight:120, padding:"12px 16px", resize:"vertical", lineHeight:1.6, ...p.style }}
    onFocus={e => { e.currentTarget.style.borderColor = "rgba(254,224,1,0.5)"; }}
    onBlur={e  => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
  />
);

// ─── Upload field ─────────────────────────────────────────────────────────────

function UploadField({ label, req, bucket, folder, multi, onDone }: {
  label: string; req?: boolean; bucket: string; folder: string;
  multi?: boolean; onDone: (files: FileRef[]) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<FileRef[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  const upload = useCallback(async (files: File[]) => {
    if (!files.length) return;
    setBusy(true); setErr(null);
    const results: FileRef[] = [];
    for (const f of files) {
      try {
        const path = `${folder}/${Date.now()}_${f.name}`;
        const url = await supabaseUpload(bucket, path, f);
        results.push({ url, name: f.name });
      } catch { setErr("Falha ao enviar " + f.name); }
    }
    const all = multi ? [...done, ...results] : results;
    setDone(all); onDone(all); setBusy(false);
    if (ref.current) ref.current.value = "";
  }, [done, multi, bucket, folder, onDone]);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => upload(Array.from(e.target.files || []));
  const onDrop   = (e: DragEvent) => { e.preventDefault(); setDrag(false); upload(Array.from(e.dataTransfer.files)); };

  const remove = (i: number) => { const u = done.filter((_,idx)=>idx!==i); setDone(u); onDone(u); };

  const active = done.length > 0 && !multi;
  return (
    <F label={label} req={req} err={err ?? undefined}>
      <div
        onClick={() => ref.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        style={{
          display:"flex", alignItems:"center", gap:10, padding:"12px 16px",
          borderRadius:12, border:`2px dashed ${drag ? gold : active ? "rgba(254,224,1,0.4)" : "rgba(255,255,255,0.12)"}`,
          background: drag ? "rgba(254,224,1,0.06)" : active ? "rgba(254,224,1,0.04)" : "rgba(255,255,255,0.03)",
          cursor:"pointer", fontSize:13,
          color: active ? gold : "rgba(255,255,255,0.4)",
          transition:"all 0.2s",
        }}
      >
        {busy ? "⏳ Enviando..." : active ? `✓ ${done[0].name}` : `📎 ${multi ? "Selecionar arquivos" : "Selecionar arquivo"}`}
      </div>
      {err && <span style={{ fontSize:11, color:"#f87171" }}>{err}</span>}
      {multi && done.map((f,i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:gold, background:"rgba(254,224,1,0.06)", padding:"6px 12px", borderRadius:8, marginTop:4 }}>
          <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>✓ {f.name}</span>
          <button type="button" onClick={() => remove(i)} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.35)", lineHeight:1 }}>✕</button>
        </div>
      ))}
      <input ref={ref} type="file" multiple={multi} accept="image/*,.pdf,.doc,.docx" style={{ display:"none" }} onChange={onChange} />
    </F>
  );
}

// ─── Review row ───────────────────────────────────────────────────────────────

function RR({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display:"flex", gap:12, padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
      <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)", fontWeight:600, minWidth:90, flexShrink:0, paddingTop:2 }}>{label}</span>
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

// ─── Grid helpers ─────────────────────────────────────────────────────────────

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
  const [step, setStep]         = useState(0);
  const [errs, setErrs]         = useState<Record<string,string>>({});
  const [submitting, setSub]    = useState(false);
  const [submitErr, setSubErr]  = useState<string|null>(null);
  const [done, setDone]         = useState(false);
  const [email, setEmail]       = useState("");

  // Step data
  const [a, setA] = useState<Autor>({ nome:"",cpf:"",rg:"",telefone:"",email:"",cep:"",endereco:"",numero:"",complemento:"",bairro:"",cidade:"",estado:"" });
  const [r, setR] = useState<Reu>({ nome:"",cpf:"",telefone:"",email:"",cep:"",endereco:"",numero:"",bairro:"",cidade:"",estado:"" });
  const [c, setC] = useState({ valor:"", fatos:"", pedido:"" });
  const [docId,   setDocId]   = useState<FileRef[]>([]);
  const [docRes,  setDocRes]  = useState<FileRef[]>([]);
  const [provas,  setProvas]  = useState<FileRef[]>([]);

  useEffect(() => {
    try {
      const s = localStorage.getItem("client_session") || localStorage.getItem("user") || "{}";
      const p = JSON.parse(s);
      if (p.email) { setEmail(p.email); setA(x => ({...x, email: p.email})); }
      if (p.name)  setA(x => ({...x, nome: p.name}));
    } catch {}
  }, []);

  // Validate current step
  const validate = (): boolean => {
    const e: Record<string,string> = {};
    if (step === 0) {
      if (!a.nome.trim())     e.nome     = "Obrigatório";
      if (!a.cpf.trim())      e.cpf      = "Obrigatório";
      if (!a.telefone.trim()) e.telefone = "Obrigatório";
      if (!a.email.trim())    e.email    = "Obrigatório";
      if (!a.cep.trim())      e.cep      = "Obrigatório";
      if (!a.endereco.trim()) e.endereco = "Obrigatório";
      if (!a.numero.trim())   e.numero   = "Obrigatório";
      if (!a.bairro.trim())   e.bairro   = "Obrigatório";
      if (!a.cidade.trim())   e.cidade   = "Obrigatório";
      if (!a.estado)          e.estado   = "Obrigatório";
    }
    if (step === 1) {
      if (!r.nome.trim())     e["r.nome"]     = "Obrigatório";
      if (!r.cpf.trim())      e["r.cpf"]      = "Obrigatório";
      if (!r.telefone.trim()) e["r.telefone"] = "Obrigatório";
    }
    if (step === 2) {
      if (!c.valor.trim()) e.valor = "Obrigatório";
      if (!c.fatos.trim()) e.fatos = "Obrigatório";
      if (!c.pedido.trim()) e.pedido = "Obrigatório";
    }
    setErrs(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) { setStep(s => s+1); window.scrollTo({top:0,behavior:"smooth"}); } };
  const back = () => { setErrs({}); setStep(s => s-1); window.scrollTo({top:0,behavior:"smooth"}); };

  const submit = async () => {
    setSub(true); setSubErr(null);
    try {
      await supabaseFrom("case_submissions", {
        client_email: email || a.email,
        autores: [a],
        reus: [r],
        testemunhas: [],
        detalhes_causa: c,
        provas_links: [],
        documentos_autor: { identidade: docId[0] ?? null, residencia: docRes[0] ?? null },
        provas_documentais: provas,
        status: "pendente",
      });
      setDone(true);
      window.scrollTo({top:0,behavior:"smooth"});
    } catch (err: any) {
      setSubErr(err.message || "Erro ao enviar");
    } finally { setSub(false); }
  };

  // ─── Success screen ─────────────────────────────────────────────────────────
  if (done) return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(160deg,#032956,${dark})`, display:"flex", alignItems:"center", justifyContent:"center", padding:"32px 16px" }}>
      <div style={{ maxWidth:420, width:"100%", textAlign:"center" }}>
        <div style={{ width:80, height:80, borderRadius:"50%", background:"rgba(254,224,1,0.12)", border:`2px solid rgba(254,224,1,0.4)`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px", fontSize:36 }}>✓</div>
        <h1 style={{ color:"white", fontSize:28, fontWeight:900, margin:"0 0 12px" }}>Caso enviado!</h1>
        <p style={{ color:"rgba(180,210,255,0.7)", fontSize:14, lineHeight:1.7, margin:"0 0 24px" }}>
          Nossa equipe irá analisar e entrar em contato pelo e-mail cadastrado em até 2 dias úteis.
        </p>
        <div style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:"16px 20px", textAlign:"left" }}>
          <RR label="Status"  value={<span style={{ color:gold, fontWeight:700 }}>Aguardando análise</span>} />
          <RR label="E-mail"  value={email || a.email} />
          <RR label="Autor"   value={a.nome} />
        </div>
      </div>
    </div>
  );

  // ─── Progress bar ───────────────────────────────────────────────────────────
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

        {/* Step indicators */}
        <div style={{ display:"flex", alignItems:"center", marginBottom:28 }}>
          {STEPS.map((label, i) => {
            const isDone   = i < step;
            const isActive = i === step;
            return (
              <React.Fragment key={i}>
                <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                  <div style={{
                    width:40, height:40, borderRadius:"50%",
                    border:`2px solid ${isDone||isActive ? gold : "rgba(255,255,255,0.12)"}`,
                    background: isDone ? gold : isActive ? "rgba(254,224,1,0.12)" : "rgba(255,255,255,0.04)",
                    color: isDone ? dark : isActive ? gold : "rgba(255,255,255,0.25)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:isDone?18:13, fontWeight:800,
                    transition:"all 0.3s",
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
          {/* Gold progress bar */}
          <div style={{ height:3, background:`linear-gradient(90deg,${gold},#fbbf24)`, width:`${pct}%`, transition:"width 0.4s ease" }} />

          <div style={{ padding:"28px 28px 32px" }}>

            {/* ── Step 0: Autor ───────────────────────────────────── */}
            {step === 0 && <>
              <h2 style={{ color:"white", fontSize:20, fontWeight:900, margin:"0 0 4px" }}>Dados do Autor</h2>
              <p style={{ color:"rgba(180,210,255,0.5)", fontSize:13, margin:"0 0 24px" }}>Quem está entrando com o processo</p>
              <G1>
                <F label="Nome completo" req err={errs.nome}>
                  <Inp value={a.nome} onChange={e=>setA(x=>({...x,nome:e.target.value}))} placeholder="Seu nome completo" />
                </F>
              </G1>
              <div style={{ height:14 }} />
              <G2>
                <F label="CPF / CNPJ" req err={errs.cpf}>
                  <Inp value={a.cpf} onChange={e=>setA(x=>({...x,cpf:e.target.value}))} placeholder="000.000.000-00" />
                </F>
                <F label="RG">
                  <Inp value={a.rg} onChange={e=>setA(x=>({...x,rg:e.target.value}))} placeholder="RG" />
                </F>
                <F label="Telefone / WhatsApp" req err={errs.telefone}>
                  <Inp value={a.telefone} onChange={e=>setA(x=>({...x,telefone:e.target.value}))} placeholder="(11) 99999-9999" />
                </F>
                <F label="E-mail" req err={errs.email}>
                  <Inp type="email" value={a.email} onChange={e=>setA(x=>({...x,email:e.target.value}))} placeholder="email@exemplo.com" />
                </F>
                <F label="CEP" req err={errs.cep}>
                  <Inp value={a.cep} onChange={e=>setA(x=>({...x,cep:e.target.value}))} placeholder="00000-000" />
                </F>
                <Full>
                  <F label="Endereço" req err={errs.endereco}>
                    <Inp value={a.endereco} onChange={e=>setA(x=>({...x,endereco:e.target.value}))} placeholder="Rua, Avenida..." />
                  </F>
                </Full>
                <F label="Número" req err={errs.numero}>
                  <Inp value={a.numero} onChange={e=>setA(x=>({...x,numero:e.target.value}))} placeholder="N°" />
                </F>
                <F label="Complemento">
                  <Inp value={a.complemento} onChange={e=>setA(x=>({...x,complemento:e.target.value}))} placeholder="Apto, bloco..." />
                </F>
                <F label="Bairro" req err={errs.bairro}>
                  <Inp value={a.bairro} onChange={e=>setA(x=>({...x,bairro:e.target.value}))} placeholder="Bairro" />
                </F>
                <F label="Cidade" req err={errs.cidade}>
                  <Inp value={a.cidade} onChange={e=>setA(x=>({...x,cidade:e.target.value}))} placeholder="Cidade" />
                </F>
                <F label="Estado" req err={errs.estado}>
                  <Sel value={a.estado} onChange={e=>setA(x=>({...x,estado:e.target.value}))}>
                    <option value="">Selecione a UF</option>
                    {ESTADOS.map(uf=><option key={uf}>{uf}</option>)}
                  </Sel>
                </F>
              </G2>
            </>}

            {/* ── Step 1: Réu ─────────────────────────────────────── */}
            {step === 1 && <>
              <h2 style={{ color:"white", fontSize:20, fontWeight:900, margin:"0 0 4px" }}>Dados do Réu</h2>
              <p style={{ color:"rgba(180,210,255,0.5)", fontSize:13, margin:"0 0 24px" }}>A parte contra quem você está processando</p>
              <G1>
                <F label="Nome / Razão Social" req err={errs["r.nome"]}>
                  <Inp value={r.nome} onChange={e=>setR(x=>({...x,nome:e.target.value}))} placeholder="Nome da empresa ou pessoa" />
                </F>
              </G1>
              <div style={{ height:14 }} />
              <G2>
                <F label="CPF / CNPJ" req err={errs["r.cpf"]}>
                  <Inp value={r.cpf} onChange={e=>setR(x=>({...x,cpf:e.target.value}))} placeholder="000.000.000-00 ou CNPJ" />
                </F>
                <F label="Telefone" req err={errs["r.telefone"]}>
                  <Inp value={r.telefone} onChange={e=>setR(x=>({...x,telefone:e.target.value}))} placeholder="(11) 99999-9999" />
                </F>
                <Full>
                  <F label="E-mail">
                    <Inp type="email" value={r.email} onChange={e=>setR(x=>({...x,email:e.target.value}))} placeholder="email@exemplo.com (se souber)" />
                  </F>
                </Full>
                <F label="CEP">
                  <Inp value={r.cep} onChange={e=>setR(x=>({...x,cep:e.target.value}))} placeholder="00000-000" />
                </F>
                <Full>
                  <F label="Endereço">
                    <Inp value={r.endereco} onChange={e=>setR(x=>({...x,endereco:e.target.value}))} placeholder="Endereço completo" />
                  </F>
                </Full>
                <F label="Número">
                  <Inp value={r.numero} onChange={e=>setR(x=>({...x,numero:e.target.value}))} placeholder="N°" />
                </F>
                <F label="Bairro">
                  <Inp value={r.bairro} onChange={e=>setR(x=>({...x,bairro:e.target.value}))} placeholder="Bairro" />
                </F>
                <F label="Cidade">
                  <Inp value={r.cidade} onChange={e=>setR(x=>({...x,cidade:e.target.value}))} placeholder="Cidade" />
                </F>
                <F label="Estado">
                  <Sel value={r.estado} onChange={e=>setR(x=>({...x,estado:e.target.value}))}>
                    <option value="">Selecione a UF</option>
                    {ESTADOS.map(uf=><option key={uf}>{uf}</option>)}
                  </Sel>
                </F>
              </G2>
            </>}

            {/* ── Step 2: Causa ───────────────────────────────────── */}
            {step === 2 && <>
              <h2 style={{ color:"white", fontSize:20, fontWeight:900, margin:"0 0 4px" }}>Detalhes da Causa</h2>
              <p style={{ color:"rgba(180,210,255,0.5)", fontSize:13, margin:"0 0 24px" }}>Descreva o ocorrido e o que você busca</p>
              <G1>
                <F label="Valor da causa (R$)" req err={errs.valor}>
                  <Inp value={c.valor} onChange={e=>setC(x=>({...x,valor:e.target.value}))} placeholder="Ex: 5.000,00" />
                </F>
                <F label="Fatos — o que aconteceu?" req err={errs.fatos}>
                  <TA value={c.fatos} onChange={e=>setC(x=>({...x,fatos:e.target.value}))} rows={8}
                    placeholder="Descreva detalhadamente os fatos que motivaram a ação. Quanto mais detalhes, melhor..." />
                </F>
                <F label="Pedido — o que você quer que o juiz decida?" req err={errs.pedido}>
                  <TA value={c.pedido} onChange={e=>setC(x=>({...x,pedido:e.target.value}))} rows={5}
                    placeholder="Ex: Que o réu seja condenado a pagar indenização de R$ X por danos morais..." />
                </F>
              </G1>
            </>}

            {/* ── Step 3: Documentos ──────────────────────────────── */}
            {step === 3 && <>
              <h2 style={{ color:"white", fontSize:20, fontWeight:900, margin:"0 0 4px" }}>Documentos</h2>
              <p style={{ color:"rgba(180,210,255,0.5)", fontSize:13, margin:"0 0 16px" }}>Envie seus documentos e provas</p>
              <div style={{ background:"rgba(254,224,1,0.06)", border:"1px solid rgba(254,224,1,0.18)", borderRadius:12, padding:"12px 16px", fontSize:13, color:"rgba(254,224,1,0.8)", lineHeight:1.6, marginBottom:20 }}>
                <strong style={{ color:gold }}>Dica:</strong> Envie documentos nítidos em PDF, JPG ou PNG. Quanto mais provas, mais forte é o seu caso.
              </div>
              <G1>
                <UploadField label="CNH, CPF ou RG (documento de identidade)" req bucket="case-documents" folder={email||"anon"} onDone={setDocId} />
                <UploadField label="Comprovante de Residência" req bucket="case-documents" folder={email||"anon"} onDone={setDocRes} />
                <UploadField label="Provas (fotos, prints, contratos, notas fiscais...)" bucket="case-provas" folder={email||"anon"} multi onDone={setProvas} />
              </G1>
            </>}

            {/* ── Step 4: Revisão ─────────────────────────────────── */}
            {step === 4 && <>
              <h2 style={{ color:"white", fontSize:20, fontWeight:900, margin:"0 0 4px" }}>Revisão e Confirmação</h2>
              <p style={{ color:"rgba(180,210,255,0.5)", fontSize:13, margin:"0 0 20px" }}>Confira os dados antes de enviar</p>
              <Block title="Autor">
                <RR label="Nome"       value={a.nome} />
                <RR label="CPF/CNPJ"   value={a.cpf} />
                <RR label="Telefone"   value={a.telefone} />
                <RR label="E-mail"     value={a.email} />
                <RR label="Endereço"   value={`${a.endereco}, ${a.numero}${a.complemento?` - ${a.complemento}`:""}, ${a.bairro}, ${a.cidade} - ${a.estado}`} />
              </Block>
              <Block title="Réu">
                <RR label="Nome"       value={r.nome} />
                <RR label="CPF/CNPJ"   value={r.cpf} />
                <RR label="Telefone"   value={r.telefone} />
                {r.email   && <RR label="E-mail"     value={r.email} />}
                {r.cidade  && <RR label="Localização" value={`${r.cidade} - ${r.estado}`} />}
              </Block>
              <Block title="Causa">
                <RR label="Valor"  value={`R$ ${c.valor}`} />
                <RR label="Fatos"  value={<span style={{ whiteSpace:"pre-wrap" }}>{c.fatos}</span>} />
                <RR label="Pedido" value={<span style={{ whiteSpace:"pre-wrap" }}>{c.pedido}</span>} />
              </Block>
              <Block title="Documentos">
                <RR label="Identidade"  value={docId[0]?.name   || "—"} />
                <RR label="Residência"  value={docRes[0]?.name  || "—"} />
                <RR label="Provas"      value={provas.length > 0 ? `${provas.length} arquivo(s)` : "—"} />
              </Block>
              {submitErr && (
                <div style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.3)", borderRadius:12, padding:"12px 16px", fontSize:13, color:"#fca5a5", marginBottom:12 }}>
                  ⚠️ {submitErr}
                </div>
              )}
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.25)", textAlign:"center", lineHeight:1.6, marginTop:8 }}>
                Ao confirmar, você declara que os dados são verdadeiros. Após o envio não é possível alterar.
              </p>
            </>}

            {/* ── Navigation ──────────────────────────────────────── */}
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
                  display:"flex", alignItems:"center", gap:8, padding:"12px 28px",
                  borderRadius:12, background:gold, color:dark,
                  fontSize:13, fontWeight:900, cursor:"pointer", border:"none",
                  boxShadow:`0 4px 0 0 #b8a000`, fontFamily:"inherit",
                  transition:"all 0.15s",
                }}>
                  Próximo →
                </button>
              ) : (
                <button type="button" onClick={submit} disabled={submitting} style={{
                  display:"flex", alignItems:"center", gap:8, padding:"12px 28px",
                  borderRadius:12, background: submitting ? "rgba(254,224,1,0.5)" : gold,
                  color:dark, fontSize:13, fontWeight:900, cursor: submitting ? "not-allowed" : "pointer",
                  border:"none", boxShadow:`0 4px 0 0 #b8a000`, fontFamily:"inherit",
                }}>
                  {submitting ? "⏳ Enviando..." : "✓ Confirmar Envio"}
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
