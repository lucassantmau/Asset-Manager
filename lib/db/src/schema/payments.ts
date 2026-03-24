import { pgTable, text, serial, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  uuid: text("uuid").notNull().unique(),
  caseUuid: text("case_uuid").notNull(),
  email: text("email").notNull(),
  whatsapp: text("whatsapp").notNull(),
  cpf: text("cpf").notNull(),
  method: text("method").notNull(),
  amount: real("amount").notNull().default(199.90),
  status: text("status").notNull().default("pending"),
  pixCode: text("pix_code"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
