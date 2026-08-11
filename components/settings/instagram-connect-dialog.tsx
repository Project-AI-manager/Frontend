"use client";

import { ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";

import { ChannelConnectDialogShell } from "@/components/settings/channel-connect-dialog-shell";
import { getApiErrorMessage } from "@/lib/api/errors";
import { instagramApi } from "@/lib/api/instagram";

export function InstagramConnectDialog({
  onClose,
  replaceChannelId,
}: {
  onClose: () => void;
  replaceChannelId?: string;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function connect() {
    setError("");
    setIsSubmitting(true);
    try {
      const result = await instagramApi.startOAuth(replaceChannelId);
      window.location.assign(result.authorization_url);
    } catch (connectError) {
      setError(getApiErrorMessage(connectError, "Не удалось начать подключение Instagram. Проверьте настройки приложения Meta и повторите попытку."));
      setIsSubmitting(false);
    }
  }

  return (
    <ChannelConnectDialogShell
      service="Instagram Messaging API"
      title={replaceChannelId ? "Переподключить Instagram" : "Подключить Instagram"}
      accentClass="text-[#c63377]"
      busy={isSubmitting}
      maxWidthClass="max-w-[520px]"
      onClose={onClose}
    >
      <p className="mt-4 text-sm leading-6 text-[#526071]">
        Войдите через Meta и выберите профессиональный аккаунт Instagram. Разрешите приложению читать и отправлять сообщения.
      </p>
      <div className="mt-4 rounded-lg border border-[#d9e1ec] bg-[#f8fbff] p-4 text-sm leading-6 text-[#415066]">
        После подтверждения обращения из Instagram Direct появятся в общем Inbox. Пароли и токены Meta во frontend не сохраняются.
      </div>
      {error ? <p role="alert" className="mt-4 rounded-lg border border-[#d84545]/30 bg-[#fdeded] px-4 py-3 text-sm text-[#a72f2f]">{error}</p> : null}
      <div className="mt-6 flex justify-end gap-2.5">
        <button type="button" onClick={onClose} disabled={isSubmitting} className="min-h-11 rounded-lg border border-[#d9e1ec] px-4 text-sm font-semibold disabled:opacity-50">Отмена</button>
        <button type="button" onClick={() => void connect()} disabled={isSubmitting} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#c63377] px-5 text-sm font-semibold text-white hover:bg-[#a92966] disabled:opacity-50">
          {isSubmitting ? <Loader2 size={17} className="animate-spin" /> : <ExternalLink size={17} />}
          Перейти в Instagram
        </button>
      </div>
    </ChannelConnectDialogShell>
  );
}
