import Image from "next/image";
import Link from "next/link";
import {
  Bell, Building2, LayoutDashboard, LogOut,
  ShieldCheck, Trophy, Users, Zap, BarChart3, Star,
} from "lucide-react";
import { logoutAction } from "@/lib/actions";
import { isProUser } from "@/lib/utils";

type ShellUser = {
  fullName: string;
  role: "ADMIN" | "PARTICIPANT";
  schoolName: string;
  isPro: boolean;
  proUntil: Date | null;
};

const navItems = [
  { href: "/dashboard", label: "Nadzorna plošča", icon: LayoutDashboard },
  { href: "/tournaments", label: "Turnirji", icon: Trophy },
  { href: "/leaderboard", label: "Lestvice", icon: BarChart3 },
  { href: "/teams", label: "Ekipe", icon: Users },
  { href: "/school", label: "Moja šola", icon: Building2 },
];

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const init = parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2);
  return <>{init.toUpperCase()}</>;
}

export function AppShell({
  user, activePath, title, description, children, actions,
}: {
  user: ShellUser;
  activePath: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const pro = isProUser(user);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>

      {/* ── Top Nav ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 h-14"
        style={{ background: "rgba(6,8,15,0.92)", borderBottom: "1px solid var(--border)", backdropFilter: "blur(20px)" }}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center gap-2 px-5">

          {/* Logo */}
          <Link href="/" className="mr-4 shrink-0">
            <Image
              src="/szss-logo-transparent.png"
              alt="ŠZSŠ"
              width={72}
              height={28}
              className="h-7 w-auto object-contain"
              priority
            />
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-0.5 flex-1">
            {navItems.map((item) => {
              const active = activePath === item.href || activePath.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all"
                  style={active
                    ? { background: "rgba(43,175,58,0.12)", color: "#6ee77a" }
                    : { color: "var(--text-muted)" }
                  }
                >
                  {item.label}
                </Link>
              );
            })}
            {user.role === "ADMIN" && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ml-1"
                style={activePath.startsWith("/admin")
                  ? { background: "rgba(239,68,68,0.12)", color: "#f87171" }
                  : { color: "var(--text-muted)" }
                }
              >
                <ShieldCheck size={13} />
                Admin
              </Link>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">

            {/* Upgrade pill for non-pro */}
            {!pro && (
              <Link
                href="/upgrade"
                className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold sm:flex"
                style={{ background: "rgba(43,175,58,0.12)", color: "#6ee77a", border: "1px solid rgba(43,175,58,0.25)" }}
              >
                <Zap size={11} />
                Pro – 5€
              </Link>
            )}
            {pro && user.role !== "ADMIN" && (
              <span
                className="hidden items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold sm:flex"
                style={{ background: "rgba(245,158,11,0.12)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.2)" }}
              >
                <Star size={10} />
                Pro
              </span>
            )}

            {/* Notifications */}
            <Link
              href="/notifications"
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-all"
              style={{
                background: activePath === "/notifications" ? "rgba(43,175,58,0.12)" : "rgba(255,255,255,0.05)",
                color: activePath === "/notifications" ? "#6ee77a" : "var(--text-muted)",
              }}
            >
              <Bell size={15} />
            </Link>

            {/* User menu */}
            <div className="flex items-center gap-2 rounded-lg pl-2 pr-3 py-1.5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}>
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white"
                style={{ background: "linear-gradient(135deg, #2baf3a, #0a2c57)" }}
              >
                <Initials name={user.fullName} />
              </div>
              <span className="hidden text-sm font-medium sm:block" style={{ color: "var(--text-secondary)" }}>
                {user.fullName.split(" ")[0]}
              </span>
              <form action={logoutAction}>
                <button
                  className="flex items-center gap-1 text-xs transition-all"
                  style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
                  title="Odjava"
                >
                  <LogOut size={13} />
                </button>
              </form>
            </div>

          </div>
        </div>
      </header>

      {/* ── Page ── */}
      <div className="pt-14">
        <div className="mx-auto max-w-7xl px-5 py-8">

          {/* Page header */}
          {(title || actions) && (
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black tracking-tight md:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
                  {title}
                </h1>
                {description && (
                  <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{description}</p>
                )}
              </div>
              {actions && (
                <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
              )}
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}
