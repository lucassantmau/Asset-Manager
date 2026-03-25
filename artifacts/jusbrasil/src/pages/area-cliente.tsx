import React, { useEffect, useState, useRef, useCallback } from "react";
import { Layout } from "@/components/layout";
import { supabase } from "@/lib/supabase";
import {
  Plus, Trash2, Upload, X, CheckCircle2, AlertCircle,
  Loader2, Link2, Info, ChevronDown, ChevronUp,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Autor {
  id: string;
  nome: string; cpf: string; rg: string; telefone: string; email: string;
  estadoCivil: string; profissao: string; cep: string; endereco: string;
  numero: string; complemento: string; bairro: string; cidade: string; estado: string;
}

interface Reu {
  id: string;
  nome: string; cpf: string; rg: string; telefone1: string; telefone2: string;
  email: string; cep: string; endereco: string; numero: string;
  complemento: string; bairro: string; cidade: string; estado: string;
}

interface Testemunha {
  id: string; nome: string; cpf: string; telefone: string; email: string;
}

const emptyAutor = (): Autor => ({
  id: crypto.randomUUID(), nome: "", cpf: "", rg: "", telefone: "", email: "",
  estadoCivil: "", profissao: "", cep: "", endereco: "", numero: "",
  complemento: "", bairro: "", cidade: "", estado: "",
});
const emptyReu = (): Reu => ({
  id: crypto.randomUUID(), nome: "", cpf: "", rg: "", telefone1: "", telefone2: "",
  email: "", cep: "", endereco: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "",
});
const emptyTestemunha = (): Testemunha => ({
  id: crypto.randomUUID(), nome: "", cpf: "", telefone: "", email: "",
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className="block text-xs font-bold text-gray-700 mb-1">
    {children}{required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`w-full h-10 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all bg-white ${props.className || ""}`}
  />
);

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all bg-white resize-y ${props.className || ""}`}
  />
);

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) => (
  <select
    {...props}
    className={`w-full h-10 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all bg-white ${props.className || ""}`}
  />
);

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
      <h2 className="text-base font-bold text-gray-800">{title}</h2>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const ESTADOS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

// ─── File Upload ──────────────────────────────────────────────────────────────

function FileUploadField({
  label, accept, bucket, path, onUploaded, required,
}: {
  label: string; accept: string; bucket: string; path: string;
  onUploaded: (url: string, name: string) => void; required?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError(null);
    const filePath = `${path}/${Date.now()}_${file.name}`;
    const { data, error: err } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true });
    if (err) { setError("Erro ao enviar. Tente novamente."); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    setUploaded(file.name);
    onUploaded(urlData.publicUrl, file.name);
    setUploading(false);
    if (ref.current) ref.current.value = "";
  };

  return (
    <div>
      <Label required={required}>{label}</Label>
      <div
        onClick={() => ref.current?.click()}
        className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-all text-sm
          ${uploaded ? "border-green-400 bg-green-50 text-green-700" : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50 text-gray-500"}`}
      >
        {uploading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
        ) : uploaded ? (
          <><CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {uploaded}</>
        ) : (
          <><Upload className="w-4 h-4 flex-shrink-0" /> Clique para selecionar arquivo</>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={handleChange} />
    </div>
  );
}

