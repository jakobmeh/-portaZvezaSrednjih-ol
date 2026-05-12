"use client";

type BMatch = {
  id: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  scoreHome: number | null;
  scoreAway: number | null;
  status: string;
  round: number | null;
  group?: string | null;
};

function getRoundLabel(roundIdx: number, totalRounds: number): string {
  const fromEnd = totalRounds - 1 - roundIdx;
  if (fromEnd === 0) return "Finale";
  if (fromEnd === 1) return "Polfinale";
  if (fromEnd === 2) return "Cetrtfinale";
  if (fromEnd === 3) return "Osmina finala";
  return `${roundIdx + 1}. krog`;
}

const CARD_H = 94;
const CONN_W = 36;
const CARD_W = 210;
const HEADER_H = 28;

function BracketCard({ match }: { match: BMatch }) {
  const isLive = match.status === "LIVE";
  const isFinished = match.status === "FINISHED";
  const homeWin = isFinished && match.scoreHome !== null && match.scoreAway !== null && match.scoreHome > match.scoreAway;
  const awayWin = isFinished && match.scoreHome !== null && match.scoreAway !== null && match.scoreAway > match.scoreHome;

  return (
    <div
      style={{
        height: CARD_H,
        width: CARD_W,
        background: "var(--bg-card, #fff)",
        border: `1px solid ${isLive ? "rgba(239,68,68,0.45)" : "var(--border, #e5e7eb)"}`,
        borderRadius: 10,
        padding: "7px 10px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        flexShrink: 0,
      }}
    >
      {match.group && (
        <div
          style={{
            fontSize: 8,
            fontWeight: 900,
            textTransform: "uppercase",
            color: "var(--text-muted, #64748b)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {match.group}
        </div>
      )}
      <Row name={match.homeTeam.name} score={isFinished || isLive ? match.scoreHome : null} win={homeWin} live={isLive} />
      <div style={{ height: 1, background: "var(--border, #e5e7eb)" }} />
      <Row name={match.awayTeam.name} score={isFinished || isLive ? match.scoreAway : null} win={awayWin} live={isLive} />
    </div>
  );
}

function Row({ name, score, win, live }: { name: string; score: number | null; win: boolean; live: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: win ? 800 : 500,
          color: win ? "var(--text-primary, #0f172a)" : "var(--text-secondary, #475569)",
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </span>
      {score !== null && (
        <span
          style={{
            fontSize: 13,
            fontWeight: 900,
            minWidth: 18,
            textAlign: "right",
            color: live ? "#f87171" : win ? "#16a34a" : "var(--text-secondary, #475569)",
          }}
        >
          {score}
        </span>
      )}
    </div>
  );
}

function Connector({ matchCount, bracketH }: { matchCount: number; bracketH: number }) {
  const slotH = bracketH / matchCount;
  const pairs = Math.floor(matchCount / 2);

  return (
    <svg width={CONN_W} height={bracketH} style={{ flexShrink: 0, display: "block" }}>
      {Array.from({ length: pairs }, (_, j) => {
        const topY = (2 * j + 0.5) * slotH;
        const botY = (2 * j + 1.5) * slotH;
        const midY = (2 * j + 1) * slotH;
        const bx = CONN_W * 0.5;
        return (
          <g key={j} stroke="rgba(43,175,58,0.35)" strokeWidth={1.5} fill="none">
            <line x1={0} y1={topY} x2={bx} y2={topY} />
            <line x1={0} y1={botY} x2={bx} y2={botY} />
            <line x1={bx} y1={topY} x2={bx} y2={botY} />
            <line x1={bx} y1={midY} x2={CONN_W} y2={midY} />
          </g>
        );
      })}
      {matchCount % 2 === 1 && (
        <line
          x1={0}
          y1={(matchCount - 0.5) * slotH}
          x2={CONN_W}
          y2={(matchCount - 0.5) * slotH}
          stroke="rgba(43,175,58,0.35)"
          strokeWidth={1.5}
        />
      )}
    </svg>
  );
}

export function BracketView({ matches }: { matches: BMatch[] }) {
  const valid = matches.filter((m) => m.round !== null && m.status !== "CANCELLED");
  if (valid.length === 0) return null;

  const roundMap = new Map<number, BMatch[]>();
  for (const match of valid) {
    const round = match.round!;
    const group = roundMap.get(round) ?? [];
    group.push(match);
    roundMap.set(round, group);
  }

  const rounds = [...roundMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([round, roundMatches]) => [
      round,
      [...roundMatches].sort((a, b) => a.id.localeCompare(b.id)),
    ] as const);
  const totalRounds = rounds.length;
  const maxCount = Math.max(...rounds.map(([, roundMatches]) => roundMatches.length));
  const bracketH = Math.max(maxCount, 1) * (CARD_H + 12);

  return (
    <div style={{ overflowX: "auto", overflowY: "visible", paddingBottom: 4 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 0, minWidth: "max-content" }}>
        {rounds.map(([roundNum, roundMatches], roundIdx) => (
          <div key={roundNum} style={{ display: "flex", alignItems: "flex-start" }}>
            <div>
              <div
                style={{
                  height: HEADER_H,
                  fontSize: 9,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--text-muted, #64748b)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {getRoundLabel(roundIdx, totalRounds)}
              </div>
              <div
                style={{
                  height: bracketH,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-around",
                }}
              >
                {roundMatches.map((match) => (
                  <BracketCard key={match.id} match={match} />
                ))}
              </div>
            </div>

            {roundIdx < totalRounds - 1 && (
              <div>
                <div style={{ height: HEADER_H }} />
                <Connector matchCount={roundMatches.length} bracketH={bracketH} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
