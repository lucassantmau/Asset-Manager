import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { pushDataLayer } from "@/lib/gtm";

const SESSION_KEY = "exit_intent_shown";

export default function ExitIntentPopup() {
  const [visible, setVisible] = useState(false);
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const shownRef = useRef(false);
  const enabledRef = useRef(false);

  function show() {
    if (shownRef.current) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    shownRef.current = true;
    sessionStorage.setItem(SESSION_KEY, "1");
    setVisible(true);
    pushDataLayer("exit_intent_shown");
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      enabledRef.current = true;
    }, 10000);

    function onMouseLeave(e: MouseEvent) {
      if (!enabledRef.current) return;
      if (e.clientY <= 10) show();
    }

    let lastY = window.scrollY;
    function onScroll() {
      if (!enabledRef.current) return;
      const currentY = window.scrollY;
      if (currentY < lastY - 80 && currentY < 300) show();
      lastY = currentY;
    }

    document.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!telefone.replace(/\D/g, "").match(/^\d{10,11}$/)) {
      setError("Digite um WhatsApp válido com DDD.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { error: err } = await supabase.from("leads").insert({
        telefone,
        causa: "exit_intent",
        status: "lead_morno",
        created_at: new Date().toISOString(),
      });
      if (err) throw err;
      pushDataLayer("exit_intent_submit");
      setSubmitted(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.65)", display: "flex",
        alignItems: "center", justifyContent: "center", padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) setVisible(false); }}
    >
      <div style={{
        background: "#fff", borderRadius: 20, padding: "36px 32px",
        maxWidth: 440, width: "100%", position: "relative",
        boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
      }}>
        <button
          onClick={() => setVisible(false)}
          style={{
            position: "absolute", top: 14, right: 16, background: "none",
            border: "none", fontSize: 22, cursor: "pointer", color: "#9ca3af",
          }}
        >×</button>

        {submitted ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "#dcfce7", display: "flex", alignItems: "center",
              justifyContent: "center", margin: "0 auto 16px", fontSize: 28,
            }}>✓</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0a1628", marginBottom: 8 }}>
              Recebido!
            </h3>
            <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6 }}>
              Um especialista entrará em contato pelo WhatsApp <strong>{telefone}</strong> em até 24h para avaliar seu caso gratuitamente.
            </p>
            <button
              onClick={() => setVisible(false)}
              style={{
                marginTop: 20, background: "#0a1628", color: "#fff",
                border: "none", borderRadius: 10, padding: "12px 24px",
                fontWeight: 700, fontSize: 14, cursor: "pointer", width: "100%",
              }}
            >Fechar</button>
          </div>
        ) : (
          <>
            <div style={{
              background: "#fff3cd", borderRadius: 10, padding: "10px 14px",
              marginBottom: 20, display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <p style={{ fontSize: 13, color: "#856404", fontWeight: 600, margin: 0 }}>
                Espere! Seu caso pode ter solução.
              </p>
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0a1628", marginBottom: 8, lineHeight: 1.2 }}>
              Avalie Seu Caso <span style={{ color: "#c8a400" }}>Gratuitamente</span>
            </h2>
            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 20, lineHeight: 1.6 }}>
              Deixe seu WhatsApp e um especialista avalia seu caso <strong>gratuitamente</strong> em até 24h.
            </p>

            <form onSubmit={handleSubmit}>
              <input
                type="tel"
                placeholder="(11) 99999-9999"
                value={telefone}
                onChange={e => setTelefone(e.target.value)}
                style={{
                  width: "100%", padding: "14px", borderRadius: 10,
                  border: "1.5px solid #d1d5db", fontSize: 16, color: "#0a1628",
                  background: "#fff", outline: "none", boxSizing: "border-box",
                  fontFamily: "inherit", marginBottom: 8,
                }}
              />
              {error && <p style={{ color: "#ef4444", fontSize: 12, marginBottom: 8 }}>{error}</p>}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", padding: "14px", borderRadius: 10,
                  background: loading ? "#e5e7eb" : "#c8a400",
                  color: loading ? "#9ca3af" : "#0a1628",
                  fontWeight: 800, fontSize: 15, border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading ? "none" : "0 3px 0 rgba(0,0,0,0.18)",
                  minHeight: 48,
                }}
              >
                {loading ? "Enviando..." : "Quero Avaliação Gratuita →"}
              </button>
            </form>

            <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 12 }}>
              🔒 Seus dados estão protegidos. Sem spam.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
