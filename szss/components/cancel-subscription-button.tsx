"use client";

import { useState } from "react";
import { XCircle, Loader2 } from "lucide-react";

export function CancelSubscriptionButton() {
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  async function handleCancel() {
    if (!confirm) { setConfirm(true); return; }
    setLoading(true);
    const res = await fetch("/api/stripe/cancel", { method: "POST" });
    const data = await res.json();
    if (data.ok) {
      window.location.href = "/upgrade?cancelled=1";
    } else {
      alert(data.error ?? "Napaka pri preklicu.");
      setLoading(false);
      setConfirm(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={handleCancel}
        disabled={loading}
        className="btn-ghost py-2 px-4 text-sm w-full"
        style={{
          color: confirm ? "#f87171" : "var(--text-muted)",
          borderColor: confirm ? "rgba(239,68,68,0.4)" : "var(--border)",
        }}
      >
        {loading
          ? <Loader2 size={13} className="animate-spin" />
          : <XCircle size={13} />
        }
        {confirm ? "Klikni še enkrat za potrditev" : "Prekliči naročnino"}
      </button>
      {confirm && (
        <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
          Dostop ostane aktiven do {" "}
          <span style={{ color: "var(--text-secondary)" }}>konca plačanega obdobja</span>.
        </p>
      )}
    </div>
  );
}
