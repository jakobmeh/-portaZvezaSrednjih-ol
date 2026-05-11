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
      description="Turnirji, tekme in rezultati."
      actions={
        unread > 0 ? (
          <form action={markNotificationsReadAction}>
            <button className="btn-ghost py-2 px-4 text-sm">
              <CheckCheck size={13} />
              Označi vse kot prebrano
            </button>
          </form>
        ) : null
      }
    >
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "var(--bg-card)" }}>
            <Bell size={20} style={{ color: "var(--text-muted)" }} />
          </div>
          <p className="mt-4 font-black" style={{ fontFamily: "var(--font-heading)" }}>Ni obvestil</p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>Obvestila bodo prikazana tukaj.</p>
        </div>
      ) : (
        <div className="mx-auto max-w-2xl space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="relative rounded-xl px-5 py-4"
              style={{
                background: n.isRead ? "var(--bg-card)" : "rgba(43,175,58,0.08)",
                border: `1px solid ${n.isRead ? "var(--border)" : "rgba(43,175,58,0.3)"}`,
              }}
            >
              {!n.isRead && (
                <span className="absolute right-4 top-4 h-2 w-2 rounded-full" style={{ background: "#2baf3a" }} />
              )}
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: n.isRead ? "var(--bg-surface)" : "rgba(43,175,58,0.2)" }}>
                  <Bell size={13} style={{ color: n.isRead ? "var(--text-muted)" : "#6ee77a" }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold">{n.title}</p>
                  <p className="mt-0.5 text-sm leading-5" style={{ color: "var(--text-secondary)" }}>{n.content}</p>
                  <p className="mt-2 text-[11px]" style={{ color: "var(--text-muted)" }}>{formatDate(n.createdAt)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
