import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { shareUrl } from "@/lib/utils-whisper";

export function ShareLink({ handle }: { handle: string }) {
  const [copied, setCopied] = useState(false);
  const url = shareUrl(handle);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy your link", url);
    }
  };
  return (
    <div className="flex items-center gap-2 rounded-full bg-secondary text-secondary-foreground pl-4 pr-1 py-1 max-w-full">
      <span className="font-mono text-xs truncate" data-testid="text-share-url">{url}</span>
      <button
        onClick={copy}
        data-testid="button-copy-link"
        className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${
          copied ? "bg-[hsl(170_35%_40%)] text-white" : "bg-primary text-primary-foreground hover:brightness-110"
        }`}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
