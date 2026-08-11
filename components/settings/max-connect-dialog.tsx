"use client";

import { Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";

import { ChannelConnectDialogShell } from "@/components/settings/channel-connect-dialog-shell";
import { getApiErrorMessage } from "@/lib/api/errors";
import { maxApi } from "@/lib/api/max";

export function MaxConnectDialog({
  onClose,
  onConnected,
  replacing = false,
  replaceChannelId,
  initialName = "",
}: {
  onClose: () => void;
  onConnected: () => Promise<void>;
  replacing?: boolean;
  replaceChannelId?: string;
  initialName?: string;
}) {
  const [name, setName] = useState(initialName);
  const [botToken, setBotToken] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await maxApi.connect({
        bot_token: botToken.trim(),
        ...(name.trim() ? { name: name.trim() } : {}),
        ...(replaceChannelId ? { replace_channel_id: replaceChannelId } : {}),
      });
      setBotToken("");
      await onConnected();
      onClose();
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Не удалось подключить MAX. Проверьте токен бота из «MAX для бизнеса» и повторите попытку."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ChannelConnectDialogShell
      service="MAX Bot API"
      title={replacing ? "Переподключить MAX" : "Подключить MAX"}
      accentClass="text-[#415066]"
      busy={isSubmitting}
      maxWidthClass="max-w-[520px]"
      onClose={onClose}
    >
      <p className="mt-3 text-sm leading-6 text-[#526071]">
        Создайте бота в «MAX для бизнеса» и скопируйте токен в разделе business.max.ru/self. Backend проверит бота и сам настроит защищённую доставку новых сообщений.
      </p>
      <form onSubmit={submit} className="mt-5 grid gap-4">
        <label className="ap-label">
          Название канала <span className="font-normal text-[#8c98a8]">(необязательно)</span>
          <input autoFocus className="ap-input" autoComplete="off" placeholder="MAX магазина" value={name} onChange={(event) => setName(event.target.value)} maxLength={255} />
        </label>
        <label className="ap-label">
          Токен бота
          <input className="ap-input" type="password" autoComplete="new-password" value={botToken} onChange={(event) => setBotToken(event.target.value)} minLength={8} required />
        </label>
        <p className="text-xs leading-5 text-[#64717f]">Токен отправляется только на backend и хранится там в зашифрованном виде.</p>
        {error ? <p role="alert" className="rounded-lg border border-[#d84545]/30 bg-[#fdeded] px-4 py-3 text-sm text-[#a72f2f]">{error}</p> : null}
        <div className="flex justify-end gap-2.5">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="min-h-11 rounded-lg border border-[#d9e1ec] px-4 text-sm font-semibold hover:bg-[#f4f7fb] disabled:opacity-50">Отмена</button>
          <button type="submit" disabled={isSubmitting || botToken.trim().length < 8} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#415066] px-5 text-sm font-semibold text-white hover:bg-[#2f3b4d] disabled:opacity-50">
            {isSubmitting ? <Loader2 size={17} className="animate-spin" /> : null}
            {replacing ? "Переподключить" : "Подключить"}
          </button>
        </div>
      </form>
    </ChannelConnectDialogShell>
  );
}
