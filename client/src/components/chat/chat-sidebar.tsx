import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Chat } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  selectedChatId: number;
  onSelectChat: (chatId: number) => void;
}

export function ChatSidebar({ selectedChatId, onSelectChat }: ChatSidebarProps) {
  const [newChatTitle, setNewChatTitle] = useState("");
  const { toast } = useToast();

  const { data: chats = [] } = useQuery<Chat[]>({
    queryKey: ["/api/chats"],
  });

  const createChatMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await apiRequest("POST", "/api/chats", { title });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      setNewChatTitle("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create new chat",
        variant: "destructive"
      });
    }
  });

  const handleCreateChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChatTitle.trim() && !createChatMutation.isPending) {
      createChatMutation.mutate(newChatTitle);
    }
  };

  return (
    <div className="w-64 border-r bg-muted/50 p-4 flex flex-col gap-4">
      <form onSubmit={handleCreateChat} className="flex gap-2">
        <Input
          value={newChatTitle}
          onChange={(e) => setNewChatTitle(e.target.value)}
          placeholder="New Chat Title"
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={createChatMutation.isPending}>
          <PlusCircle className="h-4 w-4" />
        </Button>
      </form>

      <div className="flex-1 overflow-y-auto space-y-2">
        {chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={cn(
              "w-full px-3 py-2 rounded-lg flex items-center gap-2 transition-colors",
              selectedChatId === chat.id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm font-medium truncate">{chat.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
