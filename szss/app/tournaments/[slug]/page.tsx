import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, MessageSquare, Send, Trophy, Users } from "lucide-react";
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

  if (!tournament) notFound();

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

  return (
    <AppShell
      user={user}
      activePath="/tournaments"
      title={tournament.title}
      description="Podrobnosti turnirja, prijavljene ekipe in komunikacija z organizatorjem."
      actions={<StatusBadge label={status} />}
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">

        {/* Left column */}
        <div className="space-y-5">

          {/* Info */}
          <section className="rounded-[22px] border border-slate-200 bg-white p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2BAF3A]">
              {tournament.sport}
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
          </section>

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

            {/* Progress bar */}
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
                className="w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 placeholder:text-slate-400"
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

          {/* Register team */}
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
                <select
                  name="teamId"
                  defaultValue=""
                  className="w-full rounded-[12px] border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700"
                >
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
                <div className="mt-2 space-y-1.5">
                  {teams.map((team) => (
                    <div key={team.id} className="rounded-[10px] bg-white px-3 py-2 text-xs">
                      {team.name} · <span className="text-slate-400">{team.sport}</span>
                    </div>
                  ))}
                </div>
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

          {/* Steps */}
          <div className="rounded-[22px] border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-black text-[#0A2C57]">Kako deluje?</h2>
            <div className="space-y-3">
              {[
                "Organizator objavi turnir in določi max. število ekip.",
                "Šole prijavijo ekipe in spremljajo potrditve.",
                "Komunikacija in obvestila so zbrani tukaj.",
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
