import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { SendMessageRequest } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAvailableModels } from "@/lib/models";

interface MessageInputProps {
  username: string;
}

export function MessageInput({ username }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");
  const { toast } = useToast();
  const models = getAvailableModels();

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
      mutation.mutate({ content, username, model });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t p-4">
      <div className="space-y-4">
        <Select value={model} onValueChange={setModel}>
          <SelectTrigger>
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {models.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <span className="font-medium">{model.name}</span>
                <span className="ml-2 text-muted-foreground">({model.provider})</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
      </div>
    </form>
  );
}