import Link from "next/link";
import { Bell, Calendar, CheckCircle2, BarChart3, Trophy, Zap } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { isProUser } from "@/lib/utils";

const proFeatures = [
  {
    icon: Trophy,
    title: "Ustvari turnirje",
    description: "Objavi turnirje za katerikoli šport s popolnim urejanjem.",
  },
  {
    icon: Calendar,
    title: "Urnik tekem",
    description: "Razporedi tekme, vnesi rezultate in upravljaj skupine.",
  },
  {
    icon: BarChart3,
    title: "Živa lestvica",
    description: "Avtomatski izračun lestvice, javno dostopen brez prijave.",
  },
  {
    icon: Bell,
    title: "Obvestila udeležencev",
    description: "Ekipe prejmejo obvestila o začetku tekem in rezultatih.",
  },
  {
    icon: Zap,
    title: "Javna povezava",
    description: "Deli javno URL za lestvico z gledalci in organizatorji.",
  },
];

export default async function UpgradePage() {
  const user = await requireUser();
  const already = isProUser(user);

  return (
    <AppShell
      user={user}
      activePath="/upgrade"
      title="Pro načrt"
      description="Postani Pro organizator in objavljaj turnirje za svojo šolo."
    >
      <div className="mx-auto max-w-3xl">

        {already ? (
          <div className="rounded-[22px] bg-[#f0fdf4] border border-[#2BAF3A]/20 p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#2BAF3A]/15">
              <CheckCircle2 size={26} className="text-[#2BAF3A]" />
            </div>
            <h2 className="text-2xl font-black text-[#0A2C57]">Že imaš Pro dostop!</h2>
            <p className="mt-2 text-slate-600">Ustvari turnir ali upravljaj obstoječe.</p>
            <Link
              href="/tournaments/create"
              className="mt-6 inline-block rounded-[14px] bg-[#2BAF3A] px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#2BAF3A]/25 transition hover:bg-[#249933]"
            >
              Ustvari turnir
            </Link>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Hero card */}
            <div className="rounded-[28px] bg-[#0A2C57] p-8 text-white">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-[#2BAF3A]/20 p-3">
                  <Zap size={24} className="text-[#8EF29A]" />
                </div>
                <div>
                  <span className="rounded-full bg-amber-400/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-amber-300">
                    Pro načrt
                  </span>
                  <h2 className="mt-3 text-3xl font-black">5€ / mesec</h2>
                  <p className="mt-2 text-white/65 max-w-md">
                    Organiziraj in vodì turnirje za svojo šolo. Vnašaj rezultate, deli živoažurno lestvico in obvešaj ekipe v realnem času.
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {proFeatures.map(({ icon: Icon, title, description }) => (
                  <div key={title} className="flex items-start gap-3 rounded-[16px] bg-white/8 p-4">
                    <div className="mt-0.5 rounded-lg bg-[#2BAF3A]/20 p-1.5 shrink-0">
                      <Icon size={14} className="text-[#8EF29A]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{title}</p>
                      <p className="mt-0.5 text-xs text-white/55 leading-4">{description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA – no payment provider yet */}
              <div className="mt-8 rounded-[18px] bg-white/10 p-5">
                <p className="text-sm font-bold text-white">Kako nadgraditi?</p>
                <p className="mt-2 text-xs leading-5 text-white/60">
                  Trenutno naročnina poteka ročno. Kontaktiraj administratorja portala ali nam pošlji sporočilo na{" "}
                  <span className="font-bold text-[#8EF29A]">szss@sportna-zveza.si</span>{" "}
                  in vam aktiviramo Pro dostop v 24 urah.
                </p>
                <a
                  href="mailto:szss@sportna-zveza.si?subject=Pro narocnina"
                  className="mt-4 inline-flex items-center gap-2 rounded-[12px] bg-[#2BAF3A] px-5 py-2.5 text-sm font-black text-white shadow-md shadow-[#2BAF3A]/30 transition hover:bg-[#249933]"
                >
                  <Zap size={14} />
                  Zahtevaj Pro dostop
                </a>
              </div>
            </div>

            {/* Free plan comparison */}
            <div className="rounded-[22px] border border-slate-200 bg-white p-6">
              <h3 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-400">
                Primerjava načrtov
              </h3>
              <div className="overflow-hidden rounded-[14px] border border-slate-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-4 py-3 text-left font-black text-[#0A2C57]">Funkcija</th>
                      <th className="px-4 py-3 text-center font-black text-slate-500">Brezplačno</th>
                      <th className="px-4 py-3 text-center font-black text-[#2BAF3A]">Pro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Ogled turnirjev", true, true],
                      ["Prijava ekipe na turnir", true, true],
                      ["Sledenje turnirjem", true, true],
                      ["Ogled javne lestvice", true, true],
                      ["Ustvarjanje turnirjev", false, true],
                      ["Vnos rezultatov", false, true],
                      ["Upravljanje urnika tekem", false, true],
                      ["Obvestila ekipam", false, true],
                    ].map(([feature, free, pro]) => (
                      <tr key={String(feature)} className="border-b border-slate-50 last:border-0">
                        <td className="px-4 py-3 text-slate-700">{feature}</td>
                        <td className="px-4 py-3 text-center">
                          {free ? (
                            <CheckCircle2 size={16} className="mx-auto text-slate-400" />
                          ) : (
                            <span className="text-slate-300">–</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {pro ? (
                            <CheckCircle2 size={16} className="mx-auto text-[#2BAF3A]" />
                          ) : (
                            <span className="text-slate-300">–</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
