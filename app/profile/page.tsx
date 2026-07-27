"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell, Mail, RefreshCw, UserRound } from "lucide-react";
import { useMemo, useState } from "react";

import { LogoutButton } from "@/components/auth/logout-button";
import { AppShell } from "@/components/layout/app-shell";
import { getApiErrorMessage } from "@/lib/api/errors";
import { getUsers } from "@/lib/api/generated/users/users";

const usersApi = getUsers();

export default function ProfilePage() {
  const userQuery = useQuery({
    queryKey: ["profile-user"],
    queryFn: usersApi.meApiV1UsersMeGet,
  });

  return (
    <AppShell title="Профиль" description="Личные данные и уведомления." immersive>
      <div className="relative h-full min-h-0 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
        {userQuery.isLoading ? (
          <ProfileSkeleton />
        ) : userQuery.error || !userQuery.data ? (
          <ProfileError error={userQuery.error} onRetry={() => userQuery.refetch()} />
        ) : (
          <ProfileContent user={userQuery.data} />
        )}
      </div>
    </AppShell>
  );
}

function ProfileContent({ user }: { user: Awaited<ReturnType<typeof usersApi.meApiV1UsersMeGet>> }) {
  const [telegramAlerts, setTelegramAlerts] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);
  const initials = useMemo(
    () => user.full_name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "А",
    [user.full_name],
  );

  return (
    <div className="flex w-full flex-col gap-4">
      <section className="overflow-hidden rounded-lg border border-[#d9e1ec] bg-white shadow-[0_10px_22px_rgba(18,39,76,.07)]">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-7">
          <div className="flex size-[72px] shrink-0 items-center justify-center rounded-full border border-[#cddfff] bg-[#eaf1ff] font-heading text-2xl font-extrabold text-[#1546ad]">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-extrabold uppercase tracking-[.12em] text-[#64717f]">Личные данные</p>
            <h1 className="mt-1.5 truncate font-heading text-[24px] font-extrabold tracking-[-.04em] text-[#101828]">{user.full_name || "Пользователь"}</h1>
            <p className="mt-1 flex items-center gap-1.5 break-all text-sm text-[#526071]"><Mail size={15} aria-hidden="true" />{user.email}</p>
          </div>
        </div>
        <div className="grid border-t border-[#e5eaf1] sm:grid-cols-2">
          <ProfileField icon={UserRound} label="Имя" value={user.full_name || "Не указано"} />
          <ProfileField icon={Mail} label="Почта" value={user.email} separated />
        </div>
      </section>

      <section className="rounded-lg border border-[#d9e1ec] bg-white p-6 shadow-[0_10px_22px_rgba(18,39,76,.07)] sm:p-7">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#eaf1ff] text-[#1546ad]"><Bell size={19} aria-hidden="true" /></span>
          <div>
            <h2 className="font-heading text-lg font-extrabold tracking-[-.02em]">Уведомления</h2>
            <p className="mt-1 text-[13px] text-[#64717f]">Выберите, куда отправлять важные события.</p>
          </div>
        </div>
        <div className="mt-5 divide-y divide-[#e5eaf1] border-y border-[#e5eaf1]">
          <NotificationRow label="Присылать в Telegram, когда нужен человек" checked={telegramAlerts} onChange={setTelegramAlerts} />
          <NotificationRow label="Сводка за день на почту" checked={emailDigest} onChange={setEmailDigest} />
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-5 rounded-lg border border-[#d9e1ec] bg-white p-6 shadow-[0_10px_22px_rgba(18,39,76,.07)] sm:p-7">
        <div>
          <h2 className="font-heading font-extrabold tracking-[-.02em]">Выйти из аккаунта</h2>
          <p className="mt-1 text-[13px] text-[#64717f]">Сессия завершится только на этом устройстве.</p>
        </div>
        <LogoutButton className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#d84545] px-5 text-sm font-semibold text-[#a72f2f] hover:bg-[#fdeded] disabled:opacity-50" />
      </section>
    </div>
  );
}

function ProfileField({ icon: Icon, label, value, separated = false }: { icon: typeof UserRound; label: string; value: string; separated?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-6 py-5 sm:px-7 ${separated ? "border-t border-[#e5eaf1] sm:border-t-0 sm:border-l" : ""}`}>
      <Icon size={18} className="shrink-0 text-[#64717f]" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[.1em] text-[#64717f]">{label}</p>
        <p className="mt-1 truncate text-sm font-semibold text-[#101828]">{value}</p>
      </div>
    </div>
  );
}

function NotificationRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="flex min-h-[64px] items-center justify-between gap-6 py-3.5">
      <span className="text-sm font-semibold text-[#101828]">{label}</span>
      <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={`flex h-[26px] w-11 shrink-0 items-center rounded-full p-[3px] transition-colors ${checked ? "justify-end bg-[#2463eb]" : "justify-start bg-[#d9e1ec]"}`}>
        <span className="size-5 rounded-full bg-white shadow-sm" />
      </button>
    </div>
  );
}

function ProfileError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div className="flex min-h-72 w-full flex-col items-center justify-center rounded-lg border border-[#d9e1ec] bg-white p-8 text-center">
      <RefreshCw className="text-[#2463eb]" />
      <h2 className="mt-4 text-xl font-extrabold">Профиль не загрузился</h2>
      <p className="mt-2 text-sm text-[#526071]">{getApiErrorMessage(error, "Не удалось получить данные пользователя.")}</p>
      <button type="button" onClick={onRetry} className="mt-5 rounded-lg bg-[#2463eb] px-5 py-2.5 text-sm font-semibold text-white">Повторить</button>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div role="status" aria-label="Загружаем профиль" className="flex w-full animate-pulse flex-col gap-4">
      <div className="h-[230px] rounded-lg border border-[#e5eaf1] bg-[#eef3fb]" />
      <div className="h-[190px] rounded-lg border border-[#e5eaf1] bg-[#eef3fb]" />
      <div className="h-[110px] rounded-lg border border-[#e5eaf1] bg-[#eef3fb]" />
    </div>
  );
}
