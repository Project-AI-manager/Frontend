"use client";

import { Loader2, X } from "lucide-react";
import { FormEvent, KeyboardEvent as ReactKeyboardEvent, useEffect, useRef, useState } from "react";

import { resolveApiUrl } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { ChannelResponse } from "@/lib/api/generated/ai.schemas";
import { whatsappApi } from "@/lib/api/whatsapp";

export function WhatsAppConnectDialog({
  onClose,
  onConnected,
  replacing = false,
  replaceChannelId,
}: {
  onClose: () => void;
  onConnected: () => Promise<void>;
  replacing?: boolean;
  replaceChannelId?: string;
}) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const firstInput = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLElement>(null);
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectedChannel, setConnectedChannel] = useState<ChannelResponse | null>(null);
  const [copied, setCopied] = useState<"callback" | "verify" | null>(null);
  const closeRef = useRef(onClose);
  const submittingRef = useRef(isSubmitting);

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
      const channel = await whatsappApi.connect({
        phone_number_id: phoneNumberId.trim(),
        waba_id: wabaId.trim(),
        access_token: accessToken.trim(),
        app_secret: appSecret.trim(),
        verify_token: verifyToken.trim(),
        name: name.trim(),
        ...(replaceChannelId ? { replace_channel_id: replaceChannelId } : {}),
      });
      await onConnected();
      setAccessToken("");
      setAppSecret("");
      setConnectedChannel(channel);
    } catch (submitError) {
      setError(
        getApiErrorMessage(
          submitError,
          "Не удалось подключить WhatsApp. Проверьте реквизиты Cloud API и повторите попытку.",
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

  async function copySetupValue(kind: "callback" | "verify", value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
  }

  const webhookPath = typeof connectedChannel?.settings.webhook_path === "string"
    ? connectedChannel.settings.webhook_path
    : "";
  const callbackUrl = webhookPath ? resolveApiUrl(webhookPath) : "";

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
        aria-labelledby="whatsapp-dialog-title"
        onKeyDown={keepFocusInside}
        className="my-auto w-full max-w-[540px] rounded-xl border border-[#d9e1ec] bg-white p-6 shadow-[0_24px_70px_rgba(18,39,76,.20)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[.12em] text-[#149b50]">
              WhatsApp Cloud API
            </p>
            <h2
              id="whatsapp-dialog-title"
              className="mt-1 font-heading text-xl font-extrabold tracking-[-.03em]"
            >
              {connectedChannel
                ? "Завершите настройку webhook"
                : replacing
                  ? "Переподключить WhatsApp"
                  : "Подключить WhatsApp"}
            </h2>
          </div>
          <button
            ref={closeButton}
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Закрыть подключение WhatsApp"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg text-[#64717f] hover:bg-[#f4f7fb] disabled:opacity-50"
          >
            <X size={19} />
          </button>
        </div>

        {connectedChannel ? (
          <div className="mt-4 space-y-4 text-sm text-[#526071]">
            <p>
              Meta подтвердила доступ к номеру. В разделе Webhooks приложения Meta
              укажите эти значения и подпишите поле <strong>messages</strong>.
            </p>
            <label className="ap-label">
              Callback URL
              <span className="flex gap-2">
                <input className="ap-input min-w-0" readOnly value={callbackUrl} />
                <button type="button" className="rounded-lg border px-3 font-semibold" onClick={() => void copySetupValue("callback", callbackUrl)}>
                  Копировать
                </button>
              </span>
            </label>
            <label className="ap-label">
              Verify token
              <span className="flex gap-2">
                <input className="ap-input min-w-0" readOnly type="password" value={verifyToken} />
                <button type="button" className="rounded-lg border px-3 font-semibold" onClick={() => void copySetupValue("verify", verifyToken)}>
                  Копировать
                </button>
              </span>
            </label>
            <p role="status" aria-live="polite" className="min-h-5 text-[#0c7a4e]">
              {copied === "callback" ? "Callback URL скопирован" : copied === "verify" ? "Verify token скопирован" : ""}
            </p>
            <div className="flex justify-end">
              <button type="button" onClick={onClose} className="min-h-11 rounded-lg bg-[#149b50] px-5 font-semibold text-white">
                Готово
              </button>
            </div>
          </div>
        ) : <>
        <p className="mt-3 text-sm leading-6 text-[#526071]">
          {replacing
            ? "Обновите токены того же бизнес-номера. Backend проверит доступ до сохранения; смена Phone Number ID через переподключение запрещена, чтобы сохранить корректную маршрутизацию старых диалогов."
            : "Возьмите реквизиты в Meta for Developers и настройках WhatsApp Business Account."}
          {" "}Секреты отправляются только на backend и не сохраняются во frontend.
        </p>

        <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="ap-label">
            Название канала
            <input
              ref={firstInput}
              autoFocus
              className="ap-input"
              autoComplete="off"
              placeholder="WhatsApp магазина"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={255}
              required
            />
          </label>
          <label className="ap-label">
            Phone Number ID
            <input
              className="ap-input"
              autoComplete="off"
              inputMode="numeric"
              value={phoneNumberId}
              onChange={(event) => setPhoneNumberId(event.target.value)}
              required
            />
          </label>
          <label className="ap-label">
            WhatsApp Business Account ID
            <input
              className="ap-input"
              autoComplete="off"
              inputMode="numeric"
              value={wabaId}
              onChange={(event) => setWabaId(event.target.value)}
              required
            />
          </label>
          <label className="ap-label">
            Verify token
            <input
              className="ap-input"
              type="password"
              autoComplete="new-password"
              value={verifyToken}
              onChange={(event) => setVerifyToken(event.target.value)}
              minLength={8}
              required
            />
          </label>
          <label className="ap-label sm:col-span-2">
            Permanent access token
            <input
              className="ap-input"
              type="password"
              autoComplete="new-password"
              value={accessToken}
              onChange={(event) => setAccessToken(event.target.value)}
              minLength={10}
              required
            />
          </label>
          <label className="ap-label sm:col-span-2">
            App secret
            <input
              className="ap-input"
              type="password"
              autoComplete="new-password"
              value={appSecret}
              onChange={(event) => setAppSecret(event.target.value)}
              minLength={8}
              required
            />
          </label>

          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-[#d84545]/30 bg-[#fdeded] px-4 py-3 text-sm text-[#a72f2f] sm:col-span-2"
            >
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
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#149b50] px-5 text-sm font-semibold text-white hover:bg-[#0f7f41] disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={17} className="animate-spin" /> : null}
              {replacing ? "Переподключить" : "Подключить"}
            </button>
          </div>
        </form>
        </>}
      </section>
    </div>
  );
}
