import { MessageSquareOff } from "lucide-react";
import { ChatSidebar } from "@/components/chat-sidebar";

export default function ChatIndexPage() {
  return (
    <>
      <ChatSidebar />
      <div className="flex flex-1 flex-col items-center justify-center rounded-r-xl border border-l-0 border-ink-border bg-white text-center text-ink/60">
        <MessageSquareOff className="h-12 w-12 text-ink/25" />
        <p className="mt-4 text-sm">Select a channel from the sidebar to start messaging.</p>
      </div>
    </>
  );
}
