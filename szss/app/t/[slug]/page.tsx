import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Trophy } from "lucide-react";
import { ShareButton } from "@/components/share-button";
import { getTournamentBySlugPublic } from "@/lib/data";
import {
  calculateStandings,
  formatDate,
  getMatchStatusLabel,
  getMatchStatusTone,
  getTournamentFormatLabel,
} from "@/lib/utils";

export const revalidate = 30;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tournament = await getTournamentBySlugPublic(slug);
  if (!tournament) return {};
  return {
    title: `${tournament.title} – lestvica`,
    description: `Javna lestvica in urnik tekem za turnir ${tournament.title}.`,
  };
}

export default async function PublicLeaderboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tournament = await getTournamentBySlugPublic(slug);

  if (!tournament) notFound();

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

  const groups = [...new Set(tournament.matches.map((m) => m.group).filter(Boolean))] as string[];
  const hasGroups = groups.length > 0;

  const live = tournament.matches.filter((m) => m.status === "LIVE");
  const upcoming = tournament.matches.filter((m) => m.status === "UPCOMING");
  const finished = tournament.matches.filter((m) => m.status === "FINISHED");

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      <div className="mx-auto max-w-4xl px-4 py-8">

        {/* Header */}
        <div className="mb-6 rounded-[28px] bg-[#0A2C57] p-7 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.25em]">
                {tournament.sport} · {getTournamentFormatLabel(tournament.format)}
              </span>
              <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
                {tournament.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/60">
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={13} />
                  {formatDate(tournament.date)}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} />
                  {tournament.location}
                </span>
                <span>Organizator: {tournament.organizer.fullName}</span>
              </div>
            </div>
            <ShareButton title={tournament.title} />
          </div>

          {/* Live indicator */}
          {live.length > 0 && (
            <div className="mt-5 flex items-center gap-2 rounded-[14px] bg-red-500/20 px-4 py-2.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
              <span className="text-sm font-bold text-red-300">
                {live.length} tekma v živo
              </span>
            </div>
          )}
        </div>

        {/* Live matches */}
        {live.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-red-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              V živo
            </h2>
            <div className="space-y-3">
              {live.map((match) => (
                <MatchRow key={match.id} match={match} />
              ))}
            </div>
          </section>
        )}

        {/* Standings */}
        {standings.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="rounded-xl bg-[#2BAF3A]/10 p-2">
                <Trophy size={15} className="text-[#2BAF3A]" />
              </div>
              <h2 className="text-lg font-black text-[#0A2C57]">Lestvica</h2>
            </div>

            {hasGroups ? (
              <div className="space-y-5">
                {groups.map((group) => (
                  <div key={group}>
                    <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">{group}</p>
                    <StandingsTable
                      rows={calculateStandings(
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
                        group,
                      )}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <StandingsTable rows={standings} />
            )}
          </section>
        )}

        {/* Upcoming matches */}
        {upcoming.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-500">
              Prihajajoče tekme
            </h2>
            <div className="space-y-2.5">
              {upcoming.map((match) => (
                <MatchRow key={match.id} match={match} />
              ))}
            </div>
          </section>
        )}

        {/* Finished matches */}
        {finished.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-400">
              Končane tekme
            </h2>
            <div className="space-y-2.5">
              {finished.map((match) => (
                <MatchRow key={match.id} match={match} />
              ))}
            </div>
          </section>
        )}

        {/* Teams */}
        {tournament.registrations.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-500">
              Ekipe ({tournament.registrations.length})
            </h2>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {tournament.registrations.map((r) => (
                <div key={r.id} className="rounded-[14px] bg-white px-4 py-3 text-sm font-bold text-[#0A2C57] shadow-sm">
                  {r.team.name}
                  <p className="mt-0.5 text-xs font-normal text-slate-400">{r.team.schoolName}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <div className="mt-10 text-center text-xs text-slate-400">
          Lestvica se samodejno posodablja · ŠZSŠ portal
        </div>
      </div>
    </div>
  );
}

function StandingsTable({
  rows,
}: {
  rows: ReturnType<typeof calculateStandings>;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-[18px] bg-white p-5 text-center text-sm text-slate-400 shadow-sm">
        Ni končanih tekem za prikaz lestvice.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[18px] bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-400">#</th>
            <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-400">Ekipa</th>
            <th className="px-3 py-3 text-center text-xs font-black uppercase tracking-wider text-slate-400">T</th>
            <th className="px-3 py-3 text-center text-xs font-black uppercase tracking-wider text-slate-400">Z</th>
            <th className="px-3 py-3 text-center text-xs font-black uppercase tracking-wider text-slate-400">R</th>
            <th className="px-3 py-3 text-center text-xs font-black uppercase tracking-wider text-slate-400">P</th>
            <th className="px-3 py-3 text-center text-xs font-black uppercase tracking-wider text-slate-400">GR</th>
            <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-wider text-[#2BAF3A]">Točke</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.teamId}
              className={`border-b border-slate-50 last:border-0 ${i === 0 ? "bg-[#f0fdf4]" : ""}`}
            >
              <td className="px-4 py-3 text-xs font-black text-slate-400">
                {i === 0 ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2BAF3A] text-[10px] text-white">1</span>
                ) : (
                  i + 1
                )}
              </td>
              <td className="px-4 py-3 font-bold text-[#0A2C57]">{row.teamName}</td>
              <td className="px-3 py-3 text-center text-slate-600">{row.played}</td>
              <td className="px-3 py-3 text-center font-bold text-emerald-600">{row.wins}</td>
              <td className="px-3 py-3 text-center text-slate-500">{row.draws}</td>
              <td className="px-3 py-3 text-center font-bold text-rose-500">{row.losses}</td>
              <td className="px-3 py-3 text-center text-slate-500">
                {row.goalsFor}:{row.goalsAgainst}
                <span className="ml-1 text-[10px] text-slate-400">({row.goalDiff > 0 ? "+" : ""}{row.goalDiff})</span>
              </td>
              <td className="px-4 py-3 text-center text-base font-black text-[#2BAF3A]">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MatchRow({
  match,
}: {
  match: {
    id: string;
    homeTeam: { name: string };
    awayTeam: { name: string };
    scoreHome: number | null;
    scoreAway: number | null;
    scheduledAt: Date | null;
    court: string | null;
    location: string | null;
    status: string;
    round: number | null;
    group: string | null;
  };
}) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] bg-white px-4 py-3 shadow-sm">
      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <p className="min-w-0 flex-1 truncate text-right text-sm font-bold text-[#0A2C57]">
          {match.homeTeam.name}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          {match.status === "FINISHED" || match.status === "LIVE" ? (
            <>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0A2C57] font-black text-white">
                {match.scoreHome ?? "–"}
              </span>
              <span className="text-xs font-black text-slate-400">:</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0A2C57] font-black text-white">
                {match.scoreAway ?? "–"}
              </span>
            </>
          ) : (
            <div className="px-2 text-center">
              {match.scheduledAt ? (
                <p className="text-xs font-bold text-slate-500">
                  {new Intl.DateTimeFormat("sl-SI", { hour: "2-digit", minute: "2-digit" }).format(match.scheduledAt)}
                </p>
              ) : (
                <p className="text-xs text-slate-400">vs</p>
              )}
            </div>
          )}
        </div>
        <p className="min-w-0 flex-1 truncate text-sm font-bold text-[#0A2C57]">
          {match.awayTeam.name}
        </p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getMatchStatusTone(match.status as Parameters<typeof getMatchStatusTone>[0])}`}
      >
        {getMatchStatusLabel(match.status as Parameters<typeof getMatchStatusLabel>[0])}
      </span>
    </div>
  );
}

