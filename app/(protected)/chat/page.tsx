import { ChatSidebar } from "@/components/chat-sidebar";
import { MessageSquareOff } from "lucide-react";

export default function ChatIndexPage() {
    return (
        <>
            <ChatSidebar />
            <div className="flex-1 bg-zinc-950 flex flex-col items-center justify-center rounded-r-lg border border-l-0 border-zinc-800 text-zinc-500 gap-4">
                <MessageSquareOff className="w-12 h-12 text-zinc-800" />
                <p>Sélectionnez un canal dans la barre latérale pour commencer à communiquer.</p>
            </div>
        </>
    );
}
