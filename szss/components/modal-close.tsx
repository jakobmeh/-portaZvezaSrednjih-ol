"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";

export function ModalClose() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      aria-label="Zapri"
      style={{
        position: "absolute",
        top: "1rem",
        right: "1rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "2rem",
        width: "2rem",
        borderRadius: "0.5rem",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid var(--border)",
        color: "var(--text-muted)",
        cursor: "pointer",
        transition: "all 150ms ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)";
        (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
        (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
      }}
    >
      <X size={14} />
    </button>
  );
}

export function ModalBackdrop() {
  const router = useRouter();
  return (
    <div
      onClick={() => router.back()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
        zIndex: 40,
        cursor: "default",
      }}
    />
  );
}
