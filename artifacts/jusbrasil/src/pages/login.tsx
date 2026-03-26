/**
 * login.tsx
 * Página de login — usa Supabase Auth diretamente.
 */

import { useState } from "react";
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

export default function LoginPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Preencha e-mail e senha.");
      return;
    }
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (authError) {
      setError("E-mail ou senha incorretos. Verifique e tente novamente.");
    } else {
      navigate("/area-do-cliente");
    }
    setLoading(false);
  }

  return (
    <div style={T.page}>
      <div style={T.topBar}>
        <span style={T.logo}>
          Pequenas Causas <span style={T.logoSpan}>Processos</span>
        </span>
      </div>
      <div style={T.wrap}>
        <div style={T.card}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 8, marginTop: 0 }}>
            Entrar na sua conta
          </h1>
          <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 28, marginTop: 0 }}>
            Acesse o portal para acompanhar seu processo.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: 18 }}>
              <label style={T.label} htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                style={T.input}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={T.label} htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
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
              {loading ? "Entrando..." : "Entrar →"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: C.textMuted }}>
            Não tem conta?{" "}
            <a href="/criar-conta" style={{ color: C.accentLight, fontWeight: 600, textDecoration: "none" }}>
              Criar conta
            </a>
          </p>
        </div>
      </div>

      <style>{`
        input:focus { border-color: ${C.borderFocus} !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
        button:hover { opacity: 0.88 !important; }
      `}</style>
    </div>
  );
}
