import Link from "next/link";
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
      title="Seznam turnirjev"
      description="Filtriraj turnirje po športu, statusu in lokaciji ter hitro preveri razpoložljivost ekip."
      actions={
        user.role === "ADMIN" ? (
          <Link
            href="/tournaments/create"
            className="rounded-2xl bg-[#2BAF3A] px-4 py-3 text-sm font-semibold text-white"
          >
            Nov turnir
          </Link>
        ) : undefined
      }
    >
      <form className="grid gap-4 rounded-[28px] border border-slate-200 bg-white p-5 md:grid-cols-4">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Išči po nazivu ali lokaciji"
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
        />
        <select
          name="sport"
          defaultValue={params.sport ?? ""}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
        >
          <option value="">Vsi športi</option>
          {data.sports.map((sport) => (
            <option key={sport} value={sport}>
              {sport}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
        >
          <option value="">Vsi statusi</option>
          <option value="odprt">Odprt</option>
          <option value="poln">Poln</option>
          <option value="zaključen">Zaključen</option>
        </select>
        <button className="rounded-2xl bg-[#0A2C57] px-4 py-3 text-sm font-semibold text-white">
          Uporabi filtre
        </button>
      </form>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        {data.tournaments.map((tournament) => (
          <Link
            key={tournament.id}
            href={`/tournaments/${tournament.slug}`}
            className="rounded-[28px] border border-slate-200 bg-white p-6 hover:border-[#2BAF3A]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#2BAF3A]">
                  {tournament.sport}
                </p>
                <h2 className="mt-3 text-2xl tracking-tight text-[#0A2C57]">{tournament.title}</h2>
              </div>
              <StatusBadge label={tournament.status} />
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">{tournament.description}</p>
            <div className="mt-6 grid gap-3 text-sm text-slate-500 md:grid-cols-2">
              <p>Datum: {formatDate(tournament.date)}</p>
              <p>Lokacija: {tournament.location}</p>
              <p>Organizator: {tournament.organizer.fullName}</p>
              <p>
                Ekipe: {tournament.registrations.length}/{tournament.maxTeams}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
