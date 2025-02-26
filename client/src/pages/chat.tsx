import { useState } from "react";
import { MessageList } from "@/components/chat/message-list";
import { MessageInput } from "@/components/chat/message-input";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { useQuery } from "@tanstack/react-query";
import { Message } from "@shared/schema";

const DEFAULT_USERNAME = "user";

export default function Chat() {
  const [selectedChatId, setSelectedChatId] = useState<number>(1); // Start with the default chat

  const { data: messages, isError } = useQuery<Message[]>({
    queryKey: [`/api/chats/${selectedChatId}/messages`],
  });

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar selectedChatId={selectedChatId} onSelectChat={setSelectedChatId} />

      <div className="flex-1 flex flex-col">
        <header className="border-b p-4">
          <h1 className="text-2xl font-bold">Chat with AI</h1>
        </header>

        <main className="flex-1 overflow-hidden flex flex-col">
          {isError ? (
            <div className="p-4 text-destructive">Failed to load messages. Please try again.</div>
          ) : (
            <MessageList messages={messages || []} />
          )}
          <MessageInput username={DEFAULT_USERNAME} chatId={selectedChatId} />
        </main>
      </div>
    </div>
  );
}