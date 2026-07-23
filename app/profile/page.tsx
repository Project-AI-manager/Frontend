"use client";

import {
  AlertCircle,
  Building2,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
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
          ? `Письмо подготовлено. Код подтверждения: ${data.dev_token}`
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
      setEmailNotice("Вставь код подтверждения.");
      return;
    }
    confirmVerificationMutation.mutate(token);
  }

  return (
    <AppShell
      title="Профиль"
      description="Личные данные, рабочее пространство и подтверждение почты."
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="surface-card overflow-hidden">
          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-[#2463eb] text-2xl font-black text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="truncate text-2xl font-black">
                  {profile?.full_name || "Пользователь"}
                </h2>
                <span className="rounded-full bg-[#eaf1ff] px-3 py-1 text-xs font-bold text-[#1546ad]">
                  {profile?.role ?? "роль"}
                </span>
              </div>
              <p className="mt-1 truncate text-sm text-[#526071]">
                {profile?.email ?? "email не загружен"}
              </p>
              <p className="mt-3 flex items-center gap-2 text-sm font-semibold">
                <Building2 size={16} className="text-[#2463eb]" />
                {workspace?.name ?? "Компания"}
                <span className="font-normal text-[#526071]">
                  · {workspace?.slug ?? "workspace"}
                </span>
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-stretch gap-2">
              <button
                type="button"
                onClick={refreshAll}
                className="secondary-button px-4 py-2.5 text-sm"
              >
                {isProfileFetching ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <RefreshCw size={16} />
                )}
                Обновить
              </button>
              <LogoutButton />
            </div>
          </div>
          <div className="grid border-t border-[#d9e1ec] bg-[#f8fbff] md:grid-cols-2">
            <div className="border-b border-[#d9e1ec] px-6 py-4 md:border-b-0 md:border-r sm:px-8">
              <InfoRow
                label="ID пространства"
                value={profile?.tenant_id ?? workspace?.id ?? "—"}
                truncate
              />
            </div>
            <div className="px-6 py-4 sm:px-8">
              <InfoRow label="Статус" value={workspace?.status ?? "—"} />
            </div>
          </div>
        </section>

        <section className="space-y-6">
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
                "Обнови страницу или войди в аккаунт повторно.",
              )}
              tone="error"
            />
          ) : null}

          <article className="surface-card p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <Mail size={20} className="text-[#2463eb]" />
              <h2 className="text-xl font-black">Контактные данные</h2>
            </div>
            <div className="mt-5 divide-y divide-[#d9e1ec] border-y border-[#d9e1ec]">
              <ProfileDetail
                label="Имя"
                value={profile?.full_name || "Не указано"}
              />
              <ProfileDetail
                label="Email"
                value={profile?.email || "Не загружен"}
              />
              <ProfileDetail label="Роль" value={profile?.role || "—"} />
              <ProfileDetail label="Статус" value={profile?.status || "—"} />
              <ProfileDetail
                label="Почта"
                value={
                  profile?.email_verified ? "Подтверждена" : "Не подтверждена"
                }
              />
            </div>
            <p className="mt-4 text-sm leading-6 text-neutral-500">
              Сейчас данные доступны только для просмотра. Редактирование имени
              и пароля появится в одном из следующих обновлений.
            </p>
          </article>

          <article className="surface-card p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} className="text-[#2463eb]" />
              <h2 className="text-xl font-black">Подтверждение почты</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              Запроси письмо с одноразовым кодом и введи его ниже. В тестовом
              окружении код появится прямо в уведомлении.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <InfoRow label="Email" value={profile?.email ?? "—"} />
              <InfoRow
                label="Статус"
                value={
                  profile?.email_verified ? "Подтверждена" : "Не подтверждена"
                }
              />
              <InfoRow
                label="Доставка"
                value={
                  emailStatusQuery.data?.smtp_configured
                    ? "Настроен"
                    : "Тестовый режим"
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
                  placeholder="Код из письма"
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
                    "Не удалось загрузить историю писем.",
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
                  Пока писем нет. Запроси подтверждение почты, и запись появится
                  здесь.
                </p>
              )}
            </div>
          </article>
        </section>
      </div>
    </AppShell>
  );
}

function ProfileDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-3 text-sm sm:grid-cols-[180px_1fr] sm:gap-4">
      <span className="font-semibold text-[#526071]">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
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
