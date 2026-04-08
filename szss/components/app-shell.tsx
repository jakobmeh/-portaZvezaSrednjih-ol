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
  role: "ADMIN" | "ORGANIZER" | "PARTICIPANT";
  schoolName: string;
};

const navItems = [
  { href: "/dashboard", label: "Nadzorna plošča", icon: LayoutDashboard },
  { href: "/school", label: "Moja šola", icon: Building2 },
  { href: "/tournaments", label: "Turnirji", icon: Trophy },
  { href: "/teams", label: "Ekipe", icon: Users },
];

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(43,175,58,0.14),_transparent_32%),linear-gradient(180deg,#f7fbff_0%,#eef3f9_100%)]">
      <div className="mx-auto grid min-h-screen max-w-[1500px] gap-6 px-4 py-4 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-[28px] bg-[#0A2C57] p-6 text-white shadow-2xl shadow-[#0A2C57]/20">
          <Logo />
          <div className="mt-10 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activePath === item.href || activePath.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                    active
                      ? "bg-white text-[#0A2C57]"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
            {user.role === "ADMIN" ? (
              <Link
                href="/admin"
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                  activePath.startsWith("/admin")
                    ? "bg-white text-[#0A2C57]"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <ShieldCheck size={18} />
                Admin panel
              </Link>
            ) : null}
          </div>

          <div className="mt-10 rounded-[24px] border border-white/10 bg-white/8 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Profil</p>
            <p className="mt-3 text-lg font-semibold">{user.fullName}</p>
            <p className="text-sm text-white/70">{getRoleLabel(user.role)}</p>
            <p className="mt-1 text-sm text-white/70">{user.schoolName}</p>
            <form action={logoutAction} className="mt-5">
              <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2BAF3A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#249933]">
                <LogOut size={16} />
                Odjava
              </button>
            </form>
          </div>

          <div className="mt-6 rounded-[24px] bg-[linear-gradient(135deg,rgba(43,175,58,0.22),rgba(255,255,255,0.04))] p-4">
            <div className="flex items-start gap-3">
              <Bell size={18} className="mt-1 text-[#8EF29A]" />
              <div>
                <p className="text-sm font-semibold">Obvestila in statusi</p>
                <p className="mt-1 text-sm text-white/70">
                  Spremljaj prijave ekip, sošolce iz svoje šole in admin odobritve brez
                  razpršenih sporočil.
                </p>
              </div>
            </div>
          </div>
        </aside>

        <main className="rounded-[30px] bg-white/80 p-4 shadow-xl shadow-slate-200/60 backdrop-blur md:p-8">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#2BAF3A]">
                ŠZSŠ portal
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-[#0A2C57] md:text-4xl">
                {title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
            </div>
            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
          </div>

          <div className="py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
