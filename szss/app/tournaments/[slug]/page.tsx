import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, MessageSquare, Send, Trophy, Users, Zap } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { BracketView } from "@/components/bracket-view";
import { FormSelect } from "@/components/form-select";
import { createMessageAction, joinTournamentAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { getTeamsForUser, getTournamentDetails } from "@/lib/data";
import { calculateKnockoutStandings, calculateStandings, formatDate, getMatchStatusLabel, getRegistrationLabel, getTournamentFormatLabel, getTournamentStatus, normalizeLabel } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export default async function TournamentDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser();
  const { slug } = await params;
  const [tournament, teams] = await Promise.all([getTournamentDetails(slug), getTeamsForUser(user.id)]);
  if (!tournament) notFound();

  const isOrganizer = tournament.organizerId === user.id;
  const following = await prisma.tournamentFollower.findUnique({
    where: { userId_tournamentId: { userId: user.id, tournamentId: tournament.id } },
  });

  const status = getTournamentStatus({ date: tournament.date, maxTeams: tournament.maxTeams, registeredTeams: tournament.registrations.length });
  const progress = Math.min((tournament.registrations.length / tournament.maxTeams) * 100, 100);
  const alreadyRegisteredTeamIds = new Set(tournament.registrations.map((r) => r.teamId));
  const eligibleTeams = teams.filter((t) => normalizeLabel(t.sport) === normalizeLabel(tournament.sport) && !alreadyRegisteredTeamIds.has(t.id));
  const standingsInput = tournament.matches.map((m) => ({
    homeTeamId: m.homeTeamId, homeTeam: m.homeTeam, awayTeamId: m.awayTeamId, awayTeam: m.awayTeam,
    scoreHome: m.scoreHome, scoreAway: m.scoreAway, status: m.status, round: m.round, group: m.group,
  }));
  const standings = tournament.format === "KNOCKOUT"
    ? calculateKnockoutStandings(standingsInput)
    : calculateStandings(standingsInput);
  const liveOrUpcoming = tournament.matches.filter((m) => m.status === "UPCOMING" || m.status === "LIVE").slice(0, 3);

  const statusColor = status === "Odprt" ? "badge-green" : status === "Poln" ? "badge-red" : "badge-gray";

  return (
    <AppShell
      user={user}
      activePath="/tournaments"
      title={tournament.title}
      description={`${tournament.sport} · ${getTournamentFormatLabel(tournament.format)}`}
      actions={
        <div className="flex items-center gap-2">
          <span className={`badge ${statusColor}`}>{status}</span>
          {isOrganizer && (
            <Link href={`/tournaments/${slug}/matches`} className="btn-primary py-2 px-4 text-sm">
              Upravljaj tekme
            </Link>
          )}
        </div>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_300px]">

        {/* Left */}
        <div className="space-y-4">

          {/* Info */}
          <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            {tournament.description && (
              <p className="text-sm leading-6 mb-4" style={{ color: "var(--text-secondary)" }}>{tournament.description}</p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: CalendarDays, label: "Datum in ura", value: formatDate(tournament.date) },
                { icon: MapPin, label: "Lokacija", value: tournament.location },
                { icon: Users, label: "Organizator", value: tournament.organizer.fullName },
                { icon: Trophy, label: "Kapaciteta", value: `${tournament.registrations.length} / ${tournament.maxTeams} ekip` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-xl p-3" style={{ background: "var(--bg-surface)" }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon size={11} style={{ color: "var(--text-muted)" }} />
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{label}</span>
                  </div>
                  <p className="text-sm font-bold">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tekme */}
          {liveOrUpcoming.length > 0 && (
            <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-black text-sm uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  <Zap size={11} className="inline mr-1 text-red-400" />
                  Tekme
                </h2>
                <Link href={`/tournaments/${slug}/matches`} className="text-xs font-semibold" style={{ color: "#6ee77a" }}>Vse →</Link>
              </div>
              <div className="space-y-2">
                {liveOrUpcoming.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "var(--bg-surface)" }}>
                    <p className="flex-1 text-right text-sm font-bold">{m.homeTeam.name}</p>
                    <div className="flex items-center gap-1">
                      {m.status === "LIVE" ? (
                        <>
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-black" style={{ background: "#ef4444", color: "white" }}>{m.scoreHome ?? "–"}</span>
                          <span className="text-xs font-black" style={{ color: "var(--text-muted)" }}>:</span>
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-black" style={{ background: "#ef4444", color: "white" }}>{m.scoreAway ?? "–"}</span>
                        </>
                      ) : (
                        <span className="text-xs font-bold px-2" style={{ color: "var(--text-muted)" }}>vs</span>
                      )}
                    </div>
                    <p className="flex-1 text-sm font-bold">{m.awayTeam.name}</p>
                    <span className={`badge ${m.status === "LIVE" ? "badge-live" : "badge-gray"}`}>{getMatchStatusLabel(m.status)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bracket */}
          {tournament.matches.some((m) => m.round !== null) && (
            <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-black text-sm uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  <Trophy size={11} className="inline mr-1 text-amber-400" />
                  Bracket
                </h2>
                <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                  {tournament.matches.filter((m) => m.round !== null && m.status !== "CANCELLED").length} tekem
                </span>
              </div>
              <BracketView matches={tournament.matches} />
            </div>
          )}

          {/* Lestvica */}
          {standings.length > 0 && (
            <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <h2 className="font-black text-sm uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>
                <Trophy size={11} className="inline mr-1 text-amber-400" />
                Lestvica
              </h2>
              <div className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--border)" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
                      {["#", "Ekipa", "T", "Z", "P", "Točke"].map((h) => (
                        <th key={h} className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-left" style={{ color: "var(--text-muted)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {standings.slice(0, 8).map((row, i) => (
                      <tr key={row.teamId} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td className="px-3 py-2.5 text-xs font-black" style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                        <td className="px-3 py-2.5 font-bold">{row.teamName}</td>
                        <td className="px-3 py-2.5 text-center text-xs" style={{ color: "var(--text-secondary)" }}>{row.played}</td>
                        <td className="px-3 py-2.5 text-center text-xs font-bold" style={{ color: "#4ade80" }}>{row.wins}</td>
                        <td className="px-3 py-2.5 text-center text-xs font-bold" style={{ color: "#f87171" }}>{row.losses}</td>
                        <td className="px-3 py-2.5 text-center font-black" style={{ color: "#6ee77a" }}>{row.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Ekipe */}
          <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-black text-sm uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Prijavljene ekipe</h2>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{Math.round(progress)}%</span>
            </div>
            <div className="mb-4 h-1.5 overflow-hidden rounded-full" style={{ background: "var(--bg-surface)" }}>
              <div className="h-full rounded-full" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #2baf3a, #8b5cf6)" }} />
            </div>
            {tournament.registrations.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>Ni prijavljenih ekip.</p>
            ) : (
              <div className="space-y-2">
                {tournament.registrations.map((reg) => (
                  <div key={reg.id} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "var(--bg-surface)" }}>
                    <div>
                      <p className="font-bold text-sm">{reg.team.name}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{reg.team.schoolName}</p>
                    </div>
                    <span className={`badge ${reg.status === "CONFIRMED" ? "badge-green" : "badge-gray"}`}>
                      {getRegistrationLabel(reg.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sporočila */}
          <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <h2 className="font-black text-sm uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>
              <MessageSquare size={11} className="inline mr-1" />
              Sporočila
            </h2>
            <div className="space-y-3 mb-4">
              {tournament.announcements.map((a) => (
                <div key={a.id} className="rounded-xl px-4 py-3" style={{ background: "rgba(43,175,58,0.08)", borderLeft: "3px solid #2baf3a" }}>
                  <p className="font-bold text-sm">{a.title}</p>
                  <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>{a.content}</p>
                </div>
              ))}
              {tournament.messages.map((msg) => (
                <div key={msg.id} className="rounded-xl px-4 py-3" style={{ background: "var(--bg-surface)" }}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold">{msg.senderName}</p>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{formatDate(msg.createdAt)}</p>
                  </div>
                  <p className="mt-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>{msg.content}</p>
                </div>
              ))}
              {tournament.announcements.length === 0 && tournament.messages.length === 0 && (
                <p className="text-sm text-center py-2" style={{ color: "var(--text-muted)" }}>Ni sporočil.</p>
              )}
            </div>
            <form action={createMessageAction} className="space-y-2">
              <input type="hidden" name="tournamentId" value={tournament.id} />
              <textarea name="content" rows={2} placeholder="Pošlji sporočilo..." className="field" />
              <button className="btn-primary py-2 px-4 text-sm"><Send size={12} />Pošlji</button>
            </form>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Prijava ekipe */}
          <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <h2 className="font-black text-sm uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Prijava ekipe</h2>
            {eligibleTeams.length > 0 ? (
              <form action={joinTournamentAction} className="space-y-3">
                <input type="hidden" name="tournamentId" value={tournament.id} />
                <FormSelect
                  name="teamId"
                  required
                  placeholder="Izberi ekipo..."
                  options={eligibleTeams.map((t) => ({ label: t.name, value: t.id }))}
                />
                <button className="btn-primary w-full py-2.5">Prijavi ekipo</button>
              </form>
            ) : teams.length > 0 ? (
              <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                <p>Ni ekipe za <strong>{tournament.sport}</strong>.</p>
                <Link href="/teams" className="text-xs font-semibold mt-2 block" style={{ color: "#6ee77a" }}>Ustvari ekipo →</Link>
              </div>
            ) : (
              <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                <p>Najprej ustvari ekipo.</p>
                <Link href="/teams" className="text-xs font-semibold mt-2 block" style={{ color: "#6ee77a" }}>Ustvari ekipo →</Link>
              </div>
            )}
          </div>

          {/* Organizer links */}
          {isOrganizer && (
            <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Organizator</p>
              <Link href={`/tournaments/${slug}/matches`} className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold mb-2" style={{ background: "rgba(43,175,58,0.12)", color: "#6ee77a", border: "1px solid rgba(43,175,58,0.2)" }}>
                Upravljaj tekme <span>→</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
