import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ loginError?: string; registered?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const params = await searchParams;
  const error = params.loginError;
  const registered = params.registered;

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12" style={{ background: "var(--bg-base)" }}>
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="h-[400px] w-[600px] rounded-full opacity-[0.05]" style={{ background: "radial-gradient(ellipse, #2baf3a 0%, transparent 70%)" }} />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
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
          <h1 className="text-2xl font-black" style={{ fontFamily: "var(--font-heading)" }}>Prijava</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>Vstopi v svojo šolsko tekmovalno platformo.</p>

          {registered && (
            <div className="mt-4 rounded-xl p-3 text-sm" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "#4ade80" }}>
              Registracija uspešna! Administrator bo potrdil tvoj račun.
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl p-3 text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
              {error}
            </div>
          )}

          <form action={loginAction} className="mt-6 space-y-4">
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
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="btn-primary w-full py-3">
              Prijava
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          Nimaš računa?{" "}
          <Link href="/register" className="font-semibold" style={{ color: "#6ee77a" }}>
            Registracija
          </Link>
        </p>
      </div>
    </div>
  );
}
