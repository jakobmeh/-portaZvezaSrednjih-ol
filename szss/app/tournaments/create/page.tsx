import { redirect } from "next/navigation";
import { CalendarDays, Info, MapPin, Trophy, Users } from "lucide-react";
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
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">

        {/* Form */}
        <div className="rounded-[22px] border border-slate-200 bg-white p-7">
          {params.error && (
            <div className="mb-5 rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {params.error}
            </div>
          )}

          <form action={createTournamentAction} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-400">
                  <Trophy size={11} />
                  Naziv turnirja
                </span>
                <input
                  name="title"
                  required
                  className="w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400"
                  placeholder="Npr. ŠZSŠ futsal cup"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-400">
                  <Trophy size={11} />
                  Šport
                </span>
                <select
                  name="sport"
                  required
                  defaultValue=""
                  className="w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                >
                  <option value="" disabled>Izberi šport</option>
                  {SPORTS.map((sport) => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-400">
                  <CalendarDays size={11} />
                  Datum in ura
                </span>
                <input
                  name="date"
                  type="datetime-local"
                  required
                  className="w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-400">
                  <MapPin size={11} />
                  Lokacija
                </span>
                <input
                  name="location"
                  required
                  className="w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400"
                  placeholder="Športna dvorana Kranj"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-400">
                  <Users size={11} />
                  Maksimalno ekip
                </span>
                <input
                  name="maxTeams"
                  type="number"
                  min={2}
                  required
                  className="w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  placeholder="8"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-400">
                Opis turnirja
              </span>
              <textarea
                name="description"
                required
                rows={5}
                className="w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 placeholder:text-slate-400"
                placeholder="Kratek opis pravil, poteka in potrebne opreme…"
              />
            </label>

            <button className="rounded-[14px] bg-[#2BAF3A] px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#2BAF3A]/25 transition hover:bg-[#249933]">
              Objavi turnir
            </button>
          </form>
        </div>

        {/* Info panel */}
        <div className="space-y-4">
          <div className="rounded-[22px] bg-[#0A2C57] p-6 text-white">
            <div className="rounded-xl bg-white/10 p-2.5 w-fit">
              <Info size={18} />
            </div>
            <h3 className="mt-4 text-lg font-black">Ko objaviš turnir</h3>
            <p className="mt-2 text-sm leading-6 text-white/65">
              Turnir se takoj pojavi na javnem seznamu. Ekipe se lahko takoj začnejo prijavljati.
            </p>
          </div>

          <div className="rounded-[22px] border border-slate-100 bg-white p-5 space-y-3">
            {[
              "Turnir je viden vsem registriranim uporabnikom",
              "Ekipe se prijavijo z izborom iz dropdown menija",
              "Registracije ostanejo zbrane na strani turnirja",
              "Komunikacija poteka prek sekcije za sporočila",
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-slate-600">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2BAF3A]/12 text-[10px] font-black text-[#2BAF3A]">
                  {i + 1}
                </span>
                {tip}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
