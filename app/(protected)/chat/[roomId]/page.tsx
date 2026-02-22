import { ChatSidebar } from "@/components/chat-sidebar";
import { ChatWindow } from "@/components/chat-window";
import { getUserSession } from "@/lib/server-auth";
import { redirect } from "next/navigation";

export default async function ChatRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
    const session = await getUserSession();
    const { roomId } = await params;

    if (!session) {
        redirect("/login");
    }

    return (
        <>
            <ChatSidebar currentRoomId={roomId} />
            <ChatWindow roomId={roomId} currentUserId={session.userId} />
        </>
    );
}
