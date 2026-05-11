"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronDown, Check } from "lucide-react";

export function FilterSelect({
  name,
  value,
  placeholder,
  options,
}: {
  name: string;
  value?: string;
  placeholder: string;
  options: { label: string; value: string }[];
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const current = options.find((o) => o.value === value);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function select(val: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set(name, val);
    else params.delete(name);
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  return (
    <div ref={containerRef} style={{ position: "relative", minWidth: "160px" }}>
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
          whiteSpace: "nowrap",
        }}
      >
        <span>{current?.label ?? placeholder}</span>
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
          }}
        >
          {/* "Vsi" / reset option */}
          <button
            type="button"
            onClick={() => select("")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "0.55rem 0.875rem",
              textAlign: "left",
              fontSize: "0.8125rem",
              background: !value ? "rgba(43,175,58,0.1)" : "transparent",
              color: !value ? "#6ee77a" : "var(--text-muted)",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
            }}
          >
            {placeholder}
            {!value && <Check size={12} style={{ color: "#2baf3a" }} />}
          </button>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => select(opt.value)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                padding: "0.55rem 0.875rem",
                textAlign: "left",
                fontSize: "0.8125rem",
                background: value === opt.value ? "rgba(43,175,58,0.1)" : "transparent",
                color: value === opt.value ? "#6ee77a" : "var(--text-secondary)",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                borderTop: "1px solid var(--border)",
              }}
              onMouseEnter={(e) => {
                if (value !== opt.value)
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
              }}
              onMouseLeave={(e) => {
                if (value !== opt.value)
                  (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              {opt.label}
              {value === opt.value && <Check size={12} style={{ color: "#2baf3a" }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
