import { Router, type IRouter } from "express";
import { db, registrationTokensTable } from "@workspace/db";
import { randomUUID } from "crypto";

const router: IRouter = Router();

function normalizeEmail(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function pickPaymentRef(body: Record<string, unknown>): string {
  const candidates = [
    body["id"],
    body["transaction_id"],
    body["transactionId"],
    body["payment_id"],
    body["paymentId"],
    body["order_id"],
    body["orderId"],
    body["reference"],
    body["reference_id"],
  ];
  const first = candidates.find((v) => typeof v === "string" && v.trim().length > 0);
  if (typeof first === "string") return first.trim();
  return `klivo-${Date.now()}`;
}

async function createPaidSlotOnSupabase(email: string, paymentRef: string, name: string) {
  const supabaseUrl = process.env["SUPABASE_URL"];
  const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!supabaseUrl || !serviceRoleKey || !email) return;

  const now = new Date().toISOString();
  const headers = {
    "Content-Type": "application/json",
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
  };

  // Step 1: try PATCH to update existing record by email
  const patchRes = await fetch(
    `${supabaseUrl}/rest/v1/pequenas_causas_submissions?autor_email=eq.${encodeURIComponent(email)}`,
    {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify({
        pagamento_confirmado: true,
        klivo_transaction_id: paymentRef,
        pagamento_confirmado_em: now,
      }),
    }
  );

  if (!patchRes.ok) {
    const text = await patchRes.text();
    console.error(`Supabase PATCH failed: ${patchRes.status} ${text}`);
  } else {
    const updated = await patchRes.json() as unknown[];
    if (Array.isArray(updated) && updated.length > 0) {
      console.log(`[webhook] Updated ${updated.length} existing record(s) for ${email}`);
      return;
    }
  }

  // Step 2: no rows matched — INSERT a new record
  const protocol = `PCC-${Date.now().toString(36).toUpperCase()}`;
  const safeName = name.trim().length > 0 ? name.trim() : "Cliente";

  const insertRes = await fetch(`${supabaseUrl}/rest/v1/pequenas_causas_submissions`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify({
      protocol,
      pedido_ref: paymentRef,
      klivo_transaction_id: paymentRef,
      status: "aguardando_propostas",
      autor_nome: safeName,
      autor_email: email,
      pagamento_confirmado: true,
      pagamento_confirmado_em: now,
      disponivel_para_advogados: false,
    }),
  });

  if (!insertRes.ok) {
    const text = await insertRes.text();
    throw new Error(`Supabase INSERT failed: ${insertRes.status} ${text}`);
  }

  console.log(`[webhook] Inserted new record for ${email}`);
}

router.post("/webhook/klivopay", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const status = String(body.status || "").toLowerCase();

  if (status === "pago" || status === "paid" || status === "approved") {
    const customer = (body.customer ?? {}) as Record<string, unknown>;
    const email = normalizeEmail(customer.email || body.email);
    const name = String(customer.name || body.name || "");
    const paymentRef = pickPaymentRef(body);
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    // 1. Supabase first — critical for client access
    try {
      await createPaidSlotOnSupabase(email, paymentRef, name);
    } catch (err) {
      console.error("[webhook] createPaidSlotOnSupabase error:", err);
    }

    // 2. Registration token — secondary
    try {
      await db.insert(registrationTokensTable).values({
        token,
        email,
        name,
        expiresAt,
      });
    } catch (err) {
      console.error("[webhook] db.insert registrationTokens error:", err);
    }
  }

  res.status(200).json({ success: true });
});

export default router;
