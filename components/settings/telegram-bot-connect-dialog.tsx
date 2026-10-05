"use client";

import { Loader2 } from "lucide-react";
import { type FormEvent, useState } from "react";

import { ChannelConnectDialogShell } from "@/components/settings/channel-connect-dialog-shell";
import { getApiErrorMessage } from "@/lib/api/errors";
import { telegramApi } from "@/lib/api/telegram";

export function TelegramBotConnectDialog({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [botToken, setBotToken] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await telegramApi.connectBot({
        bot_token: botToken.trim(),
        ...(name.trim() ? { name: name.trim() } : {}),
      });
      setBotToken("");
      await onConnected();
      onClose();
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Не удалось подключить Telegram-бота. Проверьте токен и повторите попытку."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ChannelConnectDialogShell
      service="Telegram Bot API"
      title="Подключить Telegram-бота"
      accentClass="text-[#168bd2]"
      busy={isSubmitting}
      maxWidthClass="max-w-[520px]"
      onClose={onClose}
    >
      <p className="mt-3 text-sm leading-6 text-[#526071]">
        Создайте бота через <strong className="text-[#101828]">@BotFather</strong> и вставьте его токен. Это отдельный канал: личный Telegram-аккаунт останется подключён.
      </p>
      <p className="mt-3 rounded-lg border border-[#f0d99b] bg-[#fff8e7] px-4 py-3 text-sm leading-5 text-[#79530b]">
        После проверки токена приложение само настроит webhook, если backend доступен по публичному HTTPS-адресу. На локальном адресе Telegram не сможет доставлять сообщения, поэтому канал останется в ожидании публичного backend.
      </p>
      <form onSubmit={submit} className="mt-5 grid gap-4">
        <label className="ap-label">
          Название канала <span className="font-normal text-[#8c98a8]">(необязательно)</span>
          <input autoFocus className="ap-input" autoComplete="off" placeholder="Бот магазина" value={name} onChange={(event) => setName(event.target.value)} maxLength={255} />
        </label>
        <label className="ap-label">
          Токен бота
          <input className="ap-input" type="password" autoComplete="new-password" value={botToken} onChange={(event) => setBotToken(event.target.value)} minLength={20} required />
        </label>
        <p className="text-xs leading-5 text-[#64717f]">Токен передаётся по защищённому соединению и хранится на сервере в зашифрованном виде. Никому не отправляйте его в чат.</p>
        {error ? <p role="alert" className="rounded-lg border border-[#d84545]/30 bg-[#fdeded] px-4 py-3 text-sm text-[#a72f2f]">{error}</p> : null}
        <div className="flex justify-end gap-2.5">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="min-h-11 rounded-lg border border-[#d9e1ec] px-4 text-sm font-semibold hover:bg-[#f4f7fb] disabled:opacity-50">Отмена</button>
          <button type="submit" disabled={isSubmitting || botToken.trim().length < 20} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#168bd2] px-5 text-sm font-semibold text-white hover:bg-[#1178b8] disabled:opacity-50">
            {isSubmitting ? <Loader2 size={17} className="animate-spin" /> : null}
            Подключить бота
          </button>
        </div>
      </form>
    </ChannelConnectDialogShell>
  );
}
