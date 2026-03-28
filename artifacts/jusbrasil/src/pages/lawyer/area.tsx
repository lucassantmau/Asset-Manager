import React, { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Loader2, LogOut, Briefcase, Scale } from "lucide-react";

type LawyerProfile = {
  id: string;
  full_name: string;
  oab: string;
  phone: string;
  registration_status: string;
  city: string | null;
  state: string | null;
};

function statusLabel(s: string) {
  const m: Record<string, string> = {
    pending: "Em análise",
    approved: "Aprovado",
    rejected: "Não aprovado",
  };
  return m[s] ?? s;
}

export default function LawyerArea() {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<LawyerProfile | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/advogado/signin");
        return;
      }
      if (!mounted) return;
      setEmail(session.user.email ?? null);

      const role = session.user.user_metadata?.user_role;
      const { data: row, error } = await supabase
        .from("lawyer_profiles")
        .select("id, full_name, oab, phone, registration_status, city, state")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        console.warn("lawyer_profiles:", error);
      }
      if (!mounted) return;

      if (row) setProfile(row as LawyerProfile);
      else if (role !== "lawyer") {
        navigate("/");
        return;
      }

      setLoading(false);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate("/advogado/signin");
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/advogado/signin");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-9 h-9 text-[#001532] animate-spin" />
      </div>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#001532] flex items-center justify-center">
                <Scale className="w-6 h-6 text-[#fee001]" />
              </div>
              <div>
                <h1 className="text-xl font-black text-[#001532]">Área do Advogado</h1>
                <p className="text-sm text-muted-foreground">
                  {profile?.full_name ?? "Advogado(a)"}
                  {email ? ` · ${email}` : ""}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold text-[#001532] mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Seu cadastro
              </h2>
              {profile ? (
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">OAB</dt>
                    <dd className="font-medium text-right">{profile.oab}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">WhatsApp</dt>
                    <dd className="font-medium text-right">{profile.phone}</dd>
                  </div>
                  {(profile.city || profile.state) && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Local</dt>
                      <dd className="font-medium text-right">
                        {[profile.city, profile.state].filter(Boolean).join(" / ")}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-4 pt-2 border-t border-slate-100">
                    <dt className="text-muted-foreground">Status</dt>
                    <dd>
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-[#001532]">
                        {statusLabel(profile.registration_status)}
                      </span>
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Perfil em sincronização. Se a mensagem persistir, confirme se a migration do Supabase foi aplicada ou entre em contato com o suporte.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold text-[#001532] mb-2">Processos e informações</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Quando a equipe vincular processos ou atualizações à sua conta, elas aparecerão nesta área. Por enquanto, use os canais oficiais (WhatsApp e e-mail) para acompanhar demandas em análise.
              </p>
              <div className="mt-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                Nenhum processo listado ainda.
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
