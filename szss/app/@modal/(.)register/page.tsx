import Image from "next/image";
import Link from "next/link";
import { registerAction } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth";
import { SCHOOL_OPTIONS } from "@/lib/schools";
import { ModalBackdrop, ModalClose } from "@/components/modal-close";
import { SchoolSelect } from "@/components/school-select";

export default async function RegisterModal({
  searchParams,
}: {
  searchParams: Promise<{ registerError?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) return null;

  const params = await searchParams;
  const error = params.registerError;

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
          overflowY: "auto",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "440px",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-strong)",
            borderRadius: "24px",
            padding: "2rem",
            position: "relative",
            pointerEvents: "auto",
            boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
            margin: "auto",
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
            Registracija
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Ustvari račun in začni tekmovati.
          </p>

          {error && (
            <div className="mb-4 rounded-xl p-3 text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
              {error}
            </div>
          )}

          <form action={registerAction} className="space-y-4">
            <div>
              <label className="label-text">Ime in priimek</label>
              <input type="text" name="fullName" className="field" placeholder="Janez Novak" required />
            </div>
            <div>
              <label className="label-text">E-pošta</label>
              <input type="email" name="email" className="field" placeholder="ime@sola.si" required autoComplete="email" />
            </div>
            <div>
              <label className="label-text">Geslo</label>
              <input type="password" name="password" className="field" placeholder="Najmanj 6 znakov" required autoComplete="new-password" />
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

          <p className="mt-4 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Že imaš račun?{" "}
            <Link href="/login" className="font-semibold" style={{ color: "#6ee77a" }}>
              Prijava
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
