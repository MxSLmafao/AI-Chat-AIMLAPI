import { messages, type Message, type InsertMessage } from "@shared/schema";

export interface IStorage {
  getMessages(username: string): Promise<Message[]>;
  insertMessage(message: InsertMessage): Promise<Message>;
}

export class MemStorage implements IStorage {
  private messages: Message[];
  private currentId: number;

  constructor() {
    this.messages = [];
    this.currentId = 1;
  }

  async getMessages(username: string): Promise<Message[]> {
    return this.messages.filter(m => m.username === username);
  }

  async insertMessage(message: InsertMessage): Promise<Message> {
    const newMessage: Message = {
      id: this.currentId++,
      ...message,
      timestamp: new Date()
    };
    this.messages.push(newMessage);
    return newMessage;
  }
}

export const storage = new MemStorage();
