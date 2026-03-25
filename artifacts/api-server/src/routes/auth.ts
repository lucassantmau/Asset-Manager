import { Router, type IRouter } from "express";
import { db, registrationTokensTable, clientsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

const router: IRouter = Router();

router.get("/auth/validate-token", async (req, res) => {
  const token = req.query.token as string;
  if (!token) {
    res.status(400).json({ error: "TOKEN_INVALID" });
    return;
  }

  const [row] = await db
    .select()
    .from(registrationTokensTable)
    .where(eq(registrationTokensTable.token, token))
    .limit(1);

  if (!row || row.used || new Date(row.expiresAt) < new Date()) {
    res.status(400).json({ error: "TOKEN_INVALID" });
    return;
  }

  res.json({ email: row.email, name: row.name });
});

router.post("/auth/register", async (req, res) => {
  const { token, password, name } = req.body;

  if (!token || !password) {
    res.status(400).json({ error: "MISSING_FIELDS" });
    return;
  }

  const [row] = await db
    .select()
    .from(registrationTokensTable)
    .where(eq(registrationTokensTable.token, token))
    .limit(1);

  if (!row || row.used || new Date(row.expiresAt) < new Date()) {
    res.status(400).json({ error: "TOKEN_INVALID" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const uuid = randomUUID();
  const email = row.email;
  const finalName = row.name || name || "";

  await db.insert(clientsTable).values({ uuid, email, name: finalName, passwordHash });
  await db.update(registrationTokensTable)
    .set({ used: true })
    .where(eq(registrationTokensTable.token, token));

  res.json({ success: true, email });
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "MISSING_FIELDS" });
    return;
  }

  const [client] = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.email, email))
    .limit(1);

  if (!client) {
    res.status(401).json({ error: "INVALID_CREDENTIALS" });
    return;
  }

  const valid = await bcrypt.compare(password, client.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "INVALID_CREDENTIALS" });
    return;
  }

  res.json({ success: true, email: client.email, name: client.name, uuid: client.uuid });
});

export default router;
