import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { MessageList } from "@/components/chat/message-list";
import { MessageInput } from "@/components/chat/message-input";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { useQuery } from "@tanstack/react-query";
import { Chat as ChatType, Message } from "@shared/schema";

const DEFAULT_USERNAME = "user";

export default function Chat() {
  const [, setLocation] = useLocation();
  const params = useParams<{ uuid?: string }>();
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);

  const { data: chats = [] } = useQuery<ChatType[]>({
    queryKey: ["/api/chats"],
  });

  // If we have a UUID in the URL, fetch that chat
  const { data: selectedChat } = useQuery<ChatType>({
    queryKey: [`/api/chats/${params.uuid || ''}`],
    enabled: !!params.uuid,
  });

  // If we don't have a UUID in the URL, use the first chat
  useEffect(() => {
    if (!params.uuid && chats?.length) {
      setLocation(`/chat/${chats[0].uuid}`);
    }
  }, [params.uuid, chats, setLocation]);

  // Update selectedChatId when selectedChat changes
  useEffect(() => {
    if (selectedChat) {
      setSelectedChatId(selectedChat.id);
    }
  }, [selectedChat]);

  const { data: messages = [], isError } = useQuery<Message[]>({
    queryKey: [`/api/chats/${params.uuid}/messages`],
    enabled: !!params.uuid,
  });

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar 
        selectedChatId={selectedChatId || 0} 
        onSelectChat={(chatId) => {
          const chat = chats?.find(c => c.id === chatId);
          if (chat) {
            setLocation(`/chat/${chat.uuid}`);
          }
        }} 
      />

      <div className="flex-1 flex flex-col">
        <header className="border-b p-4">
          <h1 className="text-2xl font-bold">Chat with AI</h1>
        </header>

        <main className="flex-1 overflow-hidden flex flex-col">
          {isError ? (
            <div className="p-4 text-destructive">Failed to load messages. Please try again.</div>
          ) : (
            <MessageList messages={messages} />
          )}
          {params.uuid && (
            <MessageInput username={DEFAULT_USERNAME} chatId={params.uuid} />
          )}
        </main>
      </div>
    </div>
  );
}