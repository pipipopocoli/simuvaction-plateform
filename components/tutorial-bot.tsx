"use client";

import { useMemo, useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";

type Message = {
  role: "assistant" | "user";
  text: string;
};

function getIntro(role?: string) {
  switch (role) {
    case "delegate":
      return "I can answer from your team memory: delegation rooms, team library documents, and scheduled meetings.";
    case "journalist":
      return "I can help you navigate press conferences, newsroom work, and your shared team context.";
    case "leader":
      return "I can summarize your team memory, meetings, and workspace signals.";
    case "lobbyist":
      return "I can surface relevant team documents, bilateral activity, and private room context.";
    case "admin":
    case "game_master":
      return "I can answer from the current team-scoped memory while keeping private room boundaries intact.";
    default:
      return "Ask about your team context, meetings, documents, or navigation.";
  }
}

export function TutorialBot({ role }: { role?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const intro = useMemo(() => getIntro(role), [role]);

  async function askSimuBot() {
    const question = input.trim();
    if (!question) {
      return;
    }

    setMessages((current) => [...current, { role: "user", text: question }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/simubot/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const payload = await response.json().catch(() => ({}));
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: payload.answer || "I could not answer from the available team memory.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isOpen ? (
        <div className="pointer-events-auto relative w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl rounded-br-none border border-ink-border bg-white p-4 shadow-xl">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute right-3 top-3 text-ink/40 transition hover:text-ink/80"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="pr-5">
            <p className="mb-1 font-serif text-[15px] font-bold text-ink">SimuBot</p>
            <p className="text-sm leading-relaxed text-ink/75">{intro}</p>
          </div>

          <div className="mt-4 max-h-[320px] space-y-3 overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <div className="rounded-xl border border-ink-border bg-ivory p-3 text-sm text-ink/75">
                Try: &quot;What are my next meetings?&quot; or &quot;Summarize the latest team documents.&quot;
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`rounded-xl px-3 py-2 text-sm ${
                    message.role === "assistant"
                      ? "border border-ink-border bg-ivory text-ink/80"
                      : "bg-ink-blue text-white"
                  }`}
                >
                  {message.text}
                </div>
              ))
            )}
            {isLoading ? (
              <div className="rounded-xl border border-ink-border bg-ivory p-3 text-sm text-ink/75">
                Thinking from your team memory...
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void askSimuBot();
                }
              }}
              placeholder="Ask SimuBot"
              className="flex-1 rounded-full border border-ink-border bg-ivory px-4 py-2 text-sm text-ink outline-none"
            />
            <button
              type="button"
              onClick={() => void askSimuBot()}
              disabled={isLoading || !input.trim()}
              className="grid h-10 w-10 place-items-center rounded-full bg-ink-blue text-white disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-auto relative">
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-ink-blue text-white shadow-lg transition-all duration-300 hover:bg-ink"
        >
          <Bot className="h-7 w-7" />
          <Sparkles className="absolute -right-1 -top-1 h-4 w-4 animate-pulse text-amber-300" />
        </button>
      </div>
    </div>
  );
}
