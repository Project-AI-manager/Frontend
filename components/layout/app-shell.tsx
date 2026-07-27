"use client";

import { BarChart3, BookOpen, Inbox, Menu, Radio, Settings, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { Brand } from "@/components/ui/brand";

type NavigationItem = {
  href: string;
  label: string;
  icon: typeof Inbox;
  separated?: boolean;
};

const navigation: NavigationItem[] = [
  { href: "/inbox", label: "Диалоги", icon: Inbox },
  { href: "/knowledge", label: "База знаний", icon: BookOpen },
  { href: "/channels", label: "Каналы", icon: Radio },
  { href: "/analytics", label: "Аналитика", icon: BarChart3 },
  { href: "/settings", label: "Настройки", icon: Settings, separated: true },
  { href: "/profile", label: "Профиль", icon: UserRound },
];

function Navigation({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1" aria-label="Основная навигация">
      {navigation.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <div key={item.href} className={item.separated ? "mt-auto border-t border-[#e5eaf1] pt-5" : ""}>
            <Link href={item.href} onClick={onNavigate} aria-current={isActive ? "page" : undefined} className={`relative flex min-h-10 items-center gap-2.5 rounded-[8px] px-3 text-[14px] transition-[background,color,padding] hover:bg-[#f4f7fb] hover:pl-[15px] hover:text-[#101828] ${isActive ? "bg-[#eaf1ff] font-semibold text-[#1546ad] hover:bg-[#eaf1ff]" : "font-medium text-[#526071]"}`}>
              {isActive ? <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-[#2463eb]" /> : null}
              <item.icon size={18} strokeWidth={1.75} aria-hidden="true" />
              <span>{item.label}</span>
              {item.href === "/inbox" ? <span className="ml-auto rounded-full bg-[#2463eb] px-[7px] py-0.5 text-[11px] font-extrabold tabular-nums text-white">12</span> : null}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}

export function AppShell({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-[#101828]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[212px] flex-col gap-5 border-r border-[#d9e1ec] bg-white px-3 py-5 lg:flex">
        <div className="min-h-10 px-2"><Brand compact /></div>
        <Navigation pathname={pathname} />
      </aside>

      {mobileOpen ? <button type="button" className="fixed inset-0 z-40 bg-[#101828]/30 backdrop-blur-[2px] lg:hidden" aria-label="Закрыть меню" onClick={() => setMobileOpen(false)} /> : null}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[min(82vw,280px)] flex-col gap-5 border-r border-[#d9e1ec] bg-white px-3 py-5 shadow-deep transition-transform lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`} aria-hidden={!mobileOpen}>
        <div className="flex min-h-10 items-center justify-between px-2"><Brand compact /><button type="button" className="flex size-10 items-center justify-center rounded-[8px] hover:bg-[#f4f7fb]" onClick={() => setMobileOpen(false)} aria-label="Закрыть меню"><X size={19} /></button></div>
        <Navigation pathname={pathname} onNavigate={() => setMobileOpen(false)} />
      </aside>

      <div className="lg:pl-[212px]">
        <header className="sticky top-0 z-30 border-b border-[#d9e1ec] bg-white/90 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1180px] items-center gap-3">
            <button type="button" className="flex size-10 shrink-0 items-center justify-center rounded-[8px] border border-[#d9e1ec] bg-white lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Открыть меню" aria-expanded={mobileOpen}><Menu size={19} /></button>
            <div className="min-w-0">
              <h1 className="truncate font-heading text-[22px] font-extrabold tracking-[-0.04em]">{title}</h1>
              <p className="mt-0.5 hidden truncate text-[13px] text-[#526071] sm:block">{description}</p>
            </div>
            <Link href="/profile" className="ml-auto hidden items-center gap-2 rounded-full bg-[#eaf1ff] px-3 py-2 text-[13px] font-semibold text-[#1546ad] sm:flex"><span className="size-2 rounded-full bg-[#13a66b]" />Demo Owner</Link>
          </div>
        </header>
        <main className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
