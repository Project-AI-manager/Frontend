"use client";

import { CheckCircle2, Loader2, QrCode, Smartphone, X } from "lucide-react";
import QRCode from "qrcode";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

import { getApiErrorMessage } from "@/lib/api/errors";
import { telegramApi } from "@/lib/api/telegram";

type Step = "method" | "phone" | "code" | "qr" | "password";

export function TelegramConnectDialog({
  onClose,
  onConnected,
}: {
  onClose: () => void;
  onConnected: () => Promise<void>;
}) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const [step, setStep] = useState<Step>("method");
  const [channelId, setChannelId] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"app" | "sms" | "call" | "email" | "other">("other");
  const [nextDeliveryMethod, setNextDeliveryMethod] = useState<"app" | "sms" | "call" | "email" | "other" | null>(null);
  const [phoneMasked, setPhoneMasked] = useState("");
  const [resendAfter, setResendAfter] = useState(0);
  const [qrImage, setQrImage] = useState("");
  const [qrExpiresAt, setQrExpiresAt] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const closeRef = useRef(onClose);
  const connectedRef = useRef(onConnected);

  useEffect(() => {
    closeRef.current = onClose;
    connectedRef.current = onConnected;
  }, [onClose, onConnected]);

  const finish = useCallback(async () => {
    await connectedRef.current();
    closeRef.current();
  }, []);

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

  useEffect(() => {
    if (resendAfter <= 0) return;
    const timer = window.setInterval(() => {
      setResendAfter((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendAfter]);

  useEffect(() => {
    if (step !== "qr" || !channelId) return;
    let stopped = false;
    const check = async () => {
      try {
        const response = await telegramApi.getQrStatus(channelId);
        if (stopped) return;
        if (response.status === "active") await finish();
        else if (response.status === "password_required") setStep("password");
        else if (response.status === "expired") {
          setError("QR-код истёк. Создайте новый код и отсканируйте его ещё раз.");
          setQrImage("");
        }
      } catch (statusError) {
        if (!stopped) setError(getApiErrorMessage(statusError, "Не удалось проверить QR-код Telegram."));
      }
    };
    void check();
    const timer = window.setInterval(check, 1500);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [channelId, finish, step]);

  function applyCodeDelivery(response: Awaited<ReturnType<typeof telegramApi.startAccount>>) {
    setChannelId(response.channel_id);
    setDeliveryMethod(response.delivery_method ?? "other");
    setNextDeliveryMethod(response.next_delivery_method ?? null);
    setPhoneMasked(response.phone_masked || phone);
    setResendAfter(response.timeout_seconds ?? 30);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      if (step === "phone") {
        const response = await telegramApi.startAccount({ phone: phone.trim() });
        applyCodeDelivery(response);
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

  async function resendCode() {
    setError("");
    setIsSubmitting(true);
    try {
      const response = await telegramApi.startAccount({ phone: phone.trim() });
      applyCodeDelivery(response);
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Не удалось повторно запросить код Telegram."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function startQrLogin() {
    setError("");
    setIsSubmitting(true);
    try {
      const response = await telegramApi.startQrAccount();
      const image = await QRCode.toDataURL(response.qr_url, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 280,
        color: { dark: "#101828", light: "#ffffff" },
      });
      setChannelId(response.channel_id);
      setQrImage(image);
      setQrExpiresAt(response.expires_at);
      setStep("qr");
    } catch (startError) {
      setError(getApiErrorMessage(startError, "Не удалось создать QR-код Telegram."));
    } finally {
      setIsSubmitting(false);
    }
  }

  const title = step === "method"
    ? "Подключить Telegram"
    : step === "phone"
    ? "Подключить Telegram"
    : step === "code"
      ? "Введите код из Telegram"
      : step === "qr"
        ? "Отсканируйте QR-код"
      : "Двухэтапная аутентификация";

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-[#101828]/35 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSubmitting) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="telegram-dialog-title" className="w-full max-w-[460px] rounded-xl border border-[#d9e1ec] bg-white p-6 shadow-[0_24px_70px_rgba(18,39,76,.20)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[.12em] text-[#2463eb]">Telegram</p>
            <h2 id="telegram-dialog-title" className="mt-1 font-heading text-xl font-extrabold tracking-[-.03em]">{title}</h2>
          </div>
          <button ref={closeButton} type="button" onClick={onClose} disabled={isSubmitting} aria-label="Закрыть подключение Telegram" className="flex size-10 shrink-0 items-center justify-center rounded-lg text-[#64717f] hover:bg-[#f4f7fb] disabled:opacity-50"><X size={19} /></button>
        </div>

        <p className="mt-3 text-sm leading-6 text-[#526071]">
          {step === "method" && "Выберите удобный способ. QR-код работает без SMS и кода из служебного чата."}
          {step === "phone" && "Укажите номер личного аккаунта в международном формате. Способ доставки кода выбирает Telegram."}
          {step === "code" && (
            <>
              {_deliveryText(deliveryMethod)} Номер: <strong className="font-semibold text-[#101828]">{phoneMasked || phone}</strong>.
              {nextDeliveryMethod ? <> Следующий доступный способ: {_deliveryLabel(nextDeliveryMethod)}.</> : null}
            </>
          )}
          {step === "password" && "Telegram запросил облачный пароль. Он отправляется только на backend и не сохраняется во frontend."}
          {step === "qr" && "Откройте Telegram на телефоне и выполните три шага ниже. Подключение завершится автоматически."}
        </p>

        {step === "method" ? (
          <div className="mt-5 grid gap-3">
            <button type="button" onClick={startQrLogin} disabled={isSubmitting} className="flex min-h-[82px] items-center gap-4 rounded-xl border border-[#b9c9df] bg-[#f7faff] px-4 text-left hover:border-[#2463eb] hover:bg-[#eef5ff] disabled:opacity-50">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#2463eb] text-white">{isSubmitting ? <Loader2 size={22} className="animate-spin" /> : <QrCode size={23} />}</span>
              <span><strong className="block text-sm text-[#101828]">По QR-коду</strong><span className="mt-1 block text-xs leading-5 text-[#64717f]">Рекомендуется. Быстрое подключение через уже открытый Telegram.</span></span>
            </button>
            <button type="button" onClick={() => { setError(""); setStep("phone"); }} disabled={isSubmitting} className="flex min-h-[82px] items-center gap-4 rounded-xl border border-[#d9e1ec] px-4 text-left hover:bg-[#f7f9fc] disabled:opacity-50">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#edf2f8] text-[#526071]"><Smartphone size={22} /></span>
              <span><strong className="block text-sm text-[#101828]">По номеру телефона</strong><span className="mt-1 block text-xs leading-5 text-[#64717f]">Telegram пришлёт код выбранным им способом.</span></span>
            </button>
            {error ? <p role="alert" className="rounded-lg border border-[#d84545]/30 bg-[#fdeded] px-4 py-3 text-sm text-[#a72f2f]">{error}</p> : null}
          </div>
        ) : step === "qr" ? (
          <div className="mt-5 flex flex-col items-center">
            {qrImage ? <img src={qrImage} alt="QR-код для подключения Telegram" width={248} height={248} className="size-[248px] rounded-2xl border border-[#e2e8f0] bg-white p-2" /> : <div className="grid size-[248px] place-items-center rounded-2xl bg-[#f4f7fb]"><QrCode size={54} className="text-[#93a1b2]" /></div> /* eslint-disable-line @next/next/no-img-element */}
            <ol className="mt-5 w-full space-y-2.5 text-sm leading-5 text-[#526071]">
              <li className="flex gap-3"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#2e9b63]" /><span>Откройте Telegram → <strong className="text-[#101828]">Настройки</strong> → <strong className="text-[#101828]">Устройства</strong>.</span></li>
              <li className="flex gap-3"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#2e9b63]" /><span>Нажмите <strong className="text-[#101828]">Подключить устройство</strong>.</span></li>
              <li className="flex gap-3"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#2e9b63]" /><span>Наведите камеру Telegram на этот QR-код.</span></li>
            </ol>
            {qrExpiresAt ? <p className="mt-4 text-xs text-[#8c98a8]">QR-код действует ограниченное время.</p> : null}
            {error ? <p role="alert" className="mt-4 w-full rounded-lg border border-[#d84545]/30 bg-[#fdeded] px-4 py-3 text-sm text-[#a72f2f]">{error}</p> : null}
            <div className="mt-5 flex w-full justify-between gap-2.5">
              <button type="button" onClick={() => { setError(""); setStep("method"); }} className="min-h-11 rounded-lg border border-[#d9e1ec] px-4 text-sm font-semibold hover:bg-[#f4f7fb]">Назад</button>
              <button type="button" onClick={startQrLogin} disabled={isSubmitting} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#2463eb] px-4 text-sm font-semibold text-white hover:bg-[#1546ad] disabled:opacity-50">{isSubmitting ? <Loader2 size={17} className="animate-spin" /> : null}Обновить QR-код</button>
            </div>
          </div>
        ) : (
        <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
          {step === "phone" ? (
            <label className="ap-label">Номер телефона<input autoFocus className="ap-input" type="tel" autoComplete="tel" placeholder="+7 999 123-45-67" value={phone} onChange={(event) => setPhone(event.target.value)} minLength={8} required /></label>
          ) : step === "code" ? (
            <label className="ap-label">Код подтверждения<input autoFocus className="ap-input" inputMode="numeric" autoComplete="one-time-code" placeholder="12345" value={code} onChange={(event) => setCode(event.target.value)} minLength={3} maxLength={16} required /></label>
          ) : (
            <label className="ap-label">Облачный пароль<input autoFocus className="ap-input" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          )}

          {error ? <p role="alert" className="rounded-lg border border-[#d84545]/30 bg-[#fdeded] px-4 py-3 text-sm text-[#a72f2f]">{error}</p> : null}

          {step === "code" ? (
            <button
              type="button"
              onClick={resendCode}
              disabled={isSubmitting || resendAfter > 0}
              className="self-start text-sm font-semibold text-[#2463eb] hover:text-[#1546ad] disabled:cursor-not-allowed disabled:text-[#8c98a8]"
            >
              {resendAfter > 0 ? `Запросить повторно через ${resendAfter} сек.` : "Отправить код повторно"}
            </button>
          ) : null}

          <div className="flex justify-end gap-2.5">
            <button type="button" onClick={() => { if (step === "phone") setStep("method"); else onClose(); }} disabled={isSubmitting} className="min-h-11 rounded-lg border border-[#d9e1ec] px-4 text-sm font-semibold hover:bg-[#f4f7fb] disabled:opacity-50">{step === "phone" ? "Назад" : "Отмена"}</button>
            <button type="submit" disabled={isSubmitting || (step === "phone" ? phone.trim().length < 8 : step === "code" ? code.trim().length < 3 : !password)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#2463eb] px-5 text-sm font-semibold text-white hover:bg-[#1546ad] disabled:opacity-50">
              {isSubmitting ? <Loader2 size={17} className="animate-spin" /> : null}
              {step === "phone" ? "Получить код" : step === "code" ? "Подтвердить" : "Подключить"}
            </button>
          </div>
        </form>
        )}
      </section>
    </div>
  );
}

function _deliveryLabel(method: "app" | "sms" | "call" | "email" | "other") {
  if (method === "app") return "сообщение в приложении Telegram";
  if (method === "sms") return "SMS";
  if (method === "call") return "телефонный звонок";
  if (method === "email") return "электронная почта";
  return "способ, выбранный Telegram";
}

function _deliveryText(method: "app" | "sms" | "call" | "email" | "other") {
  if (method === "app") return "Telegram отправил код в служебный чат Telegram на уже авторизованном устройстве.";
  if (method === "sms") return "Telegram отправил код по SMS.";
  if (method === "call") return "Telegram передаст код телефонным звонком.";
  if (method === "email") return "Telegram отправил код на связанную электронную почту.";
  return "Telegram принял запрос кода, но не сообщил приложению точный способ доставки.";
}
