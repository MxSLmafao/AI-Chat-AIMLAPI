import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { SendMessageRequest } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MessageInputProps {
  username: string;
}

export function MessageInput({ username }: MessageInputProps) {
  const [content, setContent] = useState("");
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (data: SendMessageRequest) => {
      const res = await apiRequest("POST", "/api/messages", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", username] });
      setContent("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && !mutation.isPending) {
      mutation.mutate({ content, username });
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
