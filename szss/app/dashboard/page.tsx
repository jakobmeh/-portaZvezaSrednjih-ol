import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/data";
import { formatCompactDate, formatDate, getRegistrationLabel } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.id);

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
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
          >
            Moja šola
          </Link>
          <Link
            href="/tournaments"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
          >
            Razišči turnirje
          </Link>
          {user.role === "ADMIN" ? (
            <Link
              href="/tournaments/create"
              className="rounded-2xl bg-[#2BAF3A] px-4 py-3 text-sm font-semibold text-white"
            >
              Ustvari turnir
            </Link>
          ) : null}
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Prihajajoči turnirji", String(data.stats.tournaments)],
          ["Moje prijave", String(data.stats.joined)],
          ["Moje ekipe", String(data.stats.teams)],
          ["Moja šola", String(data.stats.schoolmates)],
        ].map(([title, value]) => (
          <div key={title} className="rounded-[26px] bg-[#f5f8fc] p-5">
            <p className="text-sm text-slate-500">{title}</p>
            <p className="mt-3 text-4xl font-black text-[#0A2C57]">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl tracking-tight text-[#0A2C57]">Prihajajoči turnirji</h2>
            <Link href="/tournaments" className="text-sm font-semibold text-[#2BAF3A]">
              Poglej vse
            </Link>
          </div>
          <div className="mt-5 space-y-4">
            {data.upcoming.map((tournament) => (
              <Link
                key={tournament.id}
                href={`/tournaments/${tournament.slug}`}
                className="block rounded-[24px] border border-slate-200 p-5 hover:border-[#2BAF3A]"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2BAF3A]">
                      {tournament.sport}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-[#0A2C57]">
                      {tournament.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">
                      {formatDate(tournament.date)} · {tournament.location}
                    </p>
                  </div>
                  <StatusBadge label={tournament.status} />
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                  <span>Organizator: {tournament.organizer.fullName}</span>
                  <span>
                    {tournament.registrations.length}/{tournament.maxTeams} ekip
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6">
            <h2 className="text-2xl tracking-tight text-[#0A2C57]">Obvestila</h2>
            <div className="mt-5 space-y-4">
              {data.notifications.map((item) => (
                <div key={item.id} className="rounded-[24px] bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-[#0A2C57]">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.content}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6">
            <h2 className="text-2xl tracking-tight text-[#0A2C57]">Moji turnirji</h2>
            <div className="mt-5 space-y-4">
              {data.myRegistrations.length > 0 ? (
                data.myRegistrations.map((registration) => (
                  <div key={registration.id} className="rounded-[24px] bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-[#0A2C57]">{registration.tournament.title}</p>
                      <span className="rounded-full bg-[#e8f8ea] px-3 py-1 text-xs font-semibold text-[#228f2f]">
                        {getRegistrationLabel(registration.status)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      Ekipa: {registration.team.name} · {formatCompactDate(registration.tournament.date)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-[24px] bg-slate-50 p-4 text-sm text-slate-600">
                  Še nisi prijavil ekipe na noben turnir.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl tracking-tight text-[#0A2C57]">Moje ekipe</h2>
            <Link href="/teams" className="text-sm font-semibold text-[#2BAF3A]">
              Upravljanje ekip
            </Link>
          </div>
          <div className="mt-5 space-y-4">
            {data.teams.map((team) => (
              <div key={team.id} className="rounded-[24px] bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-[#0A2C57]">{team.name}</p>
                  <span className="text-sm text-slate-500">{team.sport}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {team.players.length} članov · {team.registrations.length} prijav
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl tracking-tight text-[#0A2C57]">Moja šola</h2>
            <Link href="/school" className="text-sm font-semibold text-[#2BAF3A]">
              Odpri
            </Link>
          </div>
          <div className="mt-5 rounded-[24px] bg-slate-50 p-5">
            <p className="font-semibold text-[#0A2C57]">{data.currentUser.schoolName}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              V aplikaciji je trenutno {data.stats.schoolmates} potrjenih uporabnikov iz tvoje šole.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
