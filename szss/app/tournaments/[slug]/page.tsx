import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  ExternalLink,
  MapPin,
  MessageSquare,
  Send,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import {
  createMessageAction,
  followTournamentAction,
  joinTournamentAction,
  unfollowTournamentAction,
} from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { getTeamsForUser, getTournamentDetails } from "@/lib/data";
import {
  calculateStandings,
  formatDate,
  getMatchStatusLabel,
  getMatchStatusTone,
  getRegistrationLabel,
  getTournamentFormatLabel,
  getTournamentStatus,
  isProUser,
  normalizeLabel,
} from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export default async function TournamentDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireUser();
  const { slug } = await params;
  const [tournament, teams] = await Promise.all([
    getTournamentDetails(slug),
    getTeamsForUser(user.id),
  ]);

  if (!tournament) notFound();

  const isOrganizer = tournament.organizerId === user.id;

  const following = await prisma.tournamentFollower.findUnique({
    where: { userId_tournamentId: { userId: user.id, tournamentId: tournament.id } },
  });

  const status = getTournamentStatus({
    date: tournament.date,
    maxTeams: tournament.maxTeams,
    registeredTeams: tournament.registrations.length,
  });

  const progress = Math.min((tournament.registrations.length / tournament.maxTeams) * 100, 100);
  const normalizedTournamentSport = normalizeLabel(tournament.sport);
  const alreadyRegisteredTeamIds = new Set(tournament.registrations.map((r) => r.teamId));
  const eligibleTeams = teams.filter(
    (team) =>
      normalizeLabel(team.sport) === normalizedTournamentSport &&
      !alreadyRegisteredTeamIds.has(team.id),
  );

  const standings = calculateStandings(
    tournament.matches.map((m) => ({
      homeTeamId: m.homeTeamId,
      homeTeam: m.homeTeam,
      awayTeamId: m.awayTeamId,
      awayTeam: m.awayTeam,
      scoreHome: m.scoreHome,
      scoreAway: m.scoreAway,
      status: m.status,
      group: m.group,
    })),
  );

  const liveOrUpcoming = tournament.matches.filter(
    (m) => m.status === "UPCOMING" || m.status === "LIVE",
  ).slice(0, 3);

  const publicUrl = `/t/${tournament.slug}`;

  return (
    <AppShell
      user={user}
      activePath="/tournaments"
      title={tournament.title}
      description="Podrobnosti turnirja, lestvica, tekme in komunikacija z organizatorjem."
      actions={
        <div className="flex items-center gap-2">
          <StatusBadge label={status} />
          {isOrganizer && (
            <Link
              href={`/tournaments/${slug}/matches`}
              className="rounded-2xl bg-[#2BAF3A] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#2BAF3A]/30 transition hover:bg-[#249933]"
            >
              Upravljaj tekme
            </Link>
          )}
        </div>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">

        {/* Left column */}
        <div className="space-y-5">

          {/* Info */}
          <section className="rounded-[22px] border border-slate-200 bg-white p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2BAF3A]">
              {tournament.sport} · {getTournamentFormatLabel(tournament.format)}
            </p>
            {tournament.description && (
              <p className="mt-3 text-sm leading-7 text-slate-600">{tournament.description}</p>
            )}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                { icon: CalendarDays, label: "Datum in ura", value: formatDate(tournament.date) },
                { icon: MapPin, label: "Lokacija", value: tournament.location },
                { icon: Users, label: "Organizator", value: tournament.organizer.fullName },
                {
                  icon: Trophy,
                  label: "Kapaciteta ekip",
                  value: `${tournament.registrations.length} / ${tournament.maxTeams}`,
                },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-[14px] bg-slate-50 p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon size={13} className="text-slate-400" />
                    <p className="text-xs font-bold text-slate-400">{label}</p>
                  </div>
                  <p className="text-sm font-black text-[#0A2C57]">{value}</p>
                </div>
              ))}
            </div>

            {/* Public leaderboard link */}
            <div className="mt-4 flex items-center gap-3 rounded-[14px] bg-[#f0fdf4] px-4 py-3">
              <ExternalLink size={14} className="shrink-0 text-[#2BAF3A]" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#2BAF3A]">Javna lestvica</p>
                <p className="truncate text-xs text-slate-500">
                  Deli to povezavo z gledalci in ekipami (brez prijave)
                </p>
              </div>
              <a
                href={publicUrl}
                target="_blank"
                className="ml-auto shrink-0 rounded-[10px] bg-[#2BAF3A] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#249933]"
              >
                Odpri
              </a>
            </div>
          </section>

          {/* Live matches */}
          {liveOrUpcoming.length > 0 && (
            <section className="rounded-[22px] border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-xl bg-red-100 p-2">
                    <Zap size={15} className="text-red-500" />
                  </div>
                  <h2 className="text-base font-black text-[#0A2C57]">Tekme</h2>
                </div>
                <Link
                  href={`/tournaments/${slug}/matches`}
                  className="text-xs font-bold text-[#2BAF3A] hover:underline"
                >
                  Vse tekme →
                </Link>
              </div>
              <div className="space-y-2">
                {liveOrUpcoming.map((match) => (
                  <div key={match.id} className="flex items-center gap-3 rounded-[14px] bg-slate-50 px-4 py-3">
                    <p className="flex-1 text-right text-sm font-bold text-[#0A2C57]">{match.homeTeam.name}</p>
                    <div className="flex items-center gap-1">
                      {match.status === "LIVE" ? (
                        <>
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0A2C57] text-sm font-black text-white">
                            {match.scoreHome ?? "–"}
                          </span>
                          <span className="text-xs font-black text-slate-400">:</span>
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0A2C57] text-sm font-black text-white">
                            {match.scoreAway ?? "–"}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">vs</span>
                      )}
                    </div>
                    <p className="flex-1 text-sm font-bold text-[#0A2C57]">{match.awayTeam.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getMatchStatusTone(match.status)}`}>
                      {getMatchStatusLabel(match.status)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Standings */}
          {standings.length > 0 && (
            <section className="rounded-[22px] border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="rounded-xl bg-[#2BAF3A]/10 p-2">
                  <Trophy size={15} className="text-[#2BAF3A]" />
                </div>
                <h2 className="text-base font-black text-[#0A2C57]">Lestvica</h2>
              </div>
              <div className="overflow-hidden rounded-[14px] border border-slate-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">#</th>
                      <th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Ekipa</th>
                      <th className="px-3 py-2 text-center text-[10px] font-black uppercase tracking-wider text-slate-400">T</th>
                      <th className="px-3 py-2 text-center text-[10px] font-black uppercase tracking-wider text-slate-400">Z</th>
                      <th className="px-3 py-2 text-center text-[10px] font-black uppercase tracking-wider text-slate-400">P</th>
                      <th className="px-3 py-2 text-center text-[10px] font-black uppercase tracking-wider text-[#2BAF3A]">Točke</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.slice(0, 6).map((row, i) => (
                      <tr key={row.teamId} className="border-b border-slate-50 last:border-0">
                        <td className="px-3 py-2.5 text-xs font-black text-slate-400">{i + 1}</td>
                        <td className="px-3 py-2.5 font-bold text-[#0A2C57]">{row.teamName}</td>
                        <td className="px-3 py-2.5 text-center text-slate-500">{row.played}</td>
                        <td className="px-3 py-2.5 text-center font-bold text-emerald-600">{row.wins}</td>
                        <td className="px-3 py-2.5 text-center font-bold text-rose-500">{row.losses}</td>
                        <td className="px-3 py-2.5 text-center font-black text-[#2BAF3A]">{row.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <a
                href={publicUrl}
                target="_blank"
                className="mt-3 inline-block text-xs font-bold text-[#2BAF3A] hover:underline"
              >
                Celotna lestvica →
              </a>
            </section>
          )}

          {/* Registered teams */}
          <section className="rounded-[22px] border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-[#2BAF3A]/10 p-2">
                  <Users size={15} className="text-[#2BAF3A]" />
                </div>
                <h2 className="text-base font-black text-[#0A2C57]">Prijavljene ekipe</h2>
              </div>
              <span className="text-xs font-bold text-slate-400">{Math.round(progress)}%</span>
            </div>

            <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#2BAF3A] to-[#0A2C57] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="space-y-2.5">
              {tournament.registrations.length === 0 ? (
                <div className="rounded-[14px] border border-dashed border-slate-200 p-5 text-center">
                  <p className="text-sm text-slate-400">Še ni prijavljenih ekip.</p>
                </div>
              ) : (
                tournament.registrations.map((registration) => (
                  <div key={registration.id} className="flex items-center justify-between rounded-[14px] bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-[#0A2C57]">{registration.team.name}</p>
                      <p className="text-xs text-slate-400">
                        {registration.team.schoolName} · {registration.team.players.length} igralcev
                      </p>
                    </div>
                    <span className="rounded-full bg-[#e8f8ea] px-2.5 py-1 text-[11px] font-bold text-[#228f2f]">
                      {getRegistrationLabel(registration.status)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Messages */}
          <section className="rounded-[22px] border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="rounded-xl bg-slate-100 p-2">
                <MessageSquare size={15} className="text-slate-500" />
              </div>
              <h2 className="text-base font-black text-[#0A2C57]">Objave in sporočila</h2>
            </div>

            <div className="space-y-3">
              {tournament.announcements.map((a) => (
                <div key={a.id} className="rounded-[14px] border-l-4 border-[#2BAF3A] bg-[#f0fdf4] px-4 py-3">
                  <p className="text-sm font-bold text-[#0A2C57]">{a.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{a.content}</p>
                </div>
              ))}
              {tournament.messages.map((msg) => (
                <div key={msg.id} className="rounded-[14px] bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#0A2C57]">{msg.senderName}</p>
                    <p className="text-[10px] text-slate-400">{formatDate(msg.createdAt)}</p>
                  </div>
                  <p className="mt-1.5 text-sm text-slate-600">{msg.content}</p>
                </div>
              ))}
              {tournament.announcements.length === 0 && tournament.messages.length === 0 && (
                <p className="text-sm text-slate-400">Ni objav ali sporočil.</p>
              )}
            </div>

            <form action={createMessageAction} className="mt-5 space-y-3">
              <input type="hidden" name="tournamentId" value={tournament.id} />
              <textarea
                name="content"
                rows={3}
                placeholder="Pošlji vprašanje organizatorju ali obvestilo ekipam…"
                className="field"
              />
              <button className="flex items-center gap-2 rounded-[12px] bg-[#0A2C57] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#0d3570]">
                <Send size={13} />
                Pošlji
              </button>
            </form>
          </section>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">

          {/* Follow / Register */}
          <div className="rounded-[22px] border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="rounded-xl bg-[#2BAF3A]/10 p-2">
                <Trophy size={15} className="text-[#2BAF3A]" />
              </div>
              <h2 className="text-base font-black text-[#0A2C57]">Prijava ekipe</h2>
            </div>

            {eligibleTeams.length > 0 ? (
              <form action={joinTournamentAction} className="space-y-3">
                <input type="hidden" name="tournamentId" value={tournament.id} />
                <select name="teamId" defaultValue="" className="field">
                  <option value="" disabled>Izberi ekipo…</option>
                  {eligibleTeams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name} ({team.sport})
                    </option>
                  ))}
                </select>
                <button className="w-full rounded-[12px] bg-[#2BAF3A] py-2.5 text-sm font-black text-white shadow-md shadow-[#2BAF3A]/20 transition hover:bg-[#249933]">
                  Prijavi ekipo
                </button>
              </form>
            ) : teams.length > 0 ? (
              <div className="rounded-[14px] bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-semibold">Ni ekipe za <span className="text-[#0A2C57]">{tournament.sport}</span></p>
                <Link href="/teams" className="mt-3 inline-block text-xs font-bold text-[#2BAF3A]">
                  Upravljaj ekipe →
                </Link>
              </div>
            ) : (
              <div className="rounded-[14px] bg-slate-50 p-4 text-sm text-slate-600">
                <p>Najprej ustvari ekipo za ta šport.</p>
                <Link href="/teams" className="mt-2 inline-block text-xs font-bold text-[#2BAF3A]">
                  Ustvari ekipo →
                </Link>
              </div>
            )}
          </div>

          {/* Follow button */}
          {!isOrganizer && (
            <div className="rounded-[22px] border border-slate-200 bg-white p-5">
              <p className="mb-3 text-sm font-black text-[#0A2C57]">Sledi turnirju</p>
              <p className="mb-4 text-xs text-slate-500">
                Prejemaj obvestila o začetku tekem in rezultatih.
              </p>
              {following ? (
                <form action={unfollowTournamentAction}>
                  <input type="hidden" name="tournamentId" value={tournament.id} />
                  <button className="w-full rounded-[12px] border border-slate-200 py-2.5 text-sm font-bold text-slate-600 transition hover:border-rose-200 hover:text-rose-600">
                    Prekini sledenje
                  </button>
                </form>
              ) : (
                <form action={followTournamentAction}>
                  <input type="hidden" name="tournamentId" value={tournament.id} />
                  <button className="w-full rounded-[12px] bg-[#0A2C57] py-2.5 text-sm font-bold text-white transition hover:bg-[#0d3570]">
                    Sledi turnirju
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Organizer quick links */}
          {isOrganizer && (
            <div className="rounded-[22px] border border-slate-200 bg-white p-5 space-y-2">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Organizator</p>
              <Link
                href={`/tournaments/${slug}/matches`}
                className="flex items-center justify-between rounded-[14px] bg-[#2BAF3A]/8 px-4 py-3 text-sm font-bold text-[#2BAF3A] transition hover:bg-[#2BAF3A]/15"
              >
                Upravljaj tekme
                <span>→</span>
              </Link>
              <a
                href={publicUrl}
                target="_blank"
                className="flex items-center justify-between rounded-[14px] bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
              >
                Javna lestvica
                <ExternalLink size={13} />
              </a>
            </div>
          )}

          {/* Steps */}
          <div className="rounded-[22px] border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-black text-[#0A2C57]">Kako deluje?</h2>
            <div className="space-y-3">
              {[
                "Organizator ustvari turnir in razporedi tekme.",
                "Šole prijavijo ekipe in sledijo turnirju.",
                "Rezultati se vnašajo po vsaki tekmi.",
                "Lestvica se samodejno posodablja v živo.",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3 text-xs text-slate-600">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0A2C57]/8 text-[10px] font-black text-[#0A2C57]">
                    {i + 1}
                  </span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
