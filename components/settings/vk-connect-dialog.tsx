"use client";

import { Check, Copy, Loader2, X } from "lucide-react";
import {
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { getApiErrorMessage } from "@/lib/api/errors";
import type { ChannelResponse } from "@/lib/api/generated/ai.schemas";
import { vkApi } from "@/lib/api/vk";

type CopyKind = "callback" | "confirmation" | "secret";

export function VkConnectDialog({
  onClose,
  onConnected,
  replacing = false,
  initialGroupId = "",
  initialName = "",
  replaceChannelId,
}: {
  onClose: () => void;
  onConnected: () => Promise<void>;
  replacing?: boolean;
  initialGroupId?: string;
  initialName?: string;
  replaceChannelId?: string;
}) {
  const dialog = useRef<HTMLElement>(null);
  const firstInput = useRef<HTMLInputElement>(null);
  const closeRef = useRef(onClose);
  const submittingRef = useRef(false);
  const [groupId, setGroupId] = useState(initialGroupId);
  const [accessToken, setAccessToken] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [callbackSecret, setCallbackSecret] = useState("");
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectedChannel, setConnectedChannel] = useState<ChannelResponse | null>(null);
  const [copied, setCopied] = useState<CopyKind | null>(null);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    submittingRef.current = isSubmitting;
  }, [isSubmitting]);

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    firstInput.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submittingRef.current) closeRef.current();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      opener?.focus();
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const channel = await vkApi.connect({
        group_id: Number(groupId.trim()),
        access_token: accessToken.trim(),
        callback_confirmation: confirmationCode.trim(),
        callback_secret: callbackSecret.trim(),
        name: name.trim(),
        replace_channel_id: replaceChannelId,
      });
      await onConnected();
      setAccessToken("");
      setConnectedChannel(channel);
    } catch (submitError) {
      setError(
        getApiErrorMessage(
          submitError,
          "Не удалось подключить VK. Проверьте ID сообщества, токен и настройки Callback API.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function keepFocusInside(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      dialog.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function copySetupValue(kind: CopyKind, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
  }

  const callbackUrl = typeof connectedChannel?.settings.callback_url === "string"
    ? connectedChannel.settings.callback_url
    : "";

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-[#101828]/35 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <section
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vk-dialog-title"
        onKeyDown={keepFocusInside}
        className="my-auto w-full max-w-[560px] rounded-xl border border-[#d9e1ec] bg-white p-6 shadow-[0_24px_70px_rgba(18,39,76,.20)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[.12em] text-[#1676d2]">
              VK Callback API
            </p>
            <h2
              id="vk-dialog-title"
              className="mt-1 font-heading text-xl font-extrabold tracking-[-.03em]"
            >
              {connectedChannel
                ? "Завершите настройку Callback API"
                : replacing
                  ? "Переподключить VK"
                  : "Подключить VK"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Закрыть подключение VK"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg text-[#64717f] hover:bg-[#f4f7fb] disabled:opacity-50"
          >
            <X size={19} />
          </button>
        </div>

        {connectedChannel ? (
          <div className="mt-4 space-y-4 text-sm text-[#526071]">
            <p className="leading-6">
              В управлении сообществом VK откройте <strong>Настройки → Работа с API → Callback API</strong>,
              добавьте сервер и перенесите значения ниже. Затем подтвердите адрес и включите событие
              <strong> Входящее сообщение</strong>.
            </p>
            <SetupValue
              label="Адрес сервера"
              value={callbackUrl}
              copied={copied === "callback"}
              onCopy={() => void copySetupValue("callback", callbackUrl)}
            />
            <SetupValue
              label="Строка, которую должен вернуть сервер"
              value={confirmationCode}
              copied={copied === "confirmation"}
              onCopy={() => void copySetupValue("confirmation", confirmationCode)}
            />
            <SetupValue
              label="Секретный ключ"
              value={callbackSecret}
              secret
              copied={copied === "secret"}
              onCopy={() => void copySetupValue("secret", callbackSecret)}
            />
            <label className="ap-label">
              Токен сообщества
              <input
                className="ap-input"
                readOnly
                type="password"
                value="сохранён-безопасно"
                aria-describedby="vk-token-note"
              />
            </label>
            <p id="vk-token-note" className="text-xs leading-5 text-[#64717f]">
              Токен сохранён на сервере в зашифрованном виде и больше не показывается.
            </p>
            {!callbackUrl ? (
              <p role="alert" className="rounded-lg border border-[#d8a138]/35 bg-[#fff8e8] px-4 py-3 text-[#81550b]">
                Backend не вернул публичный Callback URL. Обновите список каналов и повторите подключение.
              </p>
            ) : null}
            <p role="status" aria-live="polite" className="min-h-5 text-[#0c7a4e]">
              {copied === "callback"
                ? "Адрес сервера скопирован"
                : copied === "confirmation"
                  ? "Строка подтверждения скопирована"
                  : copied === "secret"
                    ? "Секретный ключ скопирован"
                    : ""}
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 rounded-lg bg-[#1676d2] px-5 font-semibold text-white hover:bg-[#0f62b5]"
              >
                Готово
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-3 text-sm leading-6 text-[#526071]">
              Создайте ключ доступа сообщества с правом управления сообщениями. В разделе Callback API
              скопируйте строку подтверждения и задайте секретный ключ. Все секреты отправляются только
              на backend и не сохраняются во frontend.
            </p>
            <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="ap-label">
                Название канала
                <input
                  ref={firstInput}
                  autoFocus
                  className="ap-input"
                  autoComplete="off"
                  placeholder="VK магазина"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={255}
                  required
                />
              </label>
              <label className="ap-label">
                ID сообщества
                <input
                  className="ap-input"
                  autoComplete="off"
                  inputMode="numeric"
                  pattern="[0-9]+"
                  value={groupId}
                  onChange={(event) => setGroupId(event.target.value)}
                  required
                />
              </label>
              <label className="ap-label sm:col-span-2">
                Ключ доступа сообщества
                <input
                  className="ap-input"
                  type="password"
                  autoComplete="new-password"
                  value={accessToken}
                  onChange={(event) => setAccessToken(event.target.value)}
                  minLength={20}
                  required
                />
              </label>
              <label className="ap-label">
                Строка подтверждения
                <input
                  className="ap-input"
                  autoComplete="off"
                  value={confirmationCode}
                  onChange={(event) => setConfirmationCode(event.target.value)}
                  maxLength={255}
                  required
                />
              </label>
              <label className="ap-label">
                Секретный ключ
                <input
                  className="ap-input"
                  type="password"
                  autoComplete="new-password"
                  value={callbackSecret}
                  onChange={(event) => setCallbackSecret(event.target.value)}
                  minLength={8}
                  maxLength={255}
                  required
                />
              </label>

              {error ? (
                <p role="alert" className="rounded-lg border border-[#d84545]/30 bg-[#fdeded] px-4 py-3 text-sm text-[#a72f2f] sm:col-span-2">
                  {error}
                </p>
              ) : null}

              <div className="flex justify-end gap-2.5 sm:col-span-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="min-h-11 rounded-lg border border-[#d9e1ec] px-4 text-sm font-semibold hover:bg-[#f4f7fb] disabled:opacity-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#1676d2] px-5 text-sm font-semibold text-white hover:bg-[#0f62b5] disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={17} className="animate-spin" /> : null}
                  {replacing ? "Переподключить" : "Подключить"}
                </button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

function SetupValue({
  label,
  value,
  secret = false,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  secret?: boolean;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <label className="ap-label">
      {label}
      <span className="flex gap-2">
        <input className="ap-input min-w-0" readOnly type={secret ? "password" : "text"} value={value} />
        <button
          type="button"
          onClick={onCopy}
          disabled={!value}
          aria-label={`Копировать: ${label}`}
          className="inline-flex min-w-11 items-center justify-center rounded-lg border border-[#d9e1ec] px-3 font-semibold text-[#415066] hover:bg-[#f4f7fb] disabled:opacity-40"
        >
          {copied ? <Check size={17} /> : <Copy size={17} />}
        </button>
      </span>
    </label>
  );
}
