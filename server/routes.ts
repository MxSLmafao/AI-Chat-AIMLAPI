import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { sendMessageSchema } from "@shared/schema";
import rateLimit from "express-rate-limit";

const AIML_API_KEY = process.env.AIML_API_KEY || "demo";

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20
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

    const userMessage = await storage.insertMessage({
      content: result.data.content,
      username: result.data.username,
      role: "user"
    });

    try {
      const aiResponse = await fetch("https://api.aiml.services/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${AIML_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: result.data.content }]
        })
      });

      if (!aiResponse.ok) {
        throw new Error("AI API error");
      }

      const aiData = await aiResponse.json();
      const aiMessage = await storage.insertMessage({
        content: aiData.choices[0].message.content,
        username: result.data.username,
        role: "assistant"
      });

      res.json([userMessage, aiMessage]);
    } catch (error) {
      console.error("AI API error:", error);
      res.status(500).json({ error: "Failed to get AI response" });
    }
  });

  return createServer(app);
}
