import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

/* ─── Constants ─────────────────────────────────────────── */
const ESTADOS_MAP: Record<string, string> = {
  AC:"Acre",AL:"Alagoas",AP:"Amapá",AM:"Amazonas",BA:"Bahia",
  CE:"Ceará",DF:"Distrito Federal",ES:"Espírito Santo",GO:"Goiás",
  MA:"Maranhão",MT:"Mato Grosso",MS:"Mato Grosso do Sul",MG:"Minas Gerais",
  PA:"Pará",PB:"Paraíba",PR:"Paraná",PE:"Pernambuco",PI:"Piauí",
  RJ:"Rio de Janeiro",RN:"Rio Grande do Norte",RS:"Rio Grande do Sul",
  RO:"Rondônia",RR:"Roraima",SC:"Santa Catarina",SP:"São Paulo",
  SE:"Sergipe",TO:"Tocantins"
};

/* ─── Masks ──────────────────────────────────────────────── */
function maskPhone(v: string) {
  v = v.replace(/\D/g,"");
  if(v.length<=10) return v.replace(/(\d{2})(\d{4})(\d{0,4})/,"($1) $2-$3");
  return v.replace(/(\d{2})(\d{5})(\d{0,4})/,"($1) $2-$3");
}
function maskCpfCnpj(v: string) {
  v = v.replace(/\D/g,"");
  if(v.length<=11) return v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/,"$1.$2.$3-$4");
  return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/,"$1.$2.$3/$4-$5");
}
function maskCep(v: string) { return v.replace(/\D/g,"").replace(/(\d{5})(\d{0,3})/,"$1-$2"); }
function maskCurrency(v: string) {
  const digits = v.replace(/\D/g,"").padStart(3,"0");
  const int = parseInt(digits.slice(0,-2)||"0",10).toString().replace(/\B(?=(\d{3})+(?!\d))/g,".");
  return "R$ "+int+","+digits.slice(-2);
}

/* ─── CEP lookup ─────────────────────────────────────────── */
async function fetchCep(cep: string) {
  const c = cep.replace(/\D/g,"");
  if(c.length!==8) return null;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${c}/json/`);
    const d = await r.json();
    if(d.erro) return null;
    return { rua: d.logradouro, bairro: d.bairro, cidade: d.localidade, uf: d.uf };
  } catch { return null; }
}

/* ─── Upload helper ──────────────────────────────────────── */
async function uploadFile(file: File, folder: string): Promise<string|null> {
  const ext = file.name.split(".").pop();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("pequenas-causas-docs").upload(path, file, { upsert: false });
  if(error) { console.error("Upload error:", error); return null; }
  const { data } = supabase.storage.from("pequenas-causas-docs").getPublicUrl(path);
  return data.publicUrl;
}

/* ─── UploadZone component ───────────────────────────────── */
function UploadZone({ label, icon, accept, multiple, onFilesAdded, urls, onRemove }:{
  label:string; icon:string; accept:string; multiple:boolean;
  onFilesAdded:(files:File[])=>void; urls:string[]; onRemove:(i:number)=>void;
}) {
  const [dragging,setDragging]=useState(false);
  const ref=useRef<HTMLInputElement>(null);
  const handle=(files:FileList|null)=>{
    if(!files) return;
    onFilesAdded(Array.from(files));
  };
  return (
    <div>
      {urls.length>0&&<div className="mb-2 flex flex-wrap gap-2">
        {urls.map((u,i)=>(
          <div key={i} className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded px-2 py-1 text-xs text-blue-700">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
            Arquivo {i+1}
            <button type="button" onClick={()=>onRemove(i)} className="ml-1 text-red-400 hover:text-red-600 font-bold">×</button>
          </div>
        ))}
      </div>}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${dragging?"border-blue-400 bg-blue-50":"border-gray-300 hover:border-blue-300 hover:bg-gray-50"}`}
        onDragOver={e=>{e.preventDefault();setDragging(true);}}
        onDragLeave={()=>setDragging(false)}
        onDrop={e=>{e.preventDefault();setDragging(false);handle(e.dataTransfer.files);}}
        onClick={()=>ref.current?.click()}
      >
        <div className="text-3xl mb-2">{icon}</div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-xs text-gray-400 mt-1">(Formatos aceitos: PDF, JPG, PNG)</p>
        <input ref={ref} type="file" className="hidden" accept={accept} multiple={multiple} onChange={e=>handle(e.target.files)}/>
      </div>
    </div>
  );
}

/* ─── Section header ─────────────────────────────────────── */
function SectionTitle({ title, color="blue" }:{ title:string; color?:"blue"|"orange"|"purple" }) {
  const cls={ blue:"border-blue-600 text-blue-900", orange:"border-orange-500 text-orange-900", purple:"border-purple-600 text-purple-900" }[color];
  return <h2 className={`text-lg font-bold border-l-4 pl-3 mb-4 ${cls}`}>{title}</h2>;
}

