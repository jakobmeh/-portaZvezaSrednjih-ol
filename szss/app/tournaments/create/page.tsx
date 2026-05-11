import { redirect } from "next/navigation";
import { CalendarDays, Info, MapPin, Trophy, Users, Zap } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { createTournamentAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { isProUser, SPORTS, TOURNAMENT_FORMATS } from "@/lib/utils";

export default async function CreateTournamentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  if (!isProUser(user)) {
    redirect("/upgrade");
  }

  const params = await searchParams;

  return (
    <AppShell
      user={user}
      activePath="/tournaments"
      title="Ustvari turnir"
      description="Objavi nov turnir, nastavi format, termin, maksimalno število ekip in opis za prijave."
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
                <span className="label-text">
                  <Trophy size={11} />
                  Naziv turnirja
                </span>
                <input
                  name="title"
                  required
                  className="field"
                  placeholder="Npr. ŠZSŠ futsal cup"
                />
              </label>

              <label className="block">
                <span className="label-text">
                  <Trophy size={11} />
                  Šport
                </span>
                <select name="sport" required defaultValue="" className="field">
                  <option value="" disabled>Izberi šport</option>
                  {SPORTS.map((sport) => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="label-text">
                  <CalendarDays size={11} />
                  Datum in ura
                </span>
                <input
                  name="date"
                  type="datetime-local"
                  required
                  className="field"
                />
              </label>

              <label className="block">
                <span className="label-text">
                  <MapPin size={11} />
                  Lokacija
                </span>
                <input
                  name="location"
                  required
                  className="field"
                  placeholder="Športna dvorana Kranj"
                />
              </label>

              <label className="block">
                <span className="label-text">
                  <Users size={11} />
                  Maksimalno ekip
                </span>
                <input
                  name="maxTeams"
                  type="number"
                  min={2}
                  required
                  className="field"
                  placeholder="8"
                />
              </label>

              <label className="block">
                <span className="label-text">
                  <Zap size={11} />
                  Format turnirja
                </span>
                <select name="format" required defaultValue="GROUP_STAGE" className="field">
                  {TOURNAMENT_FORMATS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="label-text">Opis turnirja</span>
              <textarea
                name="description"
                required
                rows={4}
                className="field"
                placeholder="Kratek opis pravil, poteka in potrebne opreme…"
              />
            </label>

            {/* Self-registration toggle */}
            <label className="flex cursor-pointer items-start gap-3 rounded-[14px] border border-slate-200 bg-slate-50 p-4">
              <input
                type="checkbox"
                name="selfRegistrationEnabled"
                className="mt-0.5 h-4 w-4 accent-[#2BAF3A]"
              />
              <div>
                <p className="text-sm font-bold text-[#0A2C57]">Omogoči samostojno prijavo</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Ekipe se lahko prijavijo prek javne povezave brez predhodne odobritve.
                </p>
              </div>
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
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Formati</p>
            {TOURNAMENT_FORMATS.map((f) => (
              <div key={f.value} className="flex items-start gap-2.5 text-sm text-slate-600">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2BAF3A]/10 text-[10px] font-black text-[#2BAF3A]">
                  {f.label.charAt(0)}
                </span>
                <div>
                  <p className="font-bold text-[#0A2C57]">{f.label}</p>
                  <p className="text-xs text-slate-500">{f.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-[22px] border border-slate-100 bg-white p-5 space-y-3">
            {[
              "Turnir je viden vsem registriranim uporabnikom",
              "Lestvica se samodejno posodobi po vsakem rezultatu",
              "Javna lestvica je dostopna brez prijave",
              "Pošlji javno povezavo gledalcem in ekipam",
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
