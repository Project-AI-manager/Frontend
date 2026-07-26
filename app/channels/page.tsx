"use client";

import { Check, ClipboardCheck, Copy, RefreshCw, Send } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/layout/app-shell";
import { StateCard } from "@/components/ui/state-card";
import { getApiErrorMessage } from "@/lib/api/errors";
import { axiosInstance } from "@/lib/api/client";
import type { ChannelResponse } from "@/lib/api/generated/ai.schemas";
import { getChannels } from "@/lib/api/generated/channels/channels";

type ChannelStatus = "active" | "disabled" | "error" | "unknown";

type ChannelRow = {
  id?: string;
  type: string;
  name: string;
  status: ChannelStatus;
  updatedAt?: string;
};

type StepState = "done" | "current" | "next";

const channelsApi = getChannels();

const UNKNOWN_TYPE_LABEL = "Тип не определён";

const skeletonRows = [0, 1, 2];

const onboardingSteps = [
  "Ввести номер личного Telegram-аккаунта.",
  "Подтвердить одноразовый код из Telegram.",
  "При необходимости ввести пароль облачной 2FA.",
  "Проверить входящее тестовое сообщение и убедиться, что диалог появился в inbox.",
];

/** Подписи шагов авторизации совпадают с подписью активного поля формы. */
const authSteps = [
  { key: "phone", label: "Номер телефона" },
  { key: "code", label: "Код из Telegram" },
  { key: "password", label: "Пароль 2FA" },
] as const;

