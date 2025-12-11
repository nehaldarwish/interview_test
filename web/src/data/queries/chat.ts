import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { toast } from "sonner";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface Chat {
  id: string;
  name: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatListItem {
  id: string;
  name: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

// Get all chats
export function useChatsQuery() {
  return useQuery<{ chats: ChatListItem[] }>({
    queryKey: ["chats"],
    queryFn: async () => {
      const response = await apiClient.get("/chats");
      return response.data;
    },
    retry: 1,
    staleTime: 1000 * 30, // Consider data fresh for 30 seconds
  });
}

// Get a specific chat with all messages
export function useChatQuery(chatId: string | null) {
  return useQuery<Chat>({
    queryKey: ["chats", chatId],
    queryFn: async () => {
      if (!chatId) throw new Error("No chat ID");
      const response = await apiClient.get(`/chats/${chatId}`);
      return response.data;
    },
    enabled: !!chatId,
    retry: 1,
    staleTime: 1000 * 30,
  });
}

// Create a new chat
export function useCreateChatMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post("/chats");
      return response.data as Chat;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Failed to create chat";
      toast.error("Error", { description: message });
    },
  });
}

// Send a message in a chat
export function useSendMessageMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ chatId, content, model }: { 
      chatId: string; 
      content: string;
      model?: string;
    }) => {
      const response = await apiClient.post(`/chats/${chatId}/messages`, {
        content,
        model: model || "gpt-4o-mini", // fallback
      });
      return response.data as { message: string; chat: Chat };
    },
    onSuccess: (data, variables) => {
      // Update the chat query with the new data
      queryClient.setQueryData(["chats", variables.chatId], data.chat);
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Failed to send message";
      toast.error("Error", { description: message });
    },
  });
}

// Delete a chat
export function useDeleteChatMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (chatId: string) => {
      const response = await apiClient.delete(`/chats/${chatId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      toast.success("Chat deleted");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Failed to delete chat";
      toast.error("Error", { description: message });
    },
  });
}
