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
  const [selectedChatId, setSelectedChatId] = useState<number>(1); // Initialize with default chat ID

  const { data: chats } = useQuery<ChatType[]>({
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
    } else if (chats?.length && !params.uuid) {
      setSelectedChatId(chats[0].id);
    }
  }, [selectedChat, chats, params.uuid]);

  const { data: messages, isError } = useQuery<Message[]>({
    queryKey: [`/api/chats/${selectedChatId}/messages`],
    enabled: selectedChatId > 0,
  });

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar 
        selectedChatId={selectedChatId} 
        onSelectChat={(chatId) => {
          const chat = chats?.find(c => c.id === chatId);
          if (chat) {
            setLocation(`/chat/${chat.uuid}`);
          }
        }} 
      />

      <div className="flex-1 flex flex-col">
        <header className="border-b p-4">
          <h1 className="text-2xl font-bold">
            {selectedChat?.title || "Chat with AI"}
          </h1>
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