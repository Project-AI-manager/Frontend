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
    <div className="soft-grid min-h-screen bg-[#f8fbff] text-[#101828]">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-[#d9e1ec] bg-white/90 p-5 shadow-[18px_0_50px_rgba(18,39,76,0.06)] backdrop-blur-xl lg:block">
        <Link href="/" className="flex items-center gap-3">
          <span className="brand-mark size-11" />
          <span className="text-xl font-black">Автопилот</span>
        </Link>

        <div className="mt-8 rounded-lg border border-[#d9e1ec] bg-[#f8fbff] p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-[#eaf1ff] text-[#2463eb]">
              <Bot size={20} />
            </span>
            <div>
              <p className="text-sm font-bold">AI-менеджер</p>
              <p className="text-xs text-[#526071]">Mock режим · обучение</p>
            </div>
          </div>
          <div className="mt-4 h-2 rounded-full bg-[#eaf1ff]">
            <div className="h-2 w-[64%] rounded-full bg-[#2463eb]" />
          </div>
          <p className="mt-2 text-xs text-[#526071]">
            База знаний заполнена на 64%
          </p>
        </div>

        <nav className="mt-8 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-[#526071] transition hover:bg-[#eaf1ff] hover:text-[#2463eb]"
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-5 left-5 right-5 rounded-lg border border-[#d9e1ec] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <LifeBuoy size={18} className="text-[#2463eb]" />
            <div>
              <p className="text-sm font-semibold">Нужна помощь?</p>
              <p className="text-xs text-[#526071]">Проверим сценарии вместе</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-[#d9e1ec] bg-white/86 px-5 py-4 backdrop-blur-xl lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div>
              <p className="brand-kicker">Рабочий кабинет</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight">
                {title}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-[#526071]">
                {description}
              </p>
            </div>
            <Link
              href="/profile"
              className="hidden items-center gap-3 rounded-full border border-[#d9e1ec] bg-white px-4 py-2 text-sm font-semibold shadow-sm md:flex"
            >
              <span className="size-2 rounded-full bg-[#13a66b]" />
              Demo Owner
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
