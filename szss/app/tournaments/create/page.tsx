import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { createTournamentAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { SPORTS } from "@/lib/utils";

export default async function CreateTournamentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const params = await searchParams;

  return (
    <AppShell
      user={user}
      activePath="/tournaments"
      title="Ustvari turnir"
      description="Objavi nov turnir, nastavi termin, maksimalno število ekip in opis za prijave."
    >
      <div className="max-w-4xl rounded-[28px] border border-slate-200 bg-white p-6">
        {params.error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {params.error}
          </div>
        ) : null}
        <form action={createTournamentAction} className="mt-2 grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Naziv turnirja</span>
            <input
              name="title"
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              placeholder="Npr. ŠZSŠ futsal cup"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Šport</span>
            <select
              name="sport"
              required
              defaultValue=""
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            >
              <option value="" disabled>
                Izberi šport
              </option>
              {SPORTS.map((sport) => (
                <option key={sport} value={sport}>
                  {sport}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Datum in ura</span>
            <input
              name="date"
              type="datetime-local"
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Lokacija</span>
            <input
              name="location"
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              placeholder="Športna dvorana"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Maksimalno ekip</span>
            <input
              name="maxTeams"
              type="number"
              min={2}
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              placeholder="8"
            />
          </label>
          <div className="rounded-[26px] bg-[#0A2C57] p-5 text-sm text-white/80">
            Ko objaviš turnir, se takoj pojavi na seznamu in ga ekipe lahko začnejo prijavljati.
          </div>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">Opis turnirja</span>
            <textarea
              name="description"
              required
              rows={6}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              placeholder="Kratek opis pravil, poteka in potrebne opreme."
            />
          </label>
          <div className="md:col-span-2">
            <button className="rounded-2xl bg-[#2BAF3A] px-6 py-3 text-sm font-semibold text-white">
              Objavi turnir
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
