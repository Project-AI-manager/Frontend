"use client";

import {
  AlertCircle,
  Check,
  ClipboardCheck,
  Copy,
  Loader2,
  RadioTower,
  Send,
  ShieldCheck,
  Smartphone,
  Webhook,
} from "lucide-react";
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

/**
 * Тон статуса. Правило одно на весь экран:
 * `ok` — всё работает, `error` — реальная поломка, `warn` — от пользователя
 * нужно действие, `neutral` — нейтральный факт или идущий процесс.
 * Янтарный никогда не используется для «идёт проверка» и «события ещё не было».
 */
type Tone = "ok" | "warn" | "error" | "neutral";

type BadgeState = "done" | "current" | "next";

const channelsApi = getChannels();

const UNKNOWN_TYPE_LABEL = "Тип не определён";

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

  // Канал не заведён — это единственное состояние Telegram, требующее действия
  // пользователя. «Выключен» тоже включается вручную. «Неизвестно» — просто
  // отсутствие данных о статусе, тревожить им незачем.
  const telegramTone: Tone = !hasTelegram
    ? "warn"
    : telegramChannel?.status === "active"
      ? "ok"
      : telegramChannel?.status === "error"
        ? "error"
        : telegramChannel?.status === "disabled"
          ? "warn"
          : "neutral";

  const syncCards = [
    {
      label: "Связь с сервисом",
      value: error ? "Ошибка запроса" : isLoading ? "Проверяем" : "Доступен",
      // «Проверяем» — идущий процесс, а не проблема: нейтральный тон.
      tone: error ? "error" : isLoading ? "neutral" : "ok",
    },
    {
      label: "Telegram",
      value: hasTelegram
        ? statusLabel(telegramChannel?.status)
        : "Не подключён",
      tone: telegramTone,
    },
    {
      label: "Последняя синхронизация",
      value: telegramChannel?.updatedAt
        ? formatDate(telegramChannel.updatedAt)
        : "ещё не запускалась",
      // Дата — факт, а не состояние; её отсутствие ничего не требует от
      // пользователя. Поэтому тон нейтральный в обоих случаях.
      tone: "neutral",
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
        <section className="panel p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
            <div className="flex min-w-0 items-start gap-4">
              <span className="icon-badge shrink-0" aria-hidden="true">
                <Send size={20} />
              </span>
              <div className="min-w-0">
                <p className="section-kicker">Состояние подключения</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <h2 className="font-display text-xl font-extrabold tracking-[-0.04em] sm:text-2xl">
                    Telegram
                  </h2>
                  <span
                    className="status-dot shrink-0"
                    data-tone={
                      telegramTone === "ok"
                        ? undefined
                        : telegramTone === "neutral"
                          ? "grey"
                          : "amber"
                    }
                    aria-hidden="true"
                  />
                  <span className={`chip shrink-0 ${chipToneClass(telegramTone)}`}>
                    {hasTelegram
                      ? statusLabel(telegramChannel?.status)
                      : "Не подключён"}
                  </span>
                </div>
                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-balance text-muted">
                  Авторизуй личный аккаунт и отправь ему тестовое сообщение —
                  оно появится в общей ленте диалогов.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => refetch()}
              className="btn btn-secondary btn-sm shrink-0 self-start"
            >
              {isFetching ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RadioTower size={16} />
              )}
              Обновить статус
            </button>
          </div>

          <dl className="mt-6 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-3">
            {syncCards.map((item) => (
              <div key={item.label} className="min-w-0 bg-white p-4">
                <dt className="micro-label truncate">{item.label}</dt>
                <dd className="mt-2 min-w-0">
                  <span
                    className={`chip max-w-full overflow-hidden ${chipToneClass(item.tone)}`}
                  >
                    {item.value}
                  </span>
                </dd>
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
              icon={<Webhook size={20} />}
              value="MTProto · локальный listener"
              copied={copied === "webhook"}
              onCopy={() => copyToClipboard("MTProto · локальный listener", "webhook")}
            />
          </div>

          {error ? (
            <StateCard
              className="mt-4"
              icon={<AlertCircle size={22} />}
              title="Не удалось получить список каналов"
              description={getApiErrorMessage(
                error,
                "Обнови страницу или повтори попытку позже.",
              )}
              tone="error"
            />
          ) : null}
        </section>

        {/* Пошаговый поток авторизации личного аккаунта. */}
        <section className="panel grid overflow-hidden lg:grid-cols-[minmax(0,1fr)_320px]">
          <form onSubmit={handleSubmit} className="min-w-0 p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <span className="icon-badge shrink-0" aria-hidden="true">
                <Send size={20} />
              </span>
              <div className="min-w-0">
                <p className="section-kicker">Авторизация</p>
                <h2 className="mt-1.5 font-display text-xl font-extrabold tracking-[-0.04em] text-balance sm:text-2xl">
                  Подключение личного Telegram
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-muted">
                  Данные передаются и хранятся в защищённом виде.
                </p>
              </div>
            </div>

            <ol className="mt-6 grid gap-3 sm:grid-cols-3">
              {authSteps.map((step, index) => {
                const state: BadgeState =
                  index < activeStepIndex
                    ? "done"
                    : index === activeStepIndex
                      ? "current"
                      : "next";

                return (
                  <li
                    key={step.key}
                    className={`flex min-w-0 items-center gap-3 rounded-md border p-3 ${
                      state === "current"
                        ? "border-brand/35 bg-white"
                        : "border-line-soft bg-mist"
                    }`}
                  >
                    <span
                      className="num-badge num-badge-sm shrink-0"
                      data-state={state}
                      aria-hidden="true"
                    >
                      {state === "done" ? (
                        <Check size={18} />
                      ) : (
                        String(index + 1).padStart(2, "0")
                      )}
                    </span>
                    <span
                      className={`font-display min-w-0 text-[13px] leading-5 font-extrabold tracking-[-0.02em] ${
                        state === "next" ? "text-faint" : "text-ink"
                      }`}
                    >
                      {step.label}
                    </span>
                  </li>
                );
              })}
            </ol>

            <label
              className="field-label mt-6"
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
              className="field text-sm"
              placeholder={authStep === "phone" ? "+7 999 000-00-00" : authStep === "code" ? "12345" : "Облачный пароль"}
              disabled={isSubmitting || authStep === "active"}
            />

            {formMessage ? (
              <p className="notice notice-brand mt-4" role="status">
                {formMessage}
              </p>
            ) : null}

            {/* Это гарантия безопасности, а не предупреждение: янтарный тон здесь
                пугал на ровном месте. Действий от пользователя блок не требует. */}
            <div className="soft-panel mt-4 flex items-start gap-3 p-4">
              <span
                className="icon-badge icon-badge-ok shrink-0 border border-ok/20"
                aria-hidden="true"
              >
                <ShieldCheck size={20} />
              </span>
              <p className="text-[13px] leading-6 text-muted">
                Сессия аккаунта шифруется на backend. Код и пароль 2FA не сохраняются.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary mt-5 w-full sm:w-auto"
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              {authStep === "phone" ? "Отправить код" : authStep === "code" ? "Подтвердить код" : authStep === "password" ? "Подтвердить 2FA" : "Аккаунт подключён"}
            </button>
          </form>

          <aside className="min-w-0 border-t border-line bg-mist p-5 sm:p-6 lg:border-t-0 lg:border-l">
            <div className="flex items-center gap-3">
              <span className="icon-badge shrink-0" aria-hidden="true">
                <ShieldCheck size={20} />
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-base font-extrabold tracking-[-0.02em]">
                  После подключения
                </h3>
                <p className="mt-0.5 text-sm text-muted">Короткая проверка</p>
              </div>
            </div>

            <ol className="mt-5 space-y-4">
              {onboardingSteps.slice(1).map((item, index) => (
                <li key={item} className="flex gap-3">
                  <span className="num-badge num-badge-xs shrink-0" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 pt-1 text-sm leading-6 text-muted">
                    {item}
                  </span>
                </li>
              ))}
            </ol>
          </aside>
        </section>

        {/* Требования к подключению: что нужно от пользователя. */}
        <section className="panel p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span className="icon-badge shrink-0" aria-hidden="true">
              <Smartphone size={20} />
            </span>
            <div className="min-w-0">
              <p className="section-kicker">Инструкция</p>
              <h2 className="mt-1.5 font-display text-xl font-extrabold tracking-[-0.04em] text-balance sm:text-2xl">
                Порядок подключения
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-muted">
                Короткий чек-лист Telegram
              </p>
            </div>
          </div>

          <ol className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {onboardingSteps.map((item, index) => (
              <li
                key={item}
                className="card card-hover flex h-full flex-col gap-4 p-5"
              >
                <span className="num-badge num-badge-sm shrink-0" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-sm leading-6 text-muted">{item}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Подключённые каналы. */}
        <section className="panel overflow-hidden">
          <div className="flex flex-col justify-between gap-4 p-5 sm:p-6 md:flex-row md:items-center">
            <div className="min-w-0">
              <p className="section-kicker">Все подключения</p>
              <h2 className="mt-1.5 font-display text-xl font-extrabold tracking-[-0.04em] text-balance sm:text-2xl">
                Подключённые каналы
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-muted">
                Список синхронизируется с рабочим пространством.
              </p>
            </div>
            <span className="chip chip-blue shrink-0">
              {channels.length} всего
            </span>
          </div>

          <div className="border-t border-line bg-white">
            {isLoading ? (
              <div className="p-4 sm:p-6">
                <StateCard variant="loading" title="Загружаем каналы" rows={3} />
              </div>
            ) : channels.length > 0 ? (
              <ul className="divide-y divide-line-soft">
                {channels.map((channel) => {
                  const typeLabel = channelTypeLabel(channel.type);

                  return (
                    <li
                      key={channel.id ?? channel.type}
                      className="grid gap-2 p-4 sm:gap-3 md:grid-cols-[minmax(0,1fr)_140px_190px] md:items-center md:px-6"
                    >
                      <div className="min-w-0">
                        <p className="font-display truncate font-extrabold">
                          {channel.name}
                        </p>
                        {/* Показываем человекочитаемый тип; сырой слаг модели
                            данных остаётся только в подсказке title. Если имя
                            канала и есть его тип — вторую строку не дублируем. */}
                        {typeLabel === channel.name ? null : (
                          <p
                            className="truncate text-sm text-muted"
                            title={channel.type}
                          >
                            {typeLabel}
                          </p>
                        )}
                      </div>
                      <StatusPill status={channel.status} />
                      <p className="text-sm text-muted">
                        {channel.updatedAt
                          ? formatDate(channel.updatedAt)
                          : "нет синхронизации"}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="p-4 sm:p-6">
                <StateCard
                  align="center"
                  icon={<Smartphone size={22} />}
                  title="Каналы ещё не подключены"
                  description="Авторизуй личный Telegram-аккаунт выше, и канал появится здесь после подтверждения кода."
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function StatusPill({ status }: { status: ChannelStatus }) {
  const toneClass =
    status === "active"
      ? "chip-green"
      : status === "error"
        ? "chip-red"
        : status === "disabled"
          ? "chip-amber"
          : "chip-grey";

  return <span className={`chip w-fit ${toneClass}`}>{statusLabel(status)}</span>;
}

function CopyCard({
  title,
  description,
  icon,
  value,
  copied,
  onCopy,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="soft-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
      <span className="icon-badge shrink-0" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="field-label">{title}</p>
        <p className="text-[13px] leading-5 text-muted">{description}</p>
      </div>
      {/* Паддинг контейнера уменьшен под кнопку 40px — высота строки прежняя. */}
      <div className="flex min-w-0 items-center gap-2 rounded-md border border-line bg-white px-2 py-1 sm:w-[270px]">
        <code className="min-w-0 flex-1 truncate pl-1 text-xs text-muted">
          {value}
        </code>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-line bg-white text-faint transition hover:border-brand/40 hover:bg-brand-soft hover:text-brand"
          aria-label={`Скопировать ${title}`}
        >
          {copied ? (
            <ClipboardCheck size={16} className="text-ok" />
          ) : (
            <Copy size={16} />
          )}
        </button>
      </div>
    </div>
  );
}

function chipToneClass(tone: Tone) {
  switch (tone) {
    case "ok":
      return "chip-green";
    case "error":
      return "chip-red";
    case "warn":
      return "chip-amber";
    default:
      return "chip-grey";
  }
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
