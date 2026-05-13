import { redirect } from "next/navigation";
import Link from "next/link";
import { Check, Trophy, Shield } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CopyButton } from "@/components/copy-button";
import { requireUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export default async function UpgradeSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const user = await requireUser();
  const { session_id } = await searchParams;

  if (!session_id) redirect("/upgrade");

  // Preveri Stripe session
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(session_id);
  } catch {
    redirect("/upgrade?payment=cancelled");
  }

  if (session.payment_status !== "paid") {
    redirect("/upgrade?payment=cancelled");
  }

  const { type, userId, schoolName, plan, months } = session.metadata ?? {};

  // Preveri da je session za tega userja
  if (userId !== user.id) redirect("/dashboard");

  let inviteCode: string | null = null;
  let activationType: "pro" | "school" = "pro";

  if (type === "pro_monthly") {
    // Aktiviraj Pro (fallback če webhook ni delal)
    const proUntil = new Date();
    proUntil.setMonth(proUntil.getMonth() + Number(months ?? 1));
    await prisma.user.update({
      where: { id: user.id },
      data: { isPro: true, proUntil },
    });
    activationType = "pro";
  }

  if (type === "school" && schoolName) {
    activationType = "school";
    // Preveri ali licenca že obstaja (webhook jo je morda že ustvaril)
    let license = await (prisma.schoolLicense as any).findUnique({
      where: { schoolName },
    });

    if (!license) {
      // Webhook še ni delal - aktiviraj sami
      const proUntil = new Date();
      proUntil.setMonth(proUntil.getMonth() + 1);
      const token = Array.from({ length: 8 }, () =>
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]
      ).join("");

      license = await (prisma.schoolLicense as any).create({
        data: { schoolName, plan: "UNLIMITED", inviteToken: token, expiresAt: proUntil },
      });
    }

    inviteCode = license.inviteToken;
  }

  return (
    <AppShell
      user={user}
      activePath="/upgrade"
      title="Plačilo uspešno!"
    >
      <div className="max-w-lg mx-auto">

        {/* Uspeh */}
        <div
          className="rounded-2xl p-8 text-center mb-6"
          style={{ background: "linear-gradient(135deg, rgba(43,175,58,0.15) 0%, rgba(43,175,58,0.05) 100%)", border: "1px solid rgba(43,175,58,0.35)" }}
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "rgba(43,175,58,0.2)" }}>
            <Check size={28} style={{ color: "#6ee77a" }} />
          </div>
          <h2 className="text-2xl font-black mb-2" style={{ fontFamily: "var(--font-heading)" }}>
            {activationType === "school" ? "Šolska licenca aktivirana!" : "Pro aktiviran!"}
          </h2>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {activationType === "school"
              ? `Šola ${schoolName} ima zdaj Pro dostop za 1 mesec.`
              : "Imaš Pro dostop za 1 mesec."}
          </p>
        </div>

        {/* Invite koda za šolo */}
        {activationType === "school" && inviteCode && (
          <div className="rounded-2xl p-6 mb-6" style={{ background: "var(--bg-surface)", border: "1px solid rgba(245,158,11,0.35)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Shield size={16} style={{ color: "#fbbf24" }} />
              <h3 className="font-black" style={{ color: "#fbbf24" }}>Invite koda za dijake</h3>
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
              Pošlji to kodo vsem dijakom šole. Ko se registrirajo in vnesejo kodo, samodejno dobijo Pro dostop.
            </p>

            {/* Koda */}
            <div
              className="flex items-center justify-between rounded-2xl px-6 py-5 mb-4"
              style={{ background: "var(--bg-card)", border: "1px solid rgba(245,158,11,0.4)" }}
            >
              <span
                className="text-4xl font-black tracking-[0.2em]"
                style={{ fontFamily: "monospace", color: "#fbbf24", letterSpacing: "0.25em" }}
              >
                {inviteCode}
              </span>
              <CopyButton code={inviteCode} />
            </div>

            <div className="rounded-xl p-3 text-xs space-y-1" style={{ background: "rgba(245,158,11,0.06)", color: "var(--text-muted)" }}>
              <p>📋 Kodo najdeš tudi v <strong style={{ color: "var(--text-secondary)" }}>Admin panelu</strong> pod "Šolske licence"</p>
              <p>📧 Pošlji jo dijakom po e-pošti ali jo objavi na oglasni deski</p>
              <p>⏰ Koda velja 1 mesec od danes</p>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="flex gap-3">
          <Link href="/dashboard" className="btn-primary flex-1 py-3 text-center">
            <Trophy size={14} />
            Na nadzorno ploščo
          </Link>
          {activationType === "pro" && (
            <Link href="/tournaments/create" className="btn-ghost flex-1 py-3 text-center">
              Ustvari turnir →
            </Link>
          )}
        </div>
      </div>
    </AppShell>
  );
}

