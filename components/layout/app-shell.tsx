import {
  BarChart3,
  Bot,
  BrainCircuit,
  Cable,
  Inbox,
  LifeBuoy,
  Settings,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const navigation = [
  { href: "/inbox", label: "Диалоги", icon: Inbox },
  { href: "/knowledge", label: "База знаний", icon: BrainCircuit },
  { href: "/channels", label: "Каналы", icon: Cable },
  { href: "/analytics", label: "Аналитика", icon: BarChart3 },
  { href: "/settings", label: "Настройки", icon: Settings },
  { href: "/profile", label: "Профиль", icon: UserRound },
];

export function AppShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f6f3ee] text-neutral-950">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-black/10 bg-[#17130f] p-5 text-white lg:block">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-white text-sm font-black text-black">
            Е
          </span>
          <span className="text-xl font-black">Едино</span>
        </Link>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/7 p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-orange-400 text-black">
              <Bot size={20} />
            </span>
            <div>
              <p className="text-sm font-bold">AI-менеджер</p>
              <p className="text-xs text-white/55">Mock режим · обучение</p>
            </div>
          </div>
          <div className="mt-4 h-2 rounded-full bg-white/10">
            <div className="h-2 w-[64%] rounded-full bg-orange-400" />
          </div>
          <p className="mt-2 text-xs text-white/50">База знаний заполнена на 64%</p>
        </div>

        <nav className="mt-8 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-5 left-5 right-5 rounded-3xl border border-white/10 bg-white/7 p-4">
          <div className="flex items-center gap-3">
            <LifeBuoy size={18} className="text-orange-300" />
            <div>
              <p className="text-sm font-semibold">Нужна помощь?</p>
              <p className="text-xs text-white/55">Проверим сценарии вместе</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-black/10 bg-[#f6f3ee]/85 px-5 py-4 backdrop-blur-xl lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-600">
                Рабочий кабинет
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-tight">{title}</h1>
              <p className="mt-1 max-w-2xl text-sm text-neutral-600">{description}</p>
            </div>
            <Link
              href="/profile"
              className="hidden items-center gap-3 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold shadow-sm md:flex"
            >
              <span className="size-2 rounded-full bg-emerald-500" />
              Demo Owner
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
