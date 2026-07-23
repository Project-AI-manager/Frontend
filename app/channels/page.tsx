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

const channelsApi = getChannels();

const onboardingSteps = [
  "Ввести номер личного Telegram-аккаунта.",
  "Подтвердить одноразовый код из Telegram.",
  "При необходимости ввести пароль облачной 2FA.",
  "Проверить входящее тестовое сообщение и убедиться, что диалог появился в inbox.",
];

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
                    Авторизуй личный аккаунт и отправь ему тестовое сообщение —
                    оно появится в общей ленте диалогов.
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
                  <h3 className="font-black">Подключение личного Telegram</h3>
                  <p className="text-sm text-[#526071]">
                    Данные передаются и хранятся в защищённом виде.
                  </p>
                </div>
              </div>

              <label
                className="mt-6 block text-sm font-bold"
                htmlFor="telegram-token"
              >
                {authStep === "phone" ? "Номер телефона" : authStep === "code" ? "Код из Telegram" : "Пароль 2FA"}
              </label>
              <div className="mt-2">
                <input
                  id="telegram-token"
                  type={authStep === "password" ? "password" : "text"}
                  value={authStep === "phone" ? phone : authStep === "code" ? code : password}
                  onChange={(event) => {
                    if (authStep === "phone") setPhone(event.target.value);
                    else if (authStep === "code") setCode(event.target.value);
                    else setPassword(event.target.value);
                  }}
                  className="form-field w-full px-4 py-3 text-sm"
                  placeholder={authStep === "phone" ? "+7 999 000-00-00" : authStep === "code" ? "12345" : "Облачный пароль"}
                  disabled={isSubmitting || authStep === "active"}
                />
              </div>

              {formMessage ? (
                <p
                  className="mt-4 rounded-lg border border-[rgba(36,99,235,0.18)] bg-[#eaf1ff] p-3 text-sm font-semibold text-[#1546ad]"
                  role="status"
                >
                  {formMessage}
                </p>
              ) : null}

              <p className="mt-4 text-xs leading-5 text-[#526071]">
                Сессия аккаунта шифруется на backend. Код и пароль 2FA не сохраняются.
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
                {authStep === "phone" ? "Отправить код" : authStep === "code" ? "Подтвердить код" : authStep === "password" ? "Подтвердить 2FA" : "Аккаунт подключён"}
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
                    Авторизуй личный Telegram-аккаунт выше, и канал появится
                    здесь после подтверждения кода.
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
