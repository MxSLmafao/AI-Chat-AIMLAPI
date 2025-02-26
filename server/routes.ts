import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { sendMessageSchema, insertChatSchema } from "@shared/schema";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";

const AIMLAPI_KEY = process.env.AIMLAPI_KEY;
if (!AIMLAPI_KEY) {
  throw new Error("AIMLAPI_KEY environment variable is required");
}

// Configure OpenAI with aimlapi.com base URL
const openai = new OpenAI({
  apiKey: AIMLAPI_KEY,
  baseURL: "https://api.aimlapi.com/v1"
});

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false
});

export async function registerRoutes(app: Express) {
  // Chat routes
  app.get("/api/chats", async (req, res) => {
    try {
      const chats = await storage.getChats();
      res.json(chats);
    } catch (error) {
      console.error("Error fetching chats:", error);
      res.status(500).json({ error: "Failed to fetch chats" });
    }
  });

  app.post("/api/chats", async (req, res) => {
    const result = insertChatSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid request" });
    }

    try {
      const chat = await storage.createChat(result.data);
      res.json(chat);
    } catch (error) {
      console.error("Error creating chat:", error);
      res.status(500).json({ error: "Failed to create chat" });
    }
  });

  // Message routes
  app.get("/api/chats/:chatId/messages", async (req, res) => {
    try {
      const chatId = parseInt(req.params.chatId);
      const messages = await storage.getMessages(chatId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", limiter, async (req, res) => {
    const result = sendMessageSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid request" });
    }

    try {
      const userMessage = await storage.insertMessage({
        content: result.data.content,
        username: result.data.username,
        role: "user",
        model: result.data.model,
        chatId: result.data.chatId
      });

      try {
        const completion = await openai.chat.completions.create({
          model: result.data.model,
          messages: [
            {
              role: "system",
              content: "You are an AI assistant who knows everything."
            },
            { 
              role: "user", 
              content: result.data.content 
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        });

        if (!completion.choices[0]?.message?.content) {
          throw new Error("No response from AI");
        }

        const aiMessage = await storage.insertMessage({
          content: completion.choices[0].message.content,
          username: result.data.username,
          role: "assistant",
          model: result.data.model,
          chatId: result.data.chatId
        });

        res.json([userMessage, aiMessage]);
      } catch (error) {
        console.error("AI API error:", error);
        // Still return the user message even if AI fails
        res.json([userMessage]);
      }
    } catch (error) {
      console.error("Message handling error:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  return createServer(app);
}