/* ─── Field label ────────────────────────────────────────── */
function Label({ icon, text, required }:{ icon:string; text:string; required?:boolean }) {
  return <label className="block text-sm font-medium text-gray-700 mb-1">
    <span className="mr-1">{icon}</span>{text}{required&&<span className="text-red-500 ml-0.5">*</span>}
  </label>;
}

/* ─── Input component ────────────────────────────────────── */
function Input({ value, onChange, placeholder, className="" }:{
  value:string; onChange:(v:string)=>void; placeholder?:string; className?:string;
}) {
  return <input
    type="text" value={value} placeholder={placeholder}
    onChange={e=>onChange(e.target.value)}
    className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent ${className}`}
  />;
}

/* ─── Select component ───────────────────────────────────── */
function Select({ value, onChange, options, placeholder }:{
  value:string; onChange:(v:string)=>void; options:{value:string;label:string}[]; placeholder?:string;
}) {
  return <select
    value={value} onChange={e=>onChange(e.target.value)}
    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
  >
    <option value="">{placeholder||"Selecione"}</option>
    {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
  </select>;
}

/* ─── Textarea ───────────────────────────────────────────── */
function Textarea({ value, onChange, placeholder, rows=4 }:{
  value:string; onChange:(v:string)=>void; placeholder?:string; rows?:number;
}) {
  return <textarea
    value={value} rows={rows} placeholder={placeholder}
    onChange={e=>onChange(e.target.value)}
    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
  />;
}

/* ─── Address block ──────────────────────────────────────── */
function AddressBlock({ prefix, data, onChange }:{
  prefix:string;
  data:{ cep:string; uf:string; cidade:string; bairro:string; rua:string; numero:string; complemento:string };
  onChange:(field:string,val:string)=>void;
}) {
  const [loading,setLoading]=useState(false);
  const handleCep = async (val:string) => {
    const masked = maskCep(val);
    onChange("cep", masked);
    if(masked.replace(/\D/g,"").length===8) {
      setLoading(true);
      const r = await fetchCep(masked);
      setLoading(false);
      if(r) {
        onChange("rua", r.rua);
        onChange("bairro", r.bairro);
        onChange("cidade", r.cidade);
        onChange("uf", r.uf);
      }
    }
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <Label icon="📍" text="CEP" required/>
        <div className="relative">
          <Input value={data.cep} onChange={handleCep} placeholder="00000-000"/>
          {loading&&<span className="absolute right-2 top-2 text-xs text-gray-400">buscando...</span>}
        </div>
      </div>
      <div>
        <Label icon="🗺️" text="Estado" required/>
        <Select value={data.uf} onChange={v=>onChange("uf",v)}
          options={Object.entries(ESTADOS_MAP).map(([k,v])=>({value:k,label:v}))}
          placeholder="Selecione um estado"/>
      </div>
      <div>
        <Label icon="🏙️" text="Cidade" required/>
        <Input value={data.cidade} onChange={v=>onChange("cidade",v)} placeholder="Cidade"/>
      </div>
      <div>
        <Label icon="🏘️" text="Bairro" required/>
        <Input value={data.bairro} onChange={v=>onChange("bairro",v)} placeholder="Bairro"/>
      </div>
      <div className="md:col-span-2">
        <Label icon="📍" text="Endereço" required/>
        <Input value={data.rua} onChange={v=>onChange("rua",v)} placeholder="Rua, Avenida..."/>
      </div>
      <div>
        <Label icon="#️⃣" text="Número" required/>
        <Input value={data.numero} onChange={v=>onChange("numero",v)} placeholder="Número"/>
      </div>
      <div>
        <Label icon="🏢" text="Complemento"/>
        <Input value={data.complemento} onChange={v=>onChange("complemento",v)} placeholder="Bloco, apartamento, referência..."/>
      </div>
    </div>
  );
}

/* ─── Types ──────────────────────────────────────────────── */
interface Autor {
  nome:string; cpf_cnpj:string; rg:string; telefone:string; email:string;
  estado_civil:string; profissao:string;
  cep:string; uf:string; cidade:string; bairro:string; rua:string; numero:string; complemento:string;
  doc_identidade_urls:string[]; doc_residencia_urls:string[];
  doc_identidade_pendentes:File[]; doc_residencia_pendentes:File[];
}

interface Reu {
  nome:string; cpf_cnpj:string; rg:string;
  telefone1:string; telefone2:string; email:string;
  cep:string; uf:string; cidade:string; bairro:string; rua:string; numero:string; complemento:string;
}

interface Testemunha { nome:string; cpf:string; telefone:string; email:string; }

function emptyAutor(email=""): Autor {
  return { nome:"", cpf_cnpj:"", rg:"", telefone:"", email, estado_civil:"", profissao:"",
    cep:"", uf:"", cidade:"", bairro:"", rua:"", numero:"", complemento:"",
    doc_identidade_urls:[], doc_residencia_urls:[], doc_identidade_pendentes:[], doc_residencia_pendentes:[] };
}
function emptyReu(): Reu {
  return { nome:"", cpf_cnpj:"", rg:"", telefone1:"", telefone2:"", email:"",
    cep:"", uf:"", cidade:"", bairro:"", rua:"", numero:"", complemento:"" };
}
function emptyTestemunha(): Testemunha { return { nome:"", cpf:"", telefone:"", email:"" }; }

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function ClientArea() {
  const [,nav] = useLocation();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submissionId, setSubmissionId] = useState<string|null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  /* ── Form state ── */
  const [autores, setAutores] = useState<Autor[]>([emptyAutor()]);
  const [incluirTestemunhas, setIncluirTestemunhas] = useState(false);
  const [testemunhas, setTestemunhas] = useState<Testemunha[]>([emptyTestemunha()]);
  const [reus, setReus] = useState<Reu[]>([emptyReu()]);
  const [valorCausa, setValorCausa] = useState("R$ 0,00");
  const [fatos, setFatos] = useState("");
  const [pedido, setPedido] = useState("");
  const [linksVideo, setLinksVideo] = useState([""]);
  const [provasDocs, setProvasDocs] = useState<string[]>([]);
  const [provasDocsPendentes, setProvasDocsPendentes] = useState<File[]>([]);
  const [docVeiculo, setDocVeiculo] = useState<string[]>([]);
  const [docVeiculoPendentes, setDocVeiculoPendentes] = useState<File[]>([]);

  /* ── Auth guard + load data ── */
  useEffect(()=>{
    (async()=>{
      const { data:{ session } } = await supabase.auth.getSession();
      if(!session) { nav("/login"); return; }
      const email = session.user.email||"";
      setUserEmail(email);

      // load existing row
      const { data } = await supabase
        .from("pequenas_causas_submissions")
        .select("*")
        .eq("autor_email", email)
        .single();

      if(data) {
        setSubmissionId(data.id);
        setAutores([{
          nome: data.autor_nome||"",
          cpf_cnpj: data.autor_cpf||data.autor_cnpj||"",
          rg: data.autor_rg||"",
          telefone: data.autor_telefone||"",
          email: data.autor_email||"",
          estado_civil: data.autor_estado_civil||"",
          profissao: data.autor_profissao||"",
          cep: data.autor_cep||"",
          uf: data.autor_estado_uf||"",
          cidade: data.autor_cidade||"",
          bairro: data.autor_bairro||"",
          rua: data.autor_rua||"",
          numero: data.autor_numero||"",
          complemento: data.autor_complemento||"",
          doc_identidade_urls: data.doc_identidade_urls||[],
          doc_residencia_urls: data.doc_residencia_urls||[],
          doc_identidade_pendentes: [],
          doc_residencia_pendentes: [],
        }, ...(data.autores_adicionais||[]).map((a:any)=>({...emptyAutor(), ...a, doc_identidade_pendentes:[], doc_residencia_pendentes:[]}))]);
        setIncluirTestemunhas(data.incluir_testemunhas||false);
        setTestemunhas(data.testemunhas_dados?.length ? data.testemunhas_dados : [emptyTestemunha()]);
        const r = { nome: data.reu_nome||"", cpf_cnpj: data.reu_cpf||data.reu_cnpj||"",
          rg: data.reu_rg||"", telefone1: data.reu_telefone||"", telefone2: data.reu_telefone_2||"",
          email: data.reu_email||"", cep: data.reu_cep||"", uf: data.reu_estado_uf||"",
          cidade: data.reu_cidade||"", bairro: data.reu_bairro||"", rua: data.reu_rua||"",
          numero: data.reu_numero||"", complemento: data.reu_complemento||"" };
        setReus([r, ...(data.reus_adicionais||[])]);
        if(data.valor_estimado) setValorCausa(data.valor_estimado);
        setFatos(data.descricao_fatos||"");
        setPedido(data.pretensao||"");
        try { const lv=JSON.parse(data.links_midia||"[]"); setLinksVideo(lv.length?lv:[""]); } catch{ setLinksVideo([""]); }
        setProvasDocs(data.provas_docs_urls||[]);
        setDocVeiculo(data.doc_veiculo_urls||[]);
        if(data.formulario_enviado_em) setSubmitted(true);
      } else {
        setAutores([emptyAutor(email)]);
      }
      setLoading(false);
    })();
  },[nav]);

  /* ── Signout ── */
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    nav("/login");
  };

  /* ── Save draft (sem marcar como enviado) ── */
  const saveDraft = useCallback(async () => {
    if(!userEmail || submitted) return;
    const a0 = autores[0];
    const r0 = reus[0];
    const payload: Record<string,any> = {
      autor_nome: a0.nome,
      autor_cpf: a0.cpf_cnpj,
      autor_rg: a0.rg,
      autor_telefone: a0.telefone,
      autor_email: a0.email || userEmail,
      autor_estado_civil: a0.estado_civil,
      autor_profissao: a0.profissao,
      autor_cep: a0.cep,
      autor_estado_uf: a0.uf,
      autor_cidade: a0.cidade,
      autor_bairro: a0.bairro,
      autor_rua: a0.rua,
      autor_numero: a0.numero,
      autor_complemento: a0.complemento,
      reu_nome: r0.nome,
      reu_cpf: r0.cpf_cnpj,
      reu_rg: r0.rg,
      reu_telefone: r0.telefone1,
      reu_email: r0.email,
      reu_cep: r0.cep,
      reu_estado_uf: r0.uf,
      reu_cidade: r0.cidade,
      reu_bairro: r0.bairro,
      reu_rua: r0.rua,
      reu_numero: r0.numero,
      reu_complemento: r0.complemento,
      reus_adicionais: reus.slice(1),
      incluir_testemunhas: incluirTestemunhas,
      testemunhas_dados: incluirTestemunhas ? testemunhas : [],
      valor_estimado: valorCausa,
      descricao_fatos: fatos,
      pretensao: pedido,
      links_midia: JSON.stringify(linksVideo.filter(l=>l.trim())),
      provas_docs_urls: provasDocs,
      doc_veiculo_urls: docVeiculo,
      disponivel_para_advogados: false,
    };
    try {
      if(submissionId) {
        await supabase.from("pequenas_causas_submissions").update(payload).eq("id", submissionId);
      } else {
        const { data: inserted } = await supabase
          .from("pequenas_causas_submissions")
          .insert({ ...payload, status: "aguardando_analise" })
          .select("id")
          .single();
        if(inserted?.id) setSubmissionId(inserted.id);
      }
      setSaveMsg("✓ Salvo às " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    } catch {
      setSaveMsg("⚠️ Erro ao salvar rascunho");
    }
  }, [userEmail, submitted, submissionId, autores, reus, incluirTestemunhas, testemunhas, valorCausa, fatos, pedido, linksVideo, provasDocs, docVeiculo]);

  /* ── Autosave a cada 30 segundos ── */
  useEffect(() => {
    if(loading || submitted) return;
    const timer = setInterval(saveDraft, 30_000);
    return () => clearInterval(timer);
  }, [saveDraft, loading, submitted]);

  /* ── Autor helpers ── */
  const updateAutor = (i:number, field:string, val:string) => {
    setAutores(prev=>prev.map((a,idx)=>idx===i?{...a,[field]:val}:a));
  };
  const updateAutorAddr = (i:number, field:string, val:string) => {
    setAutores(prev=>prev.map((a,idx)=>idx===i?{...a,[field]:val}:a));
  };
  const addAutor = () => setAutores(prev=>[...prev, emptyAutor()]);
  const removeAutor = (i:number) => setAutores(prev=>prev.filter((_,idx)=>idx!==i));

  /* ── Réu helpers ── */
  const updateReu = (i:number, field:string, val:string) => {
    setReus(prev=>prev.map((r,idx)=>idx===i?{...r,[field]:val}:r));
  };
  const updateReuAddr = (i:number, field:string, val:string) => {
    setReus(prev=>prev.map((r,idx)=>idx===i?{...r,[field]:val}:r));
  };
  const addReu = () => setReus(prev=>[...prev, emptyReu()]);
  const removeReu = (i:number) => setReus(prev=>prev.filter((_,idx)=>idx!==i));

  /* ── Testemunha helpers ── */
  const updateTest = (i:number, field:string, val:string) => {
    setTestemunhas(prev=>prev.map((t,idx)=>idx===i?{...t,[field]:val}:t));
  };

  /* ── Upload all pending files ── */
  const uploadAllFiles = async () => {
    const updatedAutores = [...autores];
    for(let i=0;i<updatedAutores.length;i++){
      const a = updatedAutores[i];
      // identidade
      const idents = [...a.doc_identidade_urls];
      for(const f of a.doc_identidade_pendentes) {
        const url = await uploadFile(f, `identidade`);
        if(url) idents.push(url);
      }
      // residência
      const resids = [...a.doc_residencia_urls];
      for(const f of a.doc_residencia_pendentes) {
        const url = await uploadFile(f, `residencia`);
        if(url) resids.push(url);
      }
      updatedAutores[i] = {...a, doc_identidade_urls:idents, doc_residencia_urls:resids,
        doc_identidade_pendentes:[], doc_residencia_pendentes:[]};
    }
    setAutores(updatedAutores);

    // provas docs
    const newProvasDocs = [...provasDocs];
    for(const f of provasDocsPendentes) {
      const url = await uploadFile(f, `provas`);
      if(url) newProvasDocs.push(url);
    }
    setProvasDocs(newProvasDocs);
    setProvasDocsPendentes([]);

    // doc veículo
    const newDocVeiculo = [...docVeiculo];
    for(const f of docVeiculoPendentes) {
      const url = await uploadFile(f, `veiculo`);
      if(url) newDocVeiculo.push(url);
    }
    setDocVeiculo(newDocVeiculo);
    setDocVeiculoPendentes([]);

    return { updatedAutores, newProvasDocs, newDocVeiculo };
  };

  /* ── Save/Submit ── */
  const handleSubmit = async () => {
    setSubmitting(true);
    setShowModal(false);
    try {
      const { updatedAutores, newProvasDocs, newDocVeiculo } = await uploadAllFiles();
      const a0 = updatedAutores[0];
      const r0 = reus[0];
      const linksValidos = linksVideo.filter(l=>l.trim());

      const payload: Record<string,any> = {
        autor_nome: a0.nome,
        autor_cpf: a0.cpf_cnpj,
        autor_rg: a0.rg,
        autor_telefone: a0.telefone,
        autor_email: a0.email,
        autor_estado_civil: a0.estado_civil,
        autor_profissao: a0.profissao,
        autor_cep: a0.cep,
        autor_estado_uf: a0.uf,
        autor_cidade: a0.cidade,
        autor_bairro: a0.bairro,
        autor_rua: a0.rua,
        autor_numero: a0.numero,
        autor_complemento: a0.complemento,
        doc_identidade_urls: a0.doc_identidade_urls,
        doc_residencia_urls: a0.doc_residencia_urls,
        autores_adicionais: updatedAutores.slice(1).map(({doc_identidade_pendentes:_,doc_residencia_pendentes:__,...rest})=>rest),
        incluir_testemunhas: incluirTestemunhas,
        testemunhas_dados: incluirTestemunhas ? testemunhas : [],
        reu_nome: r0.nome,
        reu_cpf: r0.cpf_cnpj,
        reu_rg: r0.rg,
        reu_telefone: r0.telefone1,
        reu_telefone_2: r0.telefone2,
        reu_email: r0.email,
        reu_cep: r0.cep,
        reu_estado_uf: r0.uf,
        reu_cidade: r0.cidade,
        reu_bairro: r0.bairro,
        reu_rua: r0.rua,
        reu_numero: r0.numero,
        reu_complemento: r0.complemento,
        reus_adicionais: reus.slice(1),
        valor_estimado: valorCausa,
        descricao_fatos: fatos,
        pretensao: pedido,
        links_midia: JSON.stringify(linksValidos),
        provas_docs_urls: newProvasDocs,
        doc_veiculo_urls: newDocVeiculo,
        formulario_enviado_em: new Date().toISOString(),
        disponivel_para_advogados: true,
        status: "aguardando_analise",
      };

      if(submissionId) {
        await supabase.from("pequenas_causas_submissions").update(payload).eq("id", submissionId);
      } else {
        // Primeira submissão — cria o registro
        const { data: inserted } = await supabase
          .from("pequenas_causas_submissions")
          .insert({ ...payload, status: "aguardando_analise" })
          .select("id")
          .single();
        if(inserted?.id) setSubmissionId(inserted.id);
      }
      setSubmitted(true);
    } catch(err) {
      console.error(err);
      alert("Erro ao enviar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ─────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────── */
  if(loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-gray-500 text-sm">Carregando seus dados...</p>
      </div>
    </div>
  );

  if(submitted) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-lg text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Formulário enviado!</h1>
        <p className="text-gray-600 mb-2">Seus dados foram recebidos com sucesso.</p>
        <p className="text-gray-500 text-sm">Nossa equipe irá analisar seu caso e entrar em contato em breve.</p>
        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-left">
          <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-2">Próximos passos</p>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>✅ Formulário recebido</li>
            <li>⏳ Análise pela equipe (até 2 dias úteis)</li>
            <li>⏳ Designação de advogado</li>
            <li>⏳ Abertura do processo</li>
          </ul>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={()=>nav("/area-do-cliente")}
            className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
            Ir para o Portal →
          </button>
          <button onClick={handleSignOut} className="text-sm text-gray-500 hover:text-gray-700 underline">
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">PC</span>
            </div>
            <span className="font-semibold text-gray-800 text-sm">Pequenas Causas</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 hidden sm:block">{userEmail}</span>
            <button onClick={()=>nav("/area-do-cliente")}
              className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 rounded px-3 py-1 transition-colors font-medium">
              ← Portal
            </button>
            <button onClick={handleSignOut}
              className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 rounded px-3 py-1 transition-colors">
              Sair
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* ─── Banner ─── */}
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-600">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h1 className="text-xl font-bold text-gray-900">Orientações Importantes</h1>
            {saveMsg && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                {saveMsg}
              </span>
            )}
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✅</span>
              <div><strong>Preencha com tranquilidade!</strong> Seus dados ficam salvos automaticamente.<br/>
                <span className="text-gray-400">Você pode iniciar agora e finalizar depois.</span></div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">💬</span>
              <div>Dúvidas? <a href="https://wa.me/5511911824642" target="_blank" rel="noreferrer"
                className="text-green-600 underline font-medium">Fale conosco via WhatsApp</a> a qualquer momento.</div>
            </div>
          </div>
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            <p className="font-semibold mb-1">⚠️ Sua atenção é fundamental</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs">
              <li>Verifique cuidadosamente todas as informações</li>
              <li>Certifique-se de anexar todos os documentos necessários</li>
            </ul>
          </div>
          <p className="text-xs text-red-500 mt-3">* Campos obrigatórios</p>
        </div>

        {/* ─── AUTORES ─── */}
        {autores.map((autor, ai)=>(
          <div key={ai} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle title={`Autor ${ai+1}`}/>
              {ai>0&&<button type="button" onClick={()=>removeAutor(ai)}
                className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded px-2 py-1">
                Remover Autor
              </button>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="md:col-span-2">
                <Label icon="👤" text="Nome completo" required/>
                <Input value={autor.nome} onChange={v=>updateAutor(ai,"nome",v)} placeholder="Nome completo"/>
              </div>
              <div>
                <Label icon="🪪" text="CPF / CNPJ" required/>
                <Input value={autor.cpf_cnpj}
                  onChange={v=>updateAutor(ai,"cpf_cnpj",maskCpfCnpj(v))}
                  placeholder="Digite o CPF ou CNPJ"/>
              </div>
              <div>
                <Label icon="🪪" text="RG" required/>
                <Input value={autor.rg} onChange={v=>updateAutor(ai,"rg",v)} placeholder="Informe o RG"/>
              </div>
              <div>
                <Label icon="📞" text="Telefone" required/>
                <Input value={autor.telefone}
                  onChange={v=>updateAutor(ai,"telefone",maskPhone(v))}
                  placeholder="(00) 00000-0000"/>
              </div>
              <div>
                <Label icon="❤️" text="Estado Civil" required/>
                <Select value={autor.estado_civil} onChange={v=>updateAutor(ai,"estado_civil",v)}
                  options={["Solteiro(a)","Casado(a)","Divorciado(a)","Viúvo(a)","União Estável"].map(s=>({value:s,label:s}))}/>
              </div>
              <div>
                <Label icon="✉️" text="E-mail" required/>
                <Input value={autor.email} onChange={v=>updateAutor(ai,"email",v)} placeholder="exemplo@email.com"/>
              </div>
              <div>
                <Label icon="💼" text="Profissão" required/>
                <Input value={autor.profissao} onChange={v=>updateAutor(ai,"profissao",v)} placeholder="Informe sua profissão"/>
              </div>
            </div>

            <div className="mb-4">
              <SectionTitle title="Seu endereço" color="blue"/>
              <AddressBlock prefix={`autor${ai}`} data={{ cep:autor.cep, uf:autor.uf, cidade:autor.cidade, bairro:autor.bairro, rua:autor.rua, numero:autor.numero, complemento:autor.complemento }}
                onChange={(field,val)=>updateAutorAddr(ai,field,val)}/>
            </div>

            <div>
              <SectionTitle title="Documentos" color="blue"/>
              <p className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded px-3 py-1 mb-3">ℹ️ Tamanho máximo por arquivo: 5MB</p>
              <div className="space-y-4">
                <div>
                  <Label icon="🪪" text="Documento (CNH / CPF / RG)" required/>
                  <UploadZone label="Clique ou arraste para enviar seu documento" icon="🪪"
                    accept=".pdf,.jpg,.jpeg,.png" multiple={false}
                    urls={autor.doc_identidade_urls}
                    onFilesAdded={files=>setAutores(prev=>prev.map((a,idx)=>idx===ai?{...a,doc_identidade_pendentes:[...a.doc_identidade_pendentes,...files]}:a))}
                    onRemove={i=>setAutores(prev=>prev.map((a,idx)=>idx===ai?{...a,doc_identidade_urls:a.doc_identidade_urls.filter((_,ii)=>ii!==i)}:a))}
                  />
                  {autor.doc_identidade_pendentes.length>0&&
                    <p className="text-xs text-amber-600 mt-1">📎 {autor.doc_identidade_pendentes.length} arquivo(s) aguardando envio</p>}
                </div>
                <div>
                  <Label icon="🏠" text="Comprovante de residência (água, luz ou telefone - até 60 dias)" required/>
                  <UploadZone label="Tire uma foto ou envie o comprovante" icon="📄"
                    accept=".pdf,.jpg,.jpeg,.png" multiple={false}
                    urls={autor.doc_residencia_urls}
                    onFilesAdded={files=>setAutores(prev=>prev.map((a,idx)=>idx===ai?{...a,doc_residencia_pendentes:[...a.doc_residencia_pendentes,...files]}:a))}
                    onRemove={i=>setAutores(prev=>prev.map((a,idx)=>idx===ai?{...a,doc_residencia_urls:a.doc_residencia_urls.filter((_,ii)=>ii!==i)}:a))}
                  />
                  {autor.doc_residencia_pendentes.length>0&&
                    <p className="text-xs text-amber-600 mt-1">📎 {autor.doc_residencia_pendentes.length} arquivo(s) aguardando envio</p>}
                </div>
              </div>
            </div>
          </div>
        ))}

        <button type="button" onClick={addAutor}
          className="w-full py-2.5 border-2 border-dashed border-blue-300 text-blue-600 hover:border-blue-500 hover:bg-blue-50 rounded-xl text-sm font-medium transition-colors">
          + Adicionar outro Autor
        </button>

        {/* ─── TESTEMUNHAS ─── */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <SectionTitle title="Testemunhas" color="purple"/>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 select-none">
            <input type="checkbox" checked={incluirTestemunhas}
              onChange={e=>setIncluirTestemunhas(e.target.checked)}
              className="w-4 h-4 accent-purple-600"/>
            Deseja incluir dados de testemunhas?
          </label>
          {incluirTestemunhas&&(
            <div className="mt-4 space-y-4">
              {testemunhas.map((t,ti)=>(
                <div key={ti} className="bg-purple-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-semibold text-purple-800">Testemunha {ti+1}</p>
                    {ti>0&&<button type="button" onClick={()=>setTestemunhas(p=>p.filter((_,i)=>i!==ti))}
                      className="text-xs text-red-500">Remover</button>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div><Label icon="👤" text="Nome" required/><Input value={t.nome} onChange={v=>updateTest(ti,"nome",v)} placeholder="Nome completo"/></div>
                    <div><Label icon="🪪" text="CPF"/><Input value={t.cpf} onChange={v=>updateTest(ti,"cpf",maskCpfCnpj(v))} placeholder="CPF"/></div>
                    <div><Label icon="📞" text="Telefone"/><Input value={t.telefone} onChange={v=>updateTest(ti,"telefone",maskPhone(v))} placeholder="(00) 00000-0000"/></div>
                    <div><Label icon="✉️" text="E-mail"/><Input value={t.email} onChange={v=>updateTest(ti,"email",v)} placeholder="exemplo@email.com"/></div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={()=>setTestemunhas(p=>[...p,emptyTestemunha()])}
                className="text-sm text-purple-600 border border-purple-300 rounded px-3 py-1.5 hover:bg-purple-50">
                + Adicionar testemunha
              </button>
            </div>
          )}
        </div>

        {/* ─── RÉUS ─── */}
        {reus.map((reu,ri)=>(
          <div key={ri} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle title={`Réu ${ri+1}`} color="orange"/>
              {ri>0&&<button type="button" onClick={()=>removeReu(ri)}
                className="text-xs text-red-500 border border-red-200 rounded px-2 py-1">
                Remover Réu
              </button>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="md:col-span-2">
                <Label icon="👤" text="Réu(s)/Reclamado(s)" required/>
                <Input value={reu.nome} onChange={v=>updateReu(ri,"nome",v)} placeholder="Nome completo do réu/reclamado"/>
              </div>
              <div>
                <Label icon="🪪" text="CPF / CNPJ" required/>
                <Input value={reu.cpf_cnpj} onChange={v=>updateReu(ri,"cpf_cnpj",maskCpfCnpj(v))} placeholder="Digite o CPF ou CNPJ"/>
              </div>
              <div>
                <Label icon="🪪" text="RG (caso pessoa física)"/>
                <Input value={reu.rg} onChange={v=>updateReu(ri,"rg",v)} placeholder="Informe o RG"/>
              </div>
              <div>
                <Label icon="📞" text="Telefone 1" required/>
                <Input value={reu.telefone1} onChange={v=>updateReu(ri,"telefone1",maskPhone(v))} placeholder="(00) 00000-0000"/>
              </div>
              <div>
                <Label icon="📞" text="Telefone 2"/>
                <Input value={reu.telefone2} onChange={v=>updateReu(ri,"telefone2",maskPhone(v))} placeholder="(00) 00000-0000"/>
              </div>
              <div className="md:col-span-2">
                <Label icon="✉️" text="E-mail"/>
                <Input value={reu.email} onChange={v=>updateReu(ri,"email",v)} placeholder="exemplo@email.com"/>
              </div>
            </div>
            <div>
              <SectionTitle title="Endereço do Réu/Reclamado" color="orange"/>
              <AddressBlock prefix={`reu${ri}`}
                data={{ cep:reu.cep, uf:reu.uf, cidade:reu.cidade, bairro:reu.bairro, rua:reu.rua, numero:reu.numero, complemento:reu.complemento }}
                onChange={(field,val)=>updateReuAddr(ri,field,val)}/>
            </div>
          </div>
        ))}

        <button type="button" onClick={addReu}
          className="w-full py-2.5 border-2 border-dashed border-orange-300 text-orange-600 hover:border-orange-500 hover:bg-orange-50 rounded-xl text-sm font-medium transition-colors">
          + Adicionar outro Réu
        </button>

        {/* ─── DETALHES DA CAUSA ─── */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <SectionTitle title="Detalhes da causa"/>
          <div className="space-y-4">
            <div>
              <Label icon="💰" text="Qual o valor que você pretende receber na justiça (R$)?" required/>
              <input type="text" value={valorCausa}
                onChange={e=>setValorCausa(maskCurrency(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"/>
            </div>
            <div>
              <Label icon="📝" text="FATOS: Descreva em detalhes, de forma exaustiva, tudo o que aconteceu. Informe datas, nomes e valores (se houver)." required/>
              <p className="text-xs text-blue-600 mb-1">O sucesso da sua causa depende muito do que você escreve aqui.</p>
              <Textarea value={fatos} onChange={setFatos} rows={6}
                placeholder="Exemplo: No dia 15/01/2024, comprei um produto da loja X no valor de R$ 500,00. No entanto, ao recebê-lo, percebi que estava com defeito..."/>
            </div>
            <div>
              <Label icon="⚖️" text="Pedido (o que você deseja conseguir na justiça?)" required/>
              <Textarea value={pedido} onChange={setPedido} rows={4}
                placeholder="Exemplo: Solicito o reembolso do valor pago, acrescido de danos morais, devido ao transtorno causado..."/>
            </div>
          </div>
        </div>

        {/* ─── PROVAS EM VÍDEOS/ÁUDIOS ─── */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <SectionTitle title="🎥 Provas em Vídeos e Áudios" color="purple"/>
          <p className="text-sm text-gray-600 mb-1">Cole links do Google Drive, OneDrive, etc. (Formato: MP3, MP4, WAV, AVI)</p>
          <p className="text-xs text-red-500 mb-3">Não serão aceitos outros formatos!</p>
          <div className="space-y-2">
            {linksVideo.map((link,li)=>(
              <div key={li} className="flex gap-2">
                <Input value={link}
                  onChange={v=>setLinksVideo(prev=>prev.map((l,i)=>i===li?v:l))}
                  placeholder="Ex: https://drive.google.com/..."/>
                {li>0&&<button type="button" onClick={()=>setLinksVideo(prev=>prev.filter((_,i)=>i!==li))}
                  className="text-red-400 hover:text-red-600 text-lg font-bold px-2">×</button>}
              </div>
            ))}
            <button type="button" onClick={()=>setLinksVideo(prev=>[...prev,""])}
              className="text-sm text-blue-600 hover:underline">+ Adicionar outro link</button>
          </div>
          <p className="text-xs text-gray-400 mt-3">Você é responsável pelos links: devem estar acessíveis sem senha, não corrompidos e com permissão de visualização.</p>
        </div>

        {/* ─── PROVAS DOCUMENTAIS ─── */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <SectionTitle title="📄 Provas Documentais"/>
          <p className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded px-3 py-1 mb-4">ℹ️ Tamanho máximo por arquivo: 5MB</p>
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                <span className="font-bold">1.</span> Fotos, prints, contratos, notas fiscais e/ou outros documentos <span className="text-red-500">*</span>
              </p>
              <UploadZone label="Arraste arquivos ou clique para selecionar" icon="📎"
                accept=".pdf,.jpg,.jpeg,.png" multiple={true}
                urls={provasDocs}
                onFilesAdded={files=>setProvasDocsPendentes(prev=>[...prev,...files])}
                onRemove={i=>setProvasDocs(prev=>prev.filter((_,ii)=>ii!==i))}
              />
              {provasDocsPendentes.length>0&&
                <p className="text-xs text-amber-600 mt-1">📎 {provasDocsPendentes.length} arquivo(s) aguardando envio</p>}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                <span className="font-bold">2.</span> Documento do veículo (<strong>obrigatório apenas para casos de trânsito</strong>, ou que envolvam compra e venda de veículos)
              </p>
              <UploadZone label="CRV, CRLV, fotos do veículo (Apenas para casos de trânsito)" icon="🚗"
                accept=".pdf,.jpg,.jpeg,.png" multiple={true}
                urls={docVeiculo}
                onFilesAdded={files=>setDocVeiculoPendentes(prev=>[...prev,...files])}
                onRemove={i=>setDocVeiculo(prev=>prev.filter((_,ii)=>ii!==i))}
              />
              {docVeiculoPendentes.length>0&&
                <p className="text-xs text-amber-600 mt-1">📎 {docVeiculoPendentes.length} arquivo(s) aguardando envio</p>}
            </div>
          </div>
        </div>

        {/* ─── SUBMIT ─── */}
        <div className="flex items-center justify-between pb-8 flex-wrap gap-3">
          <button type="button" onClick={saveDraft}
            className="text-sm text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-400 px-5 py-2.5 rounded-xl transition-colors">
            💾 Salvar rascunho
          </button>
          <button type="button" onClick={()=>setShowModal(true)}
            className="bg-gray-900 hover:bg-gray-700 text-white font-semibold px-8 py-3 rounded-xl text-sm transition-colors shadow">
            Enviar formulário →
          </button>
        </div>
      </div>

      {/* ─── Modal de confirmação ─── */}
      {showModal&&(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Confirmação Final</h2>
            <p className="text-sm text-gray-500 mb-4">Verifique atentamente antes de enviar!</p>
            <p className="text-sm font-medium text-gray-700 mb-3">Você confirma que todos os dados estão corretos e completos?</p>
            <ul className="space-y-2 mb-5">
              {["Seu problema/ocorrência está detalhado?","Todos os documentos foram anexados?","Os valores e datas estão corretos?","Endereços e contatos estão atualizados?"].map((q,i)=>(
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-blue-500 mt-0.5">✔️</span>{q}
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-400 mb-4">Na dúvida, peça ajuda! Nossa equipe está pronta para te auxiliar 😊</p>
            <div className="flex gap-3">
              <button type="button" onClick={()=>setShowModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                Revisar Dados
              </button>
              <button type="button" onClick={handleSubmit} disabled={submitting}
                className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60">
                {submitting?"Enviando...":"Confirmar Envio"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
