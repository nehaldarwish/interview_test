import { Button } from "./ui/button";
import { MessagesSquareIcon, PlusIcon, Trash2Icon } from "lucide-react";

interface ChatReference {
  name: string;
  id: string;
  updatedAt?: string;
}

interface Props {
  onCreateChat?: () => void;
  chats: ChatReference[];
  onSelectChat?: (chatId: string) => void;
  selectedChatId: string | null;
  onDeleteChat?: (chatId: string) => void;  // ← NEW
}

export function ChatSidebar(props: Props) {
  const { chats, selectedChatId, onCreateChat, onSelectChat, onDeleteChat } = props;

  const sortedChats = [...chats].sort((a, b) => {
    if (a.updatedAt && b.updatedAt) {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    return b.id.localeCompare(a.id);
  });

  const getDisplayName = (chat: ChatReference, index: number) => {
    const name = chat.name?.trim();
    if (name && name !== "New Chat") return name;
    return `Chat #${index + 1}`;
  };

  return (
    <div className="fixed left-0 top-16 bottom-0 w-64 border-r border-border bg-background p-4 flex flex-col gap-3 overflow-hidden">
      <Button onClick={onCreateChat} size="sm" className="w-full">
        <PlusIcon className="w-5 h-5 mr-2" />
        New Chat
      </Button>

      <hr className="my-2 border-border" />

      <div className="flex-1 overflow-y-auto pr-2">
        {sortedChats.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground mt-8">No chats yet</p>
        ) : (
          <div className="flex flex-col gap-1">
            {sortedChats.map((chat, index) => {
              const isSelected = selectedChatId === chat.id;
              const displayName = getDisplayName(chat, index);

              return (
                <div
                  key={chat.id}
                  className="group flex items-center gap-2 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <Button
                    variant={isSelected ? "secondary" : "ghost"}
                    size="sm"
                    className="flex-1 justify-start text-left font-normal truncate"
                    onClick={() => onSelectChat?.(chat.id)}
                  >
                    <MessagesSquareIcon className="w-4 h-4 mr-2 shrink-0" />
                    <span className="truncate">{displayName}</span>
                  </Button>

                  {/* Delete Button – only shows on hover */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat?.(chat.id);
                    }}
                  >
                    <Trash2Icon className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}