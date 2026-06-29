"use client";

import axios from "axios";
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
import { getChannels } from "@/lib/api/generated/channels/channels";

type ChannelStatus = "active" | "disabled" | "error" | "unknown";

type ChannelRow = {
  id?: string;
  type: string;
  name: string;
  status: ChannelStatus;
  updatedAt?: string;
};

const channelsApi = getChannels();

const webhookPath = "/api/v1/channels/webhook/telegram";
const widgetSnippet = `<script src="https://app.ai-manager.local/widget.js" data-channel="telegram"></script>`;

const onboardingSteps = [
  "Создать бота через @BotFather и получить токен.",
  "Сохранить токен Telegram в AI Manager после готовности backend-ручки.",
  "Подключить webhook и проверить входящее тестовое сообщение.",
  "Синхронизировать чаты и вывести диалоги в inbox.",
];

export default function ChannelsPage() {
  const [botToken, setBotToken] = useState("");
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["channels"],
    queryFn: () => channelsApi.listChannelsApiV1ChannelsGet(),
    retry: 1,
  });

  const channels = useMemo(() => normalizeChannels(data), [data]);
  const telegramChannel = channels.find((channel) => channel.type === "telegram");
  const hasTelegram = Boolean(telegramChannel);

  const syncCards = [
    {
      label: "Статус API",
      value: error ? "Ошибка запроса" : isLoading ? "Проверяем" : "Доступен",
      tone: error ? "error" : isLoading ? "warn" : "ok",
    },
    {
      label: "Telegram",
      value: hasTelegram ? statusLabel(telegramChannel?.status) : "Не подключён",
      tone: hasTelegram && telegramChannel?.status === "active" ? "ok" : "warn",
    },
    {
      label: "Последняя синхронизация",
      value: telegramChannel?.updatedAt ? formatDate(telegramChannel.updatedAt) : "ещё не запускалась",
      tone: telegramChannel?.updatedAt ? "ok" : "warn",
    },
  ] as const;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!botToken.trim()) {
      setFormMessage("Вставь токен Telegram-бота, чтобы подготовить подключение.");
      return;
    }

    setFormMessage(
      "Фронт готов к отправке токена, но backend-контракт пока не принимает credentials. Следующий шаг — реализовать POST /channels для Telegram.",
    );
  }

  async function copyToClipboard(value: string, key: string) {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1600);
  }

  return (
    <AppShell
      title="Каналы"
      description="В MVP подключаем только Telegram: показываем статус API, готовим форму токена и webhook для синхронизации чатов."
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <section className="space-y-5">
          <div className="glass-card rounded-[1.75rem] p-6">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.22em] text-orange-600">
                  Первый канал
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight">Telegram</h2>
                <p className="mt-2 max-w-2xl text-neutral-600">
                  Здесь менеджер подключает Telegram-бота, видит состояние интеграции и понимает,
                  готов ли канал отправлять новые сообщения в общую ленту диалогов.
                </p>
              </div>

              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                {isFetching ? <Loader2 size={16} className="animate-spin" /> : <RadioTower size={16} />}
                Обновить статус
              </button>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {syncCards.map((item) => (
                <StatusCard key={item.label} {...item} />
              ))}
            </div>

            {error ? (
              <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 shrink-0" size={18} />
                  <div>
                    <p className="font-black">Не удалось получить список каналов</p>
                    <p className="mt-1">{getApiErrorMessage(error, "Проверь авторизацию и доступность backend.")}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
            <form onSubmit={handleSubmit} className="rounded-[1.75rem] bg-[#17130f] p-6 text-white shadow-xl">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-black">
                  <Send size={20} />
                </span>
                <div>
                  <h3 className="font-black">Подключение Telegram-бота</h3>
                  <p className="text-sm text-white/55">Форма готова под будущий backend-контракт Telegram.</p>
                </div>
              </div>

              <label className="mt-6 block text-sm font-bold text-white/70" htmlFor="telegram-token">
                Токен бота
              </label>
              <div className="mt-2 grid gap-3 md:grid-cols-[1fr_auto]">
                <input
                  id="telegram-token"
                  value={botToken}
                  onChange={(event) => setBotToken(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-orange-300"
                  placeholder="123456:ABC-telegram-bot-token"
                />
                <button
                  type="submit"
                  className="rounded-2xl bg-orange-400 px-5 py-3 text-sm font-black text-black transition hover:-translate-y-0.5 hover:bg-orange-300"
                >
                  Подготовить
                </button>
              </div>

              {formMessage ? (
                <p className="mt-4 rounded-2xl border border-white/10 bg-white/10 p-3 text-sm text-white/75">
                  {formMessage}
                </p>
              ) : null}

              <p className="mt-4 text-xs leading-5 text-white/45">
                Токен не сохраняется на фронте. После backend-задачи он должен уходить в защищённую ручку,
                шифроваться и храниться только на сервере.
              </p>
            </form>

            <div className="glass-card rounded-[1.75rem] p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <ShieldCheck size={20} />
                </span>
                <div>
                  <h3 className="font-black">Безопасность</h3>
                  <p className="text-sm text-neutral-500">Что важно для реального подключения</p>
                </div>
              </div>

              <ul className="mt-5 space-y-3 text-sm text-neutral-600">
                <li className="rounded-2xl bg-white p-3 shadow-sm">Не показывать сохранённый токен повторно.</li>
                <li className="rounded-2xl bg-white p-3 shadow-sm">Шифровать credentials на backend.</li>
                <li className="rounded-2xl bg-white p-3 shadow-sm">Проверять webhook и дедуплицировать события.</li>
              </ul>
            </div>
          </div>

          <div className="glass-card rounded-[1.75rem] p-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h3 className="text-xl font-black">Подключённые каналы</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Таблица уже читает `GET /api/v1/channels`; сейчас backend может вернуть пустой список.
                </p>
              </div>
              <span className="rounded-full bg-white px-4 py-2 text-sm font-black shadow-sm">
                {channels.length} всего
              </span>
            </div>

            <div className="mt-5 overflow-hidden rounded-3xl border border-black/10 bg-white">
              {isLoading ? (
                <div className="flex items-center justify-center gap-3 p-8 text-sm font-bold text-neutral-500">
                  <Loader2 size={18} className="animate-spin" />
                  Загружаем каналы
                </div>
              ) : channels.length > 0 ? (
                <div className="divide-y divide-black/10">
                  {channels.map((channel) => (
                    <div key={channel.id ?? channel.type} className="grid gap-3 p-4 md:grid-cols-[1fr_160px_180px] md:items-center">
                      <div>
                        <p className="font-black">{channel.name}</p>
                        <p className="text-sm text-neutral-500">{channel.type}</p>
                      </div>
                      <StatusPill status={channel.status} />
                      <p className="text-sm text-neutral-500">
                        {channel.updatedAt ? formatDate(channel.updatedAt) : "нет синхронизации"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Smartphone className="mx-auto text-orange-500" size={32} />
                  <p className="mt-3 font-black">Каналы ещё не подключены</p>
                  <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
                    Это нормальное состояние для текущего backend: список каналов уже запрашивается,
                    но подключение Telegram будет активировано следующей backend-задачей.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="glass-card rounded-[1.75rem] p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                <Smartphone size={20} />
              </span>
              <div>
                <h2 className="font-black">Порядок подключения</h2>
                <p className="text-sm text-neutral-500">Мини-чеклист Telegram</p>
              </div>
            </div>

            <ol className="mt-5 space-y-3 text-sm">
              {onboardingSteps.map((item, index) => (
                <li key={item} className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-black text-xs font-black text-white">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>

          <CopyCard
            title="Webhook URL"
            description="Адрес для входящих Telegram-событий."
            icon={<Webhook size={20} />}
            value={webhookPath}
            copied={copied === "webhook"}
            onCopy={() => copyToClipboard(webhookPath, "webhook")}
          />

          <CopyCard
            title="Виджет сайта"
            description="Справочный snippet для будущего web-chat этапа."
            icon={<RadioTower size={20} />}
            value={widgetSnippet}
            copied={copied === "widget"}
            onCopy={() => copyToClipboard(widgetSnippet, "widget")}
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
      <AlertCircle size={20} className={tone === "error" ? "text-red-500" : "text-orange-500"} />
    );

  return (
    <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
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
        : "bg-orange-100 text-orange-700";

  return (
    <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ${className}`}>
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
    <div className="glass-card rounded-[1.75rem] p-5">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-black text-white">{icon}</span>
        <div>
          <h2 className="font-black">{title}</h2>
          <p className="text-sm text-neutral-500">{description}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white p-3 text-sm text-neutral-500 shadow-sm">
        <code className="min-w-0 flex-1 truncate">{value}</code>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-xl p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-black"
          aria-label={`Скопировать ${title}`}
        >
          {copied ? <ClipboardCheck size={16} className="text-emerald-600" /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
}

function normalizeChannels(value: unknown): ChannelRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item, index) => {
      const type = typeof item.type === "string" ? item.type : "unknown";
      const name = typeof item.name === "string" && item.name.trim() ? item.name : channelName(type);
      const status = normalizeStatus(item.status);
      const updatedAt = typeof item.updated_at === "string" ? item.updated_at : undefined;
      const id = typeof item.id === "string" ? item.id : `${type}-${index}`;

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

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const detail = error.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    const firstMessage = detail.find((item) => typeof item?.msg === "string")?.msg;
    if (firstMessage) {
      return firstMessage;
    }
  }

  return error.message || fallback;
}
