"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  BookOpen,
  Inbox,
  RadioTower,
  Settings,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { Brand } from "@/components/ui/brand";
import { AuthBackground } from "@/components/ui/auth-background";
import { getConversations } from "@/lib/api/generated/conversations/conversations";
import { getUsers } from "@/lib/api/generated/users/users";
import { subscribeToConversationEvents } from "@/lib/api/conversation-events";
import { getAccessToken } from "@/lib/api/token";

const conversationsApi = getConversations();
const usersApi = getUsers();

type NavigationItem = {
  href: string;
  label: string;
  mobileLabel?: string;
  icon: typeof Inbox;
  separated?: boolean;
};

const navigation: NavigationItem[] = [
  { href: "/inbox", label: "Диалоги", icon: Inbox },
  { href: "/knowledge", label: "База знаний", mobileLabel: "Знания", icon: BookOpen },
  { href: "/channels", label: "Каналы", icon: RadioTower },
  { href: "/analytics", label: "Аналитика", icon: BarChart3 },
  { href: "/settings", label: "Настройки", icon: Settings, separated: true },
  { href: "/profile", label: "Профиль", icon: UserRound },
];

type AppShellProps = {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
  immersive?: boolean;
};

export function AppShell({
  title,
  description,
  actions,
  children,
  immersive = false,
}: AppShellProps) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const queryClient = useQueryClient();
  const [eventStreamOpen, setEventStreamOpen] = useState(false);
  const conversations = useQuery({
    queryKey: ["conversations"],
    queryFn: () => conversationsApi.listConversationItemsApiV1ConversationsGet(),
    enabled: Boolean(getAccessToken()),
    retry: 1,
    refetchInterval: eventStreamOpen ? false : 4_000,
    refetchIntervalInBackground: false,
  });
  const currentUser = useQuery({
    queryKey: ["profile-user"],
    queryFn: usersApi.meApiV1UsersMeGet,
    enabled: Boolean(getAccessToken()),
    retry: 1,
  });

  useEffect(() => {
    if (currentUser.data && !currentUser.data.email_verified) {
      router.replace(
        `/verify-email?email=${encodeURIComponent(currentUser.data.email)}`,
      );
    }
  }, [currentUser.data, router]);

  useEffect(
    () =>
      subscribeToConversationEvents({
        onChanged: () => {
          void queryClient.invalidateQueries({ queryKey: ["conversations"] });
        },
        onConnectionChange: (state) => setEventStreamOpen(state === "open"),
      }),
    [queryClient],
  );

  const unreadCount = (conversations.data ?? []).reduce(
    (total, conversation) => total + Math.max(0, conversation.unread_count),
    0,
  );

  if (currentUser.data && !currentUser.data.email_verified) {
    return <main className="ap-doodle min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-[#101828]">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[70] -translate-y-24 rounded-[8px] bg-white px-4 py-2 text-sm shadow-deep focus:translate-y-0"
      >
        Перейти к содержимому
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[212px] flex-col gap-5 border-r border-[#d9e1ec] bg-white px-3 py-5 lg:flex">
        <div className="min-h-10 px-2">
          <Brand compact />
        </div>
        <Navigation pathname={pathname} unreadCount={unreadCount} />
      </aside>

      <div className="lg:pl-[212px]">
        <header
          className={`${immersive ? "lg:hidden" : ""} sticky top-0 z-30 min-h-[65px] border-b border-[#d9e1ec] bg-white/95 px-3 py-2.5 backdrop-blur-xl sm:px-6 lg:px-8 lg:py-3`}
        >
          <div className="mx-auto flex min-h-10 max-w-[1180px] items-center gap-2.5">
            <div className="mr-auto lg:hidden">
              <Brand compact />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-heading text-[22px] font-extrabold tracking-[-0.04em]">
                <span className="sr-only lg:not-sr-only">{title}</span>
              </h1>
              <p className="mt-0.5 hidden truncate text-[13px] text-[#526071] sm:block">
                {description}
              </p>
            </div>
            {actions ? (
              <div className="hidden shrink-0 items-center gap-2 sm:flex">
                {actions}
              </div>
            ) : null}
            <Link
              data-tour="tour-nav-settings"
              href="/settings"
              aria-label="Настройки"
              aria-current={pathname === "/settings" || pathname.startsWith("/settings/") ? "page" : undefined}
              className={`grid size-11 shrink-0 place-items-center rounded-full border lg:hidden ${pathname === "/settings" || pathname.startsWith("/settings/") ? "border-[#cddfff] bg-[#eaf1ff] text-[#1546ad]" : "border-[#d9e1ec] bg-white text-[#526071]"}`}
            >
              <Settings size={19} strokeWidth={1.9} aria-hidden="true" />
            </Link>
            <Link
              data-tour="tour-nav-profile"
              href="/profile"
              aria-label="Профиль"
              aria-current={pathname === "/profile" || pathname.startsWith("/profile/") ? "page" : undefined}
              className={`grid size-11 shrink-0 place-items-center rounded-full border lg:hidden ${pathname === "/profile" || pathname.startsWith("/profile/") ? "border-[#cddfff] bg-[#eaf1ff] text-[#1546ad]" : "border-[#d9e1ec] bg-white text-[#526071]"}`}
            >
              <UserRound size={19} strokeWidth={1.9} aria-hidden="true" />
            </Link>
            <Link
              href="/profile"
              className="ml-auto hidden items-center gap-2 rounded-full bg-[#eaf1ff] px-3 py-2 text-[13px] font-semibold text-[#1546ad] lg:flex"
            >
              <span className="size-2 rounded-full bg-[#13a66b]" />
              Профиль
            </Link>
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className={
            immersive
              ? "relative h-[calc(100dvh-65px-var(--mobile-nav-height)-env(safe-area-inset-bottom))] overflow-hidden bg-[#f4f7fb] lg:h-dvh"
              : "relative min-h-[calc(100dvh-65px)] bg-[#f4f7fb] pb-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom))] lg:pb-0"
          }
        >
          {immersive ? (
            <>
              <AuthBackground />
              <div className="relative h-full min-h-0">{children}</div>
            </>
          ) : (
            <>
              <AuthBackground />
              <div className="relative mx-auto max-w-[1180px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
                {children}
              </div>
            </>
          )}
        </main>
      </div>
      <MobileBottomNavigation
        pathname={pathname}
        unreadCount={unreadCount}
      />
    </div>
  );

}

