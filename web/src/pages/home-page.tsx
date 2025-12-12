import React, { useEffect } from "react";
import { ChatSidebar } from "../components/chat-sidebar";
import { ChatInputBox } from "../components/chat-input-box";
import { MessageContainer, AssistantLoadingIndicator, MessageBubble } from "../components/message";
import {
  useChatsQuery,
  useChatQuery,
  useCreateChatMutation,
  useSendMessageMutation,
  useDeleteChatMutation,
} from "../data/queries/chat";
import Spinner from "../components/ui/spinner";
import { Button } from "../components/ui/button";
import { MessagesSquareIcon, AlertCircle, Bot } from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/alert";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

// Local storage keys
const STORAGE_KEYS = {
  SELECTED_CHAT: "tekkr_selected_chat",
  SELECTED_MODEL: "tekkr_selected_model",
};

export function HomePage() {
  const [selectedChatId, setSelectedChatId] = React.useState<string | null>(() => {
    // Load from localStorage on mount
    return localStorage.getItem(STORAGE_KEYS.SELECTED_CHAT);
  });
  
  const [selectedModel, setSelectedModel] = React.useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL) || "gpt-4o-mini";
  });

  const chatsQuery = useChatsQuery();
  const chatQuery = useChatQuery(selectedChatId);
  const createChatMutation = useCreateChatMutation();
  const sendMessageMutation = useSendMessageMutation();
  const deleteChatMutation = useDeleteChatMutation();
  
  // Persist selected chat to localStorage
  useEffect(() => {
    if (selectedChatId) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_CHAT, selectedChatId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.SELECTED_CHAT);
    }
  }, [selectedChatId]);

  // Persist selected model to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, selectedModel);
  }, [selectedModel]);
  
  // Auto-select the first chat if none selected and there are chats
  useEffect(() => {
    if (!selectedChatId && chatsQuery.data?.chats.length) {
      const firstChat = chatsQuery.data.chats[0];
      setSelectedChatId(firstChat.id);
    }
  }, [chatsQuery.data, selectedChatId]);

  const handleCreateChat = async () => {
    try {
      const newChat = await createChatMutation.mutateAsync();
      setSelectedChatId(newChat.id);
    } catch (err) {
      toast.error("Failed to create chat");
    }
  };

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
  };

  const handleSendMessage = (content: string) => {
    if (!selectedChatId) return;
    sendMessageMutation.mutate({
      chatId: selectedChatId,
      content,
      model: selectedModel,
    });
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!confirm("Delete this chat? This cannot be undone.")) return;
  
    await deleteChatMutation.mutateAsync(chatId);
  
    if (selectedChatId === chatId) {
      const remaining = chats.filter(c => c.id !== chatId);
      setSelectedChatId(remaining.length > 0 ? remaining[0].id : null);
    }
  
    toast.success("Chat deleted");
  };

  const chats = chatsQuery.data?.chats || [];

  if (chatsQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-10 px-8">
        <div className="text-center">
          <Bot className="w-24 h-24 text-muted-foreground/60 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-3">Welcome to Tekkr</h2>
          <p className="text-xl text-muted-foreground">Start a conversation with AI</p>
        </div>
        <Button onClick={handleCreateChat} size="lg" className="gap-3 text-lg px-8 py-6">
          <MessagesSquareIcon className="w-6 h-6" />
          New Chat
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <div className="w-64 flex-shrink-0">
        <ChatSidebar
          chats={chats}
          selectedChatId={selectedChatId}
          onCreateChat={handleCreateChat}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
        />
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex-1 overflow-y-auto py-8 min-h-0">
          {chatQuery.isError ? (
            <Alert variant="destructive" className="max-w-md mx-auto mt-20">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load messages.
                <Button variant="outline" size="sm" className="ml-3" onClick={() => chatQuery.refetch()}>
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : !chatQuery.data?.messages?.length ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Bot className="w-20 h-20 mb-6 opacity-60" />
              <p className="text-xl">How can I help you today?</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {chatQuery.data.messages.map((msg, i) => (
                <MessageContainer key={i} role={msg.role}>
                  <MessageBubble message={msg} />
                </MessageContainer>
              ))}
              {sendMessageMutation.isPending && <AssistantLoadingIndicator />}
            </div>
          )}
        </div>

        <div className="border-t border-border bg-background px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-3">
              <span className="text-sm font-medium text-muted-foreground">Model:</span>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (Fast)</SelectItem>
                  <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ChatInputBox onSend={handleSendMessage} />
          </div>
        </div>
      </div>
    </div>
  );
}