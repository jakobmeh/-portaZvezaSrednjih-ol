"use client";

import { useOptimistic, useTransition, useState } from "react";
import { liveScoreAction } from "@/lib/actions";

export function LiveScoreInput({
  matchId,
  initialHome,
  initialAway,
  homeTeamName,
  awayTeamName,
}: {
  matchId: string;
  initialHome: number;
  initialAway: number;
  homeTeamName: string;
  awayTeamName: string;
}) {
  const [score, setScore] = useState({ home: initialHome, away: initialAway });
  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(score);

  function update(home: number, away: number) {
    const next = { home: Math.max(0, home), away: Math.max(0, away) };
    startTransition(async () => {
      setOptimistic(next);
      const fd = new FormData();
      fd.set("matchId", matchId);
      fd.set("scoreHome", String(next.home));
      fd.set("scoreAway", String(next.away));
      await liveScoreAction(fd);
      setScore(next);
    });
  }

  const btnStyle = (color: string) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "2.25rem",
    height: "2.25rem",
    borderRadius: "50%",
    background: color,
    border: "none",
    cursor: "pointer",
    fontSize: "1.1rem",
    fontWeight: 900,
    color: "white",
    flexShrink: 0,
    transition: "opacity 150ms",
    opacity: isPending ? 0.6 : 1,
  });

  const scoreBox = (val: number) => (
    <div style={{
      minWidth: "3rem",
      textAlign: "center",
      fontSize: "2.5rem",
      fontWeight: 900,
      fontFamily: "var(--font-heading)",
      color: "var(--text-primary)",
      lineHeight: 1,
    }}>
      {val}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* Score display */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
        {/* Home */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", flex: 1 }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textAlign: "center" }}>
            {homeTeamName}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button style={btnStyle("rgba(239,68,68,0.8)")} onClick={() => update(optimistic.home - 1, optimistic.away)} disabled={isPending}>
              −
            </button>
            {scoreBox(optimistic.home)}
            <button style={btnStyle("rgba(43,175,58,0.8)")} onClick={() => update(optimistic.home + 1, optimistic.away)} disabled={isPending}>
              +
            </button>
          </div>
        </div>

        {/* Separator */}
        <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--text-muted)", paddingBottom: "1.5rem" }}>:</div>

        {/* Away */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", flex: 1 }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textAlign: "center" }}>
            {awayTeamName}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button style={btnStyle("rgba(239,68,68,0.8)")} onClick={() => update(optimistic.home, optimistic.away - 1)} disabled={isPending}>
              −
            </button>
            {scoreBox(optimistic.away)}
            <button style={btnStyle("rgba(43,175,58,0.8)")} onClick={() => update(optimistic.home, optimistic.away + 1)} disabled={isPending}>
              +
            </button>
          </div>
        </div>
      </div>

      {/* Saving indicator */}
      {isPending && (
        <p style={{ fontSize: "0.7rem", textAlign: "center", color: "var(--text-muted)" }}>
          Shranjujem...
        </p>
      )}
    </div>
  );
}
