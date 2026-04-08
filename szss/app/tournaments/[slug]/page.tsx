import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { createMessageAction, joinTournamentAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { getTeamsForUser, getTournamentDetails } from "@/lib/data";
import {
  formatDate,
  getRegistrationLabel,
  getTournamentStatus,
  normalizeLabel,
} from "@/lib/utils";

export default async function TournamentDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireUser();
  const { slug } = await params;
  const [tournament, teams] = await Promise.all([getTournamentDetails(slug), getTeamsForUser(user.id)]);

  if (!tournament) {
    notFound();
  }

  const status = getTournamentStatus({
    date: tournament.date,
    maxTeams: tournament.maxTeams,
    registeredTeams: tournament.registrations.length,
  });

  const progress = Math.min((tournament.registrations.length / tournament.maxTeams) * 100, 100);
  const normalizedTournamentSport = normalizeLabel(tournament.sport);
  const alreadyRegisteredTeamIds = new Set(tournament.registrations.map((registration) => registration.teamId));
  const eligibleTeams = teams.filter(
    (team) =>
      normalizeLabel(team.sport) === normalizedTournamentSport &&
      !alreadyRegisteredTeamIds.has(team.id),
  );

  return (
    <AppShell
      user={user}
      activePath="/tournaments"
      title={tournament.title}
      description="Podrobnosti turnirja, prijavljene ekipe, obvestila in komunikacija z organizatorjem."
      actions={<StatusBadge label={status} />}
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#2BAF3A]">
              {tournament.sport}
            </p>
            <p className="mt-4 text-base leading-8 text-slate-600">{tournament.description}</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Datum in ura</p>
                <p className="mt-2 font-semibold text-[#0A2C57]">{formatDate(tournament.date)}</p>
              </div>
              <div className="rounded-[24px] bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Lokacija</p>
                <p className="mt-2 font-semibold text-[#0A2C57]">{tournament.location}</p>
              </div>
              <div className="rounded-[24px] bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Organizator</p>
                <p className="mt-2 font-semibold text-[#0A2C57]">{tournament.organizer.fullName}</p>
              </div>
              <div className="rounded-[24px] bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Kapaciteta ekip</p>
                <p className="mt-2 font-semibold text-[#0A2C57]">
                  {tournament.registrations.length}/{tournament.maxTeams}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl tracking-tight text-[#0A2C57]">Prijavljene ekipe</h2>
              <span className="text-sm text-slate-500">{Math.round(progress)}% zapolnjeno</span>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#2BAF3A,#0A2C57)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-5 space-y-4">
              {tournament.registrations.length > 0 ? (
                tournament.registrations.map((registration) => (
                  <div key={registration.id} className="rounded-[24px] bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#0A2C57]">{registration.team.name}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {registration.team.schoolName} · {registration.team.players.length} igralcev
                        </p>
                      </div>
                      <span className="rounded-full bg-[#e8f8ea] px-3 py-1 text-xs font-semibold text-[#228f2f]">
                        {getRegistrationLabel(registration.status)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] bg-slate-50 p-4 text-sm text-slate-600">
                  Na ta turnir še ni prijavljena nobena ekipa.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6">
            <h2 className="text-2xl tracking-tight text-[#0A2C57]">Objave in sporočila</h2>
            <div className="mt-5 space-y-4">
              {tournament.announcements.map((announcement) => (
                <div key={announcement.id} className="rounded-[24px] border border-slate-200 p-4">
                  <p className="font-semibold text-[#0A2C57]">{announcement.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{announcement.content}</p>
                </div>
              ))}
              {tournament.messages.map((message) => (
                <div key={message.id} className="rounded-[24px] bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-[#0A2C57]">{message.senderName}</p>
                    <p className="text-xs text-slate-500">{formatDate(message.createdAt)}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{message.content}</p>
                </div>
              ))}
            </div>

            <form action={createMessageAction} className="mt-5 space-y-3">
              <input type="hidden" name="tournamentId" value={tournament.id} />
              <textarea
                name="content"
                rows={4}
                placeholder="Pošlji vprašanje organizatorju ali obvestilo ekipam."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              />
              <button className="rounded-2xl bg-[#0A2C57] px-5 py-3 text-sm font-semibold text-white">
                Pošlji sporočilo
              </button>
            </form>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6">
            <h2 className="text-2xl tracking-tight text-[#0A2C57]">Prijava ekipe</h2>
            {eligibleTeams.length > 0 ? (
              <form action={joinTournamentAction} className="mt-5 space-y-4">
                <input type="hidden" name="tournamentId" value={tournament.id} />
                <select
                  name="teamId"
                  defaultValue=""
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                >
                  <option value="" disabled>
                    Izberi ekipo za prijavo
                  </option>
                  {eligibleTeams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name} ({team.sport})
                    </option>
                  ))}
                </select>
                <button className="w-full rounded-2xl bg-[#2BAF3A] px-4 py-3 text-sm font-semibold text-white">
                  Prijavi ekipo
                </button>
              </form>
            ) : teams.length > 0 ? (
              <div className="mt-5 rounded-[24px] bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                Trenutno nimaš ekipe za šport <strong>{tournament.sport}</strong>. Tvoje ekipe:
                <div className="mt-3 space-y-2">
                  {teams.map((team) => (
                    <div key={team.id} className="rounded-2xl bg-white px-3 py-2">
                      {team.name} · {team.sport}
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Link href="/teams" className="font-semibold text-[#2BAF3A]">
                    Odpri ekipe
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-[24px] bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                Za ta šport še nimaš ekipe. Najprej ustvari ekipo v modulu za upravljanje.
                <div className="mt-4">
                  <Link href="/teams" className="font-semibold text-[#2BAF3A]">
                    Odpri ekipe
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6">
            <h2 className="text-2xl tracking-tight text-[#0A2C57]">Urnik in koraki</h2>
            <div className="mt-5 space-y-4 text-sm text-slate-600">
              <div className="rounded-[24px] bg-slate-50 p-4">
                1. Organizator objavi turnir in določi maksimalno število ekip.
              </div>
              <div className="rounded-[24px] bg-slate-50 p-4">
                2. Šole prijavijo ekipe in spremljajo potrditve v svoji nadzorni plošči.
              </div>
              <div className="rounded-[24px] bg-slate-50 p-4">
                3. Komunikacija in obvestila ostanejo zbrani na tej strani turnirja.
              </div>
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
