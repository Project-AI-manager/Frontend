"use client";

import { RefreshCw } from "lucide-react";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { LogoutButton } from "@/components/auth/logout-button";
import { AppShell } from "@/components/layout/app-shell";
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

  const isEmailVerified = Boolean(profile?.email_verified);

  return (
    <AppShell
      title="Профиль"
      description="Личные данные, рабочее пространство и подтверждение почты."
    >
      <div className="mx-auto max-w-5xl space-y-4 sm:space-y-5">
        {/* Шапка профиля: аватар-инициалы, роль, компания и действия аккаунта. */}
        <section className="wf-box p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <span className="bg-fill flex size-14 shrink-0 items-center justify-center rounded-md text-base font-semibold">
              {initials}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="wf-title min-w-0 truncate">
                  {profile?.full_name || "Пользователь"}
                </h2>
                <span className="wf-tag">{profile?.role ?? "роль"}</span>
              </div>
              <p className="wf-muted mt-1 truncate text-sm">
                {profile?.email ?? "email не загружен"}
              </p>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                {workspace?.name ?? "Компания"}
                <span className="wf-muted">
                  · {workspace?.slug ?? "workspace"}
                </span>
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-stretch gap-2 lg:w-52">
              <button
                type="button"
                onClick={refreshAll}
                className="wf-btn w-full"
              >
                <RefreshCw size={18} className="text-muted" />
                {isProfileFetching ? "Обновляем..." : "Обновить"}
              </button>
              <LogoutButton />
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <MetaCell
              label="ID пространства"
              value={profile?.tenant_id ?? workspace?.id ?? "—"}
            />
            <MetaCell label="Статус" value={workspace?.status ?? "—"} />
          </div>
        </section>

        {isLoading ? (
          <LoadingRows
            label="Загружаем профиль"
            description="Запрашиваем `/users/me` и `/settings/workspace`."
            rows={3}
          />
        ) : error ? (
          <div role="alert" className="wf-fill p-4">
            <p className="text-sm font-semibold">Не удалось загрузить профиль</p>
            <p className="wf-muted mt-1 text-sm leading-6">
              {getApiErrorMessage(
                error,
                "Обнови страницу или войди в аккаунт повторно.",
              )}
            </p>
          </div>
        ) : null}

        {/* Данные пользователя: роль и статусы вынесены в метки. */}
        <ProfileSection kicker="Аккаунт" title="Контактные данные">
          <DetailRow label="Имя" value={profile?.full_name || "Не указано"} />
          <div className="wf-divider" />
          <DetailRow label="Email" value={profile?.email || "Не загружен"} />
          <div className="wf-divider" />
          <DetailRow label="Роль" value={profile?.role || "—"} asTag />
          <div className="wf-divider" />
          <DetailRow label="Статус" value={profile?.status || "—"} asTag />
          <div className="wf-divider" />
          <DetailRow
            label="Почта"
            value={isEmailVerified ? "Подтверждена" : "Не подтверждена"}
            asTag
          />

          <p className="wf-fill wf-muted mt-4 p-4 text-sm leading-6">
            Сейчас данные доступны только для просмотра. Редактирование имени и
            пароля появится в одном из следующих обновлений.
          </p>
        </ProfileSection>

        {/* Подтверждение почты: состояние, запрос кода и история писем. */}
        <ProfileSection
          kicker="Безопасность"
          title="Подтверждение почты"
          description="Запроси письмо с одноразовым кодом и введи его ниже. В тестовом окружении код появится прямо в уведомлении."
        >
          <div className="grid gap-2 sm:grid-cols-3">
            <StatusTile label="Email" value={profile?.email ?? "—"} />
            <StatusTile
              label="Статус"
              value={isEmailVerified ? "Подтверждена" : "Не подтверждена"}
            />
            <StatusTile
              label="Доставка"
              value={
                emailStatusQuery.data?.smtp_configured
                  ? "Настроен"
                  : "Тестовый режим"
              }
            />
          </div>

          {emailNotice ? (
            <p
              role="status"
              className="wf-fill mt-3 break-words px-3 py-2 text-sm leading-6"
            >
              {emailNotice}
            </p>
          ) : null}

          <div className="mt-4 flex flex-col gap-2 md:flex-row">
            <button
              type="button"
              onClick={() => requestVerificationMutation.mutate()}
              disabled={
                Boolean(profile?.email_verified) ||
                requestVerificationMutation.isPending
              }
              className="wf-btn wf-btn-primary shrink-0"
            >
              {requestVerificationMutation.isPending
                ? "Запрашиваем..."
                : "Запросить подтверждение"}
            </button>

            <form
              onSubmit={handleVerificationConfirm}
              className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row"
            >
              <input
                id="profile-verification-token"
                aria-label="Код из письма"
                value={verificationToken}
                onChange={(event) => setVerificationToken(event.target.value)}
                className="wf-field min-w-0 flex-1 text-sm"
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
                className="wf-btn shrink-0"
              >
                Подтвердить
              </button>
            </form>
          </div>

          {/* Outbox: компактная таблица последних писем. */}
          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold">Последние письма</h3>
              {emailOutboxQuery.isFetching ? (
                <span className="wf-muted text-xs">Обновляем...</span>
              ) : null}
            </div>

            {emailOutboxQuery.error ? (
              <p role="alert" className="wf-fill mt-3 p-4 text-sm leading-6">
                {getApiErrorMessage(
                  emailOutboxQuery.error,
                  "Не удалось загрузить историю писем.",
                )}
              </p>
            ) : emailOutboxQuery.data?.length ? (
              <div className="scroll-thin mt-3 overflow-x-auto rounded-md border border-line">
                <table className="w-full min-w-[36rem] border-collapse text-left">
                  <thead>
                    <tr className="bg-fill border-b border-line">
                      <th scope="col" className="wf-kicker px-3 py-2">
                        Письмо
                      </th>
                      <th scope="col" className="wf-kicker px-3 py-2">
                        Тип
                      </th>
                      <th scope="col" className="wf-kicker px-3 py-2">
                        Отправлено
                      </th>
                      <th
                        scope="col"
                        className="wf-kicker px-3 py-2 text-right"
                      >
                        Статус
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {emailOutboxQuery.data.slice(0, 5).map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-line-soft align-top last:border-0"
                      >
                        <td className="min-w-0 px-3 py-2.5">
                          <p className="text-sm font-semibold">
                            {item.subject}
                          </p>
                          <p className="wf-muted mt-0.5 break-words text-xs">
                            {item.to_email}
                          </p>
                          {item.error ? (
                            <p className="mt-1 break-words text-xs font-medium">
                              {item.error}
                            </p>
                          ) : null}
                        </td>
                        <td className="wf-muted px-3 py-2.5 text-xs">
                          {item.purpose}
                        </td>
                        <td className="wf-muted whitespace-nowrap px-3 py-2.5 text-xs tabular-nums">
                          {formatDateTime(item.created_at)}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className="wf-tag">{item.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="wf-fill wf-muted mt-3 p-4 text-sm leading-6">
                Пока писем нет. Запроси подтверждение почты, и запись появится
                здесь.
              </p>
            )}
          </div>
        </ProfileSection>
      </div>
    </AppShell>
  );
}

/** Секция профиля: шапка с кикером и заголовком, затем содержимое. */
function ProfileSection({
  kicker,
  title,
  description,
  children,
}: {
  kicker: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="wf-box p-4 sm:p-5">
      <div className="min-w-0">
        <p className="wf-kicker">{kicker}</p>
        <h2 className="wf-title mt-1 text-balance">{title}</h2>
        {description ? (
          <p className="wf-muted mt-1.5 max-w-3xl text-sm leading-6">
            {description}
          </p>
        ) : null}
      </div>

      <div className="wf-divider my-4" />

      {children}
    </section>
  );
}

/** Строка данных: подпись слева, значение или метка состояния справа. */
function DetailRow({
  label,
  value,
  asTag,
}: {
  label: string;
  value: string;
  asTag?: boolean;
}) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] sm:items-center sm:gap-6">
      <span className="wf-muted text-sm">{label}</span>
      {asTag ? (
        <span className="min-w-0">
          <span className="wf-tag">{value}</span>
        </span>
      ) : (
        <span className="min-w-0 break-words text-sm font-semibold">
          {value}
        </span>
      )}
    </div>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="wf-fill min-w-0 p-3">
      <p className="wf-kicker">{label}</p>
      <p title={value} className="mt-1 truncate text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}

function StatusTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="wf-fill min-w-0 p-3">
      <p className="wf-kicker">{label}</p>
      <p
        title={value}
        className="mt-1 min-w-0 truncate text-sm font-semibold"
      >
        {value}
      </p>
    </div>
  );
}

/** Состояние загрузки: скелетоны для глаз, текст — для скринридера. */
function LoadingRows({
  label,
  description,
  rows,
}: {
  label: string;
  description?: string;
  rows: number;
}) {
  return (
    <div role="status" aria-busy="true" className="space-y-2">
      <span className="sr-only">{label}</span>
      {description ? <span className="sr-only">{description}</span> : null}
      {Array.from({ length: rows }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className="wf-skeleton block h-12"
        />
      ))}
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
