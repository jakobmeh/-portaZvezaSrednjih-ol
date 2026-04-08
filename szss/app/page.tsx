import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarDays, MapPin, ShieldCheck, Trophy, Users2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { loginAction, registerAction } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth";
import { getTournamentList } from "@/lib/data";
import { SCHOOL_OPTIONS } from "@/lib/schools";
import { SPORTS, formatDate } from "@/lib/utils";

function MainCta() {
  return (
    <div className="mt-8 flex flex-wrap gap-4">
      <Link
        href="/?modal=register"
        className="inline-flex items-center gap-2 rounded-2xl bg-[#2BAF3A] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#2BAF3A]/25 hover:bg-[#249933]"
      >
        Ustvari račun
        <ArrowRight size={16} />
      </Link>
      <Link
        href="/?modal=login"
        className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:border-[#0A2C57]/15 hover:text-[#0A2C57]"
      >
        Imam račun
      </Link>
    </div>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    modal?: string;
    error?: string;
    registered?: string;
    q?: string;
    sport?: string;
    status?: string;
  }>;
}) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const data = await getTournamentList({
    q: params.q,
    sport: params.sport,
    status: params.status,
  });
  const activeModal =
    params.modal === "register" ? "register" : params.modal === "login" ? "login" : null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(43,175,58,0.18),transparent_18%),radial-gradient(circle_at_right,_rgba(10,44,87,0.10),transparent_22%),linear-gradient(180deg,#f8fbff_0%,#eaf1f8_100%)] px-4 py-6 md:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,#0A2C57_0%,#143d74_58%,#0b2344_100%)] px-6 py-6 text-white shadow-2xl shadow-[#0A2C57]/15 md:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <Logo />
            <div className="flex flex-wrap gap-3">
              <Link
                href="/?modal=login"
                className="rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/10"
              >
                Prijava
              </Link>
              <Link
                href="/?modal=register"
                className="rounded-2xl bg-[#2BAF3A] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#2BAF3A]/25 hover:bg-[#249933]"
              >
                Registracija
              </Link>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative overflow-hidden rounded-[34px] border border-white/60 bg-[linear-gradient(180deg,#ffffff_0%,#f9fcff_100%)] px-8 py-10 shadow-2xl shadow-slate-200/60">
            <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-[#2BAF3A]/10 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-56 w-56 bg-[radial-gradient(circle,_rgba(10,44,87,0.08),_transparent_58%)]" />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#2BAF3A]">
                Športna zveza srednjih šol
              </p>
              <h1 className="mt-5 max-w-4xl text-5xl leading-[0.96] tracking-tight text-[#0A2C57] md:text-7xl">
                Turnirji, ekipe in šole v eni športni platformi.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600">
                Javni pregled turnirjev, hitra registracija šolskih ekip in enoten sistem za
                dijake, mentorje ter organizatorje. Brez razpršenih prijav, brez zmede, brez
                ročnega usklajevanja.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-600">
                <div className="rounded-full border border-[#2BAF3A]/20 bg-[#2BAF3A]/8 px-4 py-2">
                  Registracija po dejanski srednji šoli
                </div>
                <div className="rounded-full border border-[#0A2C57]/10 bg-[#0A2C57]/5 px-4 py-2">
                  Admin odobritev novih računov
                </div>
              </div>

              <MainCta />

              <div className="mt-10 grid gap-4 md:grid-cols-3">
                {[
                  ["Odprti turnirji", `${data.tournaments.length}`, "Aktualni in prihajajoči dogodki"],
                  ["Športne kategorije", `${SPORTS.length}`, "Od futsala do atletike"],
                  ["Šole v sistemu", `${SCHOOL_OPTIONS.length}`, "Registracija po dejanski srednji šoli"],
                ].map(([label, value, text]) => (
                  <div
                    key={label}
                    className="rounded-[26px] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,248,252,0.96))] p-5"
                  >
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="mt-2 text-3xl font-black text-[#0A2C57]">{value}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {[
              {
                title: "Pametna prijava",
                text: "Prijava in registracija se odpirata v pojavnem oknu brez zapuščanja začetne strani.",
                icon: ShieldCheck,
              },
              {
                title: "Šolske ekipe",
                text: "Vsaka ekipa pripada svoji šoli, člane pa dodajaš iz potrjenih uporabnikov iste šole.",
                icon: Users2,
              },
              {
                title: "Pregled turnirjev",
                text: "Na prvi strani vidiš šport, lokacijo, zasedenost in datum vsakega turnirja.",
                icon: Trophy,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-[30px] border border-white/50 bg-white/85 p-6 shadow-xl shadow-slate-200/40 backdrop-blur transition hover:-translate-y-1"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A2C57] text-white">
                    <Icon size={20} />
                  </div>
                  <h2 className="mt-5 text-2xl tracking-tight text-[#0A2C57]">{item.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-6 rounded-[34px] border border-white/60 bg-white px-6 py-6 shadow-2xl shadow-slate-200/60 md:px-8 md:py-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#2BAF3A]">
                Javni pregled
              </p>
              <h2 className="mt-3 text-4xl tracking-tight text-[#0A2C57]">Aktualni turnirji</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Filtriraj po športu, statusu ali lokaciji in nato odpri račun za prijavo ekip.
              </p>
            </div>
          </div>

          <form className="mt-6 grid gap-4 rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#f8fbfd_0%,#eff5fa_100%)] p-5 md:grid-cols-4">
            <input
              name="q"
              defaultValue={params.q}
              placeholder="Išči po nazivu ali lokaciji"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
            />
            <select
              name="sport"
              defaultValue={params.sport ?? ""}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
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
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
            >
              <option value="">Vsi statusi</option>
              <option value="odprt">Odprt</option>
              <option value="poln">Poln</option>
              <option value="zaključen">Zaključen</option>
            </select>
            <button className="rounded-2xl bg-[#0A2C57] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0A2C57]/20">
              Uporabi filtre
            </button>
          </form>

          <div className="mt-8 grid gap-5 xl:grid-cols-2">
            {data.tournaments.map((tournament) => (
              <article
                key={tournament.id}
                className="group overflow-hidden rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbfd_100%)] p-6 shadow-lg shadow-slate-100/80 transition hover:-translate-y-1 hover:border-[#2BAF3A]/40"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#2BAF3A]">
                      {tournament.sport}
                    </p>
                    <h3 className="mt-3 text-3xl tracking-tight text-[#0A2C57]">
                      {tournament.title}
                    </h3>
                  </div>
                  <span className="rounded-full bg-[#e8f8ea] px-3 py-1 text-xs font-semibold text-[#228f2f]">
                    {tournament.status}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-7 text-slate-600">{tournament.description}</p>

                <div className="mt-6 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-3">
                    <CalendarDays size={16} className="text-[#0A2C57]" />
                    <span>{formatDate(tournament.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-3">
                    <MapPin size={16} className="text-[#0A2C57]" />
                    <span>{tournament.location}</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-5 text-sm text-slate-500">
                  <span>Organizator: {tournament.organizer.fullName}</span>
                  <span>
                    {tournament.registrations.length}/{tournament.maxTeams} ekip
                  </span>
                </div>

                <div className="mt-6">
                  <Link
                    href="/?modal=login"
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#0A2C57] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0A2C57]/20"
                  >
                    Prijava za podrobnosti
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {activeModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(43,175,58,0.15),transparent_20%),rgba(2,12,27,0.72)] px-4 py-8 backdrop-blur-md">
            <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[34px] border border-white/20 bg-[linear-gradient(180deg,#ffffff_0%,#f6f9fc_100%)] p-8 shadow-2xl shadow-black/30 md:p-10">
              <Link
                href="/"
                className="absolute right-5 top-5 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 hover:text-[#0A2C57]"
              >
                Zapri
              </Link>

              <div className="grid gap-8 md:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-[28px] bg-[#0A2C57] p-6 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#8EF29A]">
                    ŠZSŠ portal
                  </p>
                  <h2 className="mt-4 text-4xl leading-tight tracking-tight">
                    {activeModal === "login" ? "Prijava v sistem" : "Registracija novega računa"}
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-white/75">
                    {activeModal === "login"
                      ? "Vstopi v sistem za upravljanje ekip, prijave na turnirje in pregled dogajanja tvoje šole."
                      : "Izberi svojo srednjo šolo, naloži kartico in po admin odobritvi dostopaj do ekip in turnirjev."}
                  </p>
                  <div className="mt-8 space-y-3">
                    {[
                      "Javni pregled turnirjev",
                      "Registracija po dejanski srednji šoli",
                      "Ekipe in člani na enem mestu",
                    ].map((item) => (
                      <div key={item} className="rounded-2xl bg-white/8 px-4 py-3 text-sm text-white/80">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  {activeModal === "login" ? (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#2BAF3A]">
                        Prijava
                      </p>
                      <h3 className="mt-3 text-3xl tracking-tight text-[#0A2C57]">Vstop v sistem</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        Prijavi se s svojim računom. Če je registracija še v čakanju, te admin
                        najprej odobri.
                      </p>

                      {params.registered ? (
                        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                          Registracija je oddana. Po admin odobritvi se lahko prijaviš.
                        </div>
                      ) : null}

                      {params.error ? (
                        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                          {params.error}
                        </div>
                      ) : null}

                      <form action={loginAction} className="mt-8 space-y-4">
                        <input type="hidden" name="redirectTo" value="/" />
                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-700">E-pošta</span>
                          <input
                            name="email"
                            type="email"
                            required
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                            placeholder="ime@sola.si"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-700">Geslo</span>
                          <input
                            name="password"
                            type="password"
                            required
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                            placeholder="Vnesi geslo"
                          />
                        </label>
                        <button className="w-full rounded-2xl bg-[#0A2C57] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0A2C57]/20">
                          Prijava
                        </button>
                      </form>

                      <p className="mt-6 text-sm text-slate-600">
                        Nimaš računa?{" "}
                        <Link href="/?modal=register" className="font-semibold text-[#2BAF3A]">
                          Registriraj se tukaj
                        </Link>
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#2BAF3A]">
                        Registracija
                      </p>
                      <h3 className="mt-3 text-3xl tracking-tight text-[#0A2C57]">Ustvari račun</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        Izberi svojo srednjo šolo, naloži šolsko kartico in počakaj na admin
                        odobritev.
                      </p>

                      {params.error ? (
                        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                          {params.error}
                        </div>
                      ) : null}

                      <form action={registerAction} className="mt-8 grid gap-4">
                        <input type="hidden" name="redirectTo" value="/" />
                        <input
                          name="fullName"
                          required
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                          placeholder="Ime in priimek"
                        />
                        <input
                          name="email"
                          type="email"
                          required
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                          placeholder="E-pošta"
                        />
                        <input
                          name="password"
                          type="password"
                          required
                          minLength={6}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                          placeholder="Geslo"
                        />
                        <select
                          name="schoolName"
                          required
                          defaultValue=""
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                        >
                          <option value="" disabled>
                            Izberi svojo šolo
                          </option>
                          {SCHOOL_OPTIONS.map((school) => (
                            <option key={school} value={school}>
                              {school}
                            </option>
                          ))}
                        </select>
                        <select
                          name="role"
                          defaultValue="PARTICIPANT"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                        >
                          <option value="PARTICIPANT">Dijak / udeleženec</option>
                          <option value="ORGANIZER">Učitelj / organizator</option>
                        </select>
                        <input
                          name="schoolCard"
                          type="file"
                          accept="image/*"
                          required
                          className="w-full rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm"
                        />
                        <button className="mt-2 rounded-2xl bg-[#2BAF3A] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#2BAF3A]/25">
                          Oddaj registracijo
                        </button>
                      </form>

                      <p className="mt-6 text-sm text-slate-600">
                        Že imaš račun?{" "}
                        <Link href="/?modal=login" className="font-semibold text-[#0A2C57]">
                          Nazaj na prijavo
                        </Link>
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
