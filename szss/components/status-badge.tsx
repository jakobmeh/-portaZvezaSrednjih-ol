import { getTournamentStatusTone } from "@/lib/utils";

export function StatusBadge({ label }: { label: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${getTournamentStatusTone(label)}`}>
      {label}
    </span>
  );
}
