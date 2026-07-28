"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ClipboardEvent, FormEvent, KeyboardEvent, Suspense, useEffect, useRef, useState } from "react";

import { AuthShell } from "@/components/ui/auth-shell";
import { emailApi } from "@/lib/api/email";
import { getApiErrorMessage } from "@/lib/api/errors";

const CODE_LENGTH = 6;

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "вашу почту";
  const [characters, setCharacters] = useState(Array.from({ length: CODE_LENGTH }, () => ""));
  const [seconds, setSeconds] = useState(42);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [devToken, setDevToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const storedToken = sessionStorage.getItem("autopilot_verification_dev_token") ?? "";
      window.setTimeout(() => setDevToken(storedToken), 0);
    }
  }, []);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(id);
  }, [seconds]);

  function setCharacter(index: number, raw: string) {
    const nextValue = raw.replace(/\D/g, "").slice(0, 1);
    setCharacters((current) => current.map((value, itemIndex) => itemIndex === index ? nextValue : value));
    if (nextValue && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
  }

  function handleInput(index: number, event: FormEvent<HTMLInputElement>) {
    setCharacter(index, event.currentTarget.value);
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !characters[index] && index > 0) inputs.current[index - 1]?.focus();
    if (event.key === "ArrowLeft" && index > 0) inputs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const token = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!token) return;
    event.preventDefault();
    setCharacters(Array.from({ length: CODE_LENGTH }, (_, index) => token[index] ?? ""));
    inputs.current[Math.min(token.length, CODE_LENGTH) - 1]?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const enteredCode = characters.join("");
    const token = enteredCode.length === CODE_LENGTH ? enteredCode : "";
    if (!token) { setError("Введите код из шести символов."); return; }
    setError(""); setIsSubmitting(true);
    try {
      await emailApi.confirmVerification(token);
      sessionStorage.removeItem("autopilot_verification_dev_token");
      router.push("/inbox");
    } catch (err) { setError(getApiErrorMessage(err, "Код не подошёл или истёк. Запросите новый.")); }
    finally { setIsSubmitting(false); }
  }

  async function resend() {
    setError(""); setNotice(""); setIsResending(true);
    try {
      const response = await emailApi.requestVerification();
      const localToken = process.env.NODE_ENV === "development" ? response.dev_token ?? "" : "";
      setDevToken(localToken);
      if (localToken) sessionStorage.setItem("autopilot_verification_dev_token", localToken);
      setCharacters(Array.from({ length: CODE_LENGTH }, () => ""));
      setSeconds(42);
      setNotice("Новый код отправлен.");
      inputs.current[0]?.focus();
    } catch (err) { setError(getApiErrorMessage(err, "Не удалось отправить код повторно.")); }
    finally { setIsResending(false); }
  }

  return (
    <AuthShell>
      <section className="ap-auth-card" aria-labelledby="verify-title">
        <div className="text-center">
          <h1 id="verify-title" className="font-heading text-[24px] font-extrabold tracking-[-0.04em]">Подтвердите почту</h1>
          <p className="mt-2 text-[14px] leading-[1.6] text-[#526071]">Отправили код на <strong className="font-semibold text-[#101828]">{email}</strong> · <Link href="/register" className="text-[#1546ad]">изменить</Link></p>
        </div>
        <div className="my-[18px] h-px bg-[#e5eaf1]" />
        <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
          <fieldset>
            <legend className="sr-only">Код подтверждения</legend>
            <div className="flex justify-center gap-1.5 sm:gap-2.5">
              {characters.map((character, index) => (
                <input
                  key={index}
                  ref={(node) => { inputs.current[index] = node; }}
                  className="h-[58px] w-[43px] rounded-[8px] border border-[#d9e1ec] bg-white text-center font-heading text-[24px] font-extrabold tabular-nums outline-none focus:border-[#2463eb] focus:shadow-[0_0_0_3px_#eaf1ff] sm:h-[60px] sm:w-[52px]"
                  value={character}
                  onInput={(event) => handleInput(index, event)}
                  onKeyDown={(event) => handleKeyDown(index, event)}
                  onPaste={handlePaste}
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  inputMode="numeric"
                  maxLength={1}
                  aria-label={`Символ ${index + 1}`}
                />
              ))}
            </div>
          </fieldset>
          <p className="m-0 text-center text-[13px] text-[#64717f]">Код из шести символов действует 10 минут</p>
          {devToken ? <p className="m-0 rounded-[8px] border border-[#d9e1ec] bg-[#f8fbff] p-3 text-center text-[12px] text-[#526071]">Локальный код разработчика: <code className="break-all font-semibold text-[#101828]">{devToken}</code></p> : null}
          {notice ? <p role="status" className="m-0 rounded-[8px] bg-[#e6f7f0] p-3 text-center text-[13px] text-[#0c7a4e]">{notice}</p> : null}
          {error ? <p role="alert" className="m-0 rounded-[8px] border border-[#f3cfcf] bg-[#fdeded] p-3 text-center text-[13px] text-[#a72f2f]">{error}</p> : null}
          <button className="ap-primary flex items-center justify-center gap-2" disabled={isSubmitting} type="submit">{isSubmitting ? <><span className="ap-spinner" />Проверяем</> : "Подтвердить"}</button>
          <button className="min-h-10 rounded-[8px] border border-transparent bg-transparent text-[14px] font-semibold tabular-nums text-[#526071] hover:bg-[#f4f7fb] disabled:cursor-default disabled:opacity-45" disabled={seconds > 0 || isResending} type="button" onClick={resend}>{isResending ? "Отправляем..." : seconds > 0 ? `Отправить код снова через 00:${String(seconds).padStart(2, "0")}` : "Отправить код снова"}</button>
        </form>
      </section>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return <Suspense fallback={<main className="ap-doodle min-h-screen" />}><VerifyEmailForm /></Suspense>;
}
