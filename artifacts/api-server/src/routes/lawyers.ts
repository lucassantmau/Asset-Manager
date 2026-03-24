import { Router, type IRouter } from "express";
import { db, lawyersTable } from "@workspace/db";
import { RegisterLawyerBody, LawyerSignInBody } from "@workspace/api-zod";
import { eq } from "drizzle-orm";
import { randomUUID, createHash } from "crypto";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "procjus-salt-2025").digest("hex");
}

router.post("/lawyers", async (req, res) => {
  const body = RegisterLawyerBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "VALIDATION_ERROR", message: body.error.message });
    return;
  }

  const existing = await db
    .select()
    .from(lawyersTable)
    .where(eq(lawyersTable.email, body.data.email))
    .limit(1);

  if (existing.length) {
    res.status(409).json({ error: "CONFLICT", message: "Email already registered" });
    return;
  }

  const uuid = randomUUID();
  const [lawyer] = await db
    .insert(lawyersTable)
    .values({
      uuid,
      name: body.data.name,
      email: body.data.email,
      oab: body.data.oab,
      phone: body.data.phone,
      passwordHash: hashPassword(body.data.password),
      cep: body.data.cep ?? null,
      state: body.data.state ?? null,
      city: body.data.city ?? null,
      address: body.data.address ?? null,
      status: "pending",
    })
    .returning();

  res.status(201).json({
    id: lawyer.uuid,
    name: lawyer.name,
    email: lawyer.email,
    oab: lawyer.oab,
    status: lawyer.status,
    createdAt: lawyer.createdAt.toISOString(),
  });
});

router.post("/lawyers/signin", async (req, res) => {
  const body = LawyerSignInBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "VALIDATION_ERROR", message: body.error.message });
    return;
  }

  const found = await db
    .select()
    .from(lawyersTable)
    .where(eq(lawyersTable.email, body.data.email))
    .limit(1);

  if (!found.length || found[0].passwordHash !== hashPassword(body.data.password)) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "Invalid credentials" });
    return;
  }

  const lawyer = found[0];
  const token = Buffer.from(`${lawyer.uuid}:${Date.now()}`).toString("base64");

  res.json({
    token,
    lawyer: {
      id: lawyer.uuid,
      name: lawyer.name,
      email: lawyer.email,
      oab: lawyer.oab,
      status: lawyer.status,
      createdAt: lawyer.createdAt.toISOString(),
    },
  });
});

export default router;
