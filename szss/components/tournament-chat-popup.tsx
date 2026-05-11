"use client";

import { MessageCircle, Send, X } from "lucide-react";
import { useState } from "react";
import { createMessageAction } from "@/lib/actions";

type ChatMessage = {
  id: string;
  senderName: string;
  content: string;
  createdAt: string;
};

export function TournamentChatPopup({
  tournamentId,
  redirectTo,
  messages,
}: {
  tournamentId: string;
  redirectTo: string;
  messages: ChatMessage[];
}) {
  const [open, setOpen] = useState(false);
  const latest = messages[0];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition"
        style={{ background: "rgba(43,175,58,0.12)", color: "#6ee77a", border: "1px solid rgba(43,175,58,0.3)" }}
      >
        <MessageCircle size={15} />
        Sporočila
        {messages.length > 0 && (
          <span className="ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-black" style={{ background: "#2baf3a", color: "#06100a" }}>
            {messages.length}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 24px 80px rgba(0,0,0,0.45)" }}
          >
            <div className="flex items-center justify-between gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="min-w-0">
                <p className="text-sm font-black uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Sporočila turnirja</p>
                {latest && (
                  <p className="mt-0.5 truncate text-xs" style={{ color: "var(--text-secondary)" }}>
                    Zadnje: {latest.senderName}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: "var(--bg-surface)", color: "var(--text-muted)" }}
                aria-label="Zapri sporočila"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[52vh] space-y-3 overflow-y-auto p-5">
              {messages.length === 0 ? (
                <div className="rounded-xl p-6 text-center text-sm" style={{ background: "var(--bg-surface)", color: "var(--text-muted)" }}>
                  Ni sporočil.
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="rounded-xl px-4 py-3" style={{ background: "var(--bg-surface)" }}>
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <p className="truncate text-xs font-black">{message.senderName}</p>
                      <p className="shrink-0 text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {new Intl.DateTimeFormat("sl-SI", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(message.createdAt))}
                      </p>
                    </div>
                    <p className="text-sm leading-5" style={{ color: "var(--text-secondary)" }}>{message.content}</p>
                  </div>
                ))
              )}
            </div>

            <form action={createMessageAction} className="space-y-3 p-5 pt-0">
              <input type="hidden" name="tournamentId" value={tournamentId} />
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <textarea name="content" rows={3} placeholder="Pošlji sporočilo..." className="field resize-none" />
              <button className="btn-primary py-2.5 px-4 text-sm">
                <Send size={14} />
                Pošlji
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
