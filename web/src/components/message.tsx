import React from "react";
import { cn } from "../lib/utils";
import Spinner from "./ui/spinner";
import { BotIcon, UserIcon } from "lucide-react";
import { MessageContentRenderer } from "./message-content-renderer";
import { ProjectPlan } from "./project-plan-preview";

export type MessageContent = string | { text?: string; projectPlan?: ProjectPlan };

export type Message = { 
  role: "user" | "assistant"; 
  content: MessageContent;
};

export function MessageContainer({ role, children }: React.PropsWithChildren<{ role: Message["role"] }>) {
    return (
        <div className={cn("flex flex-col gap-2", role === "user" ? "items-end" : "items-start")}>
            <div
                className={
                    "flex flex-row items-center gap-1 rounded-full bg-accent py-1.5 pe-3 ps-1.5 text-xs font-semibold"
                }
            >
                {role === "assistant" && <BotIcon className={"me-1 inline-block h-4 w-4"} />}
                {role === "user" && <UserIcon className={"me-1 inline-block h-4 w-4"} />}
                {role === "user" ? "You" : "Assistant"}
            </div>
            <div className={cn(role === "user" ? "pe-2 ps-16" : "flex w-full flex-col items-start pe-16 ps-2")}>
                {children}
            </div>
        </div>
    );
}

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  
  return (
    <div
      className={cn(
        "rounded-2xl px-6 py-4 text-sm shadow-sm",
        isUser
          ? "bg-primary text-primary-foreground ml-auto max-w-2xl"
          : "bg-muted max-w-full"
      )}
    >
      <MessageContentRenderer content={message.content} />
    </div>
  );
}

export function AssistantLoadingIndicator() {
    return (
        <MessageContainer role={"assistant"}>
            <div
                className={
                    "flex flex-row items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-muted-foreground"
                }
            >
                <Spinner />
                Working on it...
            </div>
        </MessageContainer>
    );
}