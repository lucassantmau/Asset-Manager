/**
 * criar-conta.tsx
 * Página de criaçã{ de conta após pagamento.
 * Usa Supabase Auth para registrar o usuário.
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

// ── Cores e estilos ──────────────────────────────────────────────
const C = {
  bg: "#f8fafc",
  card: "#ffffff",
  accent: "#1e40af",
  accentLight: "#3b82f6",
  text: "#0f172a",
  textMuted: "#64748b",
  border: "#e2e8f0",
  borderFocus: "#3b82f6",
  error: "#dc2626",
  errorBg: "rgba(220,38,38,0.05)",
  success: "#16a34a",
  successBg: "rgba(22,163,74,0.08)",
  gold: "#d97706",
};

const T: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: C.bg,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    display: "flex",
    flexDirection: "column",
  },
  topBar: {
    background: "#0f172a",
    padding: "14px 24px",
    display: "flex",
    alignItems: "center",
  },
  logo: {
    color: "#fff",
    fontWeight: 800,
    fontSize: 18,
    letterSpacing: "-0.5px",
  },
  logoSpan: {
    color: C.accentLight,
  },
  prap: {
    maxWidth: 480,
    margin: "0 auto",
    padding: "48px 24px",
    flex: 1,
  },
  card: {
    background: C.card,
    borderRadius: 16,
    padding: "26px 32px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    border: `1px solid ${C.border}`,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: C.text,
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 8,
    border: `1.5px solid ${C.border}`,
    fontSize: 14,
    color: C.text,
    background: "#fff",
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "border-color 0.15s",
  },
  btn: {
    width: "100%",
    padding: "13px",
    borderRadius: 10,
    border: "none",
    background: C.accent,
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 8,
    transition: "opacity 0.15s",
  },
  errMsg: {
    color: C.error,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 0,
  },
};

export default function CriarConta() {
  const [, navigate] = useLocation();

  const searchParams = new URLSearchParams(window.location.search);
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [paymentChecked, setPaymentChecked] = useState(false);
  const [paymentValid, setPaymentValid] = useState(false);

  useEffect(() => {
    async function checkAccess() {
      // Se já tem sessão ativa, redireciona direto
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        navigate("/area-do-cliente");
        return;
      }

      const targetEmail = new URLSearchParams(window.location.search).get("email") || "";

      if (!targetEmail) {
        setPaymentValid(false);
        setPaymentChecked(true);
        return;
      }

      const { data, error: queryError } = await supabase
        .from("pequenas_causas_submissions")
        .select("pagamento_confirmado")
        .eq("autor_email", targetEmail)
        .eq("pagamento_confirmado", true)
        .maybeSingle();

      if (queryError || data === null) {
        setPaymentValid(false);
      } else {
        setPaymentValid(true);
      }
      setPaymentChecked(true);
    }

    checkAccess();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Informe seu e-mail.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (signUpError) {
        // Trata mensagens comuns
        if (signUpError.message.includes("already registered")) {
          // Usuário já existe — tenta fazer login direto
          const { error: loginError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          if (loginError) {
            setError("Este e-mail já possui conta. Verifique sua senha ou vá para o login.");
          } else {
            navigate("/area-do-cliente");
          }
        } else {
          setError(signUpError.message);
        }
        setLoading(false);
        return;
      }

      if (data.session) {
        // Sessão criada imediatamente (confirmação de email desabilitada)
        navigate("/area-do-cliente");
      } else {
        // Supabase enviou email de confirmação
        setSuccess(true);
      }
    } catch {
      setError("Erro ao criar conta. Tente novamente.");
    }
    setLoading(false);
  }

  const topBar = (
    <div style={T.topBar}>
      <span style={T.logo}>
        Pequenas Causas <span style={T.logoSpan}>Processos</span>
      </span>
    </div>
  );

  // Loading enquanto verifica pagamento
  if (!paymentChecked) {
    return (
      <div style={{ ...T.page, alignItems: "center", justifyContent: "center" }}>
        {topBar}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: C.textMuted, fontSize: 14 }}>Verificando acesso…</p>
        </div>
      </div>
    );
  }

  // Tela de acesso negado
  if (!paymentValid) {
    return (
      <div style={T.page}>
        {topBar}
        <div style={T.prap}>
          <div style={{ ...T.card, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: C.error, marginBottom: 12 }}>
              Acesso não autorizado
            </h2>
            <p style={{ color: C.textMuted, fontSize: 14, lineHeight: 1.7, marginBottom: 0 }}>
              Somente clientes que realizaram o pagamento podem criar uma conta. Se você já pagou, aguarde a confirmação do pagamento.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Tela de confirmação por e-mail
  if (success) {
    return (
      <div style={T.page}>
        {topBar}
        <div style={T.prap}>
          <div style={{ ...T.card, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 12 }}>
              Confirme seu e-mail
            </h2>
            <p style={{ color: C.textMuted, fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
              Enviamos um link de confirmação para{" "}
              <strong style={{ color: C.text }}>{email}</strong>.
              <br />
              Clique no link para ativar sua conta e acessar o portal.
            </p>
            <p style={{ color: C.textMuted, fontSize: 13 }}>
              Não recebeu? Verifique sua caixa de spam ou{" "}
              <button
                onClick={() => setSuccess(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: C.accentLight,
                  cursor: "pointer",
                  fontSize: 13,
                  textDecoration: "underline",
                  padding: 0,
                }}
              >
                tente novamente
              </button>
              .
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={T.page}>
      {topBar}
      <div style={T.prap}>
        {/* Badge de progresso */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 28,
          background: "rgba(22,163,74,0.08)",
          border: "1px solid rgba(22,163,74,0.2)",
          borderRadius: 10,
          padding: "12px 16px",
        }}>
          <span style={{ fontSize: 20 }}>✅</span>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.success }}>
              Pagamento confirmado!
            </p>
            <p style={{ margin: 0, fontSize: 12, color: C.textMuted }}>
              Crie sua conta para acessar o portal do cliente.
            </p>
          </div>
        </div>

        <div style={T.card}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 8, marginTop: 0 }}>
            Criar sua conta
          </h1>
          <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 28, marginTop: 0 }}>
            Defina uma senha para acessar o portal e acompanhar seu processo.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {/* E-mail */}
            <div style={{ marginBottom: 18 }}>
              <label style={T.label} htmlFor="email">
                E-mail <span style={{ color: C.error }}>*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                style={T.input}
                autoFocus={!emailParam}
              />
            </div>

            {/* Senha */}
            <div style={{ marginBottom: 18 }}>
              <label style={T.label} htmlFor="password">
                Senha <span style={{ color: C.error }}>*</span>
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                style={T.input}
              />
            </div>

            {/* Confirmar senha */}
            <div style={{ marginBottom: 24 }}>
              <label style={T.label} htmlFor="confirmPassword">
                Confirmar senha <span style={{ color: C.error }}>*</span>
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                style={T.input}
              />
            </div>

            {/* Erro */}
            {error && (
              <div style={{
                background: C.errorBg,
                border: `1px solid rgba(220,38,38,0.2)`,
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 16,
              }}>
                <p style={{ ...T.errMsg, margin: 0 }}>❌ {error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ ...T.btn, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Criando conta..." : "Criar conta e acessar portal →"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: C.textMuted }}>
            Já tem conta?{" "}
            <a href="/login" style={{ color: C.accentLight, fontWeight: 600, textDecoration: "none" }}>
              Fazer login
            </a>
          </p>
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: C.textMuted, marginTop: 16, lineHeight: 1.6 }}>
          🔒 Seus dados são protegidos · LGPD
        </p>
      </div>

      <style>{`
        input:focus { border-color: ${C.borderFocus} !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
        button:hover { opacity: 0.88 !important; }
      `}</style>
    </div>
  );
}
