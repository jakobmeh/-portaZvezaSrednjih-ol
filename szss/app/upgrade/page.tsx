import Link from "next/link";
import { Star, Shield, Check, Trophy, Zap, Calendar, CreditCard } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StripeCheckoutButton } from "@/components/stripe-checkout-button";
import { CancelSubscriptionButton } from "@/components/cancel-subscription-button";
import { requireUser } from "@/lib/auth";
import { getSchoolLicense } from "@/lib/data";

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const user = await requireUser();
  const pro = user.isPro;
  const params = await searchParams;
  const schoolLicense = await getSchoolLicense(user.schoolName);

  return (
    <AppShell
      user={user}
      activePath="/upgrade"
      title="Nadgradi račun"
      description="Organiziraj turnirje in pomagaj svoji šoli do zmage."
    >
      {params.payment === "success" && (
        <div className="mb-6 rounded-2xl px-5 py-4" style={{ background: "rgba(43,175,58,0.1)", border: "1px solid rgba(43,175,58,0.3)", color: "#6ee77a" }}>
          🎉 Plačilo uspešno! Tvoj dostop se aktivira v nekaj sekundah.
        </div>
      )}
      {params.payment === "cancelled" && (
        <div className="mb-6 rounded-2xl px-5 py-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
          Plačilo je bilo preklicano. Poskusi znova.
        </div>
      )}

      {pro ? (
        <div className="grid gap-5 max-w-4xl md:grid-cols-2">

          {/* Aktivna Pro naročnina */}
          <div className="flex flex-col rounded-2xl p-6" style={{ background: "linear-gradient(135deg, rgba(43,175,58,0.15) 0%, rgba(43,175,58,0.05) 100%)", border: "1px solid rgba(43,175,58,0.35)" }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: "rgba(43,175,58,0.2)" }}>
                <Star size={16} style={{ color: "#6ee77a" }} />
              </div>
              <div>
                <p className="font-black" style={{ fontFamily: "var(--font-heading)" }}>Pro naročnina</p>
                <p className="text-xs font-bold" style={{ color: "#6ee77a" }}>● Aktivna</p>
              </div>
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "var(--bg-card)" }}>
                <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  <CreditCard size={13} /> Znesek
                </div>
                <span className="font-bold text-sm">5€ / mesec</span>
              </div>
              {user.proUntil && (
                <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "var(--bg-card)" }}>
                  <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                    <Calendar size={13} />
                    {user.stripeSubscriptionId ? "Naslednji zaračun" : "Dostop do"}
                  </div>
                  <span className="font-bold text-sm">
                    {new Date(user.proUntil).toLocaleDateString("sl-SI", { day: "2-digit", month: "long", year: "numeric" })}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-5 space-y-2">
              <Link href="/tournaments/create" className="btn-primary w-full py-2.5 text-sm flex justify-center">
                <Trophy size={13} /> Ustvari turnir
              </Link>
              <CancelSubscriptionButton />
            </div>
          </div>

          {/* Šolska licenca – vedno vidna */}
          <div className="flex flex-col rounded-2xl p-6" style={{ background: "var(--bg-card)", border: `1px solid ${schoolLicense ? "rgba(43,175,58,0.35)" : "rgba(245,158,11,0.3)"}` }}>
            <div className="badge badge-pro mb-4 self-start"><Shield size={9} />Šolska licenca</div>

            {schoolLicense ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold" style={{ color: "#6ee77a" }}>● Aktivna za tvojo šolo</span>
                </div>
                <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                  Šola <strong>{user.schoolName}</strong> ima aktivno licenco.
                </p>
                <div className="rounded-xl px-4 py-3 mb-4" style={{ background: "var(--bg-surface)" }}>
                  <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Invite koda za dijake:</p>
                  <p className="text-2xl font-black tracking-widest" style={{ fontFamily: "monospace", color: "#6ee77a" }}>
                    {schoolLicense.inviteToken}
                  </p>
                </div>
                {schoolLicense.expiresAt && (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Velja do: {new Date(schoolLicense.expiresAt).toLocaleDateString("sl-SI")}
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="text-4xl font-black gradient-text-gold mb-1" style={{ fontFamily: "var(--font-heading)" }}>500€</div>
                <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>letno · cela šola · neomejeno dijakov</p>
                <ul className="space-y-2 flex-1 mb-5">
                  {["Pro za vse dijake šole", "Invite koda za dijake", "Novi dijaki dobijo Pro ob registraciji", "1 leto dostopa"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                      <Check size={12} style={{ color: "#fbbf24" }} /> {f}
                    </li>
                  ))}
                </ul>
                <StripeCheckoutButton
                  type="school"
                  schoolName={user.schoolName}
                  className="btn-primary w-full py-2.5 text-sm"
                  style={{ background: "#f59e0b" }}
                >
                  <Shield size={13} /> Kupi za šolo – 500€ / leto
                </StripeCheckoutButton>
                <p className="mt-2 text-xs text-center" style={{ color: "var(--text-muted)" }}>
                  Za: <strong style={{ color: "var(--text-secondary)" }}>{user.schoolName}</strong>
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-5 max-w-4xl md:grid-cols-2">

          {/* Individualni Pro */}
          <div className="relative flex flex-col rounded-2xl px-6 pb-6 pt-9" style={{ background: "linear-gradient(135deg, rgba(43,175,58,0.15) 0%, rgba(43,175,58,0.06) 100%)", border: "1px solid rgba(43,175,58,0.35)" }}>
            <div className="absolute -top-3 left-6">
              <span className="badge badge-green px-3 py-1">Za posameznike</span>
            </div>
            <div className="badge badge-pro mb-4 self-start"><Star size={9} />Pro</div>
            <div className="text-5xl font-black gradient-text" style={{ fontFamily: "var(--font-heading)" }}>5€</div>
            <p className="mt-1 text-sm mb-6" style={{ color: "var(--text-muted)" }}>na mesec · obnovljivo</p>
            <ul className="space-y-3 flex-1">
              {[
                "Ustvarjanje turnirjev",
                "Upravljanje tekem in rezultatov",
                "Samoregistracija z QR kodo",
                "Obvestila sledilcem v realnem času",
                "Napredna statistika",
                "Vse funkcije brezplačnega računa",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  <Check size={13} style={{ color: "#6ee77a" }} /> {f}
                </li>
              ))}
            </ul>
            <StripeCheckoutButton
              type="pro_monthly"
              className="btn-primary w-full py-3 text-base mt-6"
            >
              <Zap size={13} />
              Naroči se – 5€ / mesec
            </StripeCheckoutButton>
            <p className="mt-2 text-center text-xs" style={{ color: "var(--text-muted)" }}>
              Varno plačilo prek Stripe · Visa, Mastercard, Amex
            </p>
          </div>

          {/* Šolska licenca */}
          <div className="flex flex-col rounded-2xl p-6" style={{ background: "var(--bg-card)", border: `1px solid ${schoolLicense ? "rgba(43,175,58,0.35)" : "rgba(245,158,11,0.3)"}` }}>
            <div className="badge badge-pro mb-4 self-start"><Shield size={9} />Šolska licenca</div>

            {schoolLicense ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <Check size={14} style={{ color: "#6ee77a" }} />
                  <span className="font-bold text-sm" style={{ color: "#6ee77a" }}>Licenca aktivna za tvojo šolo</span>
                </div>
                <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                  <strong>{user.schoolName}</strong> ima aktiven šolski paket.
                </p>
                <div className="rounded-2xl px-5 py-4 mb-3" style={{ background: "var(--bg-surface)", border: "1px solid rgba(245,158,11,0.4)" }}>
                  <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>Invite koda za dijake:</p>
                  <p className="text-3xl font-black tracking-widest" style={{ fontFamily: "monospace", color: "#fbbf24" }}>
                    {schoolLicense.inviteToken}
                  </p>
                </div>
                {schoolLicense.expiresAt && (
                  <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
                    ⏰ Velja do: <strong style={{ color: "var(--text-secondary)" }}>{new Date(schoolLicense.expiresAt).toLocaleDateString("sl-SI")}</strong>
                  </p>
                )}
                <div className="rounded-xl p-3 text-xs mt-auto" style={{ background: "rgba(43,175,58,0.06)", color: "var(--text-muted)" }}>
                  Pošlji kodo dijakom – ob registraciji samodejno dobijo Pro dostop.
                </div>
              </>
            ) : (
              <>
                <div className="text-5xl font-black gradient-text-gold mb-1" style={{ fontFamily: "var(--font-heading)" }}>500€</div>
                <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>letno · cela šola · neomejeno dijakov</p>
                <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
                  Celotna šola dobi Pro dostop. Prejmeš invite kodo za dijake.
                </p>
                <ul className="space-y-2 flex-1 mb-5">
                  {["Pro za vse dijake šole", "Invite koda za šolo", "Novi dijaki dobijo Pro ob registraciji", "1 leto dostopa"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                      <Check size={12} style={{ color: "#fbbf24" }} /> {f}
                    </li>
                  ))}
                </ul>
                <StripeCheckoutButton
                  type="school"
                  schoolName={user.schoolName}
                  className="btn-primary w-full py-2.5 text-sm"
                  style={{ background: "#f59e0b" }}
                >
                  <Shield size={13} /> Kupi za šolo – 500€ / leto
                </StripeCheckoutButton>
                <p className="mt-2 text-xs text-center" style={{ color: "var(--text-muted)" }}>
                  Za: <strong style={{ color: "var(--text-secondary)" }}>{user.schoolName}</strong>
                </p>
              </>
            )}
          </div>

          {/* Brezplačno */}
          <div className="md:col-span-2 rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Brezplačen račun vključuje</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {["Prijava na turnirje", "Ogled lestvic", "Ustvarjanje ekip", "Šolski profil"].map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  <Check size={12} style={{ color: "#4ade80" }} /> {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
