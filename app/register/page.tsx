"use client";

import { Check, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { AuthShell } from "@/components/ui/auth-shell";
import { emailApi } from "@/lib/api/email";
import { getApiErrorMessage } from "@/lib/api/errors";
import { getAuth } from "@/lib/api/generated/auth/auth";
import { setAuthTokens } from "@/lib/api/token";

const authApi = getAuth();

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!accepted) { setError("Примите условия использования и политику конфиденциальности."); return; }
    setIsSubmitting(true);
    try {
      const companyName = fullName.trim() ? `Компания ${fullName.trim()}` : "Моя компания";
      const tokens = await authApi.registerApiV1AuthRegisterPost({ company_name: companyName, email, password, full_name: fullName });
      setAuthTokens({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token });
      const verification = await emailApi.requestVerification();
      if (verification.dev_token && process.env.NODE_ENV === "development") sessionStorage.setItem("autopilot_verification_dev_token", verification.dev_token);
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Не удалось создать аккаунт. Попробуйте другой адрес почты."));
    } finally { setIsSubmitting(false); }
  }

  return (
    <AuthShell width={480}>
      <section className="ap-auth-card" aria-labelledby="register-title">
        <h1 id="register-title" className="text-center font-heading text-[24px] font-extrabold tracking-[-0.04em]">Создать аккаунт</h1>
        <div className="my-[18px] h-px bg-[#e5eaf1]" />
        <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
          <label className="ap-label">Имя<input className="ap-input" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" placeholder="Анна" required /></label>
          <label className="ap-label">Почта<input className="ap-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="anna@studio.ru" required /></label>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="register-password" className="text-[13px] font-semibold">Пароль</label>
            <div className="flex items-center rounded-[8px] border border-[#d9e1ec] bg-white pr-1 focus-within:border-[#2463eb] focus-within:shadow-[0_0_0_3px_#eaf1ff]">
              <input id="register-password" className="min-h-11 min-w-0 flex-1 rounded-[8px] border-0 bg-transparent px-3.5 text-[14px] outline-none" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="Не менее 8 символов" minLength={8} required />
              <button type="button" className="flex size-9 shrink-0 items-center justify-center rounded-[8px] text-[#64717f] hover:bg-[#f4f7fb]" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </div>
          <div className="flex items-start gap-2.5 text-[13px] leading-[1.5] text-[#526071]">
            <input
              id="register-consent"
              className="peer sr-only"
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
            />
            <label
              htmlFor="register-consent"
              className="mt-0.5 flex size-[18px] shrink-0 cursor-pointer items-center justify-center rounded-[5px] border border-[#d9e1ec] bg-white peer-focus-visible:ring-3 peer-focus-visible:ring-[#eaf1ff] peer-checked:border-[#2463eb] peer-checked:bg-[#2463eb]"
              aria-label="Принять условия использования и политику конфиденциальности"
            >
              {accepted ? <Check size={12} strokeWidth={3} className="text-white" /> : null}
            </label>
            <span>
              <label htmlFor="register-consent" className="cursor-pointer">Принимаю</label>{" "}
              <Link
                href="/legal/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#1546ad] underline decoration-[#1546ad]/45 underline-offset-2 hover:text-[#2463eb]"
              >
                условия использования
              </Link>{" "}
              и{" "}
              <Link
                href="/legal/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#1546ad] underline decoration-[#1546ad]/45 underline-offset-2 hover:text-[#2463eb]"
              >
                политику конфиденциальности
              </Link>
            </span>
          </div>
          {error ? <p role="alert" className="rounded-[8px] border border-[#f3cfcf] bg-[#fdeded] p-3 text-[13px] text-[#a72f2f]">{error}</p> : null}
          <button className="ap-primary flex items-center justify-center gap-2" type="submit" disabled={isSubmitting}>{isSubmitting ? <><span className="ap-spinner" />Создаём</> : "Создать аккаунт"}</button>
        </form>
      </section>
      <p className="m-0 text-[14px] text-[#526071]">Уже есть аккаунт? <Link href="/login" className="text-[#1546ad] hover:text-[#2463eb]">Войти</Link></p>
    </AuthShell>
  );
}
