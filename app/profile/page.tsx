"use client";

import {
  AlertCircle,
  Building2,
  Loader2,
  Mail,
  RefreshCw,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { LogoutButton } from "@/components/auth/logout-button";
import { AppShell } from "@/components/layout/app-shell";
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

  const isEmailVerified = Boolean(profile?.email_verified);

  return (
    <AppShell
      title="Профиль"
      description="Личные данные, рабочее пространство и подтверждение почты."
    >
      <div className="mx-auto max-w-5xl space-y-5 sm:space-y-6">
        {/* Шапка профиля: аватар-инициалы, роль, компания и действия аккаунта. */}
        <section className="panel overflow-hidden">
          <div className="soft-grid flex flex-col gap-5 border-b border-line bg-mist p-5 sm:p-6 lg:flex-row lg:items-center lg:gap-6">
            <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-brand-soft font-display text-2xl font-extrabold tracking-[-0.02em] text-brand">
              {initials}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="min-w-0 truncate font-display text-2xl font-extrabold tracking-[-0.04em]">
                  {profile?.full_name || "Пользователь"}
                </h2>
                <span className="chip chip-blue">
                  {profile?.role ?? "роль"}
                </span>
              </div>
              <p className="mt-1 truncate text-sm text-muted">
                {profile?.email ?? "email не загружен"}
              </p>
              <p className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold">
                <Building2
                  size={16}
                  className="shrink-0 text-brand"
                  aria-hidden="true"
                />
                {workspace?.name ?? "Компания"}
                <span className="font-normal text-muted">
                  · {workspace?.slug ?? "workspace"}
                </span>
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-stretch gap-2 lg:w-52">
              <button
                type="button"
                onClick={refreshAll}
                className="btn btn-secondary btn-sm"
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

          <div className="grid divide-y divide-line sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <MetaCell
              label="ID пространства"
              value={profile?.tenant_id ?? workspace?.id ?? "—"}
            />
            <MetaCell label="Статус" value={workspace?.status ?? "—"} />
          </div>
        </section>

        {isLoading ? (
          <StateCard
            variant="loading"
            title="Загружаем профиль"
            description="Запрашиваем `/users/me` и `/settings/workspace`."
          />
        ) : error ? (
          <StateCard
            variant="error"
            icon={<AlertCircle size={22} />}
            title="Не удалось загрузить профиль"
            description={getApiErrorMessage(
              error,
              "Обнови страницу или войди в аккаунт повторно.",
            )}
          />
        ) : null}

        {/* Данные пользователя: роль и статусы вынесены в чипы. */}
        <ProfileSection
          icon={<UserRound size={22} />}
          kicker="Аккаунт"
          title="Контактные данные"
        >
          <DetailRow label="Имя" value={profile?.full_name || "Не указано"} />
          <div className="divider" />
          <DetailRow label="Email" value={profile?.email || "Не загружен"} />
          <div className="divider" />
          <DetailRow
            label="Роль"
            value={profile?.role || "—"}
            chipClass="chip-blue"
          />
          <div className="divider" />
          <DetailRow
            label="Статус"
            value={profile?.status || "—"}
            chipClass="chip-grey"
          />
          <div className="divider" />
          <DetailRow
            label="Почта"
            value={isEmailVerified ? "Подтверждена" : "Не подтверждена"}
            chipClass={isEmailVerified ? "chip-green" : "chip-amber"}
          />

          <div className="soft-panel mb-6 mt-5 flex items-start gap-4 p-5 sm:p-6">
            <span className="icon-badge shrink-0" aria-hidden="true">
              <ShieldCheck size={22} />
            </span>
            <p className="min-w-0 flex-1 text-sm leading-6 text-muted">
              Сейчас данные доступны только для просмотра. Редактирование имени
              и пароля появится в одном из следующих обновлений.
            </p>
          </div>
        </ProfileSection>

        {/* Подтверждение почты: состояние, запрос кода и история писем. */}
        <ProfileSection
          icon={<ShieldCheck size={22} />}
          kicker="Безопасность"
          title="Подтверждение почты"
          description="Запроси письмо с одноразовым кодом и введи его ниже. В тестовом окружении код появится прямо в уведомлении."
          padded
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <StatusTile label="Email" value={profile?.email ?? "—"} />
            <StatusTile
              label="Статус"
              value={isEmailVerified ? "Подтверждена" : "Не подтверждена"}
              tone={isEmailVerified ? "ok" : "amber"}
            />
            <StatusTile
              label="Доставка"
              value={
                emailStatusQuery.data?.smtp_configured
                  ? "Настроен"
                  : "Тестовый режим"
              }
              tone={emailStatusQuery.data?.smtp_configured ? "ok" : "grey"}
            />
          </div>

          {emailNotice ? (
            <p role="status" className="notice notice-brand mt-4 font-semibold">
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
              className="btn btn-primary shrink-0"
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
              className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row"
            >
              <input
                id="profile-verification-token"
                aria-label="Код из письма"
                value={verificationToken}
                onChange={(event) => setVerificationToken(event.target.value)}
                className="field min-w-0 flex-1 text-sm"
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
                className="btn btn-secondary shrink-0"
              >
                Подтвердить
              </button>
            </form>
          </div>

          {/* Outbox: компактная таблица последних писем. */}
          <div className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-base font-extrabold tracking-[-0.02em]">
                Последние письма
              </h3>
              {emailOutboxQuery.isFetching ? (
                <Loader2 size={16} className="animate-spin text-brand" />
              ) : null}
            </div>

            {emailOutboxQuery.error ? (
              <p
                role="alert"
                className="notice notice-danger mt-3 font-semibold"
              >
                {getApiErrorMessage(
                  emailOutboxQuery.error,
                  "Не удалось загрузить историю писем.",
                )}
              </p>
            ) : emailOutboxQuery.data?.length ? (
              <div className="scroll-thin mt-3 overflow-x-auto rounded-md border border-line">
                <table className="w-full min-w-[36rem] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-line bg-mist">
                      <th scope="col" className="micro-label px-4 py-3">
                        Письмо
                      </th>
                      <th scope="col" className="micro-label px-4 py-3">
                        Тип
                      </th>
                      <th scope="col" className="micro-label px-4 py-3">
                        Отправлено
                      </th>
                      <th
                        scope="col"
                        className="micro-label px-4 py-3 text-right"
                      >
                        Статус
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {emailOutboxQuery.data.slice(0, 5).map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-line align-top last:border-0"
                      >
                        <td className="min-w-0 px-4 py-3">
                          <p className="font-display text-sm font-extrabold tracking-[-0.02em]">
                            {item.subject}
                          </p>
                          <p className="mt-0.5 break-words text-xs text-muted">
                            {item.to_email}
                          </p>
                          {item.error ? (
                            <p className="mt-1 break-words text-xs font-semibold text-danger-ink">
                              {item.error}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-muted">
                          {item.purpose}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs tabular-nums text-muted">
                          {formatDateTime(item.created_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`chip ${outboxChipClass(item.status)}`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="soft-panel mt-3 flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
                <span className="icon-badge shrink-0" aria-hidden="true">
                  <Send size={22} />
                </span>
                <p className="min-w-0 flex-1 text-sm leading-6 text-muted">
                  Пока писем нет. Запроси подтверждение почты, и запись появится
                  здесь.
                </p>
              </div>
            )}
          </div>
        </ProfileSection>
      </div>
    </AppShell>
  );
}

/** Секция профиля: шапка с кикером и заголовком, затем содержимое. */
function ProfileSection({
  icon,
  kicker,
  title,
  description,
  padded = false,
  children,
}: {
  icon: ReactNode;
  kicker: string;
  title: string;
  description?: string;
  padded?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-line p-5 sm:p-6 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span className="icon-badge shrink-0" aria-hidden="true">
            {icon}
          </span>
          <div className="min-w-0">
            <span className="section-kicker">{kicker}</span>
            <h2 className="mt-1.5 text-balance font-display text-xl font-extrabold tracking-[-0.04em] sm:text-2xl">
              {title}
            </h2>
            {description ? (
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Без padded вертикальный ритм задают сами строки (py-4). */}
      <div className={`px-5 sm:px-6 ${padded ? "py-5 sm:py-6" : ""}`}>
        {children}
      </div>
    </section>
  );
}

/** Строка данных: подпись слева, значение или статусный чип справа. */
function DetailRow({
  label,
  value,
  chipClass,
}: {
  label: string;
  value: string;
  chipClass?: string;
}) {
  return (
    <div className="grid gap-1 py-4 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] sm:items-center sm:gap-6">
      <span className="text-sm font-semibold text-muted">{label}</span>
      {chipClass ? (
        <span className="min-w-0">
          <span className={`chip ${chipClass}`}>{value}</span>
        </span>
      ) : (
        <span className="min-w-0 break-words font-display text-sm font-extrabold tracking-[-0.02em]">
          {value}
        </span>
      )}
    </div>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-5 py-4 sm:px-6">
      <p className="micro-label">{label}</p>
      <p
        title={value}
        className="mt-1 truncate font-display text-sm font-extrabold tracking-[-0.02em]"
      >
        {value}
      </p>
    </div>
  );
}

function StatusTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "amber" | "grey";
}) {
  return (
    <div className="soft-panel min-w-0 p-5 sm:p-6">
      <p className="micro-label">{label}</p>
      <p className="mt-1.5 flex min-w-0 items-center gap-2">
        {tone ? (
          <span
            className="status-dot shrink-0"
            data-tone={tone === "ok" ? undefined : tone}
            aria-hidden="true"
          />
        ) : null}
        <span
          title={value}
          className="min-w-0 truncate font-display text-sm font-extrabold tracking-[-0.02em]"
        >
          {value}
        </span>
      </p>
    </div>
  );
}

function outboxChipClass(status: string) {
  switch (status) {
    case "sent":
      return "chip-green";
    case "failed":
    case "error":
      return "chip-red";
    case "pending":
    case "queued":
      return "chip-amber";
    default:
      return "chip-blue";
  }
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
