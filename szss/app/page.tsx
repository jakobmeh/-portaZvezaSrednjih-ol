import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarDays, MapPin, ShieldCheck, Trophy, Users, Users2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { loginAction, registerAction } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth";
import { getTournamentList } from "@/lib/data";
import { SCHOOL_OPTIONS } from "@/lib/schools";
import { SPORTS, formatDate } from "@/lib/utils";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    modal?: string;
    loginError?: string;
    registerError?: string;
    registered?: string;
    q?: string;
    sport?: string;
    status?: string;
  }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const params = await searchParams;
  const data = await getTournamentList({ q: params.q, sport: params.sport, status: params.status });
  const activeModal =
    params.modal === "register" ? "register" : params.modal === "login" ? "login" : null;

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      <div className="mx-auto max-w-7xl px-4 py-5 md:px-6">

        {/* ── Header ── */}
        <header className="flex items-center justify-between rounded-[24px] bg-[#0A2C57] px-6 py-4 shadow-2xl shadow-[#0A2C57]/20">
          <Logo />
          <div className="flex items-center gap-2">
            <Link
              href="/?modal=login"
              className="rounded-[14px] border border-white/20 px-4 py-2.5 text-sm font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              Prijava
            </Link>
            <Link
              href="/?modal=register"
              className="rounded-[14px] bg-[#2BAF3A] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#2BAF3A]/30 transition hover:bg-[#249933]"
            >
              Registracija
            </Link>
          </div>
        </header>

        {/* ── Hero ── */}
        <section className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">

          {/* Main hero card */}
          <div className="relative overflow-hidden rounded-[24px] bg-white p-8 shadow-sm ring-1 ring-slate-200 md:p-10">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#2BAF3A]/6 blur-3xl" />
            <div className="relative">
              <span className="inline-flex items-center rounded-full bg-[#2BAF3A]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#2BAF3A]">
                Športna zveza srednjih šol
              </span>
              <h1 className="mt-5 max-w-xl text-5xl font-black leading-[1] tracking-tight text-[#0A2C57] md:text-6xl">
                Turnirji, ekipe in šole na enem mestu.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-slate-500">
                Javni pregled turnirjev, hitra registracija šolskih ekip in enoten sistem za
                dijake, mentorje ter organizatorje. Brez zmede, brez ročnega usklajevanja.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full border border-[#2BAF3A]/25 bg-[#2BAF3A]/8 px-3.5 py-1.5 text-xs font-semibold text-[#2BAF3A]">
                  Registracija po dejanski srednji šoli
                </span>
                <span className="rounded-full border border-[#0A2C57]/15 bg-[#0A2C57]/6 px-3.5 py-1.5 text-xs font-semibold text-[#0A2C57]">
                  Admin odobritev novih računov
                </span>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/?modal=register"
                  className="inline-flex items-center gap-2 rounded-[14px] bg-[#2BAF3A] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#2BAF3A]/25 transition hover:bg-[#249933]"
                >
                  Ustvari račun <ArrowRight size={15} />
                </Link>
                <Link
                  href="/?modal=login"
                  className="inline-flex items-center gap-2 rounded-[14px] border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:shadow-sm"
                >
                  Imam račun
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-8 grid grid-cols-3 gap-3 border-t border-slate-100 pt-6">
                {[
                  { label: "Odprti turnirji", value: data.tournaments.length, sub: "Aktualni dogodki" },
                  { label: "Športne kategorije", value: SPORTS.length, sub: "Od futsala do atletike" },
                  { label: "Šole v sistemu", value: SCHOOL_OPTIONS.length, sub: "Po celotni Sloveniji" },
                ].map(({ label, value, sub }) => (
                  <div key={label} className="rounded-[16px] bg-slate-50 p-4 text-center">
                    <p className="text-3xl font-black text-[#0A2C57]">{value}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{label}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">{sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feature cards */}
          <div className="flex flex-col gap-4">
            {[
              {
                icon: ShieldCheck,
                title: "Pametna prijava",
                text: "Prijava in registracija se odpreta v pojavnem oknu — brez zapuščanja strani.",
                color: "bg-[#0A2C57]",
              },
              {
                icon: Users2,
                title: "Šolske ekipe",
                text: "Vsaka ekipa pripada svoji šoli. Člane dodajaš iz potrjenih sošolcev.",
                color: "bg-amber-500",
              },
              {
                icon: Trophy,
                title: "Pregled turnirjev",
                text: "Na prvi strani vidiš šport, lokacijo, zasedenost in datum vsakega turnirja.",
                color: "bg-[#2BAF3A]",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex items-start gap-4 rounded-[20px] bg-white p-5 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${item.color} text-white`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-[#0A2C57]">{item.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{item.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Tournament list ── */}
        <section className="mt-4 rounded-[24px] bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#2BAF3A]">
                Javni pregled
              </span>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-[#0A2C57]">
                Aktualni turnirji
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Filtriraj in odpri račun za prijavo ekip.
              </p>
            </div>
          </div>

          {/* Filters */}
          <form className="mb-6 grid gap-3 rounded-[18px] bg-slate-50 p-4 md:grid-cols-4">
            <input
              name="q"
              defaultValue={params.q}
              placeholder="Naziv ali lokacija…"
              className="rounded-[12px] border border-slate-200 bg-white px-4 py-2.5 text-sm"
            />
            <select
              name="sport"
              defaultValue={params.sport ?? ""}
              className="rounded-[12px] border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700"
            >
              <option value="">Vsi športi</option>
              {data.sports.map((sport) => (
                <option key={sport} value={sport}>{sport}</option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={params.status ?? ""}
              className="rounded-[12px] border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700"
            >
              <option value="">Vsi statusi</option>
              <option value="odprt">Odprt</option>
              <option value="poln">Poln</option>
              <option value="zaključen">Zaključen</option>
            </select>
            <button className="rounded-[12px] bg-[#0A2C57] py-2.5 text-sm font-black text-white transition hover:bg-[#0d3570]">
              Išči
            </button>
          </form>

          {/* Cards */}
          <div className="grid gap-4 xl:grid-cols-2">
            {data.tournaments.map((tournament) => (
              <article
                key={tournament.id}
                className="group rounded-[20px] border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#2BAF3A]/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2BAF3A]">
                      {tournament.sport}
                    </p>
                    <h3 className="mt-1.5 text-xl font-black leading-tight text-[#0A2C57]">
                      {tournament.title}
                    </h3>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#e8f8ea] px-2.5 py-1 text-[11px] font-bold text-[#228f2f]">
                    {tournament.status}
                  </span>
                </div>

                {tournament.description && (
                  <p className="mt-2 text-sm leading-6 text-slate-500 line-clamp-2">
                    {tournament.description}
                  </p>
                )}

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 rounded-[10px] bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    <CalendarDays size={12} className="text-slate-400" />
                    {formatDate(tournament.date)}
                  </div>
                  <div className="flex items-center gap-2 rounded-[10px] bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    <MapPin size={12} className="text-slate-400" />
                    <span className="truncate">{tournament.location}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-xs text-slate-400">Org: {tournament.organizer.fullName}</span>
                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-600">
                    <Users size={12} />
                    {tournament.registrations.length}/{tournament.maxTeams}
                  </div>
                </div>

                <div className="mt-4">
                  <Link
                    href="/?modal=login"
                    className="inline-flex items-center gap-1.5 rounded-[12px] bg-[#0A2C57] px-4 py-2 text-xs font-black text-white transition hover:bg-[#0d3570]"
                  >
                    Prijava za podrobnosti <ArrowRight size={12} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {/* ── Modal ── */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl overflow-y-auto rounded-[28px] bg-white shadow-2xl">
            <Link
              href="/"
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
            >
              ✕
            </Link>

            <div className="grid md:grid-cols-[0.9fr_1.1fr]">
              {/* Left info panel */}
              <div className="rounded-[28px] bg-[#0A2C57] p-7 text-white md:rounded-r-none">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8EF29A]">
                  ŠZSŠ portal
                </span>
                <h2 className="mt-3 text-2xl font-black leading-tight">
                  {activeModal === "login" ? "Prijava v sistem" : "Registracija novega računa"}
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/60">
                  {activeModal === "login"
                    ? "Vstopi za upravljanje ekip, prijave na turnirje in pregled dogajanja tvoje šole."
                    : "Izberi svojo šolo, naloži kartico in po admin odobritvi dostopaj do ekip in turnirjev."}
                </p>
                <div className="mt-6 space-y-2">
                  {[
                    "Javni pregled turnirjev",
                    "Registracija po dejanski srednji šoli",
                    "Ekipe in člani na enem mestu",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2.5 rounded-[12px] bg-white/8 px-3.5 py-2.5 text-sm text-white/70">
                      <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#8EF29A]" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right form */}
              <div className="p-7">
                {activeModal === "login" ? (
                  <>
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#2BAF3A]">Prijava</span>
                    <h3 className="mt-2 text-2xl font-black text-[#0A2C57]">Vstop v sistem</h3>
                    <p className="mt-1.5 text-sm text-slate-500">
                      Prijavi se. Registracija se najprej pregleda.
                    </p>

                    {params.registered && (
                      <div className="mt-4 rounded-[12px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                        Registracija je oddana. Po admin odobritvi se lahko prijaviš.
                      </div>
                    )}
                    {params.loginError && (
                      <div className="mt-4 rounded-[12px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                        {params.loginError}
                      </div>
                    )}

                    <form action={loginAction} className="mt-5 space-y-3.5">
                      <input type="hidden" name="redirectTo" value="/" />
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-400">E-pošta</span>
                        <input
                          name="email"
                          type="email"
                          required
                          className="w-full rounded-[12px] border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm"
                          placeholder="ime@sola.si"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-400">Geslo</span>
                        <input
                          name="password"
                          type="password"
                          required
                          className="w-full rounded-[12px] border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm"
                          placeholder="••••••••"
                        />
                      </label>
                      <button className="w-full rounded-[12px] bg-[#0A2C57] py-3 text-sm font-black text-white shadow-lg shadow-[#0A2C57]/20 transition hover:bg-[#0d3570]">
                        Prijava
                      </button>
                    </form>

                    <p className="mt-5 text-sm text-slate-500">
                      Nimaš računa?{" "}
                      <Link href="/?modal=register" className="font-black text-[#2BAF3A]">
                        Registriraj se
                      </Link>
                    </p>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#2BAF3A]">Registracija</span>
                    <h3 className="mt-2 text-2xl font-black text-[#0A2C57]">Ustvari račun</h3>
                    <p className="mt-1.5 text-sm text-slate-500">
                      Izberi šolo, naloži kartico in počakaj na admin odobritev.
                    </p>

                    {params.registerError && (
                      <div className="mt-4 rounded-[12px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                        {params.registerError}
                      </div>
                    )}

                    <form action={registerAction} className="mt-5 space-y-3">
                      <input type="hidden" name="redirectTo" value="/" />
                      <input
                        name="fullName"
                        required
                        className="w-full rounded-[12px] border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm"
                        placeholder="Ime in priimek"
                      />
                      <input
                        name="email"
                        type="email"
                        required
                        className="w-full rounded-[12px] border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm"
                        placeholder="E-pošta"
                      />
                      <input
                        name="password"
                        type="password"
                        required
                        minLength={6}
                        className="w-full rounded-[12px] border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm"
                        placeholder="Geslo (min. 6 znakov)"
                      />
                      <select
                        name="schoolName"
                        required
                        defaultValue=""
                        className="w-full rounded-[12px] border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700"
                      >
                        <option value="" disabled>Izberi svojo šolo</option>
                        {SCHOOL_OPTIONS.map((school) => (
                          <option key={school} value={school}>{school}</option>
                        ))}
                      </select>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-bold text-slate-500">Šolska kartica (slika)</span>
                        <input
                          name="schoolCard"
                          type="file"
                          accept="image/*"
                          required
                          className="w-full rounded-[12px] border border-dashed border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#0A2C57] file:px-3 file:py-1 file:text-xs file:font-bold file:text-white"
                        />
                      </label>
                      <button className="w-full rounded-[12px] bg-[#2BAF3A] py-3 text-sm font-black text-white shadow-lg shadow-[#2BAF3A]/25 transition hover:bg-[#249933]">
                        Oddaj registracijo
                      </button>
                    </form>

                    <p className="mt-4 text-sm text-slate-500">
                      Že imaš račun?{" "}
                      <Link href="/?modal=login" className="font-black text-[#0A2C57]">
                        Prijavi se
                      </Link>
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
