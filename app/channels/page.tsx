"use client";

import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Loader2,
  RadioTower,
  Send,
  ShieldCheck,
  Smartphone,
  Webhook,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/layout/app-shell";
import { StateCard } from "@/components/ui/state-card";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { ChannelResponse } from "@/lib/api/generated/ai.schemas";
import { getChannels } from "@/lib/api/generated/channels/channels";

type ChannelStatus = "active" | "disabled" | "error" | "unknown";

type ChannelRow = {
  id?: string;
  type: string;
  name: string;
  status: ChannelStatus;
  updatedAt?: string;
  webhookPath?: string;
};

const channelsApi = getChannels();

const webhookPath = "/api/v1/channels/webhook/telegram";
const onboardingSteps = [
  "Создать бота через @BotFather и получить токен.",
  "Сохранить токен Telegram в рабочем кабинете.",
  "Скопировать webhook URL из подключённого канала в настройки Telegram.",
  "Проверить входящее тестовое сообщение и убедиться, что диалог появился в inbox.",
];

export default function ChannelsPage() {
  const [botToken, setBotToken] = useState("");
  const [botUsername, setBotUsername] = useState("");
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
  const telegramWebhookPath = telegramChannel?.webhookPath ?? webhookPath;

  const syncCards = [
    {
      label: "Связь с сервисом",
      value: error ? "Ошибка запроса" : isLoading ? "Проверяем" : "Доступен",
      tone: error ? "error" : isLoading ? "warn" : "ok",
    },
    {
      label: "Telegram",
      value: hasTelegram
        ? statusLabel(telegramChannel?.status)
        : "Не подключён",
      tone: hasTelegram && telegramChannel?.status === "active" ? "ok" : "warn",
    },
    {
      label: "Последняя синхронизация",
      value: telegramChannel?.updatedAt
        ? formatDate(telegramChannel.updatedAt)
        : "ещё не запускалась",
      tone: telegramChannel?.updatedAt ? "ok" : "warn",
    },
  ] as const;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage(null);

    const trimmedToken = botToken.trim();
    const trimmedUsername = botUsername.trim();

    if (!trimmedToken) {
      setFormMessage(
        "Вставь токен Telegram-бота, чтобы подготовить подключение.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await channelsApi.connectChannelApiV1ChannelsPost({
        type: "telegram",
        bot_token: trimmedToken,
        bot_username: trimmedUsername,
        name: "Telegram",
      });
      setBotToken("");
      await refetch();
      setFormMessage(
        "Telegram подключён. Webhook URL обновлён в карточке справа.",
      );
    } catch (submitError) {
      setFormMessage(
        getApiErrorMessage(
          submitError,
          "Не удалось подключить Telegram. Проверь токен и повтори попытку.",
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
      <div className="mx-auto grid max-w-5xl gap-6">
        <section className="space-y-6">
          <div className="surface-card overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                <div>
                  <p className="brand-kicker">Состояние подключения</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight">
                    Telegram
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#526071]">
                    Добавь бота, проверь адрес подключения и отправь тестовое
                    сообщение — оно появится в общей ленте диалогов.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => refetch()}
                  className="secondary-button px-4 py-2.5 text-sm"
                >
                  {isFetching ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <RadioTower size={16} />
                  )}
                  Обновить статус
                </button>
              </div>

              <div className="mt-8 grid overflow-hidden rounded-lg border border-[#d9e1ec] md:grid-cols-3">
                {syncCards.map((item) => (
                  <StatusCard key={item.label} {...item} />
                ))}
              </div>

              {error ? (
                <StateCard
                  className="mt-6"
                  icon={<AlertCircle size={18} />}
                  title="Не удалось получить список каналов"
                  description={getApiErrorMessage(
                    error,
                    "Обнови страницу или повтори попытку позже.",
                  )}
                  tone="error"
                />
              ) : null}
            </div>
          </div>

          <div className="surface-card grid overflow-hidden lg:grid-cols-[minmax(0,1fr)_320px]">
            <form onSubmit={handleSubmit} className="p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-lg bg-[#eaf1ff] text-[#2463eb]">
                  <Send size={20} />
                </span>
                <div>
                  <h3 className="font-black">Подключение Telegram-бота</h3>
                  <p className="text-sm text-[#526071]">
                    Данные передаются и хранятся в защищённом виде.
                  </p>
                </div>
              </div>

              <label
                className="mt-6 block text-sm font-bold"
                htmlFor="telegram-token"
              >
                Токен бота
              </label>
              <div className="mt-2">
                <input
                  id="telegram-token"
                  value={botToken}
                  onChange={(event) => setBotToken(event.target.value)}
                  className="form-field w-full px-4 py-3 text-sm"
                  placeholder="123456:ABC-telegram-bot-token"
                  disabled={isSubmitting}
                />
              </div>

              <label
                className="mt-4 block text-sm font-bold"
                htmlFor="telegram-username"
              >
                Имя бота{" "}
                <span className="font-normal text-[#526071]">
                  (необязательно)
                </span>
              </label>
              <input
                id="telegram-username"
                value={botUsername}
                onChange={(event) => setBotUsername(event.target.value)}
                className="form-field mt-2 px-4 py-3 text-sm"
                placeholder="ai_manager_bot"
                disabled={isSubmitting}
              />

              {formMessage ? (
                <p
                  className="mt-4 rounded-lg border border-[rgba(36,99,235,0.18)] bg-[#eaf1ff] p-3 text-sm font-semibold text-[#1546ad]"
                  role="status"
                >
                  {formMessage}
                </p>
              ) : null}

              <p className="mt-4 text-xs leading-5 text-[#526071]">
                Сохранённый токен нельзя посмотреть повторно. Для замены введи
                новый токен и обнови подключение.
              </p>
              <button
                type="submit"
                disabled={isSubmitting}
                className="primary-button mt-5 px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {hasTelegram ? "Обновить подключение" : "Подключить Telegram"}
              </button>
            </form>

            <aside className="border-t border-[#d9e1ec] bg-[#f8fbff] p-6 sm:p-8 lg:border-l lg:border-t-0">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-lg bg-[#eaf1ff] text-[#2463eb]">
                  <ShieldCheck size={20} />
                </span>
                <div>
                  <h3 className="font-black">После подключения</h3>
                  <p className="text-sm text-[#526071]">Короткая проверка</p>
                </div>
              </div>

              <ol className="mt-5 space-y-4 text-sm text-[#526071]">
                {onboardingSteps.slice(1).map((item, index) => (
                  <li key={item} className="flex gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-[#1546ad] shadow-sm">
                      {index + 1}
                    </span>
                    <span className="leading-6">{item}</span>
                  </li>
                ))}
              </ol>
            </aside>
          </div>

          <div className="surface-card overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h3 className="text-xl font-black">Подключённые каналы</h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    Список синхронизируется с рабочим пространством.
                  </p>
                </div>
                <span className="rounded-full bg-[#eaf1ff] px-4 py-2 text-sm font-black text-[#1546ad]">
                  {channels.length} всего
                </span>
              </div>
            </div>
            <div className="border-t border-[#d9e1ec] bg-white">
              {isLoading ? (
                <div className="flex items-center justify-center gap-3 p-8 text-sm font-bold text-neutral-500">
                  <Loader2 size={18} className="animate-spin" />
                  Загружаем каналы
                </div>
              ) : channels.length > 0 ? (
                <div className="divide-y divide-[#d9e1ec]">
                  {channels.map((channel) => (
                    <div
                      key={channel.id ?? channel.type}
                      className="grid gap-3 p-4 md:grid-cols-[1fr_160px_180px] md:items-center"
                    >
                      <div>
                        <p className="font-black">{channel.name}</p>
                        <p className="text-sm text-neutral-500">
                          {channel.type}
                        </p>
                      </div>
                      <StatusPill status={channel.status} />
                      <p className="text-sm text-neutral-500">
                        {channel.updatedAt
                          ? formatDate(channel.updatedAt)
                          : "нет синхронизации"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Smartphone className="mx-auto text-[#2463eb]" size={32} />
                  <p className="mt-3 font-black">Каналы ещё не подключены</p>
                  <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
                    Добавь токен Telegram-бота выше, и канал появится здесь
                    после успешного подключения.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="grid gap-6 md:grid-cols-2">
          <div className="surface-card p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-lg bg-[#eaf1ff] text-[#2463eb]">
                <Smartphone size={20} />
              </span>
              <div>
                <h2 className="font-black">Порядок подключения</h2>
                <p className="text-sm text-neutral-500">
                  Короткий чек-лист Telegram
                </p>
              </div>
            </div>

            <ol className="mt-5 space-y-3 text-sm">
              {onboardingSteps.map((item, index) => (
                <li
                  key={item}
                  className="flex gap-3 border-t border-[#d9e1ec] pt-3 first:border-0 first:pt-0"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#2463eb] text-xs font-black text-white">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>

          <CopyCard
            title="Webhook URL"
            description={
              hasTelegram
                ? "Индивидуальный адрес подключённого Telegram-канала."
                : "Появится с секретом после подключения канала."
            }
            icon={<Webhook size={20} />}
            value={telegramWebhookPath}
            copied={copied === "webhook"}
            onCopy={() => copyToClipboard(telegramWebhookPath, "webhook")}
          />
        </aside>
      </div>
    </AppShell>
  );
}

function StatusCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "ok" | "warn" | "error";
}) {
  const icon =
    tone === "ok" ? (
      <CheckCircle2 size={20} className="text-emerald-500" />
    ) : (
      <AlertCircle
        size={20}
        className={tone === "error" ? "text-red-500" : "text-[#2463eb]"}
      />
    );

  return (
    <div className="border-b border-[#d9e1ec] bg-white p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
      {icon}
      <p className="mt-4 text-sm text-neutral-500">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: ChannelStatus }) {
  const className =
    status === "active"
      ? "bg-emerald-100 text-emerald-700"
      : status === "error"
        ? "bg-red-100 text-red-700"
        : "bg-[#eaf1ff] text-[#1546ad]";

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ${className}`}
    >
      {statusLabel(status)}
    </span>
  );
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
    <div className="glass-card rounded-lg p-5">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-lg bg-[#2463eb] text-white">
          {icon}
        </span>
        <div>
          <h2 className="font-black">{title}</h2>
          <p className="text-sm text-neutral-500">{description}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-lg bg-white p-3 text-sm text-neutral-500 shadow-sm">
        <code className="min-w-0 flex-1 truncate">{value}</code>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-xl p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-[#101828]"
          aria-label={`Скопировать ${title}`}
        >
          {copied ? (
            <ClipboardCheck size={16} className="text-emerald-600" />
          ) : (
            <Copy size={16} />
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
    const webhookPathValue = item.settings.webhook_path;
    const webhookPath =
      typeof webhookPathValue === "string" ? webhookPathValue : undefined;

    return { id, type, name, status, updatedAt, webhookPath };
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

function channelName(type: string) {
  if (type === "telegram") {
    return "Telegram";
  }

  if (type === "web") {
    return "Веб-чат";
  }

  return `Канал ${type}`;
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
