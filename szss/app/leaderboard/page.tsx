import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { getLeaderboardData } from "@/lib/data";
import { Trophy, Building2, Swords } from "lucide-react";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ sport?: string }>;
}) {
  const user = await requireUser();
  const { sport } = await searchParams;

  const { teamStats, schoolStats, recentMatches, availableSports } = await getLeaderboardData(sport);

  return (
    <AppShell
      user={user}
      activePath="/leaderboard"
      title="Lestvice"
      description={sport ? `Lestvica za ${sport}` : "Globalne lestvice ekip in šol po zbranih točkah."}
    >
      {/* Info banner */}
      <div className="mb-5 flex items-start gap-3 rounded-2xl px-5 py-4" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
        <span className="text-lg shrink-0">🏆</span>
        <div>
          <p className="text-sm font-bold" style={{ color: "#fbbf24" }}>Uradno potrjeni rezultati</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Na lestvici se štejejo samo rezultati iz <strong style={{ color: "var(--text-secondary)" }}>zaključenih turnirjev</strong>. Organizator mora turnir uradno zaključiti po koncu vseh tekem.
          </p>
        </div>
      </div>

      {/* Zavihki po športih */}
      {availableSports.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href="/leaderboard"
            className="rounded-xl px-4 py-2 text-sm font-bold transition-colors"
            style={
              !sport
                ? { background: "#6ee77a", color: "#0a0a0a" }
                : { background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border)" }
            }
          >
            Vse
          </Link>
          {availableSports.map((s) => (
            <Link
              key={s}
              href={`/leaderboard?sport=${encodeURIComponent(s)}`}
              className="rounded-xl px-4 py-2 text-sm font-bold transition-colors"
              style={
                sport === s
                  ? { background: "#6ee77a", color: "#0a0a0a" }
                  : { background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border)" }
              }
            >
              {s}
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">

        {/* Ekipe + Šole */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={14} style={{ color: "#f59e0b" }} />
            <h2 className="font-black text-sm uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Najboljše ekipe{sport ? ` — ${sport}` : ""}
            </h2>
          </div>

          {teamStats.length === 0 ? (
            <div className="rounded-xl py-12 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <Trophy size={28} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {sport ? `Ni zaključenih turnirjev za ${sport}.` : "Ni zaključenih turnirjev."}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Rezultati se pojavijo ko organizator zaključi turnir.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--border)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
                    {["#", "Ekipa", "Šola", "T", "Z", "R", "P", "Točke"].map((h) => (
                      <th key={h} className="px-3 py-3 text-left text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teamStats.map((team, i) => (
                    <tr
                      key={team.id}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        background: i < 3 ? `rgba(43,175,58,${0.06 - i * 0.015})` : "var(--bg-surface)",
                      }}
                    >
                      <td className="px-3 py-3">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : (
                          <span className="text-xs font-black" style={{ color: "var(--text-muted)" }}>{i + 1}</span>
                        )}
                      </td>
                      <td className="px-3 py-3 font-bold">{team.name}</td>
                      <td className="px-3 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>{team.schoolName}</td>
                      <td className="px-3 py-3 text-center text-xs" style={{ color: "var(--text-secondary)" }}>{team.played}</td>
                      <td className="px-3 py-3 text-center text-xs font-bold" style={{ color: "#4ade80" }}>{team.wins}</td>
                      <td className="px-3 py-3 text-center text-xs" style={{ color: "var(--text-secondary)" }}>{team.draws}</td>
                      <td className="px-3 py-3 text-center text-xs font-bold" style={{ color: "#f87171" }}>{team.losses}</td>
                      <td className="px-3 py-3 text-center font-black" style={{ color: "#6ee77a" }}>{team.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Šole */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={14} style={{ color: "#22c55e" }} />
              <h2 className="font-black text-sm uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Lestvica šol{sport ? ` — ${sport}` : ""}
              </h2>
            </div>
            {schoolStats.length === 0 ? (
              <div className="rounded-xl py-8 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Ni podatkov.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--border)" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
                      {["#", "Šola", "Tekme", "Zmage", "Točke"].map((h) => (
                        <th key={h} className="px-3 py-3 text-left text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {schoolStats.map((s, i) => (
                      <tr key={s.school} style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}>
                        <td className="px-3 py-3">
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : (
                            <span className="text-xs font-black" style={{ color: "var(--text-muted)" }}>{i + 1}</span>
                          )}
                        </td>
                        <td className="px-3 py-3 font-bold text-sm">{s.school}</td>
                        <td className="px-3 py-3 text-center text-xs" style={{ color: "var(--text-secondary)" }}>{s.played}</td>
                        <td className="px-3 py-3 text-center text-xs font-bold" style={{ color: "#4ade80" }}>{s.wins}</td>
                        <td className="px-3 py-3 text-center font-black" style={{ color: "#6ee77a" }}>{s.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Zadnji rezultati */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Swords size={14} style={{ color: "#ef4444" }} />
            <h2 className="font-black text-sm uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Zadnji rezultati{sport ? ` — ${sport}` : ""}
            </h2>
          </div>
          {recentMatches.length === 0 ? (
            <div className="rounded-xl py-10 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Ni zaključenih tekem.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentMatches.map((m) => (
                <div key={m.id} className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                    {m.tournament.sport} · {m.tournament.title}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-right text-sm font-bold">{m.homeTeam.name}</span>
                    <div className="flex items-center gap-1">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg font-black text-base" style={{ background: "var(--bg-surface)" }}>
                        {m.scoreHome ?? "–"}
                      </span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>:</span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg font-black text-base" style={{ background: "var(--bg-surface)" }}>
                        {m.scoreAway ?? "–"}
                      </span>
                    </div>
                    <span className="flex-1 text-sm font-bold">{m.awayTeam.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
