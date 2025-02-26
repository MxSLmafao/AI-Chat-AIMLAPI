import { MessageList } from "@/components/chat/message-list";
import { MessageInput } from "@/components/chat/message-input";
import { useQuery } from "@tanstack/react-query";
import { Message } from "@shared/schema";

const DEFAULT_USERNAME = "user";

export default function Chat() {
  const { data: messages, isError } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b p-4">
        <h1 className="text-2xl font-bold">Chat with AI</h1>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col">
        {isError ? (
          <div className="p-4 text-destructive">Failed to load messages. Please try again.</div>
        ) : (
          <MessageList messages={messages || []} />
        )}
        <MessageInput username={DEFAULT_USERNAME} />
      </main>
    </div>
  );
}