export default function ChannelsPage() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [authChannelId, setAuthChannelId] = useState<string | null>(null);
  const [authStep, setAuthStep] = useState<"phone" | "code" | "password" | "active">("phone");
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["channels"],
    queryFn: () => channelsApi.listChannelsApiV1ChannelsGet(),
    retry: 1,
  });

  const channels = useMemo(() => normalizeChannels(data), [data]);
  const telegramChannel = channels.find(
    (channel) => channel.type === "telegram",
  );
  const hasTelegram = Boolean(telegramChannel);

  const syncCards = [
    {
      label: "Связь с сервисом",
      value: error ? "Ошибка запроса" : isLoading ? "Проверяем" : "Доступен",
    },
    {
      label: "Telegram",
      value: hasTelegram
        ? statusLabel(telegramChannel?.status)
        : "Не подключён",
    },
    {
      label: "Последняя синхронизация",
      value: telegramChannel?.updatedAt
        ? formatDate(telegramChannel.updatedAt)
        : "ещё не запускалась",
    },
  ] as const;

  const activeStepIndex =
    authStep === "phone"
      ? 0
      : authStep === "code"
        ? 1
        : authStep === "password"
          ? 2
          : 3;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage(null);

    setIsSubmitting(true);

    try {
      if (authStep === "phone") {
        const { data } = await axiosInstance.post<{ channel_id: string }>(
          "/api/v1/channels/telegram/account/start",
          { phone: phone.trim() },
        );
        setAuthChannelId(data.channel_id);
        setAuthStep("code");
        setFormMessage("Код отправлен в Telegram. Введи его ниже.");
      } else if (authStep === "code" && authChannelId) {
        const { data } = await axiosInstance.post<{ status: string; display_name?: string }>(
          "/api/v1/channels/telegram/account/confirm",
          { channel_id: authChannelId, code: code.trim() },
        );
        if (data.status === "password_required") {
          setAuthStep("password");
          setFormMessage("Аккаунт защищён 2FA. Введи облачный пароль.");
        } else {
          setAuthStep("active");
          setFormMessage(`Telegram подключён${data.display_name ? `: ${data.display_name}` : "."}`);
          await refetch();
        }
      } else if (authStep === "password" && authChannelId) {
        const { data } = await axiosInstance.post<{ display_name?: string }>(
          "/api/v1/channels/telegram/account/password",
          { channel_id: authChannelId, password },
        );
        setPassword("");
        setAuthStep("active");
        setFormMessage(`Telegram подключён${data.display_name ? `: ${data.display_name}` : "."}`);
        await refetch();
      }
    } catch (submitError) {
      setFormMessage(
        getApiErrorMessage(
          submitError,
          "Не удалось подключить Telegram. Проверь данные и повтори попытку.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyToClipboard(value: string, key: string) {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1600);
  }

  return (
    <AppShell
      title="Каналы"
      description="Подключение Telegram и контроль состояния рабочего канала."
    >
      <div className="mx-auto max-w-5xl space-y-5 sm:space-y-6">
        {/* Карточка канала: статус, диагностика, технические детали. */}
        <section className="wf-box p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div className="min-w-0">
              <p className="wf-kicker">Состояние подключения</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-2">
                <h2 className="wf-title">Telegram</h2>
                <span className="wf-dot shrink-0" aria-hidden="true" />
                <span className="wf-tag shrink-0">
                  {hasTelegram
                    ? statusLabel(telegramChannel?.status)
                    : "Не подключён"}
                </span>
              </div>
              <p className="wf-muted mt-2 max-w-2xl text-sm leading-6 text-balance">
                Авторизуй личный аккаунт и отправь ему тестовое сообщение —
                оно появится в общей ленте диалогов.
              </p>
            </div>

            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="wf-btn shrink-0 self-start"
            >
              <RefreshCw size={18} className="text-muted" aria-hidden="true" />
              Обновить статус
            </button>
          </div>

          {/* Диагностика: строки «параметр → значение». */}
          <dl className="wf-fill mt-4">
            {syncCards.map((item) => (
              <div
                key={item.label}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line-soft px-3 py-2.5 last:border-b-0"
              >
                <dt className="wf-muted text-sm">{item.label}</dt>
                <dd className="min-w-0 text-sm">{item.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4">
            <CopyCard
              title="Режим подключения"
              description={
                hasTelegram
                  ? "Личный аккаунт подключён через постоянную MTProto-сессию."
                  : "Webhook и Telegram-бот для этого режима не требуются."
              }
              value="MTProto · локальный listener"
              copied={copied === "webhook"}
              onCopy={() => copyToClipboard("MTProto · локальный listener", "webhook")}
            />
          </div>

          {error ? (
            <StateCard
              className="mt-4"
              title="Не удалось получить список каналов"
              description={getApiErrorMessage(
                error,
                "Обнови страницу или повтори попытку позже.",
              )}
              variant="error"
            />
          ) : null}
        </section>

        {/* Пошаговый поток авторизации личного аккаунта. */}
        <section className="wf-box grid overflow-hidden lg:grid-cols-[minmax(0,1fr)_320px]">
          <form onSubmit={handleSubmit} className="min-w-0 p-4 sm:p-5">
            <p className="wf-kicker">Авторизация</p>
            <h2 className="wf-title mt-1.5 text-balance">
              Подключение личного Telegram
            </h2>
            <p className="wf-muted mt-2 text-sm leading-6">
              Данные передаются и хранятся в защищённом виде.
            </p>

            <ol className="mt-4 space-y-1.5">
              {authSteps.map((step, index) => {
                const state: StepState =
                  index < activeStepIndex
                    ? "done"
                    : index === activeStepIndex
                      ? "current"
                      : "next";

                return (
                  <li
                    key={step.key}
                    aria-current={state === "current" ? "step" : undefined}
                    className={`flex items-center gap-2 text-sm leading-6 ${
                      state === "current" ? "font-semibold" : "wf-muted"
                    }`}
                  >
                    <span className="shrink-0 tabular-nums">{index + 1}.</span>
                    <span className="min-w-0">{step.label}</span>
                    {state === "done" ? (
                      <Check
                        size={18}
                        className="shrink-0 text-muted"
                        aria-hidden="true"
                      />
                    ) : null}
                  </li>
                );
              })}
            </ol>

            <label
              className="wf-label mt-5"
              htmlFor="telegram-token"
            >
              {authStep === "phone" ? "Номер телефона" : authStep === "code" ? "Код из Telegram" : "Пароль 2FA"}
            </label>
            <input
              id="telegram-token"
              type={authStep === "password" ? "password" : "text"}
              value={authStep === "phone" ? phone : authStep === "code" ? code : password}
              onChange={(event) => {
                if (authStep === "phone") setPhone(event.target.value);
                else if (authStep === "code") setCode(event.target.value);
                else setPassword(event.target.value);
              }}
              className="wf-field text-sm"
              placeholder={authStep === "phone" ? "+7 999 000-00-00" : authStep === "code" ? "12345" : "Облачный пароль"}
              disabled={isSubmitting || authStep === "active"}
            />

            {formMessage ? (
              <p className="wf-fill mt-4 p-3 text-sm leading-6" role="status">
                {formMessage}
              </p>
            ) : null}

            <p className="wf-fill mt-4 p-3 text-sm leading-6">
              Сессия аккаунта шифруется на backend. Код и пароль 2FA не сохраняются.
            </p>

            <button
              type="submit"
              disabled={isSubmitting}
              className="wf-btn wf-btn-primary mt-4 w-full sm:w-auto"
            >
              <Send size={18} aria-hidden="true" />
              {authStep === "phone" ? "Отправить код" : authStep === "code" ? "Подтвердить код" : authStep === "password" ? "Подтвердить 2FA" : "Аккаунт подключён"}
            </button>
          </form>

          <aside className="min-w-0 border-t border-line bg-surface p-4 sm:p-5 lg:border-t-0 lg:border-l">
            <h3 className="text-base font-semibold">После подключения</h3>
            <p className="wf-muted mt-1 text-sm">Короткая проверка</p>

            <ol className="mt-4 space-y-2">
              {onboardingSteps.slice(1).map((item, index) => (
                <li key={item} className="flex gap-2 text-sm leading-6">
                  <span className="wf-muted shrink-0 tabular-nums">
                    {index + 1}.
                  </span>
                  <span className="wf-muted min-w-0">{item}</span>
                </li>
              ))}
            </ol>
          </aside>
        </section>

        {/* Требования к подключению: что нужно от пользователя. */}
        <section className="wf-box p-4 sm:p-5">
          <p className="wf-kicker">Инструкция</p>
          <h2 className="wf-title mt-1.5 text-balance">Порядок подключения</h2>
          <p className="wf-muted mt-2 text-sm leading-6">
            Короткий чек-лист Telegram
          </p>

          <ol className="mt-4 space-y-2">
            {onboardingSteps.map((item, index) => (
              <li key={item} className="flex gap-2 text-sm leading-6">
                <span className="wf-muted shrink-0 tabular-nums">
                  {index + 1}.
                </span>
                <span className="min-w-0">{item}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Подключённые каналы. */}
        <section>
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div className="min-w-0">
              <p className="wf-kicker">Все подключения</p>
              <h2 className="wf-title mt-1.5 text-balance">
                Подключённые каналы
              </h2>
              <p className="wf-muted mt-2 text-sm leading-6">
                Список синхронизируется с рабочим пространством.
              </p>
            </div>
            <span className="wf-tag shrink-0 self-start md:self-auto">
              {channels.length} всего
            </span>
          </div>

          <div className="mt-3">
            {isLoading ? (
              <div
                role="status"
                aria-label="Загружаем каналы"
                className="space-y-2"
              >
                {skeletonRows.map((row) => (
                  <div key={row} className="wf-box p-3">
                    <span className="wf-skeleton block h-3.5 w-40" />
                    <span className="wf-skeleton mt-2 block h-3 w-24" />
                    <span className="wf-skeleton mt-3 block h-5 w-20" />
                  </div>
                ))}
              </div>
            ) : channels.length > 0 ? (
              <ul className="space-y-2">
                {channels.map((channel) => {
                  const typeLabel = channelTypeLabel(channel.type);

                  return (
                    <li
                      key={channel.id ?? channel.type}
                      className="wf-box grid gap-2 p-3 md:grid-cols-[minmax(0,1fr)_140px_190px] md:items-center"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {channel.name}
                        </p>
                        {/* Показываем человекочитаемый тип; сырой слаг модели
                            данных остаётся только в подсказке title. Если имя
                            канала и есть его тип — вторую строку не дублируем. */}
                        {typeLabel === channel.name ? null : (
                          <p
                            className="wf-muted truncate text-sm"
                            title={channel.type}
                          >
                            {typeLabel}
                          </p>
                        )}
                      </div>
                      <StatusTag status={channel.status} />
                      <p className="wf-muted text-sm">
                        {channel.updatedAt
                          ? formatDate(channel.updatedAt)
                          : "нет синхронизации"}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <StateCard
                title="Каналы ещё не подключены"
                description="Авторизуй личный Telegram-аккаунт выше, и канал появится здесь после подтверждения кода."
              />
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function StatusTag({ status }: { status: ChannelStatus }) {
  return <span className="wf-tag w-fit">{statusLabel(status)}</span>;
}

function CopyCard({
  title,
  description,
  value,
  copied,
  onCopy,
}: {
  title: string;
  description: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="wf-fill flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="wf-muted text-sm leading-6">{description}</p>
      </div>
      <div className="flex min-w-0 items-center gap-2 sm:w-[270px]">
        <code className="wf-box min-w-0 flex-1 truncate px-2 py-1.5 text-xs">
          {value}
        </code>
        <button
          type="button"
          onClick={onCopy}
          className="wf-btn shrink-0"
          aria-label={`Скопировать ${title}`}
        >
          {copied ? (
            <ClipboardCheck size={18} className="text-muted" aria-hidden="true" />
          ) : (
            <Copy size={18} className="text-muted" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}

function normalizeChannels(value: ChannelResponse[] | undefined): ChannelRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item, index) => {
    const type = item.type || "unknown";
    const name =
      typeof item.name === "string" && item.name.trim()
        ? item.name
        : channelName(type);
    const status = normalizeStatus(item.status);
    const updatedAt = item.updated_at;
    const id = item.id || `${type}-${index}`;
    return { id, type, name, status, updatedAt };
  });
}

function normalizeStatus(value: unknown): ChannelStatus {
  if (value === "active" || value === "disabled" || value === "error") {
    return value;
  }

  return "unknown";
}

function statusLabel(status?: ChannelStatus) {
  switch (status) {
    case "active":
      return "Активен";
    case "disabled":
      return "Выключен";
    case "error":
      return "Ошибка";
    default:
      return "Неизвестно";
  }
}

/**
 * Человекочитаемое название типа канала. Сырой слаг модели данных
 * (`telegram`, `web`, `whatsapp_business`) в интерфейс не выносим —
 * он остаётся максимум в атрибуте `title`.
 */
function channelTypeLabel(type: string) {
  if (type === "telegram") {
    return "Telegram";
  }

  if (type === "web") {
    return "Веб-чат";
  }

  const readable = type.replace(/[_-]+/g, " ").trim();

  if (!readable || readable === "unknown") {
    return UNKNOWN_TYPE_LABEL;
  }

  return readable.charAt(0).toUpperCase() + readable.slice(1);
}

function channelName(type: string) {
  const label = channelTypeLabel(type);

  return label === UNKNOWN_TYPE_LABEL ? "Канал без названия" : label;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
