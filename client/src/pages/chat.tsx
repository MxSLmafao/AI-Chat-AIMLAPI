import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { MessageList } from "@/components/chat/message-list";
import { MessageInput } from "@/components/chat/message-input";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { useQuery } from "@tanstack/react-query";
import { Chat as ChatType, Message } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_USERNAME = "user";

export default function Chat() {
  const [, setLocation] = useLocation();
  const params = useParams<{ uuid?: string }>();
  const [selectedChatId, setSelectedChatId] = useState<number>(1);
  const { toast } = useToast();

  const { data: chats, isLoading: isChatsLoading, error: chatsError } = useQuery<ChatType[]>({
    queryKey: ["/api/chats"],
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to load chats. Please try refreshing the page.",
        variant: "destructive"
      });
    }
  });

  // If we have a UUID in the URL, fetch that chat
  const { data: selectedChat, error: selectedChatError } = useQuery<ChatType>({
    queryKey: [`/api/chats/${params.uuid || ''}`],
    enabled: !!params.uuid,
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to load selected chat. Redirecting to default chat.",
        variant: "destructive"
      });
      if (chats?.length) {
        setLocation(`/chat/${chats[0].uuid}`);
      }
    }
  });

  // If we don't have a UUID in the URL, use the first chat
  useEffect(() => {
    if (!params.uuid && chats?.length && !isChatsLoading) {
      const defaultChat = chats[0];
      if (defaultChat && defaultChat.uuid) {
        setLocation(`/chat/${defaultChat.uuid}`);
      }
    }
  }, [params.uuid, chats, setLocation, isChatsLoading]);

  // Update selectedChatId when selectedChat changes
  useEffect(() => {
    if (selectedChat?.id) {
      setSelectedChatId(selectedChat.id);
    } else if (chats?.length && !params.uuid) {
      const defaultChat = chats[0];
      if (defaultChat?.id) {
        setSelectedChatId(defaultChat.id);
      }
    }
  }, [selectedChat, chats, params.uuid]);

  const { data: messages, isError: isMessagesError } = useQuery<Message[]>({
    queryKey: [`/api/chats/${selectedChatId}/messages`],
    enabled: selectedChatId > 0,
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    }
  });

  if (isChatsLoading) {
    return <div className="flex h-screen items-center justify-center">Loading chats...</div>;
  }

  if (chatsError) {
    return (
      <div className="flex h-screen items-center justify-center text-destructive">
        Failed to load chats. Please refresh the page.
      </div>
    );
  }

  const validSelectedChat = selectedChat || chats?.find(c => c.id === selectedChatId);

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar 
        selectedChatId={selectedChatId} 
        onSelectChat={(chatId) => {
          const chat = chats?.find(c => c.id === chatId);
          if (chat?.uuid) {
            setLocation(`/chat/${chat.uuid}`);
          }
        }} 
      />

      <div className="flex-1 flex flex-col">
        <header className="border-b p-4">
          <h1 className="text-2xl font-bold">
            {validSelectedChat?.title || "Chat with AI"}
          </h1>
        </header>

        <main className="flex-1 overflow-hidden flex flex-col">
          {isMessagesError ? (
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