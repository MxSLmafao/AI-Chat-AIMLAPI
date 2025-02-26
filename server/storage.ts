import { messages, type Message, type InsertMessage, type Chat, type InsertChat } from "@shared/schema";
import { v4 as uuidv4 } from "uuid";

export interface IStorage {
  // Chat operations
  getChats(): Promise<Chat[]>;
  createChat(chat: InsertChat): Promise<Chat>;
  getChat(id: number): Promise<Chat | null>;
  getChatByUuid(uuid: string): Promise<Chat | null>;
  updateChat(id: number, chat: Partial<InsertChat>): Promise<Chat>;
  deleteChat(id: number): Promise<void>;

  // Message operations
  getMessages(chatId: number): Promise<Message[]>;
  insertMessage(message: InsertMessage): Promise<Message>;
}

export class MemStorage implements IStorage {
  private messages: Message[];
  private chats: Chat[];
  private currentMessageId: number;
  private currentChatId: number;

  constructor() {
    this.messages = [];
    this.chats = [];
    this.currentMessageId = 1;
    this.currentChatId = 1;

    // Create a default chat
    this.createChat({ title: "New Chat", model: "gpt-4o-mini" }).catch(console.error);
  }

  async getChats(): Promise<Chat[]> {
    return [...this.chats].sort((a, b) => b.id - a.id);
  }

  async createChat(chat: InsertChat): Promise<Chat> {
    if (!chat.title?.trim()) {
      throw new Error("Chat title is required");
    }

    let uuid = uuidv4();
    // Ensure UUID uniqueness
    while (this.chats.some(c => c.uuid === uuid)) {
      uuid = uuidv4();
    }

    const newChat: Chat = {
      id: this.currentChatId++,
      uuid,
      title: chat.title.trim(),
      model: chat.model || "gpt-4o-mini",
      createdAt: new Date()
    };

    this.chats.push({ ...newChat });
    return { ...newChat }; // Return a copy to prevent mutation
  }

  async getChat(id: number): Promise<Chat | null> {
    if (isNaN(id) || id < 1) return null;
    const chat = this.chats.find(c => c.id === id);
    return chat ? { ...chat } : null;
  }

  async getChatByUuid(uuid: string): Promise<Chat | null> {
    if (!uuid?.trim()) return null;
    const chat = this.chats.find(c => c.uuid === uuid.trim());
    return chat ? { ...chat } : null;
  }

  async updateChat(id: number, chat: Partial<InsertChat>): Promise<Chat> {
    if (isNaN(id) || id < 1) {
      throw new Error("Invalid chat ID");
    }

    const existingChat = await this.getChat(id);
    if (!existingChat) {
      throw new Error("Chat not found");
    }

    const updatedChat = {
      ...existingChat,
      title: chat.title?.trim() || existingChat.title,
      model: chat.model || existingChat.model
    };

    // Ensure we're not accidentally mutating the original chat
    this.chats = this.chats.map(c => c.id === id ? { ...updatedChat } : c);
    return { ...updatedChat };
  }

  async deleteChat(id: number): Promise<void> {
    if (isNaN(id) || id < 1) {
      throw new Error("Invalid chat ID");
    }

    const chatExists = this.chats.some(c => c.id === id);
    if (!chatExists) {
      throw new Error("Chat not found");
    }

    this.chats = this.chats.filter(c => c.id !== id);
    this.messages = this.messages.filter(m => m.chatId !== id);
  }

  async getMessages(chatId: number): Promise<Message[]> {
    if (isNaN(chatId) || chatId < 1) {
      throw new Error("Invalid chat ID");
    }

    const chat = await this.getChat(chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }

    return [...this.messages]
      .filter(m => m.chatId === chatId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async insertMessage(message: InsertMessage): Promise<Message> {
    if (!message.chatId || isNaN(message.chatId) || message.chatId < 1) {
      throw new Error("Invalid chat ID");
    }

    const chat = await this.getChat(message.chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }

    if (!message.content?.trim()) {
      throw new Error("Message content is required");
    }

    const newMessage: Message = {
      id: this.currentMessageId++,
      chatId: message.chatId,
      content: message.content.trim(),
      role: message.role,
      username: message.username,
      model: message.model || chat.model,
      timestamp: new Date()
    };

    this.messages.push({ ...newMessage });
    return { ...newMessage }; // Return a copy to prevent mutation
  }
}

export const storage = new MemStorage();