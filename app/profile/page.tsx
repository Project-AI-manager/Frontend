"use client";

import {
  AlertCircle,
  Bell,
  Building2,
  KeyRound,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { LogoutButton } from "@/components/auth/logout-button";
import { AppShell } from "@/components/layout/app-shell";
import { InfoRow } from "@/components/ui/info-row";
import { StateCard } from "@/components/ui/state-card";
import { getApiErrorMessage } from "@/lib/api/errors";
import { getUsers } from "@/lib/api/generated/users/users";
import { settingsApi } from "@/lib/api/settings";

const usersApi = getUsers();

const profileBlocks = [
  {
    icon: UserRound,
    title: "Личные данные",
    text: "Имя, email и роль теперь читаются из `GET /api/v1/users/me`.",
  },
  {
    icon: KeyRound,
    title: "Пароль",
    text: "Смена пароля появится после отдельного backend endpoint.",
  },
  {
    icon: Bell,
    title: "Уведомления",
    text: "Email и Telegram-уведомления оставлены на следующий этап интеграций.",
  },
  {
    icon: ShieldCheck,
    title: "Безопасность",
    text: "Access token автоматически добавляется Axios interceptor, refresh token обновляет сессию.",
  },
];

export default function ProfilePage() {
  const {
    data: profile,
    isLoading: isProfileLoading,
    isFetching: isProfileFetching,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["users", "me"],
    queryFn: () => usersApi.meApiV1UsersMeGet(),
    retry: 1,
  });

  const {
    data: workspace,
    isLoading: isWorkspaceLoading,
    error: workspaceError,
    refetch: refetchWorkspace,
  } = useQuery({
    queryKey: ["settings", "workspace"],
    queryFn: settingsApi.getWorkspaceSettings,
    retry: 1,
  });

  const initials = useMemo(
    () => initialsFromName(profile?.full_name || profile?.email || "User"),
    [profile],
  );
  const isLoading = isProfileLoading || isWorkspaceLoading;
  const error = profileError ?? workspaceError;

  async function refreshAll() {
    await Promise.all([refetchProfile(), refetchWorkspace()]);
  }

  return (
    <AppShell
      title="Профиль"
      description="Личные данные пользователя и компания подключены к реальному backend API."
    >
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-5">
          <div className="glass-card rounded-[1.75rem] p-6 text-center">
            <div className="mx-auto flex size-24 items-center justify-center rounded-[2rem] bg-black text-3xl font-black text-white">
              {initials}
            </div>
            <h2 className="mt-5 text-2xl font-black">
              {profile?.full_name || "Пользователь"}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">{profile?.email ?? "email не загружен"}</p>
            <span className="mt-4 inline-flex rounded-full bg-orange-100 px-4 py-2 text-sm font-bold text-orange-700">
              {profile?.role ?? "role"}
            </span>

            <button
              type="button"
              onClick={refreshAll}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {isProfileFetching ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Обновить профиль
            </button>
            <LogoutButton />
          </div>

          <div className="rounded-[1.75rem] bg-black p-6 text-white">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-black">
                <Building2 size={22} />
              </span>
              <div>
                <h2 className="font-black">{workspace?.name ?? "Компания"}</h2>
                <p className="text-sm text-white/55">{workspace?.slug ?? "workspace"}</p>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <InfoRow
                label="Tenant ID"
                value={profile?.tenant_id ?? workspace?.id ?? "—"}
                inverted
                truncate
              />
              <InfoRow label="Статус" value={workspace?.status ?? "—"} inverted />
            </div>
          </div>
        </aside>

        <section className="space-y-5">
          {isLoading ? (
            <StateCard
              icon={<Loader2 className="animate-spin" size={18} />}
              title="Загружаем профиль"
              description="Запрашиваем `/users/me` и `/settings/workspace`."
            />
          ) : error ? (
            <StateCard
              icon={<AlertCircle size={18} />}
              title="Не удалось загрузить профиль"
              description={getApiErrorMessage(error, "Проверь авторизацию и backend.")}
              tone="error"
            />
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            {profileBlocks.map((block) => (
              <article key={block.title} className="glass-card rounded-[1.75rem] p-6">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm">
                  <block.icon size={22} />
                </span>
                <h2 className="mt-5 text-xl font-black">{block.title}</h2>
                <p className="mt-3 text-sm leading-6 text-neutral-600">{block.text}</p>
              </article>
            ))}
          </div>

          <article className="glass-card rounded-[1.75rem] p-6">
            <div className="flex items-center gap-3">
              <Mail size={20} className="text-orange-500" />
              <h2 className="text-xl font-black">Контактные данные</h2>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <ReadOnlyField label="Имя" value={profile?.full_name || "Не указано"} />
              <ReadOnlyField label="Email" value={profile?.email || "Не загружен"} />
              <ReadOnlyField label="Роль" value={profile?.role || "—"} />
              <ReadOnlyField label="Статус" value={profile?.status || "—"} />
            </div>
            <p className="mt-4 text-sm leading-6 text-neutral-500">
              Редактирование профиля пока read-only: backend уже отдает профиль, но endpoint для
              изменения имени/пароля еще не реализован.
            </p>
          </article>
        </section>
      </div>
    </AppShell>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="block text-sm font-bold text-neutral-500">
      {label}
      <input
        className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 font-semibold text-neutral-900"
        value={value}
        readOnly
      />
    </label>
  );
}

function initialsFromName(value: string) {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
