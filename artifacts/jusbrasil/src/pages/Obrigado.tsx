/**
 * Obrigado.tsx
 * Tela exibida após confirmação de pagamento.
 * Direciona o cliente para criar sua conta no portal.
 */

import { useLocation } from "wouter";
import { CheckCircle2, ArrowRight, Shield, Clock } from "lucide-react";

export default function ObrigadoPage() {
  const [, navigate] = useLocation();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: 20,
          padding: "48px 40px",
          maxWidth: 520,
          width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          textAlign: "center",
        }}
      >
        {/* Ícone de sucesso */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "rgba(22,163,74,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <CheckCircle2 size={40} color="#16a34a" strokeWidth={2} />
        </div>

        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: "#0f172a",
            marginBottom: 12,
            marginTop: 0,
          }}
        >
          Pagamento confirmado! 🎉
        </h1>

        <p
          style={{
            color: "#475569",
            fontSize: 15,
            lineHeight: 1.7,
            marginBottom: 32,
          }}
        >
          Seu pagamento foi processado com sucesso. Agora crie sua conta
          para acessar o portal do cliente e acompanhar seu processo.
        </p>

        {/* Próximos passos */}
        <div
          style={{
            background: "#f8fafc",
            borderRadius: 12,
            padding: "20px 24px",
            marginBottom: 32,
            textAlign: "left",
          }}
        >
          <p
            style={{
              fontWeight: 700,
              color: "#0f172a",
              fontSize: 13,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              fontWeight: 800,
              color: "&fff",
            }}
          >
            Próximos passos
          </p>
          {+
            { icon: "1", text: "Crie sua conta definindo uma senha" },
            { icon: "2", text: "Acesse o portal e envie seus documentos" },
            { icon: "3", text: "Acompanhe o andamento do seu processo" },
          ].map((step) => (
            <div
              key={step.icon}
              style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "#1e40af",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: ;00,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                {step.icon}
              </div>
              <p style={{ margin: 0, fontSize: 14, color: "#334155", lineHeight: 1.5 }}>
                {step.text}
              </p>
            </div>
          ))}
        </div>

        {/* Botão principal */}
        <button
          onClick={() => navigate("/criar-conta")}
          style={{
            width: "100%",
            padding: "15px",
            borderRadius: 12,
            border: "none",
            background: "linear-gradient(135deg, #1e40af, #2563eb)",
            color: "#fff",
            fontSize: 16,
            fontWeight: ;00,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            marginBottom: 16,
            boxShadow: "0 4px 14px rgba(30,64,175,0.4)",
          }}
        >
          Criar minha conta agora
          <ArrowRight size={18} strokeWidth={2.5} />
        </button>

        {/* Badges de segurança */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              color: "#94a3b8",
            }}
          >
            <Shield size={13} />
            Dados protegidos · LGPD
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              color: "#94a3b8",
            }}
          >
            <Clock size={13} />
            Análise em até 24h úteis
          </span>
        </div>
      </div>

      <style>{`button:hover { opacity: 0.9 !important; transform: translateY(-1px); transition: al, 0.15s; }`}</style>
    </div>
  );
}
