import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  username: text("username").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  model: text("model").default("gpt-4o-mini").notNull(),
  chatId: serial("chat_id").notNull()
});

export const insertChatSchema = createInsertSchema(chats).pick({
  title: true
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  content: true,
  role: true,
  username: true,
  model: true,
  chatId: true
});

export type Chat = typeof chats.$inferSelect;
export type InsertChat = z.infer<typeof insertChatSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export const sendMessageSchema = z.object({
  content: z.string().min(1),
  username: z.string().min(1),
  model: z.string().default("gpt-4o-mini"),
  chatId: z.number()
});

export type SendMessageRequest = z.infer<typeof sendMessageSchema>;