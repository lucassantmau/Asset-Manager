import { Router, type IRouter } from "express";
import { db, casesTable } from "@workspace/db";
import { SubmitCaseBody, GetCaseParams } from "@workspace/api-zod";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.post("/cases", async (req, res) => {
  const body = SubmitCaseBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "VALIDATION_ERROR", message: body.error.message });
    return;
  }

  const uuid = randomUUID();
  const [newCase] = await db
    .insert(casesTable)
    .values({
      uuid,
      description: body.data.description,
      evidences: body.data.evidences ?? [],
      value: body.data.value ?? null,
      name: body.data.name,
      whatsapp: body.data.whatsapp,
      email: body.data.email,
      state: body.data.state ?? null,
      city: body.data.city ?? null,
      status: "pending",
    })
    .returning();

  res.status(201).json({
    id: newCase.uuid,
    status: newCase.status,
    description: newCase.description,
    name: newCase.name,
    email: newCase.email,
    whatsapp: newCase.whatsapp,
    createdAt: newCase.createdAt.toISOString(),
  });
});

router.get("/cases/:caseId", async (req, res) => {
  const params = GetCaseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "VALIDATION_ERROR", message: params.error.message });
    return;
  }

  const found = await db
    .select()
    .from(casesTable)
    .where(eq(casesTable.uuid, params.data.caseId))
    .limit(1);

  if (!found.length) {
    res.status(404).json({ error: "NOT_FOUND", message: "Case not found" });
    return;
  }

  const c = found[0];
  res.json({
    id: c.uuid,
    status: c.status,
    description: c.description,
    name: c.name,
    email: c.email,
    whatsapp: c.whatsapp,
    createdAt: c.createdAt.toISOString(),
  });
});

export default router;
