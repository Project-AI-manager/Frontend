"use client";

import { Loader2, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

import { getApiErrorMessage } from "@/lib/api/errors";
import { telegramApi } from "@/lib/api/telegram";

type Step = "phone" | "code" | "password";

export function TelegramConnectDialog({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: () => Promise<void>;
}) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const [step, setStep] = useState<Step>("phone");
  const [channelId, setChannelId] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    closeButton.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      if (step === "phone") {
        const response = await telegramApi.startAccount({ phone: phone.trim() });
        setChannelId(response.channel_id);
        if (response.status === "active") await finish();
        else setStep("code");
      } else if (step === "code") {
        const response = await telegramApi.confirmCode({
          channel_id: channelId,
          code: code.trim(),
        });
        if (response.status === "password_required") setStep("password");
        else await finish();
      } else {
        await telegramApi.confirmPassword({ channel_id: channelId, password });
        await finish();
      }
    } catch (submitError) {
      setError(
        getApiErrorMessage(
          submitError,
          step === "phone"
            ? "Не удалось отправить код Telegram. Проверьте номер и настройки сервера."
            : step === "code"
              ? "Код не подошёл или истёк. Запросите подключение заново."
              : "Не удалось подтвердить пароль двухэтапной аутентификации.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function finish() {
    await onConnected();
    onClose();
  }

  const title = step === "phone"
    ? "Подключить Telegram"
    : step === "code"
      ? "Введите код из Telegram"
      : "Двухэтапная аутентификация";

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-[#101828]/35 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSubmitting) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="telegram-dialog-title" className="w-full max-w-[460px] rounded-xl border border-[#d9e1ec] bg-white p-6 shadow-[0_24px_70px_rgba(18,39,76,.20)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[.12em] text-[#2463eb]">Шаг {step === "phone" ? 1 : step === "code" ? 2 : 3} из 3</p>
            <h2 id="telegram-dialog-title" className="mt-1 font-heading text-xl font-extrabold tracking-[-.03em]">{title}</h2>
          </div>
          <button ref={closeButton} type="button" onClick={onClose} disabled={isSubmitting} aria-label="Закрыть подключение Telegram" className="flex size-10 shrink-0 items-center justify-center rounded-lg text-[#64717f] hover:bg-[#f4f7fb] disabled:opacity-50"><X size={19} /></button>
        </div>

        <p className="mt-3 text-sm leading-6 text-[#526071]">
          {step === "phone" && "Укажите номер личного аккаунта в международном формате. Код придёт в приложение Telegram."}
          {step === "code" && <>Код отправлен на <strong className="font-semibold text-[#101828]">{phone}</strong>.</>}
          {step === "password" && "Telegram запросил облачный пароль. Он отправляется только на backend и не сохраняется во frontend."}
        </p>

        <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
          {step === "phone" ? (
            <label className="ap-label">Номер телефона<input autoFocus className="ap-input" type="tel" autoComplete="tel" placeholder="+7 999 123-45-67" value={phone} onChange={(event) => setPhone(event.target.value)} minLength={8} required /></label>
          ) : step === "code" ? (
            <label className="ap-label">Код подтверждения<input autoFocus className="ap-input" inputMode="numeric" autoComplete="one-time-code" placeholder="12345" value={code} onChange={(event) => setCode(event.target.value)} minLength={3} maxLength={16} required /></label>
          ) : (
            <label className="ap-label">Облачный пароль<input autoFocus className="ap-input" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          )}

          {error ? <p role="alert" className="rounded-lg border border-[#d84545]/30 bg-[#fdeded] px-4 py-3 text-sm text-[#a72f2f]">{error}</p> : null}

          <div className="flex justify-end gap-2.5">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="min-h-11 rounded-lg border border-[#d9e1ec] px-4 text-sm font-semibold hover:bg-[#f4f7fb] disabled:opacity-50">Отмена</button>
            <button type="submit" disabled={isSubmitting || (step === "phone" ? phone.trim().length < 8 : step === "code" ? code.trim().length < 3 : !password)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#2463eb] px-5 text-sm font-semibold text-white hover:bg-[#1546ad] disabled:opacity-50">
              {isSubmitting ? <Loader2 size={17} className="animate-spin" /> : null}
              {step === "phone" ? "Получить код" : step === "code" ? "Подтвердить" : "Подключить"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
