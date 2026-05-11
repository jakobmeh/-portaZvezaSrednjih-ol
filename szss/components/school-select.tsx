"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";

export function SchoolSelect({ schools, name = "schoolName", required = true, placeholder = "Izberi svojo šolo..." }: {
  schools: readonly string[];
  name?: string;
  required?: boolean;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.length < 1
    ? schools
    : schools.filter((s) => s.toLowerCase().includes(query.toLowerCase()));

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function pick(school: string) {
    setSelected(school);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={selected} required={required} />

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="field"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          textAlign: "left",
          cursor: "pointer",
          color: selected ? "var(--text-primary)" : "var(--text-muted)",
        }}
      >
        <span className="truncate">{selected || placeholder}</span>
        <ChevronDown
          size={14}
          style={{
            flexShrink: 0,
            marginLeft: "0.5rem",
            color: "var(--text-muted)",
            transition: "transform 150ms",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {/* Dropdown panel */}
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
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            overflow: "hidden",
          }}
        >
          {/* Search input */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.6rem 0.875rem",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <Search size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Išči šolo..."
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: "0.8125rem",
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontSize: "0.75rem" }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Options list */}
          <div style={{ maxHeight: "240px", overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <p style={{ padding: "1rem", textAlign: "center", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                Ni rezultatov za &ldquo;{query}&rdquo;
              </p>
            ) : (
              filtered.map((school) => (
                <button
                  key={school}
                  type="button"
                  onClick={() => pick(school)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "0.6rem 0.875rem",
                    textAlign: "left",
                    fontSize: "0.8125rem",
                    background: school === selected ? "rgba(43,175,58,0.1)" : "transparent",
                    color: school === selected ? "#6ee77a" : "var(--text-secondary)",
                    border: "none",
                    cursor: "pointer",
                    transition: "background 100ms",
                    fontFamily: "var(--font-body)",
                  }}
                  onMouseEnter={(e) => {
                    if (school !== selected) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    if (school !== selected) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  }}
                >
                  <span>{school}</span>
                  {school === selected && <Check size={13} style={{ flexShrink: 0, color: "#2baf3a" }} />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
