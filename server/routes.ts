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

  app.get("/api/chats/:identifier", async (req, res) => {
    const identifier = req.params.identifier;
    try {
      let chat;
      // Try to parse as number first for backward compatibility
      const id = parseInt(identifier);
      if (!isNaN(id)) {
        chat = await storage.getChat(id);
      } else {
        chat = await storage.getChatByUuid(identifier);
      }

      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }
      res.json(chat);
    } catch (error) {
      console.error("Error fetching chat:", error);
      res.status(500).json({ error: "Failed to fetch chat" });
    }
  });

  app.post("/api/chats", async (req, res) => {
    const result = insertChatSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid request" });
    }

    try {
      const chat = await storage.createChat(result.data);
      if (!chat) {
        return res.status(500).json({ error: "Failed to create chat" });
      }
      res.json(chat);
    } catch (error) {
      console.error("Error creating chat:", error);
      res.status(500).json({ error: "Failed to create chat" });
    }
  });

  app.patch("/api/chats/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid chat ID" });
    }

    const result = insertChatSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid request" });
    }

    try {
      const chat = await storage.updateChat(id, result.data);
      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }
      res.json(chat);
    } catch (error) {
      console.error("Error updating chat:", error);
      res.status(500).json({ error: "Failed to update chat" });
    }
  });

  app.delete("/api/chats/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid chat ID" });
    }

    try {
      await storage.deleteChat(id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting chat:", error);
      res.status(500).json({ error: "Failed to delete chat" });
    }
  });

  // Message routes
  app.get("/api/chats/:chatId/messages", async (req, res) => {
    const chatId = parseInt(req.params.chatId);
    if (isNaN(chatId)) {
      return res.status(400).json({ error: "Invalid chat ID" });
    }

    try {
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
      // Get the chat to use its model
      const chat = await storage.getChat(result.data.chatId);
      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }

      const userMessage = await storage.insertMessage({
        content: result.data.content,
        username: result.data.username,
        role: "user",
        model: chat.model,
        chatId: result.data.chatId
      });

      try {
        // Get chat history for context
        const chatHistory = await storage.getMessages(chat.id);
        const messages = chatHistory.map(msg => ({
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content
        }));

        const completion = await openai.chat.completions.create({
          model: chat.model,
          messages: [
            {
              role: "system",
              content: "You are an AI assistant who knows everything."
            },
            ...messages.slice(-5), // Include last 5 messages for context
            {
              role: "user",
              content: result.data.content
            }
          ],
          temperature: 0.7,
          max_tokens: 2048 // Increased from 500 to 2048
        });

        if (!completion.choices[0]?.message?.content) {
          throw new Error("No response from AI");
        }

        const aiMessage = await storage.insertMessage({
          content: completion.choices[0].message.content,
          username: result.data.username,
          role: "assistant",
          model: chat.model,
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