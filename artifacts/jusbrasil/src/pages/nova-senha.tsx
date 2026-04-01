import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ollfczufqavxzgvktvkb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sbGZjenVmcWF2eHpndmt0dmtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0MDY4NzMsImV4cCI6MjA1Nzk4Mjg3M30.TDZdLxmzo1kpUumLTe39LYiHdQ8cjmyEw7pz4YiSygo";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const styles: { [key: string]: React.CSSProperties } = {
    container: {
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%)",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          padding: "20px",
    },
    card: {
          background: "white",
          borderRadius: "16px",
          padding: "48px 40px",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
    },
    logo: {
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "20px",
          color: "white",
          fontSize: "22px",
          fontWeight: "bold",
    },
    title: {
          fontSize: "22px",
          fontWeight: "700",
          color: "#1a1a2e",
          marginBottom: "8px",
          textAlign: "center",
    },
    subtitle: {
          fontSize: "14px",
          color: "#6b7280",
          marginBottom: "28px",
          textAlign: "center",
    },
    form: {
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
    },
    label: {
          fontSize: "13px",
          fontWeight: "600",
          color: "#374151",
          marginBottom: "4px",
          display: "block",
    },
    input: {
          width: "100%",
          padding: "10px 14px",
          borderRadius: "8px",
          border: "1.5px solid #e5e7eb",
          fontSize: "15px",
          outline: "none",
          transition: "border-color 0.2s",
          boxSizing: "border-box" as const,
    },
    button: {
          width: "100%",
          padding: "12px",
          borderRadius: "8px",
          background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
          color: "white",
          fontWeight: "700",
          fontSize: "15px",
          border: "none",
          cursor: "pointer",
          marginTop: "4px",
          transition: "opacity 0.2s",
    },
    error: {
          color: "#ef4444",
          fontSize: "13px",
          textAlign: "center",
          marginTop: "-8px",
    },
    success: {
          color: "#22c55e",
          fontSize: "15px",
          textAlign: "center",
          fontWeight: "600",
    },
    invalidMsg: {
          color: "#ef4444",
          fontSize: "15px",
          textAlign: "center",
          fontWeight: "600",
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

  useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
                if (!data.session) {
                          setTimeout(() => {
                                      supabase.auth.getSession().then(({ data: d2 }) => {
                                                    if (!d2.session) {
                                                                    setInvalidLink(true);
                                                    }
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

      if (!updateError) {
              setSuccess(true);
              setTimeout(() => navigate("/area-do-cliente"), 2500);
      } else {
              setError("Não foi possível redefinir a senha. O link pode ter expirado.");
      }
        setLoading(false);
  }

  if (invalidLink) {
        return (
                <div style={styles.container}>
                          <div style={styles.card}>
                                      <div style={styles.logo}>PC</div>div>
                                      <h2 style={styles.title}>Link inválido ou expirado</h2>h2>
                                      <p style={styles.invalidMsg}>
                                                    Este link de redefinição de senha não é mais válido.
                                                    <br />
                                                    Por favor, solicite um novo link de redefinição.
                                      </p>p>
                                      <button
                                                    style={{ ...styles.button, marginTop: "24px" }}
                                                    onClick={() => navigate("/area-do-cliente")}
                                                  >
                                                  Voltar ao login
                                      </button>button>
                          </div>div>
                </div>div>
              );
  }
  
    if (success) {
          return (
                  <div style={styles.container}>
                          <div style={styles.card}>
                                    <div style={styles.logo}>PC</div>div>
                                    <h2 style={styles.title}>Senha redefinida!</h2>h2>
                                    <p style={styles.success}>
                                                Sua senha foi alterada com sucesso.
                                                <br />
                                                Redirecionando para o login...
                                    </p>p>
                          </div>div>
                  </div>div>
                );
    }
  
    return (
          <div style={styles.container}>
                <div style={styles.card}>
                        <div style={styles.logo}>PC</div>div>
                        <h2 style={styles.title}>Redefinir senha</h2>h2>
                        <p style={styles.subtitle}>Digite sua nova senha abaixo</p>p>
                        <form style={styles.form} onSubmit={handleSubmit}>
                                  <div>
                                              <label style={styles.label}>Nova senha</label>label>
                                              <input
                                                              type="password"
                                                              style={styles.input}
                                                              value={password}
                                                              onChange={(e) => setPassword(e.target.value)}
                                                              placeholder="Mínimo 6 caracteres"
                                                              required
                                                            />
                                  </div>div>
                                  <div>
                                              <label style={styles.label}>Confirmar nova senha</label>label>
                                              <input
                                                              type="password"
                                                              style={styles.input}
                                                              value={confirmPassword}
                                                              onChange={(e) => setConfirmPassword(e.target.value)}
                                                              placeholder="Repita a senha"
                                                              required
                                                            />
                                  </div>div>
                          {error && <p style={styles.error}>{error}</p>p>}
                                  <button type="submit" style={styles.button} disabled={loading}>
                                    {loading ? "Salvando..." : "Salvar nova senha"}
                                  </button>button>
                        </form>form>
                </div>div>
          </div>div>
        );
}</button>
