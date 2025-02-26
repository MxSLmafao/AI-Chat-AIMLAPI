import { messages, type Message, type InsertMessage, type Chat, type InsertChat } from "@shared/schema";

export interface IStorage {
  // Chat operations
  getChats(): Promise<Chat[]>;
  createChat(chat: InsertChat): Promise<Chat>;
  getChat(id: number): Promise<Chat | null>;

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
    this.createChat({ title: "New Chat" });
  }

  async getChats(): Promise<Chat[]> {
    return this.chats;
  }

  async createChat(chat: InsertChat): Promise<Chat> {
    const newChat: Chat = {
      id: this.currentChatId++,
      title: chat.title,
      createdAt: new Date()
    };
    this.chats.push(newChat);
    return newChat;
  }

  async getChat(id: number): Promise<Chat | null> {
    return this.chats.find(c => c.id === id) || null;
  }

  async getMessages(chatId: number): Promise<Message[]> {
    return this.messages.filter(m => m.chatId === chatId);
  }

  async insertMessage(message: InsertMessage): Promise<Message> {
    const newMessage: Message = {
      id: this.currentMessageId++,
      ...message,
      timestamp: new Date()
    };
    this.messages.push(newMessage);
    return newMessage;
  }
}

export const storage = new MemStorage();