"use client";

import { Share2, Check } from "lucide-react";
import { useState } from "react";

export function ShareButton({ url, title }: { url?: string; title?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");

    if (navigator.share) {
      try {
        await navigator.share({ title: title ?? "Lestvica", url: shareUrl });
        return;
      } catch {
        // Fall through to clipboard
      }
    }

    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleShare}
      className="shrink-0 flex items-center gap-1.5 rounded-[12px] bg-white/10 px-3 py-2 text-xs font-bold text-white/80 transition hover:bg-white/20"
    >
      {copied ? <Check size={13} className="text-[#8EF29A]" /> : <Share2 size={13} />}
      {copied ? "Kopirano!" : "Deli"}
    </button>
  );
}