function MultiFileUpload({
  label, accept, bucket, path, onUploaded,
}: {
  label: string; accept: string; bucket: string; path: string;
  onUploaded: (urls: { url: string; name: string }[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<{ url: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true); setError(null);
    const results: { url: string; name: string }[] = [];
    for (const file of files) {
      const filePath = `${path}/${Date.now()}_${file.name}`;
      const { error: err } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true });
      if (!err) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        results.push({ url: data.publicUrl, name: file.name });
      }
    }
    const all = [...uploaded, ...results];
    setUploaded(all);
    onUploaded(all);
    setUploading(false);
    if (ref.current) ref.current.value = "";
  };

  const remove = (i: number) => {
    const updated = uploaded.filter((_, idx) => idx !== i);
    setUploaded(updated);
    onUploaded(updated);
  };

  return (
    <div>
      <Label>{label}</Label>
      <div
        onClick={() => ref.current?.click()}
        className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50 rounded-lg cursor-pointer transition-all text-sm text-gray-500 mb-2"
      >
        {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : <><Upload className="w-4 h-4" /> Selecionar arquivos (múltiplos)</>}
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      {uploaded.map((f, i) => (
        <div key={i} className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-2 py-1 rounded mt-1">
          <CheckCircle2 className="w-3 h-3 flex-shrink-0" /> {f.name}
          <button type="button" onClick={() => remove(i)} className="ml-auto text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
        </div>
      ))}
      <input ref={ref} type="file" accept={accept} multiple className="hidden" onChange={handleChange} />
    </div>
  );
}

// ─── Autor Fields ─────────────────────────────────────────────────────────────

function AutorFields({ autor, onChange, onRemove, index, canRemove }: {
  autor: Autor; onChange: (a: Autor) => void; onRemove: () => void; index: number; canRemove: boolean;
}) {
  const f = (field: keyof Autor) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...autor, [field]: e.target.value });

  return (
    <div className="border border-gray-200 rounded-xl p-5 bg-gray-50 relative">
      {canRemove && (
        <button type="button" onClick={onRemove} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      )}
      <p className="text-xs font-bold text-blue-700 mb-4 uppercase tracking-wide">Autor {index + 1}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2"><Label required>Nome completo</Label><Input value={autor.nome} onChange={f("nome")} placeholder="Nome completo" /></div>
        <div><Label required>CPF / CNPJ</Label><Input value={autor.cpf} onChange={f("cpf")} placeholder="000.000.000-00" /></div>
        <div><Label>RG</Label><Input value={autor.rg} onChange={f("rg")} placeholder="RG" /></div>
        <div><Label required>Telefone</Label><Input value={autor.telefone} onChange={f("telefone")} placeholder="(11) 99999-9999" /></div>
        <div><Label required>E-mail</Label><Input type="email" value={autor.email} onChange={f("email")} placeholder="email@exemplo.com" /></div>
        <div>
          <Label>Estado Civil</Label>
          <Select value={autor.estadoCivil} onChange={f("estadoCivil")}>
            <option value="">Selecione</option>
            {["Solteiro(a)","Casado(a)","Divorciado(a)","Viúvo(a)","União Estável"].map(o => <option key={o}>{o}</option>)}
          </Select>
        </div>
        <div><Label>Profissão</Label><Input value={autor.profissao} onChange={f("profissao")} placeholder="Profissão" /></div>
        <div><Label required>CEP</Label><Input value={autor.cep} onChange={f("cep")} placeholder="00000-000" /></div>
        <div className="sm:col-span-2"><Label required>Endereço</Label><Input value={autor.endereco} onChange={f("endereco")} placeholder="Rua, Av..." /></div>
        <div><Label required>Número</Label><Input value={autor.numero} onChange={f("numero")} placeholder="N°" /></div>
        <div><Label>Complemento</Label><Input value={autor.complemento} onChange={f("complemento")} placeholder="Apto, bloco..." /></div>
        <div><Label required>Bairro</Label><Input value={autor.bairro} onChange={f("bairro")} placeholder="Bairro" /></div>
        <div><Label required>Cidade</Label><Input value={autor.cidade} onChange={f("cidade")} placeholder="Cidade" /></div>
        <div>
          <Label required>Estado</Label>
          <Select value={autor.estado} onChange={f("estado")}>
            <option value="">UF</option>
            {ESTADOS.map(uf => <option key={uf}>{uf}</option>)}
          </Select>
        </div>
      </div>
    </div>
  );
}

// ─── Réu Fields ───────────────────────────────────────────────────────────────

