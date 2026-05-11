import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { registerAction } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth";
import { SCHOOL_OPTIONS } from "@/lib/schools";
import { SchoolSelect } from "@/components/school-select";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ registerError?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const params = await searchParams;
  const error = params.registerError;

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12" style={{ background: "var(--bg-base)" }}>
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="h-[400px] w-[600px] rounded-full opacity-[0.05]" style={{ background: "radial-gradient(ellipse, #2baf3a 0%, transparent 70%)" }} />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Link href="/" className="rounded-2xl px-6 py-3 flex items-center justify-center" style={{ background: "rgba(43,175,58,0.08)", border: "1px solid rgba(43,175,58,0.2)" }}>
            <Image
              src="/szss-logo-transparent.png"
              alt="ŠZSŠ"
              width={140}
              height={56}
              className="h-12 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        <div className="card" style={{ padding: "2rem" }}>
          <h1 className="text-2xl font-black" style={{ fontFamily: "var(--font-heading)" }}>Registracija</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>Ustvari račun in začni tekmovati.</p>

          {error && (
            <div className="mt-4 rounded-xl p-3 text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
              {error}
            </div>
          )}

          <form action={registerAction} className="mt-6 space-y-4">
            <div>
              <label className="label-text">Ime in priimek</label>
              <input
                type="text"
                name="fullName"
                className="field"
                placeholder="Janez Novak"
                required
              />
            </div>
            <div>
              <label className="label-text">E-pošta</label>
              <input
                type="email"
                name="email"
                className="field"
                placeholder="ime@sola.si"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label-text">Geslo</label>
              <input
                type="password"
                name="password"
                className="field"
                placeholder="Najmanj 8 znakov"
                required
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="label-text">Šola</label>
              <SchoolSelect schools={SCHOOL_OPTIONS} />
            </div>
            <div>
              <label className="label-text">
                Šolska koda
                <span className="ml-1.5 normal-case font-normal" style={{ color: "var(--text-muted)" }}>(neobvezno)</span>
              </label>
              <input
                type="text"
                name="inviteCode"
                className="field"
                placeholder="npr. XKQM7R2P"
                maxLength={8}
                style={{ textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "monospace" }}
              />
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                Kodo dobi tvoja šola pri nakupu šolskega paketa → ti dobiš Pro dostop.
              </p>
            </div>
            <button type="submit" className="btn-primary w-full py-3">
              Ustvari račun
            </button>
          </form>

          <p className="mt-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
            Brez kode dobiš brezplačen račun. S kodo dobiš Pro.
          </p>
        </div>

        <p className="mt-5 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          Že imaš račun?{" "}
          <Link href="/login" className="font-semibold" style={{ color: "#6ee77a" }}>
            Prijava
          </Link>
        </p>
      </div>
    </div>
  );
}
