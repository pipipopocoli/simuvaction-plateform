"use client";

import { useEffect } from "react";
import { Twitter } from "lucide-react";
import { Panel } from "@/components/ui/commons";

export function TwitterFeedPanel({ hashtag = "SimuVaction" }: { hashtag?: string }) {
    useEffect(() => {
        // Dynamically inject the Twitter Widgets JS to process the timeline embed
        const script = document.createElement("script");
        script.src = "https://platform.twitter.com/widgets.js";
        script.async = true;
        script.charset = "utf-8";
        document.body.appendChild(script);

        return () => {
            // Prevent duplicate scripts if component unmounts rapidly
            document.body.removeChild(script);
        };
    }, []);

    return (
        <Panel variant="soft" className="p-0 border-0 overflow-hidden bg-white shadow-sm ring-1 ring-ink-border rounded-lg h-[400px] flex flex-col">
            <div className="bg-[#1DA1F2] text-white p-3 flex items-center justify-between">
                <h3 className="font-bold text-sm flex items-center gap-2"><Twitter className="w-4 h-4 text-white fill-white" /> Official X Feed</h3>
                <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full font-mono">#{hashtag}</span>
            </div>

            <div className="flex-1 overflow-y-auto w-full flex justify-center bg-[#f5f8fa]">
                <a
                    className="twitter-timeline"
                    data-theme="light"
                    data-chrome="noheader nofooter noborders transparent"
                    href={`https://twitter.com/search?q=%23${hashtag}`}
                >
                    Loading #{hashtag} Tweets...
                </a>
            </div>
        </Panel>
    );
}