function ReuFields({ reu, onChange, onRemove, index, canRemove }: {
  reu: Reu; onChange: (r: Reu) => void; onRemove: () => void; index: number; canRemove: boolean;
}) {
  const f = (field: keyof Reu) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...reu, [field]: e.target.value });

  return (
    <div className="border border-gray-200 rounded-xl p-5 bg-gray-50 relative">
      {canRemove && (
        <button type="button" onClick={onRemove} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      )}
      <p className="text-xs font-bold text-red-700 mb-4 uppercase tracking-wide">Réu {index + 1}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2"><Label required>Nome / Razão Social</Label><Input value={reu.nome} onChange={f("nome")} placeholder="Nome ou razão social" /></div>
        <div><Label required>CPF / CNPJ</Label><Input value={reu.cpf} onChange={f("cpf")} placeholder="000.000.000-00" /></div>
        <div><Label>RG</Label><Input value={reu.rg} onChange={f("rg")} placeholder="RG" /></div>
        <div><Label required>Telefone 1</Label><Input value={reu.telefone1} onChange={f("telefone1")} placeholder="(11) 99999-9999" /></div>
        <div><Label>Telefone 2</Label><Input value={reu.telefone2} onChange={f("telefone2")} placeholder="(11) 99999-9999" /></div>
        <div><Label>E-mail</Label><Input type="email" value={reu.email} onChange={f("email")} placeholder="email@exemplo.com" /></div>
        <div><Label>CEP</Label><Input value={reu.cep} onChange={f("cep")} placeholder="00000-000" /></div>
        <div className="sm:col-span-2"><Label>Endereço</Label><Input value={reu.endereco} onChange={f("endereco")} placeholder="Rua, Av..." /></div>
        <div><Label>Número</Label><Input value={reu.numero} onChange={f("numero")} placeholder="N°" /></div>
        <div><Label>Complemento</Label><Input value={reu.complemento} onChange={f("complemento")} placeholder="Apto, bloco..." /></div>
        <div><Label>Bairro</Label><Input value={reu.bairro} onChange={f("bairro")} placeholder="Bairro" /></div>
        <div><Label>Cidade</Label><Input value={reu.cidade} onChange={f("cidade")} placeholder="Cidade" /></div>
        <div>
          <Label>Estado</Label>
          <Select value={reu.estado} onChange={f("estado")}>
            <option value="">UF</option>
            {ESTADOS.map(uf => <option key={uf}>{uf}</option>)}
          </Select>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AreaClientePage() {
  const [clientEmail, setClientEmail] = useState("");
  const [existingCase, setExistingCase] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Form state
  const [autores, setAutores] = useState<Autor[]>([emptyAutor()]);
  const [reus, setReus] = useState<Reu[]>([emptyReu()]);
  const [temTestemunhas, setTemTestemunhas] = useState(false);
  const [testemunhas, setTestemunhas] = useState<Testemunha[]>([emptyTestemunha()]);
  const [valorCausa, setValorCausa] = useState("");
  const [fatos, setFatos] = useState("");
  const [pedido, setPedido] = useState("");
  const [provasLinks, setProvasLinks] = useState<string[]>([""]);

  // File URLs
  const [docAutorCnh, setDocAutorCnh] = useState<{ url: string; name: string } | null>(null);
  const [docAutorResidencia, setDocAutorResidencia] = useState<{ url: string; name: string } | null>(null);
  const [provasDocumentais, setProvasDocumentais] = useState<{ url: string; name: string }[]>([]);
  const [docVeiculo, setDocVeiculo] = useState<{ url: string; name: string } | null>(null);

  // Check existing submission & get client email
  useEffect(() => {
    const stored = localStorage.getItem("client_session") || localStorage.getItem("user") || "{}";
    const parsed = JSON.parse(stored);
    const email = parsed.email || "";
    setClientEmail(email);

    if (!email) { setChecking(false); return; }

    supabase.from("case_submissions").select("id,status,created_at").eq("client_email", email).limit(1).single()
      .then(({ data }) => {
        if (data) setExistingCase(data);
        setChecking(false);
      });
  }, []);

  const validate = (): string[] => {
    const errs: string[] = [];
    autores.forEach((a, i) => {
      if (!a.nome) errs.push(`Autor ${i + 1}: Nome obrigatório`);
      if (!a.cpf) errs.push(`Autor ${i + 1}: CPF/CNPJ obrigatório`);
      if (!a.telefone) errs.push(`Autor ${i + 1}: Telefone obrigatório`);
      if (!a.email) errs.push(`Autor ${i + 1}: E-mail obrigatório`);
      if (!a.cep) errs.push(`Autor ${i + 1}: CEP obrigatório`);
      if (!a.endereco) errs.push(`Autor ${i + 1}: Endereço obrigatório`);
      if (!a.numero) errs.push(`Autor ${i + 1}: Número obrigatório`);
      if (!a.bairro) errs.push(`Autor ${i + 1}: Bairro obrigatório`);
      if (!a.cidade) errs.push(`Autor ${i + 1}: Cidade obrigatória`);
      if (!a.estado) errs.push(`Autor ${i + 1}: Estado obrigatório`);
    });
    reus.forEach((r, i) => {
      if (!r.nome) errs.push(`Réu ${i + 1}: Nome obrigatório`);
      if (!r.cpf) errs.push(`Réu ${i + 1}: CPF/CNPJ obrigatório`);
      if (!r.telefone1) errs.push(`Réu ${i + 1}: Telefone obrigatório`);
    });
    if (!fatos.trim()) errs.push("Fatos: descreva o que aconteceu");
    if (!pedido.trim()) errs.push("Pedido: informe o que deseja que o juiz decida");
    if (!valorCausa) errs.push("Valor da causa é obrigatório");
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (errs.length) { setErrors(errs); setShowModal(false); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    setErrors([]);
    setSubmitting(true);

    const { error } = await supabase.from("case_submissions").insert({
      client_email: clientEmail,
      autores,
      reus,
      testemunhas: temTestemunhas ? testemunhas : [],
      detalhes_causa: {
        valor: valorCausa,
        fatos,
        pedido,
      },
      provas_links: provasLinks.filter(Boolean).map(l => ({ url: l })),
      documentos_autor: {
        cnh_cpf_rg: docAutorCnh,
        comprovante_residencia: docAutorResidencia,
      },
      provas_documentais: provasDocumentais,
      doc_veiculo: docVeiculo,
      status: "pendente",
    });

    setSubmitting(false);
    setShowModal(false);

    if (error) {
      setErrors([`Erro ao enviar: ${error.message}`]);
    } else {
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // ─── Render loading ────────────────────────────────────────────────────────
  if (checking) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  // ─── Already submitted ─────────────────────────────────────────────────────
  if (existingCase || submitted) {
    const status = existingCase?.status || "pendente";
    const statusLabel: Record<string, string> = {
      pendente: "Aguardando análise",
      em_analise: "Em análise",
      aprovado: "Aprovado",
      concluido: "Concluído",
    };
    return (
      <Layout>
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-gray-50">
          <div className="max-w-lg w-full text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-3">Seu caso já foi enviado com sucesso!</h1>
            <p className="text-gray-500 mb-6">Entraremos em contato em breve pelo e-mail cadastrado.</p>
            <div className="bg-white border border-gray-200 rounded-xl p-5 text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 font-medium">Status</span>
                <span className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                  {statusLabel[status] || status}
                </span>
              </div>
              {existingCase?.created_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 font-medium">Enviado em</span>
                  <span className="text-sm font-semibold text-gray-700">
                    {new Date(existingCase.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 font-medium">E-mail</span>
                <span className="text-sm font-semibold text-gray-700">{clientEmail}</span>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ─── Form ──────────────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen py-8 px-4">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-2xl font-black text-gray-900">Submissão de Processo</h1>
            <p className="text-sm text-gray-500 mt-1">Preencha os dados do seu caso para análise jurídica</p>
          </div>

          {/* Banner orientações */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800 leading-relaxed">
              <strong>Orientações Importantes:</strong> Para agilizar o processo, preencha os dados corretamente.
              Campos marcados com <span className="text-red-500 font-bold">*</span> são obrigatórios.
              Em caso de dúvidas, entre em contato com nosso suporte.
            </p>
          </div>

          {/* Validation errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <p className="text-sm font-bold text-red-700">Por favor, corrija os erros abaixo:</p>
              </div>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((e, i) => <li key={i} className="text-sm text-red-600">{e}</li>)}
              </ul>
            </div>
          )}

          {/* 1. Autores */}
          <Card title="1. Autor(es)">
            <div className="space-y-4">
              {autores.map((a, i) => (
                <AutorFields key={a.id} autor={a} index={i} canRemove={autores.length > 1}
                  onChange={updated => setAutores(autores.map((x, idx) => idx === i ? updated : x))}
                  onRemove={() => setAutores(autores.filter((_, idx) => idx !== i))}
                />
              ))}
              <button type="button" onClick={() => setAutores([...autores, emptyAutor()])}
                className="flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900 transition-colors">
                <Plus className="w-4 h-4" /> Adicionar Autor
              </button>
            </div>
          </Card>

          {/* 2. Documentos do Autor */}
          <Card title="2. Documentos do Autor">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FileUploadField
                label="CNH, CPF ou RG" accept="image/*,.pdf" bucket="case-documents"
                path={clientEmail || "anon"} required
                onUploaded={(url, name) => setDocAutorCnh({ url, name })}
              />
              <FileUploadField
                label="Comprovante de Residência" accept="image/*,.pdf" bucket="case-documents"
                path={clientEmail || "anon"} required
                onUploaded={(url, name) => setDocAutorResidencia({ url, name })}
              />
            </div>
          </Card>

          {/* 3. Testemunhas */}
          <Card title="3. Testemunhas (opcional)">
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={temTestemunhas} onChange={e => setTemTestemunhas(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-600" />
                <span className="text-sm font-medium text-gray-700">Possui testemunhas?</span>
              </label>
            </div>
            {temTestemunhas && (
              <div className="space-y-4">
                {testemunhas.map((t, i) => (
                  <div key={t.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50 relative">
                    {testemunhas.length > 1 && (
                      <button type="button" onClick={() => setTestemunhas(testemunhas.filter((_, idx) => idx !== i))}
                        className="absolute top-3 right-3 text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">Testemunha {i + 1}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div><Label>Nome</Label><Input value={t.nome} onChange={e => setTestemunhas(testemunhas.map((x, idx) => idx === i ? { ...x, nome: e.target.value } : x))} placeholder="Nome completo" /></div>
                      <div><Label>CPF</Label><Input value={t.cpf} onChange={e => setTestemunhas(testemunhas.map((x, idx) => idx === i ? { ...x, cpf: e.target.value } : x))} placeholder="000.000.000-00" /></div>
                      <div><Label>Telefone</Label><Input value={t.telefone} onChange={e => setTestemunhas(testemunhas.map((x, idx) => idx === i ? { ...x, telefone: e.target.value } : x))} placeholder="(11) 99999-9999" /></div>
                      <div><Label>E-mail</Label><Input type="email" value={t.email} onChange={e => setTestemunhas(testemunhas.map((x, idx) => idx === i ? { ...x, email: e.target.value } : x))} placeholder="email@exemplo.com" /></div>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => setTestemunhas([...testemunhas, emptyTestemunha()])}
                  className="flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900 transition-colors">
                  <Plus className="w-4 h-4" /> Adicionar Testemunha
                </button>
              </div>
            )}
          </Card>

          {/* 4. Réus */}
          <Card title="4. Réu(s)">
            <div className="space-y-4">
              {reus.map((r, i) => (
                <ReuFields key={r.id} reu={r} index={i} canRemove={reus.length > 1}
                  onChange={updated => setReus(reus.map((x, idx) => idx === i ? updated : x))}
                  onRemove={() => setReus(reus.filter((_, idx) => idx !== i))}
                />
              ))}
              <button type="button" onClick={() => setReus([...reus, emptyReu()])}
                className="flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900 transition-colors">
                <Plus className="w-4 h-4" /> Adicionar Réu
              </button>
            </div>
          </Card>

          {/* 5. Detalhes da Causa */}
          <Card title="5. Detalhes da Causa">
            <div className="space-y-5">
              <div>
                <Label required>Valor da causa (R$)</Label>
                <Input
                  value={valorCausa}
                  onChange={e => setValorCausa(e.target.value)}
                  placeholder="Ex: 5.000,00"
                />
              </div>
              <div>
                <Label required>Fatos</Label>
                <p className="text-xs text-gray-400 mb-1">Descreva com detalhes o que aconteceu</p>
                <Textarea value={fatos} onChange={e => setFatos(e.target.value)}
                  rows={8} placeholder="Descreva os fatos que motivaram a ação judicial..." />
              </div>
              <div>
                <Label required>Pedido</Label>
                <p className="text-xs text-gray-400 mb-1">O que você quer que o juiz decida?</p>
                <Textarea value={pedido} onChange={e => setPedido(e.target.value)}
                  rows={5} placeholder="Ex: Que o réu seja condenado a pagar indenização de R$ X por danos morais..." />
              </div>
            </div>
          </Card>

          {/* 6. Provas em Vídeos e Áudios */}
          <Card title="6. Provas em Vídeos e Áudios">
            <p className="text-xs text-gray-500 mb-4">Adicione links do Google Drive, OneDrive ou YouTube com seus vídeos e áudios.</p>
            <div className="space-y-2">
              {provasLinks.map((link, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <Input
                    value={link}
                    onChange={e => setProvasLinks(provasLinks.map((l, idx) => idx === i ? e.target.value : l))}
                    placeholder="https://drive.google.com/..."
                  />
                  {provasLinks.length > 1 && (
                    <button type="button" onClick={() => setProvasLinks(provasLinks.filter((_, idx) => idx !== i))}
                      className="text-gray-400 hover:text-red-500 flex-shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setProvasLinks([...provasLinks, ""])}
                className="flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900 transition-colors mt-1">
                <Plus className="w-4 h-4" /> Adicionar Link
              </button>
            </div>
          </Card>

          {/* 7. Provas Documentais */}
          <Card title="7. Provas Documentais">
            <div className="space-y-5">
              <MultiFileUpload
                label="Fotos, prints, contratos e outros documentos"
                accept="image/*,.pdf,.doc,.docx" bucket="case-provas"
                path={clientEmail || "anon"}
                onUploaded={files => setProvasDocumentais(files)}
              />
              <FileUploadField
                label="Documento do veículo (se aplicável)"
                accept="image/*,.pdf" bucket="case-provas"
                path={clientEmail || "anon"}
                onUploaded={(url, name) => setDocVeiculo({ url, name })}
              />
            </div>
          </Card>

          {/* Submit */}
          <div className="pb-8">
            <button
              type="button"
              onClick={() => { const errs = validate(); if (errs.length) { setErrors(errs); window.scrollTo({ top: 0, behavior: "smooth" }); } else { setErrors([]); setShowModal(true); } }}
              className="w-full py-4 rounded-xl bg-blue-700 text-white font-bold text-base shadow-[0_5px_0_0_#1e3a8a] hover:shadow-[0_2px_0_0_#1e3a8a] hover:translate-y-[3px] active:shadow-none active:translate-y-[5px] transition-all"
            >
              Enviar Caso
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h3 className="text-xl font-black text-gray-900 mb-3">Confirmar envio?</h3>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              Tem certeza que deseja enviar? <strong>Após o envio não será possível alterar os dados.</strong>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-blue-700 text-white font-bold text-sm hover:bg-blue-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
