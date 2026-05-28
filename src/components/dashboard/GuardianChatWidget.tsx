import { useState } from "react";
import { X } from "lucide-react";
import { LayerIcon } from "@/components/site/LayerIcons";
import { GuardianChatPanel } from "@/components/dashboard/GuardianChatPanel";

export function GuardianChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[min(92vw,400px)] h-[min(75vh,600px)] flex flex-col rounded-2xl border border-border/60 bg-popover/95 backdrop-blur-xl shadow-2xl shadow-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border/60">
            <div className="flex items-center gap-2 min-w-0">
              <LayerIcon layer="guardian" className="h-5 w-5 shrink-0" />
              <div className="leading-tight min-w-0">
                <div className="font-display text-sm font-bold truncate">Guardian AI</div>
                <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">gemini-2.5-flash</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 min-h-0 p-3">
            <GuardianChatPanel className="h-full" height="flex-1" compact />
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close Guardian chat" : "Open Guardian chat"}
        aria-expanded={open}
        className="fixed bottom-6 right-6 z-50 group flex items-center gap-3 h-14 pl-2 pr-5 rounded-full border border-primary/40 bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all"
      >
        <span className="absolute inset-0 rounded-full bg-primary/40 blur-xl -z-10 animate-pulse-ring" />
        <LayerIcon layer="guardian" className="h-10 w-10 shrink-0" />
        <span className="hidden sm:inline font-display text-sm font-semibold tracking-wide">
          Ask Guardian
        </span>
      </button>
    </>
  );
}
