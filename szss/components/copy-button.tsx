"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-all"
      style={{
        background: copied ? "rgba(43,175,58,0.15)" : "rgba(245,158,11,0.15)",
        color: copied ? "#6ee77a" : "#fbbf24",
        border: `1px solid ${copied ? "rgba(43,175,58,0.3)" : "rgba(245,158,11,0.3)"}`,
        cursor: "pointer",
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Kopirano!" : "Kopiraj"}
    </button>
  );
}
