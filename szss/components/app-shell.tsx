import Link from "next/link";
import {
  Bell,
  Building2,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import { Logo } from "./logo";
import { logoutAction } from "@/lib/actions";
import { getRoleLabel } from "@/lib/utils";

type ShellUser = {
  fullName: string;
  role: "ADMIN" | "PARTICIPANT";
  schoolName: string;
};

const navItems = [
  { href: "/dashboard", label: "Nadzorna plošča", icon: LayoutDashboard },
  { href: "/school", label: "Moja šola", icon: Building2 },
  { href: "/tournaments", label: "Turnirji", icon: Trophy },
  { href: "/teams", label: "Ekipe", icon: Users },
];

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const init = parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : parts[0].slice(0, 2);
  return <>{init.toUpperCase()}</>;
}

export function AppShell({
  user,
  activePath,
  title,
  description,
  children,
  actions,
}: {
  user: ShellUser;
  activePath: string;
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      <div className="mx-auto grid min-h-screen max-w-[1600px] gap-4 p-4 lg:grid-cols-[260px_1fr]">

        {/* ── Sidebar ── */}
        <aside className="flex flex-col gap-3 rounded-[28px] bg-[#0A2C57] p-4 text-white shadow-2xl shadow-[#0A2C57]/20 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:self-start">

          {/* Logo */}
          <div className="rounded-[20px] bg-white/[0.07] p-3.5">
            <Logo />
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-0.5 pt-1">
            <p className="mb-1.5 px-3 text-[10px] font-black uppercase tracking-[0.35em] text-white/25">
              Menu
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activePath === item.href || activePath.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-[14px] px-3.5 py-2.5 text-sm font-semibold transition-all ${
                    active
                      ? "bg-white text-[#0A2C57] shadow-md"
                      : "text-white/60 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon size={16} className={active ? "text-[#2BAF3A]" : "opacity-70"} />
                  {item.label}
                </Link>
              );
            })}
            {user.role === "ADMIN" && (
              <Link
                href="/admin"
                className={`flex items-center gap-3 rounded-[14px] px-3.5 py-2.5 text-sm font-semibold transition-all ${
                  activePath.startsWith("/admin")
                    ? "bg-white text-[#0A2C57] shadow-md"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                <ShieldCheck size={16} className={activePath.startsWith("/admin") ? "text-[#2BAF3A]" : "opacity-70"} />
                Admin panel
              </Link>
            )}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Notifications hint */}
          <div className="rounded-[18px] bg-[linear-gradient(135deg,rgba(43,175,58,0.28),rgba(43,175,58,0.06))] p-3.5 ring-1 ring-[#2BAF3A]/20">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 rounded-lg bg-[#2BAF3A]/25 p-1.5">
                <Bell size={13} className="text-[#8EF29A]" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Obvestila</p>
                <p className="mt-0.5 text-[11px] leading-4 text-white/50">
                  Prijave, odobritve in novosti iz tvoje šole.
                </p>
              </div>
            </div>
          </div>

          {/* Profile */}
          <div className="rounded-[18px] bg-white/[0.07] p-3.5 ring-1 ring-white/[0.07]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2BAF3A] text-xs font-black text-white">
                <Initials name={user.fullName} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold leading-tight">{user.fullName}</p>
                <p className="mt-0.5 truncate text-[11px] text-white/45">{user.schoolName}</p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <span className="rounded-full bg-[#2BAF3A]/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#8EF29A]">
                {getRoleLabel(user.role)}
              </span>
            </div>
            <form action={logoutAction} className="mt-3">
              <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/8 px-3 py-2 text-xs font-bold text-white/60 transition hover:bg-rose-500/20 hover:text-rose-300">
                <LogOut size={13} />
                Odjava
              </button>
            </form>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="flex min-h-[calc(100vh-2rem)] flex-col rounded-[28px] bg-white shadow-lg shadow-slate-200/60">
          {/* Page header */}
          <div className="flex flex-col gap-4 border-b border-slate-100 px-7 py-6 md:flex-row md:items-center md:justify-between md:px-10">
            <div>
              <span className="inline-flex items-center rounded-full bg-[#2BAF3A]/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.25em] text-[#2BAF3A]">
                ŠZSŠ portal
              </span>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0A2C57] md:text-4xl">
                {title}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>
            </div>
            {actions && (
              <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
                {actions}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 px-7 py-7 md:px-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
