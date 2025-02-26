import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { sendMessageSchema } from "@shared/schema";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";

const AIML_API_KEY = process.env.AIMLAPI_KEY;
if (!AIML_API_KEY) {
  throw new Error("AIMLAPI_KEY environment variable is required");
}

// Configure OpenAI with aimlapi.com base URL
const openai = new OpenAI({
  apiKey: AIML_API_KEY,
  baseURL: "https://api.aimlapi.com/v1"
});

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false
});

export async function registerRoutes(app: Express) {
  app.get("/api/messages/:username", async (req, res) => {
    const messages = await storage.getMessages(req.params.username);
    res.json(messages);
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
        model: result.data.model
      });

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
        model: result.data.model
      });

      res.json([userMessage, aiMessage]);
    } catch (error) {
      console.error("AI API error:", error);
      res.status(500).json({ error: "Failed to get AI response" });
    }
  });

  return createServer(app);
}