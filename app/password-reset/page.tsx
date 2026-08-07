"use client";

import { MailCheck } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

import { AuthShell } from "@/components/ui/auth-shell";
import { getApiErrorMessage } from "@/lib/api/errors";
import { getAuth } from "@/lib/api/generated/auth/auth";

const authApi = getAuth();

export default function PasswordResetPage() {
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const response = await authApi.requestPasswordResetEmailApiV1AuthPasswordResetRequestPost({ email: email.trim() });
      if (response.dev_token && process.env.NODE_ENV === "development") {
        sessionStorage.setItem("autopilot_password_reset_dev_token", response.dev_token);
      }
      setSubmittedEmail(email.trim());
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Не удалось отправить код. Попробуйте ещё раз."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <section className="ap-auth-card" aria-labelledby="password-reset-title">
        {submittedEmail ? (
          <div className="text-center">
            <MailCheck className="mx-auto text-[#2463eb]" size={34} />
            <h1 id="password-reset-title" className="mt-3 font-heading text-[24px] font-extrabold tracking-[-0.04em]">Проверьте почту</h1>
            <p role="status" className="mt-3 text-sm leading-6 text-[#526071]">
              Если аккаунт с адресом <strong className="font-semibold text-[#101828]">{submittedEmail}</strong> существует, мы отправили шестизначный код для смены пароля.
            </p>
            <Link href={`/password-reset/confirm?email=${encodeURIComponent(submittedEmail)}`} className="ap-primary mt-5 inline-flex items-center justify-center">Ввести код</Link>
          </div>
        ) : (
          <>
            <h1 id="password-reset-title" className="text-center font-heading text-[24px] font-extrabold tracking-[-0.04em]">Восстановить пароль</h1>
            <p className="mt-3 text-center text-sm leading-6 text-[#526071]">Укажите почту аккаунта. Мы отправим код для создания нового пароля.</p>
            <div className="my-[18px] h-px bg-[#e5eaf1]" />
            <form onSubmit={submit} className="flex flex-col gap-[18px]">
              <label className="ap-label">Почта<input className="ap-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="anna@studio.ru" required /></label>
              {error ? <p role="alert" className="rounded-[8px] border border-[#f3cfcf] bg-[#fdeded] p-3 text-[13px] text-[#a72f2f]">{error}</p> : null}
              <button className="ap-primary flex items-center justify-center gap-2" type="submit" disabled={isSubmitting}>{isSubmitting ? <><span className="ap-spinner" />Отправляем</> : "Получить код"}</button>
            </form>
          </>
        )}
      </section>
      <p className="m-0 text-[14px] text-[#526071]"><Link href="/login" className="text-[#1546ad] hover:text-[#2463eb]">Вернуться ко входу</Link></p>
    </AuthShell>
  );
}
