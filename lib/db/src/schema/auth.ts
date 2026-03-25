import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";

export const registrationTokensTable = pgTable("registration_tokens", {
  id: serial("id").primaryKey(),
  token: text("token").unique().notNull(),
  email: text("email").notNull(),
  name: text("name"),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const clientsTable = pgTable("clients", {
  id: serial("id").primaryKey(),
  uuid: text("uuid").unique().notNull(),
  email: text("email").unique().notNull(),
  name: text("name"),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type RegistrationToken = typeof registrationTokensTable.$inferSelect;
export type Client = typeof clientsTable.$inferSelect;
