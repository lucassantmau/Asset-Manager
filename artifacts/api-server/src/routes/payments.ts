import { Router, type IRouter } from "express";
import { db, paymentsTable } from "@workspace/db";
import { CreatePaymentBody } from "@workspace/api-zod";
import { randomUUID } from "crypto";

const router: IRouter = Router();

function generatePixCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "00020126580014BR.GOV.BCB.PIX0136";
  for (let i = 0; i < 36; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  code += "5204000053039865802BR5925PROCJUS TECNOLOGIA LTDA6009SAO PAULO";
  return code;
}

router.post("/payments", async (req, res) => {
  const body = CreatePaymentBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "VALIDATION_ERROR", message: body.error.message });
    return;
  }

  const uuid = randomUUID();
  const pixCode = body.data.method === "pix" ? generatePixCode() : null;

  const [payment] = await db
    .insert(paymentsTable)
    .values({
      uuid,
      caseUuid: body.data.caseId,
      email: body.data.email,
      whatsapp: body.data.whatsapp,
      cpf: body.data.cpf,
      method: body.data.method,
      amount: 199.90,
      status: "pending",
      pixCode,
    })
    .returning();

  res.status(201).json({
    id: payment.uuid,
    status: payment.status,
    method: payment.method,
    pixCode: payment.pixCode,
    pixQrCode: payment.pixCode ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(payment.pixCode)}&size=200x200` : null,
    amount: payment.amount,
    createdAt: payment.createdAt.toISOString(),
  });
});

export default router;
