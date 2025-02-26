import { useEffect } from "react";
import { useLocation } from "wouter";
import { MessageList } from "@/components/chat/message-list";
import { MessageInput } from "@/components/chat/message-input";
import { useQuery } from "@tanstack/react-query";
import { Message } from "@shared/schema";

export default function Chat() {
  const [, setLocation] = useLocation();
  const username = localStorage.getItem("chat-username");

  useEffect(() => {
    if (!username) {
      setLocation("/");
    }
  }, [username, setLocation]);

  const { data: messages } = useQuery<Message[]>({
    queryKey: ["/api/messages", username],
    enabled: !!username
  });

  if (!username) return null;

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b p-4">
        <h1 className="text-2xl font-bold">Chat with AI</h1>
        <p className="text-muted-foreground">Logged in as {username}</p>
      </header>
      
      <main className="flex-1 overflow-hidden flex flex-col">
        <MessageList messages={messages || []} />
        <MessageInput username={username} />
      </main>
    </div>
  );
}
