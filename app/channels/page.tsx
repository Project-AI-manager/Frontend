"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MessageCircle,
  RadioTower,
  RefreshCw,
  Send,
  Store,
  UsersRound,
} from "lucide-react";
import { type FormEvent, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { StateCard } from "@/components/ui/state-card";
import { axiosInstance } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { ChannelResponse } from "@/lib/api/generated/ai.schemas";
import { getChannels } from "@/lib/api/generated/channels/channels";

type AuthStep = "phone" | "code" | "password" | "active";

const api = getChannels();
const catalog = [
  {
    id: "telegram-account",
    name: "Telegram",
    account: "Личный аккаунт",
    mark: "TG",
    icon: MessageCircle,
  },
  {
    id: "telegram-bot",
    name: "Telegram Bot",
    account: "Бот для обращений",
    mark: "BOT",
    icon: Send,
  },
  {
    id: "vk",
    name: "VK",
    account: "Сообщения сообщества",
    mark: "VK",
    icon: UsersRound,
  },
  {
    id: "max",
    name: "MAX",
    account: "Диалоги в MAX",
    mark: "MAX",
    icon: RadioTower,
  },
  {
    id: "avito",
    name: "Avito",
    account: "Сообщения объявлений",
    mark: "A",
    icon: Store,
  },
  {
    id: "web",
    name: "Веб-чат",
    account: "Чат на сайте",
    mark: "WEB",
    icon: MessageCircle,
  },
] as const;

export default function ChannelsPage() {
  const queryClient = useQueryClient();
  const [editingBot, setEditingBot] = useState(false);
  const [botToken, setBotToken] = useState("");
  const [botUsername, setBotUsername] = useState("");
  const [botMessage, setBotMessage] = useState<string | null>(null);

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [authChannelId, setAuthChannelId] = useState<string | null>(null);
  const [authStep, setAuthStep] = useState<AuthStep>("phone");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const channels = useQuery({
    queryKey: ["channels"],
    queryFn: () => api.listChannelsApiV1ChannelsGet(),
    retry: 1,
  });

  const connectBot = useMutation({
    mutationFn: () =>
      api.connectChannelApiV1ChannelsPost({
        type: "telegram",
        bot_token: botToken.trim(),
        bot_username: botUsername.trim() || undefined,
        name: "Telegram Bot",
      }),
    onSuccess: async () => {
      setBotMessage("Telegram Bot подключён.");
      setBotToken("");
      setBotUsername("");
      setEditingBot(false);
      await queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
    onError: (error) =>
      setBotMessage(
        getApiErrorMessage(error, "Не удалось подключить Telegram Bot."),
      ),
  });

  async function submitPersonalAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthMessage(null);
    setAuthError(false);

    if (authStep === "phone" && phone.trim().length < 8) {
      setAuthError(true);
      setAuthMessage("Введите номер телефона в международном формате.");
      return;
    }
    if (authStep === "code" && code.trim().length < 3) {
      setAuthError(true);
      setAuthMessage("Введите код из Telegram.");
      return;
    }
    if (authStep === "password" && !password) {
      setAuthError(true);
      setAuthMessage("Введите пароль облачной 2FA.");
      return;
    }

    setIsAuthorizing(true);

    try {
      if (authStep === "phone") {
        const response = await axiosInstance.post<{
          channel_id: string;
          status: "code_required" | "active";
        }>("/api/v1/channels/telegram/account/start", {
          phone: phone.trim(),
        });

        setAuthChannelId(response.data.channel_id);
        if (response.data.status === "active") {
          await completePersonalAccount();
        } else {
          setAuthStep("code");
          setAuthMessage("Код отправлен в Telegram. Введи его ниже.");
        }
      } else if (authStep === "code" && authChannelId) {
        const response = await axiosInstance.post<{
          status: "password_required" | "active";
          display_name?: string;
        }>("/api/v1/channels/telegram/account/confirm", {
          channel_id: authChannelId,
          code: code.trim(),
        });

        if (response.data.status === "password_required") {
          setAuthStep("password");
          setAuthMessage("Аккаунт защищён 2FA. Введи облачный пароль.");
        } else {
          await completePersonalAccount(response.data.display_name);
        }
      } else if (authStep === "password" && authChannelId) {
        const response = await axiosInstance.post<{ display_name?: string }>(
          "/api/v1/channels/telegram/account/password",
          { channel_id: authChannelId, password },
        );
        setPassword("");
        await completePersonalAccount(response.data.display_name);
      }
    } catch (error) {
      setAuthError(true);
      setAuthMessage(
        getApiErrorMessage(
          error,
          "Не удалось подключить Telegram. Проверьте данные и повторите попытку.",
        ),
      );
    } finally {
      setIsAuthorizing(false);
    }
  }

  async function completePersonalAccount(displayName?: string) {
    setAuthStep("active");
    setAuthMessage(
      `Telegram подключён${displayName ? `: ${displayName}` : "."}`,
    );
    await queryClient.invalidateQueries({ queryKey: ["channels"] });
  }

  function submitBot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (botToken.trim().length < 10) {
      setBotMessage("Введите корректный токен Telegram-бота.");
      return;
    }
    setBotMessage(null);
    connectBot.mutate();
  }

  function restartPersonalAccount() {
    setPhone("");
    setCode("");
    setPassword("");
    setAuthChannelId(null);
    setAuthStep("phone");
    setAuthMessage(null);
    setAuthError(false);
  }

  return (
    <AppShell
      title="Каналы"
      description="Подключения, через которые клиенты пишут ассистенту."
    >
      <div className="relative min-h-[660px] overflow-hidden rounded-lg border border-[#d9e1ec] bg-[#f4f7fb] p-5 shadow-[0_18px_42px_rgba(18,39,76,.09)] soft-grid sm:p-7">
        <div className="relative mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[#64717f]">
              Интеграции
            </p>
            <p className="mt-1 text-sm text-[#526071]">
              Личный Telegram работает через защищённую MTProto-сессию.
            </p>
          </div>
          <button
            type="button"
            onClick={() => channels.refetch()}
            disabled={channels.isFetching}
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg border border-[#d9e1ec] bg-white px-4 text-sm font-semibold hover:bg-[#f8fafc] disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw
              size={16}
              className={channels.isFetching ? "animate-spin" : ""}
            />
            Обновить статус
          </button>
        </div>

        <>
          {channels.isLoading ? <Skeleton /> : null}
            {channels.error ? (
              <StateCard
                className="relative mb-4"
                title="Статусы каналов недоступны"
                description={getApiErrorMessage(
                  channels.error,
                  "Ошибка запроса. Формы подключения по-прежнему доступны.",
                )}
                variant="error"
                action={
                  <button
                    type="button"
                    className="wf-btn"
                    onClick={() => channels.refetch()}
                  >
                    Повторить
                  </button>
                }
              />
            ) : null}

            <div
              className={`relative grid gap-4 lg:grid-cols-2 ${
                channels.isLoading ? "mt-4" : ""
              }`}
            >
              {catalog.map((item) => {
                const actual = findChannel(channels.data, item.id);
                const connected = isConnected(actual);
                const Icon = item.icon;

                return (
                  <article
                    key={item.id}
                    className="rounded-lg border border-[#d9e1ec] bg-white p-4 shadow-[0_10px_22px_rgba(18,39,76,.07)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(18,39,76,.09)] sm:p-5"
                  >
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-[#d9e1ec] text-xs font-extrabold text-[#526071]">
                        <Icon size={20} className="sm:hidden" />
                        <span className="hidden sm:inline">{item.mark}</span>
                      </span>
                      <div className="min-w-[130px] flex-1">
                        <h2 className="font-extrabold">
                          {actual?.name || item.name}
                        </h2>
                        <p className="mt-0.5 truncate text-[13px] text-[#64717f]">
                          {channelAccount(actual) || item.account}
                        </p>
                      </div>
                      <Status connected={connected} />
                      {item.id === "telegram-bot" ? (
                        <button
                          type="button"
                          onClick={() => setEditingBot((value) => !value)}
                          className={`min-h-11 rounded-lg px-4 text-sm font-semibold ${
                            connected
                              ? "border border-[#d9e1ec] bg-white hover:bg-[#f4f7fb]"
                              : "bg-[#2463eb] text-white shadow-[0_11px_25px_rgba(36,99,235,.2)] hover:bg-[#1546ad]"
                          }`}
                        >
                          {connected ? "Настроить" : "Подключить"}
                        </button>
                      ) : null}
                    </div>

                    {item.id === "telegram-account" ? (
                      <PersonalAccountForm
                        step={authStep}
                        phone={phone}
                        code={code}
                        password={password}
                        message={authMessage}
                        hasError={authError}
                        isSubmitting={isAuthorizing}
                        onPhoneChange={setPhone}
                        onCodeChange={setCode}
                        onPasswordChange={setPassword}
                        onSubmit={submitPersonalAccount}
                        onRestart={restartPersonalAccount}
                      />
                    ) : null}

                    {item.id === "telegram-bot" && editingBot ? (
                      <form
                        onSubmit={submitBot}
                        className="mt-4 grid gap-3 border-t border-[#e5eaf1] pt-4 sm:grid-cols-2"
                      >
                        <label className="sm:col-span-2">
                          <span className="mb-1 block text-xs font-semibold">
                            Токен Telegram Bot
                          </span>
                          <input
                            type="password"
                            value={botToken}
                            onChange={(event) => setBotToken(event.target.value)}
                            placeholder="123456:ABC…"
                            autoComplete="off"
                            className="min-h-11 w-full rounded-lg border border-[#d9e1ec] px-3 text-sm outline-none focus:border-[#2463eb] focus:ring-3 focus:ring-[#eaf1ff]"
                          />
                        </label>
                        <label>
                          <span className="mb-1 block text-xs font-semibold">
                            Username
                          </span>
                          <input
                            value={botUsername}
                            onChange={(event) =>
                              setBotUsername(event.target.value)
                            }
                            placeholder="@autopilot_bot"
                            className="min-h-11 w-full rounded-lg border border-[#d9e1ec] px-3 text-sm outline-none focus:border-[#2463eb] focus:ring-3 focus:ring-[#eaf1ff]"
                          />
                        </label>
                        <button
                          type="submit"
                          disabled={connectBot.isPending}
                          className="mt-auto min-h-11 rounded-lg bg-[#2463eb] px-4 text-sm font-semibold text-white hover:bg-[#1546ad] disabled:opacity-60"
                        >
                          {connectBot.isPending ? "Подключаем…" : "Сохранить"}
                        </button>
                        {botMessage ? (
                          <p
                            role="status"
                            className={`text-sm sm:col-span-2 ${
                              connectBot.error
                                ? "text-[#a72f2f]"
                                : "text-[#08724b]"
                            }`}
                          >
                            {botMessage}
                          </p>
                        ) : null}
                      </form>
                    ) : null}
                  </article>
                );
              })}
            </div>
        </>
      </div>
    </AppShell>
  );
}

function PersonalAccountForm({
  step,
  phone,
  code,
  password,
  message,
  hasError,
  isSubmitting,
  onPhoneChange,
  onCodeChange,
  onPasswordChange,
  onSubmit,
  onRestart,
}: {
  step: AuthStep;
  phone: string;
  code: string;
  password: string;
  message: string | null;
  hasError: boolean;
  isSubmitting: boolean;
  onPhoneChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onRestart: () => void;
}) {
  if (step === "active") {
    return (
      <div className="mt-4 border-t border-[#e5eaf1] pt-4">
        {message ? (
          <p
            role="status"
            className="rounded-lg bg-[#e8f7f0] p-3 text-sm font-semibold text-[#08724b]"
          >
            {message}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onRestart}
          className="mt-3 min-h-11 rounded-lg border border-[#d9e1ec] bg-white px-4 text-sm font-semibold hover:bg-[#f4f7fb]"
        >
          Подключить другой аккаунт
        </button>
      </div>
    );
  }

  const label =
    step === "phone"
      ? "Номер телефона"
      : step === "code"
        ? "Код из Telegram"
        : "Пароль 2FA";
  const value = step === "phone" ? phone : step === "code" ? code : password;
  const placeholder =
    step === "phone"
      ? "+7 999 000-00-00"
      : step === "code"
        ? "12345"
        : "Облачный пароль";
  const buttonLabel =
    step === "phone"
      ? "Отправить код"
      : step === "code"
        ? "Подтвердить код"
        : "Подтвердить 2FA";

  return (
    <form
      onSubmit={onSubmit}
      className="mt-4 grid gap-3 border-t border-[#e5eaf1] pt-4"
    >
      <label>
        <span className="mb-1 block text-xs font-semibold">{label}</span>
        <input
          type={step === "password" ? "password" : "text"}
          inputMode={step === "password" ? undefined : "tel"}
          autoComplete={step === "phone" ? "tel" : "one-time-code"}
          value={value}
          onChange={(event) => {
            if (step === "phone") onPhoneChange(event.target.value);
            else if (step === "code") onCodeChange(event.target.value);
            else onPasswordChange(event.target.value);
          }}
          placeholder={placeholder}
          disabled={isSubmitting}
          className="min-h-11 w-full rounded-lg border border-[#d9e1ec] px-3 text-sm outline-none focus:border-[#2463eb] focus:ring-3 focus:ring-[#eaf1ff] disabled:bg-[#f4f7fb]"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-11 rounded-lg bg-[#2463eb] px-4 text-sm font-semibold text-white shadow-[0_11px_25px_rgba(36,99,235,.2)] hover:bg-[#1546ad] disabled:opacity-60"
        >
          {isSubmitting ? "Проверяем…" : buttonLabel}
        </button>
        {step !== "phone" ? (
          <button
            type="button"
            onClick={onRestart}
            disabled={isSubmitting}
            className="min-h-11 rounded-lg border border-[#d9e1ec] bg-white px-4 text-sm font-semibold hover:bg-[#f4f7fb] disabled:opacity-60"
          >
            Начать заново
          </button>
        ) : null}
      </div>
      {message ? (
        <p
          role={hasError ? "alert" : "status"}
          className={`rounded-lg p-3 text-sm font-semibold ${
            hasError
              ? "bg-[#fff1f1] text-[#a72f2f]"
              : "bg-[#eaf1ff] text-[#1546ad]"
          }`}
        >
          {message}
        </p>
      ) : null}
      <p className="text-xs leading-5 text-[#64717f]">
        Сессия шифруется на backend. Код и пароль 2FA не сохраняются.
      </p>
    </form>
  );
}

function findChannel(channels: ChannelResponse[] | undefined, id: string) {
  if (id === "telegram-account") {
    return channels?.find(
      (channel) =>
        channel.type === "telegram" && channel.settings.transport === "mtproto",
    );
  }
  if (id === "telegram-bot") {
    return channels?.find(
      (channel) =>
        channel.type === "telegram" && channel.settings.transport !== "mtproto",
    );
  }
  return channels?.find((channel) => channel.type === id);
}

function isConnected(channel?: ChannelResponse) {
  return channel?.status === "active" || channel?.status === "connected";
}

function channelAccount(channel?: ChannelResponse) {
  if (!channel) return "";
  const username = channel.settings.username ?? channel.settings.bot_username;
  return typeof username === "string" && username
    ? username.startsWith("@")
      ? username
      : `@${username}`
    : "";
}

function Status({ connected }: { connected: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.08em] ${
        connected
          ? "bg-[#e8f7f0] text-[#08724b]"
          : "bg-[#f4f7fb] text-[#526071]"
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${
          connected ? "bg-[#13a66b]" : "bg-[#98a2b3]"
        }`}
      />
      {connected ? "Подключено" : "Не подключено"}
    </span>
  );
}

function Skeleton() {
  return (
    <div
      role="status"
      aria-label="Загружаем каналы"
      className="relative grid gap-4 lg:grid-cols-2"
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-24 animate-pulse rounded-lg bg-[#e5eaf1]"
        />
      ))}
    </div>
  );
}
