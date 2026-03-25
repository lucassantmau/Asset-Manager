import { Router, type IRouter } from "express";
import { db, registrationTokensTable } from "@workspace/db";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.post("/webhook/klivopay", async (req, res) => {
  try {
    const body = req.body;
    const status = (body.status || "").toLowerCase();

    if (status === "pago" || status === "paid" || status === "approved") {
      const email = body.customer?.email || body.email || "";
      const name = body.customer?.name || body.name || "";
      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

      await db.insert(registrationTokensTable).values({
        token,
        email,
        name,
        expiresAt,
      });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(200).json({ success: true });
  }
});

export default router;
