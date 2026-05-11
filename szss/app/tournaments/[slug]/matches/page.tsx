import { notFound, redirect } from "next/navigation";
import { CalendarDays, MapPin, Plus, Trophy } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  createMatchAction,
  deleteMatchAction,
  setMatchStatusAction,
  updateMatchResultAction,
} from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { getTournamentDetails } from "@/lib/data";
import {
  formatDate,
  getMatchStatusLabel,
  getMatchStatusTone,
  SPORTS,
} from "@/lib/utils";
import { MatchStatus } from "@prisma/client";

export default async function MatchesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireUser();
  const { slug } = await params;
  const tournament = await getTournamentDetails(slug);

  if (!tournament) notFound();
  if (tournament.organizerId !== user.id) redirect(`/tournaments/${slug}`);

  const confirmedTeams = tournament.registrations
    .filter((r) => r.status === "CONFIRMED")
    .map((r) => r.team);

  const upcoming = tournament.matches.filter((m) => m.status === "UPCOMING");
  const live = tournament.matches.filter((m) => m.status === "LIVE");
  const finished = tournament.matches.filter((m) => m.status === "FINISHED");

  return (
    <AppShell
      user={user}
      activePath="/tournaments"
      title="Urnik tekem"
      description={`Upravljaj tekme za turnir ${tournament.title}`}
      actions={
        <a
          href={`/t/${tournament.slug}`}
          target="_blank"
          className="rounded-2xl border border-[#2BAF3A]/40 bg-[#f0fdf4] px-4 py-2.5 text-sm font-semibold text-[#2BAF3A] transition hover:bg-[#dcfce7]"
        >
          Javna lestvica →
        </a>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">

        {/* Left – match list */}
        <div className="space-y-5">

          {/* Live */}
          {live.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-red-600">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
                V živo ({live.length})
              </h2>
              <div className="space-y-2.5">
                {live.map((match) => (
                  <MatchCard key={match.id} match={match} isOrganizer />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-500">
                Prihajajoče ({upcoming.length})
              </h2>
              <div className="space-y-2.5">
                {upcoming.map((match) => (
                  <MatchCard key={match.id} match={match} isOrganizer />
                ))}
              </div>
            </section>
          )}

          {/* Finished */}
          {finished.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-400">
                Končane ({finished.length})
              </h2>
              <div className="space-y-2.5">
                {finished.map((match) => (
                  <MatchCard key={match.id} match={match} isOrganizer />
                ))}
              </div>
            </section>
          )}

          {tournament.matches.length === 0 && (
            <div className="rounded-[22px] border border-dashed border-slate-200 bg-white p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <Trophy size={22} className="text-slate-400" />
              </div>
              <p className="mt-4 text-base font-black text-[#0A2C57]">Ni tekem</p>
              <p className="mt-1 text-sm text-slate-400">Ustvari prvo tekmo z obrazcem na desni.</p>
            </div>
          )}
        </div>

        {/* Right – add match form */}
        <div className="space-y-4">
          <div className="rounded-[22px] border border-slate-200 bg-white p-6">
            <div className="mb-5 flex items-center gap-2.5">
              <div className="rounded-xl bg-[#2BAF3A]/10 p-2">
                <Plus size={15} className="text-[#2BAF3A]" />
              </div>
              <h2 className="text-base font-black text-[#0A2C57]">Dodaj tekmo</h2>
            </div>

            {confirmedTeams.length < 2 ? (
              <p className="rounded-[14px] bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Za dodajanje tekme potrebuješ vsaj 2 potrjeni ekipi.
              </p>
            ) : (
              <form action={createMatchAction} className="space-y-4">
                <input type="hidden" name="tournamentId" value={tournament.id} />

                <label className="block">
                  <span className="label-text">Domača ekipa</span>
                  <select name="homeTeamId" required className="field">
                    <option value="" disabled>Izberi…</option>
                    {confirmedTeams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="label-text">Gostujoča ekipa</span>
                  <select name="awayTeamId" required className="field">
                    <option value="" disabled>Izberi…</option>
                    {confirmedTeams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="label-text">Datum in ura</span>
                  <input type="datetime-local" name="scheduledAt" className="field" />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="label-text">Igrišče / dvorana</span>
                    <input name="court" className="field" placeholder="Igrišče 1" />
                  </label>
                  <label className="block">
                    <span className="label-text">Krog</span>
                    <input name="round" type="number" min="1" className="field" placeholder="1" />
                  </label>
                </div>

                <label className="block">
                  <span className="label-text">Skupina (neobvezno)</span>
                  <input name="group" className="field" placeholder="Skupina A" />
                </label>

                <button className="w-full rounded-[14px] bg-[#2BAF3A] py-3 text-sm font-black text-white shadow-md shadow-[#2BAF3A]/25 transition hover:bg-[#249933]">
                  Dodaj tekmo
                </button>
              </form>
            )}
          </div>

          <div className="rounded-[22px] bg-[#0A2C57] p-5 text-white">
            <p className="text-xs font-black uppercase tracking-widest text-white/40">Postopek</p>
            <div className="mt-3 space-y-2.5">
              {[
                "Dodaj tekme z določitvijo ekip in termina",
                "Ko se tekma začne, jo označi kot »V živo«",
                "Po koncu vnesi rezultat",
                "Lestvica se samodejno posodobi",
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-white/65">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/10 text-[9px] font-black">
                    {i + 1}
                  </span>
                  {s}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function MatchCard({
  match,
  isOrganizer,
}: {
  match: {
    id: string;
    homeTeam: { id: string; name: string };
    awayTeam: { id: string; name: string };
    scoreHome: number | null;
    scoreAway: number | null;
    scheduledAt: Date | null;
    location: string | null;
    court: string | null;
    status: MatchStatus;
    round: number | null;
    group: string | null;
  };
  isOrganizer: boolean;
}) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {match.round && <span>Krog {match.round}</span>}
          {match.group && <span>· {match.group}</span>}
          {match.scheduledAt && (
            <span className="flex items-center gap-1">
              <CalendarDays size={11} />
              {formatDate(match.scheduledAt)}
            </span>
          )}
          {(match.court || match.location) && (
            <span className="flex items-center gap-1">
              <MapPin size={11} />
              {match.court || match.location}
            </span>
          )}
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${getMatchStatusTone(match.status)}`}
        >
          {getMatchStatusLabel(match.status)}
        </span>
      </div>

      {/* Teams & score */}
      <div className="flex items-center gap-3">
        <p className="flex-1 text-right text-sm font-black text-[#0A2C57]">{match.homeTeam.name}</p>
        <div className="flex items-center gap-1.5">
          {match.status === "FINISHED" || match.status === "LIVE" ? (
            <>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0A2C57] text-lg font-black text-white">
                {match.scoreHome ?? "–"}
              </span>
              <span className="text-xs font-black text-slate-400">:</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0A2C57] text-lg font-black text-white">
                {match.scoreAway ?? "–"}
              </span>
            </>
          ) : (
            <span className="px-3 text-sm font-bold text-slate-400">vs</span>
          )}
        </div>
        <p className="flex-1 text-sm font-black text-[#0A2C57]">{match.awayTeam.name}</p>
      </div>

      {/* Organizer controls */}
      {isOrganizer && (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          {/* Result entry */}
          {match.status !== "CANCELLED" && (
            <form action={updateMatchResultAction} className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-end">
              <input type="hidden" name="matchId" value={match.id} />
              <label className="block">
                <span className="label-text">{match.homeTeam.name}</span>
                <input
                  name="scoreHome"
                  type="number"
                  min="0"
                  defaultValue={match.scoreHome ?? ""}
                  className="field text-center"
                  placeholder="0"
                />
              </label>
              <span className="pb-2.5 text-sm font-black text-slate-400">:</span>
              <label className="block">
                <span className="label-text">{match.awayTeam.name}</span>
                <input
                  name="scoreAway"
                  type="number"
                  min="0"
                  defaultValue={match.scoreAway ?? ""}
                  className="field text-center"
                  placeholder="0"
                />
              </label>
              <button className="mb-0.5 rounded-[10px] bg-[#2BAF3A] px-3 py-2.5 text-xs font-black text-white transition hover:bg-[#249933]">
                Shrani
              </button>
              <input type="hidden" name="status" value="FINISHED" />
            </form>
          )}

          {/* Status controls */}
          <div className="flex flex-wrap gap-2">
            {match.status === "UPCOMING" && (
              <form action={setMatchStatusAction}>
                <input type="hidden" name="matchId" value={match.id} />
                <input type="hidden" name="status" value="LIVE" />
                <button className="rounded-[10px] bg-red-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-600">
                  Začni tekmo
                </button>
              </form>
            )}
            {match.status === "LIVE" && (
              <form action={setMatchStatusAction}>
                <input type="hidden" name="matchId" value={match.id} />
                <input type="hidden" name="status" value="FINISHED" />
                <button className="rounded-[10px] bg-slate-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-700">
                  Zaključi brez rezultata
                </button>
              </form>
            )}
            {match.status !== "CANCELLED" && match.status !== "FINISHED" && (
              <form action={setMatchStatusAction}>
                <input type="hidden" name="matchId" value={match.id} />
                <input type="hidden" name="status" value="CANCELLED" />
                <button className="rounded-[10px] bg-orange-100 px-3 py-1.5 text-xs font-bold text-orange-700 transition hover:bg-orange-200">
                  Odpovej
                </button>
              </form>
            )}
            <form action={deleteMatchAction}>
              <input type="hidden" name="matchId" value={match.id} />
              <button className="rounded-[10px] bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-rose-100 hover:text-rose-600">
                Izbriši
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
