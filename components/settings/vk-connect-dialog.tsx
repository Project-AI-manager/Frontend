"use client";

import { Check, Copy, Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";

import { ChannelConnectDialogShell } from "@/components/settings/channel-connect-dialog-shell";
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
  const [groupId, setGroupId] = useState(initialGroupId);
  const [accessToken, setAccessToken] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [callbackSecret, setCallbackSecret] = useState("");
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectedChannel, setConnectedChannel] = useState<ChannelResponse | null>(null);
  const [copied, setCopied] = useState<CopyKind | null>(null);


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

  async function copySetupValue(kind: CopyKind, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
  }

  const callbackUrl = typeof connectedChannel?.settings.callback_url === "string"
    ? connectedChannel.settings.callback_url
    : "";

  return (
    <ChannelConnectDialogShell
      service="VK Callback API"
      title={connectedChannel ? "Завершите настройку Callback API" : replacing ? "Переподключить VK" : "Подключить VK"}
      accentClass="text-[#1676d2]"
      busy={isSubmitting}
      maxWidthClass="max-w-[560px]"
      onClose={onClose}
    >
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
    </ChannelConnectDialogShell>
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
