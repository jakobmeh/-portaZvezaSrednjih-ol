"use client";

import { useState } from "react";
import { Zap, Shield, Loader2 } from "lucide-react";

export function StripeCheckoutButton({
  type,
  schoolName,
  plan,
  children,
  className,
  style,
}: {
  type: "pro_monthly" | "school";
  schoolName?: string;
  plan?: "STANDARD" | "UNLIMITED";
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, schoolName, plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Napaka pri plačilu.");
        setLoading(false);
      }
    } catch {
      setError("Napaka pri povezavi.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className={className}
        style={{ ...style, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : null}
        {children}
      </button>
      {error && (
        <p className="mt-2 text-xs text-center" style={{ color: "#f87171" }}>{error}</p>
      )}
    </div>
  );
}
