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

  const protocol = `PCC-${Date.now().toString(36).toUpperCase()}`;
  const safeName = name.trim().length > 0 ? name.trim() : "Cliente";

  const response = await fetch(`${supabaseUrl}/rest/v1/pequenas_causas_submissions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      protocol,
      pedido_ref: paymentRef,
      status: "aguardando_propostas",
      autor_nome: safeName,
      autor_email: email,
      pagamento_confirmado: true,
      disponivel_para_advogados: false,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase payment slot insert failed: ${response.status} ${text}`);
  }
}

router.post("/webhook/klivopay", async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const status = String(body.status || "").toLowerCase();

    if (status === "pago" || status === "paid" || status === "approved") {
      const customer = (body.customer ?? {}) as Record<string, unknown>;
      const email = normalizeEmail(customer.email || body.email);
      const name = String(customer.name || body.name || "");
      const paymentRef = pickPaymentRef(body);
      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

      await db.insert(registrationTokensTable).values({
        token,
        email,
        name,
        expiresAt,
      });

      await createPaidSlotOnSupabase(email, paymentRef, name);
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(200).json({ success: true });
  }
});

export default router;
