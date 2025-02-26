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
    const newChat: Chat = {
      id: this.currentChatId++,
      uuid: uuidv4(),
      title: chat.title,
      model: chat.model || "gpt-4o-mini",
      createdAt: new Date()
    };
    this.chats.push(newChat);
    return newChat;
  }

  async getChat(id: number): Promise<Chat | null> {
    return this.chats.find(c => c.id === id) || null;
  }

  async getChatByUuid(uuid: string): Promise<Chat | null> {
    if (!uuid) return null;
    return this.chats.find(c => c.uuid === uuid) || null;
  }

  async updateChat(id: number, chat: Partial<InsertChat>): Promise<Chat> {
    const existingChat = await this.getChat(id);
    if (!existingChat) {
      throw new Error("Chat not found");
    }

    const updatedChat = {
      ...existingChat,
      ...chat,
      model: chat.model || existingChat.model
    };

    this.chats = this.chats.map(c => c.id === id ? updatedChat : c);
    return updatedChat;
  }

  async deleteChat(id: number): Promise<void> {
    this.chats = this.chats.filter(c => c.id !== id);
    this.messages = this.messages.filter(m => m.chatId !== id);
  }

  async getMessages(chatId: number): Promise<Message[]> {
    return this.messages.filter(m => m.chatId === chatId);
  }

  async insertMessage(message: InsertMessage): Promise<Message> {
    if (!message.chatId) {
      throw new Error("chatId is required");
    }

    const chat = await this.getChat(message.chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }

    const newMessage: Message = {
      id: this.currentMessageId++,
      chatId: message.chatId,
      content: message.content,
      role: message.role,
      username: message.username,
      model: message.model || chat.model,
      timestamp: new Date()
    };
    this.messages.push(newMessage);
    return newMessage;
  }
}

export const storage = new MemStorage();