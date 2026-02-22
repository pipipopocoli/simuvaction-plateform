import { ChatSidebar } from "@/components/chat-sidebar";
import { ChatWindow } from "@/components/chat-window";
import { getUserSession } from "@/lib/server-auth";
import { redirect } from "next/navigation";

export default async function ChatRoomPage({ params }: { params: { roomId: string } }) {
    const session = await getUserSession();

    if (!session) {
        redirect("/login");
    }

    return (
        <>
            <ChatSidebar currentRoomId={params.roomId} />
            <ChatWindow roomId={params.roomId} currentUserId={session.userId} />
        </>
    );
}
