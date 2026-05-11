import { Bell, CheckCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { markNotificationsReadAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { getNotificationsForUser } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await getNotificationsForUser(user.id);

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <AppShell
      user={user}
      activePath="/notifications"
      title="Obvestila"
      description="Pregled vseh obvestil o turnirjih, tekmah in rezultatih."
      actions={
        unread > 0 ? (
          <form action={markNotificationsReadAction}>
            <button className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300">
              <CheckCheck size={14} />
              Označi vse kot prebrano
            </button>
          </form>
        ) : null
      }
    >
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <Bell size={24} className="text-slate-400" />
          </div>
          <p className="mt-4 text-base font-black text-[#0A2C57]">Ni obvestil</p>
          <p className="mt-1 text-sm text-slate-400">Obvestila bodo prikazana tukaj.</p>
        </div>
      ) : (
        <div className="mx-auto max-w-2xl space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`relative rounded-[18px] px-5 py-4 transition ${
                n.isRead
                  ? "bg-white border border-slate-100"
                  : "border border-[#2BAF3A]/20 bg-[#f0fdf4]"
              }`}
            >
              {!n.isRead && (
                <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-[#2BAF3A]" />
              )}
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 rounded-xl p-2 ${n.isRead ? "bg-slate-100" : "bg-[#2BAF3A]/12"}`}>
                  <Bell size={14} className={n.isRead ? "text-slate-400" : "text-[#2BAF3A]"} />
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-bold ${n.isRead ? "text-[#0A2C57]" : "text-[#0A2C57]"}`}>
                    {n.title}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500 leading-5">{n.content}</p>
                  <p className="mt-2 text-[11px] text-slate-400">{formatDate(n.createdAt)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
