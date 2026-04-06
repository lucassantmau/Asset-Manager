/**
 * nova-senha.tsx
 * Página para redefinir a senha após clicar no link enviado por email.
 * Supabase injeta o token na URL automaticamente.
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ollfczufqavxzgvktvkb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sbGZjenVmcWF2eHpndmt0dmtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNjA2ODUsImV4cCI6MjA4OTkzNjY4NX0.wVEYoQv8epExO-WSCihojxt3Ti3pQkBjmvdCiV_fiKo";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
  logo: { color: "#fff", fontWeight: 800, fontSize: 18, letterSpacing: "-0.5px" },
  logoSpan: { color: C.accentLight },
  wrap: { maxWidth: 420, margin: "0 auto", padding: "60px 24px", flex: 1 },
  card: {
    background: C.card,
    borderRadius: 16,
    padding: "36px 32px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    border: `1px solid ${C.border}`,
  },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 },
  input: {
    width: "100%", padding: "10px 14px", borderRadius: 8,
    border: `1.5px solid ${C.border}`, fontSize: 14, color: C.text,
    background: "#fff", outline: "none", boxSizing: "border-box" as const,
  },
  btn: {
    width: "100%", padding: "13px", borderRadius: 10, border: "none",
    background: C.accent, color: "#fff", fontSize: 15, fontWeight: 700,
    cursor: "pointer", marginTop: 8,
  },
};

export default function NovaSenha() {
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);

  // Supabase processa o token do hash da URL automaticamente ao inicializar.
  // Verificamos se há uma sessão válida (indica que o link é legítimo).
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        // Aguarda um momento para o Supabase processar o hash
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: d2 }) => {
            if (!d2.session) setInvalidLink(true);
          });
        }, 1500);
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError("Não foi possível redefinir a senha. O link pode ter expirado.");
    } else {
      setSuccess(true);
      setTimeout(() => navigate("/area-do-cliente"), 2500);
    }
    setLoading(false);
  }

  // Link inválido ou expirado
  if (invalidLink) {
    return (
      <div style={T.page}>
        <div style={T.topBar}>
          <span style={T.logo}>Pequenas <span style={T.logoSpan}>Causas</span></span>
        </div>
        <div style={T.wrap}>
          <div style={{ ...T.card, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 12, marginTop: 0 }}>
              Link inválido ou expirado
            </h2>
            <p style={{ color: C.textMuted, fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              Este link de recuperação não é mais válido. Solicite um novo link na página de login.
            </p>
            <button onClick={() => navigate("/login")} style={{ ...T.btn, marginTop: 0 }}>
              Voltar para o login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Senha redefinida com sucesso
  if (success) {
    return (
      <div style={T.page}>
        <div style={T.topBar}>
          <span style={T.logo}>Pequenas <span style={T.logoSpan}>Causas</span></span>
        </div>
        <div style={T.wrap}>
          <div style={{ ...T.card, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 12, marginTop: 0 }}>
              Senha redefinida!
            </h2>
            <p style={{ color: C.textMuted, fontSize: 14, lineHeight: 1.7 }}>
              Sua senha foi atualizada com sucesso. Redirecionando para o portal...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={T.page}>
      <div style={T.topBar}>
        <span style={T.logo}>Pequenas <span style={T.logoSpan}>Causas</span></span>
      </div>
      <div style={T.wrap}>
        <div style={T.card}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 8, marginTop: 0 }}>
            Criar nova senha
          </h1>
          <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 28, marginTop: 0 }}>
            Defina uma nova senha para acessar sua conta.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: 18 }}>
              <label style={T.label} htmlFor="password">Nova senha</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                style={T.input}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={T.label} htmlFor="confirmPassword">Confirmar nova senha</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                style={T.input}
              />
            </div>

            {error && (
              <div style={{
                background: C.errorBg, border: "1px solid rgba(220,38,38,0.2)",
                borderRadius: 8, padding: "10px 14px", marginBottom: 16,
              }}>
                <p style={{ color: C.error, fontSize: 12, margin: 0 }}>❌ {error}</p>
              </div>
            )}

            <button type="submit" disabled={loading} style={{ ...T.btn, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Salvando..." : "Salvar nova senha →"}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        input:focus { border-color: ${C.borderFocus} !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
        button:hover { opacity: 0.88 !important; }
      `}</style>
    </div>
  );
}
