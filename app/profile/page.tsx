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
import { type FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { LogoutButton } from "@/components/auth/logout-button";
import { AppShell } from "@/components/layout/app-shell";
import { InfoRow } from "@/components/ui/info-row";
import { StateCard } from "@/components/ui/state-card";
import { emailApi } from "@/lib/api/email";
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
  const queryClient = useQueryClient();
  const [verificationToken, setVerificationToken] = useState("");
  const [emailNotice, setEmailNotice] = useState<string | null>(null);

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

  const emailStatusQuery = useQuery({
    queryKey: ["email", "status"],
    queryFn: emailApi.getStatus,
    retry: 1,
  });

  const emailOutboxQuery = useQuery({
    queryKey: ["email", "outbox"],
    queryFn: emailApi.getOutbox,
    retry: 1,
  });

  const requestVerificationMutation = useMutation({
    mutationFn: emailApi.requestVerification,
    onSuccess: (data) => {
      setEmailNotice(
        data.dev_token
          ? `Письмо записано в outbox. Dev token: ${data.dev_token}`
          : data.sent
            ? "Письмо подтверждения отправлено."
            : "Почта уже подтверждена или отправка отключена.",
      );
      if (data.dev_token) {
        setVerificationToken(data.dev_token);
      }
      void emailOutboxQuery.refetch();
    },
    onError: (error) => {
      setEmailNotice(
        getApiErrorMessage(error, "Не удалось запросить подтверждение почты."),
      );
    },
  });

  const confirmVerificationMutation = useMutation({
    mutationFn: emailApi.confirmVerification,
    onSuccess: async () => {
      setVerificationToken("");
      setEmailNotice("Почта подтверждена.");
      await queryClient.invalidateQueries({ queryKey: ["users", "me"] });
      await queryClient.invalidateQueries({ queryKey: ["email", "outbox"] });
    },
    onError: (error) => {
      setEmailNotice(
        getApiErrorMessage(error, "Не удалось подтвердить почту."),
      );
    },
  });

  const initials = useMemo(
    () => initialsFromName(profile?.full_name || profile?.email || "User"),
    [profile],
  );
  const isLoading = isProfileLoading || isWorkspaceLoading;
  const error = profileError ?? workspaceError;

  async function refreshAll() {
    await Promise.all([
      refetchProfile(),
      refetchWorkspace(),
      emailStatusQuery.refetch(),
      emailOutboxQuery.refetch(),
    ]);
  }

  function handleVerificationConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = verificationToken.trim();
    if (!token) {
      setEmailNotice("Вставь token подтверждения.");
      return;
    }
    confirmVerificationMutation.mutate(token);
  }

  return (
    <AppShell
      title="Профиль"
      description="Личные данные пользователя и компания подключены к реальному backend API."
    >
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-5">
          <div className="glass-card rounded-lg p-6 text-center">
            <div className="mx-auto flex size-24 items-center justify-center rounded-lg bg-[#2463eb] text-3xl font-black text-white">
              {initials}
            </div>
            <h2 className="mt-5 text-2xl font-black">
              {profile?.full_name || "Пользователь"}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              {profile?.email ?? "email не загружен"}
            </p>
            <span className="mt-4 inline-flex rounded-full bg-[#eaf1ff] px-4 py-2 text-sm font-bold text-[#1546ad]">
              {profile?.role ?? "role"}
            </span>

            <button
              type="button"
              onClick={refreshAll}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg border border-[#d9e1ec] bg-white px-4 py-3 text-sm font-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {isProfileFetching ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
              Обновить профиль
            </button>
            <LogoutButton />
          </div>

          <div className="rounded-lg bg-[#2463eb] p-6 text-white">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-lg bg-white text-[#101828]">
                <Building2 size={22} />
              </span>
              <div>
                <h2 className="font-black">{workspace?.name ?? "Компания"}</h2>
                <p className="text-sm text-white/55">
                  {workspace?.slug ?? "workspace"}
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <InfoRow
                label="Tenant ID"
                value={profile?.tenant_id ?? workspace?.id ?? "—"}
                inverted
                truncate
              />
              <InfoRow
                label="Статус"
                value={workspace?.status ?? "—"}
                inverted
              />
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
              description={getApiErrorMessage(
                error,
                "Проверь авторизацию и backend.",
              )}
              tone="error"
            />
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            {profileBlocks.map((block) => (
              <article key={block.title} className="glass-card rounded-lg p-6">
                <span className="flex size-12 items-center justify-center rounded-lg bg-white text-[#2463eb] shadow-sm">
                  <block.icon size={22} />
                </span>
                <h2 className="mt-5 text-xl font-black">{block.title}</h2>
                <p className="mt-3 text-sm leading-6 text-neutral-600">
                  {block.text}
                </p>
              </article>
            ))}
          </div>

          <article className="glass-card rounded-lg p-6">
            <div className="flex items-center gap-3">
              <Mail size={20} className="text-[#2463eb]" />
              <h2 className="text-xl font-black">Контактные данные</h2>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <ReadOnlyField
                label="Имя"
                value={profile?.full_name || "Не указано"}
              />
              <ReadOnlyField
                label="Email"
                value={profile?.email || "Не загружен"}
              />
              <ReadOnlyField label="Роль" value={profile?.role || "—"} />
              <ReadOnlyField label="Статус" value={profile?.status || "—"} />
              <ReadOnlyField
                label="Почта"
                value={profile?.email_verified ? "Подтверждена" : "Не подтверждена"}
              />
            </div>
            <p className="mt-4 text-sm leading-6 text-neutral-500">
              Редактирование профиля пока read-only: backend уже отдает профиль,
              но endpoint для изменения имени/пароля еще не реализован.
            </p>
          </article>

          <article className="glass-card rounded-lg p-6">
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} className="text-[#2463eb]" />
              <h2 className="text-xl font-black">Подтверждение почты</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              Backend теперь умеет создавать одноразовые email-token и писать
              письма в outbox. В dev-режиме token показывается здесь, чтобы
              можно было проверить поток без SMTP.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <InfoRow
                label="Email"
                value={profile?.email ?? "—"}
              />
              <InfoRow
                label="Статус"
                value={profile?.email_verified ? "Подтверждена" : "Не подтверждена"}
              />
              <InfoRow
                label="SMTP"
                value={
                  emailStatusQuery.data?.smtp_configured
                    ? "Настроен"
                    : "Dev outbox"
                }
              />
            </div>

            {emailNotice ? (
              <p className="mt-4 rounded-lg bg-white p-4 text-sm font-semibold text-neutral-700 shadow-sm">
                {emailNotice}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 md:flex-row">
              <button
                type="button"
                onClick={() => requestVerificationMutation.mutate()}
                disabled={
                  Boolean(profile?.email_verified) ||
                  requestVerificationMutation.isPending
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2463eb] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {requestVerificationMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Mail size={16} />
                )}
                Запросить подтверждение
              </button>

              <form
                onSubmit={handleVerificationConfirm}
                className="flex min-w-0 flex-1 gap-2"
              >
                <input
                  value={verificationToken}
                  onChange={(event) => setVerificationToken(event.target.value)}
                  className="form-field min-w-0 flex-1 px-4 py-3 text-sm"
                  placeholder="Email token"
                  disabled={
                    Boolean(profile?.email_verified) ||
                    confirmVerificationMutation.isPending
                  }
                />
                <button
                  type="submit"
                  disabled={
                    Boolean(profile?.email_verified) ||
                    confirmVerificationMutation.isPending
                  }
                  className="rounded-lg border border-[#d9e1ec] bg-white px-5 py-3 text-sm font-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  Подтвердить
                </button>
              </form>
            </div>

            <div className="mt-6 rounded-lg bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-black">Последние письма</h3>
                {emailOutboxQuery.isFetching ? (
                  <Loader2 size={16} className="animate-spin text-[#2463eb]" />
                ) : null}
              </div>

              {emailOutboxQuery.error ? (
                <p className="mt-3 text-sm font-semibold text-red-700">
                  {getApiErrorMessage(
                    emailOutboxQuery.error,
                    "Не удалось загрузить outbox.",
                  )}
                </p>
              ) : emailOutboxQuery.data?.length ? (
                <div className="mt-3 space-y-3">
                  {emailOutboxQuery.data.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-[#d9e1ec] p-3 text-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-black">{item.subject}</p>
                          <p className="mt-1 text-neutral-500">
                            {item.to_email}
                          </p>
                        </div>
                        <span className="rounded-full bg-[#eaf1ff] px-3 py-1 text-xs font-black text-[#1546ad]">
                          {item.status}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-neutral-500">
                        <span>{item.purpose}</span>
                        <span>{formatDateTime(item.created_at)}</span>
                      </div>
                      {item.error ? (
                        <p className="mt-2 text-xs font-semibold text-red-700">
                          {item.error}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-neutral-500">
                  Пока писем нет. Запроси подтверждение почты или восстановление
                  пароля, и запись появится здесь.
                </p>
              )}
            </div>
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
        className="mt-2 w-full rounded-lg border border-[#d9e1ec] bg-white px-4 py-3 font-semibold text-neutral-900"
        value={value}
        readOnly
      />
    </label>
  );
}

function initialsFromName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
