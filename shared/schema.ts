import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  username: text("username").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  model: text("model").default("gpt-3.5-turbo").notNull()
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  content: true,
  role: true,
  username: true,
  model: true
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export const sendMessageSchema = z.object({
  content: z.string().min(1),
  username: z.string().min(1),
  model: z.string().default("gpt-3.5-turbo")
});

export type SendMessageRequest = z.infer<typeof sendMessageSchema>;