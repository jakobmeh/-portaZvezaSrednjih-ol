import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  ChevronRight,
  ExternalLink,
  School,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/data";
import {
  formatCompactDate,
  formatDate,
  getMatchStatusLabel,
  getMatchStatusTone,
  getRegistrationLabel,
  isProUser,
} from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.id);
  const pro = isProUser(user);

  return (
    <AppShell
      user={user}
      activePath="/dashboard"
      title="Nadzorna plošča"
      description="Pregled prijavljenih turnirjev, ekip, obvestil in dogajanja v tvoji šoli."
      actions={
        <>
          <Link
            href="/school"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow"
          >
            Moja šola
          </Link>
          <Link
            href="/tournaments"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:shadow"
          >
            Razišči turnirje
          </Link>
          {pro ? (
            <Link
              href="/tournaments/create"
              className="rounded-2xl bg-[#2BAF3A] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#2BAF3A]/30 transition hover:bg-[#249933]"
            >
              + Ustvari turnir
            </Link>
          ) : (
            <Link
              href="/upgrade"
              className="flex items-center gap-1.5 rounded-2xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-400/30 transition hover:bg-amber-600"
            >
              <Zap size={14} />
              Pro
            </Link>
          )}
        </>
      }
    >
      {/* Stat Cards */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/tournaments"
          className="group relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#0A2C57] to-[#1a4a8a] p-6 text-white shadow-lg shadow-[#0A2C57]/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#0A2C57]/25"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-white/15 p-2.5">
              <CalendarDays size={18} />
            </div>
            <ChevronRight size={15} className="text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white/70" />
          </div>
          <p className="mt-5 text-[2.8rem] font-black leading-none">{data.stats.tournaments}</p>
          <p className="mt-2 text-sm font-bold text-white/90">Prihajajoči turnirji</p>
          <p className="mt-0.5 text-xs text-white/50">Turnirji, ki se bodo kmalu začeli</p>
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/5" />
        </Link>

        <Link
          href="/tournaments"
          className="group relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#2BAF3A] to-[#1d8a2a] p-6 text-white shadow-lg shadow-[#2BAF3A]/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#2BAF3A]/30"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-white/20 p-2.5">
              <Trophy size={18} />
            </div>
            <ChevronRight size={15} className="text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white/70" />
          </div>
          <p className="mt-5 text-[2.8rem] font-black leading-none">{data.stats.joined}</p>
          <p className="mt-2 text-sm font-bold text-white/90">Moje prijave</p>
          <p className="mt-0.5 text-xs text-white/60">Prijave tvojih ekip na turnirje</p>
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/8" />
        </Link>

        <Link
          href="/teams"
          className="group relative overflow-hidden rounded-[24px] bg-gradient-to-br from-amber-400 to-amber-500 p-6 text-white shadow-lg shadow-amber-400/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-400/30"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-white/20 p-2.5">
              <Users size={18} />
            </div>
            <ChevronRight size={15} className="text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white/70" />
          </div>
          <p className="mt-5 text-[2.8rem] font-black leading-none">{data.stats.teams}</p>
          <p className="mt-2 text-sm font-bold text-white/90">Moje ekipe</p>
          <p className="mt-0.5 text-xs text-white/65">Ekipe, ki jih upravljaš</p>
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/8" />
        </Link>

        <Link
          href="/school"
          className="group relative overflow-hidden rounded-[24px] bg-gradient-to-br from-violet-500 to-violet-600 p-6 text-white shadow-lg shadow-violet-500/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/30"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-white/20 p-2.5">
              <School size={18} />
            </div>
            <ChevronRight size={15} className="text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white/70" />
          </div>
          <p className="mt-5 text-[2.8rem] font-black leading-none">{data.stats.schoolmates}</p>
          <p className="mt-2 text-sm font-bold text-white/90">Člani šole</p>
          <p className="mt-0.5 text-xs text-white/60">Potrjeni uporabniki iz tvoje šole</p>
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/8" />
        </Link>
      </div>

      {/* Organizer section */}
      {pro && data.myOrganized.length > 0 && (
        <section className="mt-5 rounded-[26px] border border-[#2BAF3A]/20 bg-[#f0fdf4] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#2BAF3A]/15 p-2.5">
                <Trophy size={17} className="text-[#2BAF3A]" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-[#0A2C57]">Moji turnirji</h2>
                <p className="text-xs text-slate-500">Turnirji, ki jih organiziraš</p>
              </div>
            </div>
            <Link
              href="/tournaments/create"
              className="flex items-center gap-1 rounded-xl bg-[#2BAF3A] px-3 py-2 text-xs font-black text-white transition hover:bg-[#249933]"
            >
              + Nov turnir
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.myOrganized.map((t) => (
              <div key={t.id} className="rounded-[18px] bg-white p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#2BAF3A]">{t.sport ?? ""}</p>
                <p className="mt-1 font-bold text-[#0A2C57] truncate">{t.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{t.registrations.length} ekip prijavljenih</p>
                {t.matches.length > 0 && (
                  <p className="mt-0.5 text-xs text-slate-400">{t.matches.length} prihajajoče tekme</p>
                )}
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/tournaments/${t.slug}/matches`}
                    className="flex-1 rounded-[10px] bg-[#2BAF3A]/10 px-2 py-1.5 text-center text-xs font-bold text-[#2BAF3A] transition hover:bg-[#2BAF3A]/20"
                  >
                    Tekme
                  </Link>
                  <a
                    href={`/t/${t.slug}`}
                    target="_blank"
                    className="flex items-center gap-1 rounded-[10px] bg-slate-100 px-2 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
                  >
                    <ExternalLink size={11} />
                    Lestvica
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main grid */}
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">

        {/* Tournaments list */}
        <section className="rounded-[26px] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#0A2C57]/8 p-2.5">
                <CalendarDays size={17} className="text-[#0A2C57]" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-[#0A2C57]">Prihajajoči turnirji</h2>
                <p className="text-xs text-slate-400">Turnirji, ki se bodo kmalu začeli</p>
              </div>
            </div>
            <Link
              href="/tournaments"
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-[#2BAF3A] transition hover:bg-[#f0fdf4] hover:border-[#2BAF3A]/30"
            >
              Vsi turnirji <ArrowRight size={12} />
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {data.upcoming.length > 0 ? (
              data.upcoming.map((tournament) => (
                <Link
                  key={tournament.id}
                  href={`/tournaments/${tournament.slug}`}
                  className="group block rounded-[18px] border border-slate-100 p-5 transition hover:border-[#2BAF3A]/30 hover:bg-[#f9fffe] hover:shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2BAF3A]">
                        {tournament.sport}
                      </p>
                      <h3 className="mt-1.5 truncate text-base font-bold text-[#0A2C57]">
                        {tournament.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(tournament.date)} · {tournament.location}
                      </p>
                    </div>
                    <StatusBadge label={tournament.status} />
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-xs text-slate-400">Org: {tournament.organizer.fullName}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                      {tournament.registrations.length}/{tournament.maxTeams} ekip
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-[18px] border border-dashed border-slate-200 p-8 text-center">
                <p className="text-sm text-slate-400">Ni prihajajočih turnirjev.</p>
                <Link href="/tournaments" className="mt-2 inline-block text-xs font-bold text-[#2BAF3A]">
                  Prebrskaj vse →
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Right column */}
        <div className="flex flex-col gap-5">

          {/* Notifications */}
          <section className="rounded-[26px] border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-amber-50 p-2.5">
                  <Bell size={17} className="text-amber-500" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-[#0A2C57]">Obvestila</h2>
                  <p className="text-xs text-slate-400">Zadnje novosti</p>
                </div>
              </div>
              <Link
                href="/notifications"
                className="text-xs font-bold text-[#2BAF3A] hover:underline"
              >
                Vsa →
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {data.notifications.length > 0 ? (
                data.notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-[16px] p-4 ${item.isRead ? "border border-slate-100 bg-slate-50/80" : "border border-[#2BAF3A]/20 bg-[#f0fdf4]"}`}
                  >
                    {!item.isRead && (
                      <div className="mb-1 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#2BAF3A]" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#2BAF3A]">Novo</span>
                      </div>
                    )}
                    <p className="text-sm font-bold text-[#0A2C57]">{item.title}</p>
                    <p className="mt-1.5 text-xs leading-5 text-slate-500">{item.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">Ni novih obvestil.</p>
              )}
            </div>
          </section>

          {/* My registrations */}
          <section className="rounded-[26px] border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#2BAF3A]/10 p-2.5">
                <Trophy size={17} className="text-[#2BAF3A]" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-[#0A2C57]">Moje prijave</h2>
                <p className="text-xs text-slate-400">Turnirji, na katere si prijavil ekipe</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {data.myRegistrations.length > 0 ? (
                data.myRegistrations.map((registration) => (
                  <div key={registration.id} className="rounded-[16px] border border-slate-100 bg-slate-50/80 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold leading-tight text-[#0A2C57]">{registration.tournament.title}</p>
                      <span className="shrink-0 rounded-full bg-[#e8f8ea] px-2.5 py-0.5 text-[11px] font-bold text-[#228f2f]">
                        {getRegistrationLabel(registration.status)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">
                      <span className="font-semibold text-slate-600">{registration.team.name}</span>
                      {" · "}{formatCompactDate(registration.tournament.date)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[16px] border border-dashed border-slate-200 p-5 text-center">
                  <Trophy size={22} className="mx-auto text-slate-300" />
                  <p className="mt-2 text-sm font-semibold text-slate-400">Še ni prijav na turnirje</p>
                  <Link href="/tournaments" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#2BAF3A]">
                    Razišči turnirje <ArrowRight size={11} />
                  </Link>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Followed tournaments */}
      {data.followedTournaments.length > 0 && (
        <section className="mt-5 rounded-[26px] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-xl bg-[#0A2C57]/8 p-2.5">
              <Bell size={17} className="text-[#0A2C57]" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-[#0A2C57]">Sledim turnirjem</h2>
              <p className="text-xs text-slate-400">Prihajajoče tekme turnirjev, ki jim slediš</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.followedTournaments.map((follower) => (
              <div key={follower.id} className="rounded-[18px] border border-slate-100 p-4">
                <div className="flex items-start justify-between mb-3">
                  <Link
                    href={`/tournaments/${follower.tournament.slug}`}
                    className="text-sm font-bold text-[#0A2C57] hover:text-[#2BAF3A] truncate"
                  >
                    {follower.tournament.title}
                  </Link>
                  <a
                    href={`/t/${follower.tournament.slug}`}
                    target="_blank"
                    className="ml-2 shrink-0 text-slate-400 hover:text-[#2BAF3A]"
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>
                <div className="space-y-2">
                  {follower.tournament.matches.length === 0 ? (
                    <p className="text-xs text-slate-400">Ni prihajajočih tekem.</p>
                  ) : (
                    follower.tournament.matches.map((match) => (
                      <div key={match.id} className="flex items-center gap-2 rounded-[10px] bg-slate-50 px-3 py-2">
                        <p className="flex-1 truncate text-xs font-bold text-[#0A2C57]">
                          {match.homeTeam.name} <span className="font-normal text-slate-400">vs</span> {match.awayTeam.name}
                        </p>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${getMatchStatusTone(match.status)}`}>
                          {getMatchStatusLabel(match.status)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bottom grid */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">

        {/* My teams */}
        <section className="rounded-[26px] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-50 p-2.5">
                <Users size={17} className="text-amber-500" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-[#0A2C57]">Moje ekipe</h2>
                <p className="text-xs text-slate-400">Ekipe, ki jih upravljaš</p>
              </div>
            </div>
            <Link
              href="/teams"
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-[#2BAF3A] transition hover:bg-[#f0fdf4] hover:border-[#2BAF3A]/30"
            >
              Upravljaj <ArrowRight size={12} />
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {data.teams.length > 0 ? (
              data.teams.map((team) => (
                <div key={team.id} className="flex items-center justify-between rounded-[16px] border border-slate-100 bg-slate-50/80 p-4">
                  <div>
                    <p className="font-bold text-[#0A2C57]">{team.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      <span className="font-semibold text-slate-600">{team.players.length} članov</span>
                      {" · "}<span className="font-semibold text-slate-600">{team.registrations.length} prijav</span>
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">{team.sport}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">Ni ekip.</p>
            )}
          </div>
        </section>

        {/* My school */}
        <section className="rounded-[26px] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-50 p-2.5">
                <School size={17} className="text-violet-500" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-[#0A2C57]">Moja šola</h2>
                <p className="text-xs text-slate-400">Podatki o tvoji šoli v aplikaciji</p>
              </div>
            </div>
            <Link
              href="/school"
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-[#2BAF3A] transition hover:bg-[#f0fdf4] hover:border-[#2BAF3A]/30"
            >
              Odpri <ArrowRight size={12} />
            </Link>
          </div>
          <div className="mt-5 rounded-[18px] bg-gradient-to-br from-violet-50 to-violet-100/60 p-5 ring-1 ring-violet-200/50">
            <p className="font-black text-[#0A2C57]">{data.currentUser.schoolName}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              V aplikaciji je trenutno{" "}
              <span className="font-black text-violet-700">{data.stats.schoolmates} potrjenih uporabnikov</span>
              {" "}iz tvoje šole.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
