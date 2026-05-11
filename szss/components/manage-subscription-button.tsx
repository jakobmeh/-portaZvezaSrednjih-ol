"use client";

import { useState } from "react";
import { Settings, Loader2 } from "lucide-react";

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setLoading(false);
      alert(data.error ?? "Napaka pri odpiranju portala.");
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="btn-ghost py-2.5 px-5 text-sm"
      style={{ color: "#f87171", borderColor: "rgba(239,68,68,0.3)" }}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Settings size={14} />}
      Upravljaj naročnino
    </button>
  );
}
