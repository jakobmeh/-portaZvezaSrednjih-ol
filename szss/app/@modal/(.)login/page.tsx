import Image from "next/image";
import Link from "next/link";
import { loginAction } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth";
import { ModalBackdrop, ModalClose } from "@/components/modal-close";

export default async function LoginModal({
  searchParams,
}: {
  searchParams: Promise<{ loginError?: string; registered?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) return null;

  const params = await searchParams;
  const error = params.loginError;
  const registered = params.registered;

  return (
    <>
      <ModalBackdrop />

      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-strong)",
            borderRadius: "24px",
            padding: "2rem",
            position: "relative",
            pointerEvents: "auto",
            boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
          }}
        >
          <ModalClose />

          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <Link href="/">
              <Image
                src="/szss-logo-transparent.png"
                alt="ŠZSŠ"
                width={120}
                height={48}
                className="h-10 w-auto object-contain"
                priority
              />
            </Link>
          </div>

          <h2 className="text-2xl font-black mb-1" style={{ fontFamily: "var(--font-heading)" }}>
            Prijava
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Vstopi v svojo šolsko tekmovalno platformo.
          </p>

          {registered && (
            <div className="mb-4 rounded-xl p-3 text-sm" style={{ background: "rgba(43,175,58,0.1)", border: "1px solid rgba(43,175,58,0.25)", color: "#6ee77a" }}>
              Registracija uspešna! Administrator bo potrdil tvoj račun.
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl p-3 text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
              {error}
            </div>
          )}

          <form action={loginAction} className="space-y-4">
            <div>
              <label className="label-text">E-pošta</label>
              <input type="email" name="email" className="field" placeholder="ime@sola.si" required autoComplete="email" />
            </div>
            <div>
              <label className="label-text">Geslo</label>
              <input type="password" name="password" className="field" placeholder="••••••••" required autoComplete="current-password" />
            </div>
            <button type="submit" className="btn-primary w-full py-3">
              Prijava
            </button>
          </form>

          <p className="mt-5 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Nimaš računa?{" "}
            <Link href="/register" className="font-semibold" style={{ color: "#6ee77a" }}>
              Registracija
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
