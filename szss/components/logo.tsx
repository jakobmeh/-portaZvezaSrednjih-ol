import Image from "next/image";
import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3">
      <div
        className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 ${
          compact ? "h-12 w-12" : "h-16 w-16"
        }`}
      >
        <Image
          src="/szss-logo.png"
          alt="ŠZSŠ logo"
          fill
          className="object-contain p-1.5"
          priority
        />
      </div>
      {!compact ? (
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#2BAF3A]">
            Športna zveza srednjih šol
          </p>
          <p className="text-xs text-slate-500">Šolski športni turnirji na enem mestu</p>
        </div>
      ) : null}
    </Link>
  );
}