function Navigation({
  pathname,
  onNavigate,
  items = navigation,
  unreadCount = 0,
}: {
  pathname: string;
  onNavigate?: () => void;
  items?: NavigationItem[];
  unreadCount?: number;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-1" aria-label="Основная навигация">
      {items.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <div
            key={item.href}
            className={
              item.separated ? "mt-auto border-t border-[#e5eaf1] pt-5" : ""
            }
          >
            <Link
              href={item.href}
              data-tour={`tour-nav-${item.href.slice(1)}`}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex min-h-10 items-center gap-2.5 rounded-[8px] px-3 text-[14px] transition-[background,color,padding] hover:bg-[#f4f7fb] hover:pl-[15px] hover:text-[#101828] ${isActive ? "bg-[#eaf1ff] font-semibold text-[#1546ad] hover:bg-[#eaf1ff]" : "font-medium text-[#526071]"}`}
            >
              {isActive ? (
                <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-[#2463eb]" />
              ) : null}
              <item.icon size={18} strokeWidth={1.75} aria-hidden="true" />
              <span>{item.label}</span>
              {item.href === "/inbox" && unreadCount > 0 ? (
                <span className="ml-auto rounded-full bg-[#2463eb] px-[7px] py-0.5 text-[11px] font-extrabold tabular-nums text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}

function MobileBottomNavigation({
  pathname,
  unreadCount,
}: {
  pathname: string;
  unreadCount: number;
}) {
  const primaryItems = navigation.slice(0, 4);

  return (
    <nav
      aria-label="Мобильная навигация"
        className="fixed inset-x-0 bottom-0 z-[60] border-t border-[#d9e1ec] bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(18,39,76,.08)] backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto grid h-[var(--mobile-nav-height)] max-w-[560px] grid-cols-4 px-2">
        {primaryItems.map((item) => (
          <MobileNavigationLink
            key={item.href}
            item={item}
            active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
            unreadCount={item.href === "/inbox" ? unreadCount : 0}
          />
        ))}
      </div>
    </nav>
  );
}

function MobileNavigationLink({
  item,
  active,
  unreadCount,
}: {
  item: NavigationItem;
  active: boolean;
  unreadCount: number;
}) {
  return (
    <Link
      href={item.href}
      data-tour={`tour-nav-${item.href.slice(1)}`}
      aria-current={active ? "page" : undefined}
      className={`relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-[8px] px-1 text-[10px] font-semibold ${active ? "text-[#1546ad]" : "text-[#64717f]"}`}
    >
      <span className={`relative grid size-8 place-items-center rounded-full ${active ? "bg-[#eaf1ff]" : ""}`}>
        <item.icon size={20} strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-[#2463eb] px-1 text-center text-[9px] font-extrabold leading-4 text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </span>
      <span className="max-w-full truncate" aria-label={item.label}>{item.mobileLabel ?? item.label}</span>
    </Link>
  );
}
