import Link from "next/link";
import { CalendarDays, MapPin, Search, SlidersHorizontal, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import { getTournamentList } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default async function TournamentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sport?: string; status?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const data = await getTournamentList(params);

  return (
    <AppShell
      user={user}
      activePath="/tournaments"
      title="Turnirji"
      description="Poišči turnir po športu ali lokaciji in prijavi svojo ekipo."
      actions={
        user.role === "ADMIN" ? (
          <Link
            href="/tournaments/create"
            className="rounded-2xl bg-[#2BAF3A] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#2BAF3A]/25 transition hover:bg-[#249933]"
          >
            + Nov turnir
          </Link>
        ) : undefined
      }
    >
      {/* Filter */}
      <form className="rounded-[20px] border border-slate-200 bg-slate-50/80 p-4">
        <div className="mb-3 flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-slate-400" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">Filtri</span>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={params.q}
              placeholder="Naziv ali lokacija…"
              className="w-full rounded-[14px] border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm"
            />
          </div>
          <select
            name="sport"
            defaultValue={params.sport ?? ""}
            className="rounded-[14px] border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700"
          >
            <option value="">Vsi športi</option>
            {data.sports.map((sport) => (
              <option key={sport} value={sport}>{sport}</option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={params.status ?? ""}
            className="rounded-[14px] border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700"
          >
            <option value="">Vsi statusi</option>
            <option value="odprt">Odprt</option>
            <option value="poln">Poln</option>
            <option value="zaključen">Zaključen</option>
          </select>
          <button className="rounded-[14px] bg-[#0A2C57] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0d3570]">
            Išči
          </button>
        </div>
      </form>

      {/* Results count */}
      <p className="mt-5 mb-3 text-xs font-semibold text-slate-400">
        {data.tournaments.length} {data.tournaments.length === 1 ? "turnir" : "turnirjev"}
      </p>

      {/* Grid */}
      <div className="grid gap-4 xl:grid-cols-2">
        {data.tournaments.length === 0 ? (
          <div className="col-span-2 rounded-[20px] border border-dashed border-slate-200 bg-white p-12 text-center">
            <Search size={32} className="mx-auto text-slate-300" />
            <p className="mt-3 text-base font-bold text-slate-400">Ni najdenih turnirjev</p>
            <p className="mt-1 text-sm text-slate-400">Poskusi z drugimi filtri.</p>
          </div>
        ) : (
          data.tournaments.map((tournament) => (
            <Link
              key={tournament.id}
              href={`/tournaments/${tournament.slug}`}
              className="group flex flex-col rounded-[20px] border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#2BAF3A]/40 hover:shadow-md hover:shadow-slate-100"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2BAF3A]">
                    {tournament.sport}
                  </p>
                  <h2 className="mt-1.5 text-xl font-black text-[#0A2C57] leading-tight">
                    {tournament.title}
                  </h2>
                </div>
                <StatusBadge label={tournament.status} />
              </div>

              {tournament.description && (
                <p className="mt-2 text-sm leading-6 text-slate-500 line-clamp-2">
                  {tournament.description}
                </p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 rounded-[10px] bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <CalendarDays size={13} className="text-[#0A2C57]/50" />
                  {formatDate(tournament.date)}
                </div>
                <div className="flex items-center gap-2 rounded-[10px] bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <MapPin size={13} className="text-[#0A2C57]/50" />
                  <span className="truncate">{tournament.location}</span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
                <span>Org: {tournament.organizer.fullName}</span>
                <div className="flex items-center gap-1 font-semibold text-slate-600">
                  <Users size={12} />
                  {tournament.registrations.length}/{tournament.maxTeams} ekip
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </AppShell>
  );
}
