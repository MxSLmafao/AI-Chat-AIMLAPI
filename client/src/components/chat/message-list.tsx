import { Message } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Bot } from "lucide-react";

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex gap-3 max-w-[80%]",
            message.role === "assistant" ? "mr-auto" : "ml-auto"
          )}
        >
          <div
            className={cn(
              "p-3 rounded-lg",
              message.role === "assistant"
                ? "bg-secondary text-secondary-foreground"
                : "bg-primary text-primary-foreground"
            )}
          >
            {message.role === "assistant" && (
              <div className="flex items-center gap-2 mb-2">
                <Bot className="h-4 w-4" />
                <span className="font-medium">AI</span>
                <span className="text-xs opacity-70">via {message.model}</span>
              </div>
            )}
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}