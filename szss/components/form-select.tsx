"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export function FormSelect({
  name,
  options,
  placeholder = "Izberi...",
  required = false,
  defaultValue = "",
}: {
  name: string;
  options: { label: string; value: string }[];
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  const [selected, setSelected] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === selected);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <input type="hidden" name={name} value={selected} required={required} />

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="field"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          cursor: "pointer",
          color: current ? "var(--text-primary)" : "var(--text-muted)",
          textAlign: "left",
        }}
      >
        <span className="truncate">{current?.label ?? placeholder}</span>
        <ChevronDown
          size={13}
          style={{
            flexShrink: 0,
            color: "var(--text-muted)",
            transition: "transform 150ms",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 100,
            background: "var(--bg-card)",
            border: "1px solid var(--border-strong)",
            borderRadius: "14px",
            overflow: "hidden",
            boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
            maxHeight: "220px",
            overflowY: "auto",
          }}
        >
          {options.map((opt, i) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { setSelected(opt.value); setOpen(false); }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                padding: "0.55rem 0.875rem",
                textAlign: "left",
                fontSize: "0.8125rem",
                background: selected === opt.value ? "rgba(43,175,58,0.1)" : "transparent",
                color: selected === opt.value ? "#6ee77a" : "var(--text-secondary)",
                border: "none",
                borderTop: i > 0 ? "1px solid var(--border)" : "none",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
              }}
              onMouseEnter={(e) => {
                if (selected !== opt.value)
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
              }}
              onMouseLeave={(e) => {
                if (selected !== opt.value)
                  (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              {opt.label}
              {selected === opt.value && <Check size={12} style={{ color: "#2baf3a" }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
