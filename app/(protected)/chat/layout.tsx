export default function ChatLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex w-full overflow-hidden bg-black shadow-2xl rounded-lg border border-zinc-800">
            {children}
        </div>
    );
}
