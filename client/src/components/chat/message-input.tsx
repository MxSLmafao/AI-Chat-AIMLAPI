import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { SendMessageRequest, Chat } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MessageInputProps {
  username: string;
  chatId: number;
}

export function MessageInput({ username, chatId }: MessageInputProps) {
  const [content, setContent] = useState("");
  const { toast } = useToast();

  const { data: chat } = useQuery<Chat>({
    queryKey: [`/api/chats/${chatId}`],
  });

  const mutation = useMutation({
    mutationFn: async (data: SendMessageRequest) => {
      const res = await apiRequest("POST", "/api/messages", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatId}/messages`] });
      setContent("");
    },
    onError: (error: Error) => {
      console.error("Message sending error:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && !mutation.isPending && chat) {
      mutation.mutate({ content, username, model: chat.model, chatId });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t p-4">
      <div className="flex gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your message..."
          className="resize-none"
          rows={1}
          disabled={mutation.isPending}
        />
        <Button
          type="submit"
          size="icon"
          disabled={mutation.isPending || !content.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}