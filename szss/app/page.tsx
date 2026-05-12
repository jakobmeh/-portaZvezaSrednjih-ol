import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Trophy, Users, BarChart3, Zap, Star, Shield, ArrowRight, ChevronRight } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>

      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl" style={{ borderBottom: "1px solid var(--border)", background: "rgba(6,8,15,0.88)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Link href="/">
            <Image
              src="/szss-logo-transparent.png"
              alt="ŠZSŠ"
              width={100}
              height={40}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/leaderboard" className="hidden text-sm font-semibold sm:block" style={{ color: "var(--text-secondary)" }}>
              Lestvice
            </Link>
            <Link href="/tournaments" className="ml-4 hidden text-sm font-semibold sm:block" style={{ color: "var(--text-secondary)" }}>
              Turnirji
            </Link>
            <Link href="/login" className="btn-ghost ml-4 py-2 px-4 text-sm">
              Prijava
            </Link>
            <Link href="/register" className="btn-primary py-2 px-4 text-sm">
              Registracija
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-5 pb-24 pt-16 text-center">
        {/* Glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[500px] w-[800px] rounded-full opacity-[0.06]" style={{ background: "radial-gradient(ellipse, #2baf3a 0%, transparent 70%)" }} />
        </div>

        <div className="relative mx-auto max-w-4xl">
          {/* Logo large */}
          <div className="mb-8 flex justify-center">
            <div className="rounded-2xl p-5" style={{ background: "rgba(43,175,58,0.08)", border: "1px solid rgba(43,175,58,0.2)" }}>
              <Image
                src="/szss-logo-transparent.png"
                alt="ŠZSŠ"
                width={200}
                height={80}
                className="h-16 w-auto object-contain"
                priority
              />
            </div>
          </div>

          <div className="badge badge-green mb-5 mx-auto">
            <Trophy size={10} />
            Uradna platforma ŠZSŠ
          </div>

          <h1 className="text-5xl font-black leading-[1.05] tracking-tight md:text-7xl" style={{ fontFamily: "var(--font-heading)" }}>
            Tekmuj.{" "}
            <span className="gradient-text">Zmaguji.</span>
            <br />
            Pusti sled.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Platforma za organizacijo in prijavo na šolska športna tekmovanja.
            Ustvarjaj turnirje, oblikuj ekipe in tekmuj z dijaki iz celotne Slovenije.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register" className="btn-primary px-8 py-3 text-base">
              Začni brezplačno
              <ArrowRight size={16} />
            </Link>
            <Link href="/tournaments" className="btn-ghost px-8 py-3 text-base">
              Poglej turnirje
            </Link>
          </div>

          <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
            Brezplačna registracija · Ni kreditne kartice · Takoj na voljo
          </p>
        </div>
      </section>

      {/* Stats strip */}
      <div style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}>
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-px px-5 py-8 md:grid-cols-4">
          {[
            { value: "180+", label: "Šol v sistemu" },
            { value: "9", label: "Športov" },
            { value: "∞", label: "Ekip" },
            { value: "Live", label: "Rezultati v živo" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-black gradient-text" style={{ fontFamily: "var(--font-heading)" }}>{stat.value}</div>
              <div className="mt-1 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-black md:text-4xl" style={{ fontFamily: "var(--font-heading)" }}>
            Vse kar potrebuješ
          </h2>
          <p className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>
            Od prijave do zmagoslavja – vse na enem mestu.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Trophy, title: "Turnirji", desc: "Skupinski del, izločilni boji ali kombinirani format. Samoregistracija z unikatno QR povezavo.", color: "#2baf3a" },
            { icon: Users, title: "Ekipe", desc: "Ustvari ekipo, dodaj sošolce in se prijavite skupaj na turnirje.", color: "#0a2c57", border: "rgba(10,44,87,0.8)" },
            { icon: BarChart3, title: "Lestvice", desc: "Globalne lestvice po ekipah in šolah. Vedno veš kje stojite.", color: "#f59e0b" },
            { icon: Zap, title: "Rezultati v živo", desc: "Sproti objavljeni rezultati in obvestila v realnem času.", color: "#ef4444" },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="card">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${f.color}20` }}>
                  <Icon size={18} style={{ color: f.color === "#0a2c57" ? "#4a90d9" : f.color }} />
                </div>
                <h3 className="font-black" style={{ fontFamily: "var(--font-heading)" }}>{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-5 py-24" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-black md:text-4xl" style={{ fontFamily: "var(--font-heading)" }}>
              Preprost cenik
            </h2>
            <p className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>
              Začni brezplačno. Nadgradi ko si pripravljen.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">

            {/* Free */}
            <div className="card flex flex-col">
              <div className="badge badge-gray mb-4 self-start">Brezplačno</div>
              <div className="text-4xl font-black" style={{ fontFamily: "var(--font-heading)" }}>0€</div>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>Za vedno brezplačno</p>
              <ul className="mt-6 space-y-3 text-sm flex-1" style={{ color: "var(--text-secondary)" }}>
                {["Prijava na turnirje", "Ogled lestvic in rezultatov", "Ustvarjanje ekip", "Šolski profil"].map(item => (
                  <li key={item} className="flex items-center gap-2"><span style={{ color: "#6ee77a" }}>✓</span> {item}</li>
                ))}
                <li className="flex items-center gap-2 opacity-30"><span>✗</span> Organizacija turnirjev</li>
              </ul>
              <Link href="/register" className="btn-ghost mt-8 w-full py-3 text-center">Začni brezplačno</Link>
            </div>

            {/* Pro */}
            <div className="relative flex flex-col rounded-[18px] p-5" style={{ background: "linear-gradient(135deg, rgba(43,175,58,0.18) 0%, rgba(43,175,58,0.06) 100%)", border: "1px solid rgba(43,175,58,0.4)" }}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="badge badge-green px-3 py-1">Priporočeno</span>
              </div>
              <div className="badge badge-pro mb-4 self-start"><Star size={9} />Pro</div>
              <div className="text-4xl font-black gradient-text" style={{ fontFamily: "var(--font-heading)" }}>5€</div>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>na mesec</p>
              <ul className="mt-6 space-y-3 text-sm flex-1" style={{ color: "var(--text-secondary)" }}>
                {["Vse iz brezplačnega", "Ustvarjanje turnirjev", "Samoregistracija QR", "Upravljanje tekem", "Obvestila sledilcem", "Napredna statistika"].map(item => (
                  <li key={item} className="flex items-center gap-2"><span style={{ color: "#2baf3a" }}>✓</span> {item}</li>
                ))}
              </ul>
              <Link href="/register" className="btn-primary mt-8 w-full py-3 text-center">Kupi Pro <ChevronRight size={14} /></Link>
            </div>

            {/* School */}
            <div className="card flex flex-col" style={{ borderColor: "rgba(245,158,11,0.25)" }}>
              <div className="badge badge-pro mb-4 self-start"><Shield size={9} />Šolska licenca</div>
              <div className="text-4xl font-black gradient-text-gold" style={{ fontFamily: "var(--font-heading)" }}>500€</div>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>letno · neomejeno dijakov</p>
              <ul className="mt-6 space-y-3 text-sm flex-1" style={{ color: "var(--text-secondary)" }}>
                {["Pro za celotno šolo", "Neomejeno dijakov", "Centralno upravljanje", "Prioritetna podpora", "Brez mesečnih plačil"].map(item => (
                  <li key={item} className="flex items-center gap-2"><span style={{ color: "#fbbf24" }}>✓</span> {item}</li>
                ))}
              </ul>
              <Link href="/upgrade" className="btn-ghost mt-8 w-full py-3 text-center" style={{ borderColor: "rgba(245,158,11,0.3)", color: "#fbbf24" }}>
                Kontaktiraj nas
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-24 text-center" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="mx-auto max-w-2xl">
          {/* Logo accent */}
          <div className="mb-6 flex justify-center">
            <Image src="/szss-logo-transparent.png" alt="ŠZSŠ" width={120} height={48} className="h-12 w-auto opacity-70" />
          </div>
          <h2 className="text-3xl font-black md:text-4xl" style={{ fontFamily: "var(--font-heading)" }}>
            Pripravljen na<br /><span className="gradient-text">prvo tekmo?</span>
          </h2>
          <p className="mt-4 text-sm" style={{ color: "var(--text-secondary)" }}>
            Registracija traja manj kot 2 minuti. Administrator potrdi tvoj račun in kmalu začneš tekmovati.
          </p>
          <Link href="/register" className="btn-primary mt-8 inline-flex px-10 py-3 text-base">
            Registriraj se zdaj <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-5 py-8 text-center text-xs" style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>
        <div className="flex justify-center mb-3">
          <Image src="/szss-logo-transparent.png" alt="ŠZSŠ" width={80} height={32} className="h-8 w-auto opacity-30" />
        </div>
        © 2025 Športna zveza srednjih šol · Vse pravice pridržane
      </footer>
    </div>
  );
}
