"use client";

import { Check, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { AuthShell } from "@/components/ui/auth-shell";
import { getAuth } from "@/lib/api/generated/auth/auth";
import { getApiErrorMessage } from "@/lib/api/errors";
import { setAuthTokens } from "@/lib/api/token";

const authApi = getAuth();

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const tokens = await authApi.loginApiV1AuthLoginPost({ email, password });
      setAuthTokens({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token });
      router.push("/inbox");
    } catch (err) {
      setError(getApiErrorMessage(err, "Не удалось войти. Проверьте почту и пароль."));
    } finally { setIsSubmitting(false); }
  }

  return (
    <AuthShell>
      <section className="ap-auth-card" aria-labelledby="login-title">
        <h1 id="login-title" className="text-center font-heading text-[24px] font-extrabold tracking-[-0.04em]">Вход в кабинет</h1>
        <div className="my-[18px] h-px bg-[#e5eaf1]" />
        <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
          <label className="ap-label">Почта<input className="ap-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="anna@studio.ru" required /></label>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3"><label htmlFor="login-password" className="text-[13px] font-semibold">Пароль</label><Link href="/register" className="text-[13px] text-[#1546ad] hover:text-[#2463eb]">Забыли пароль?</Link></div>
            <div className="flex items-center rounded-[8px] border border-[#d9e1ec] bg-white pr-1 focus-within:border-[#2463eb] focus-within:shadow-[0_0_0_3px_#eaf1ff]">
              <input id="login-password" className="min-h-11 min-w-0 flex-1 rounded-[8px] border-0 bg-transparent px-3.5 text-[14px] outline-none" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="Введите пароль" required />
              <button type="button" className="flex size-9 shrink-0 items-center justify-center rounded-[8px] text-[#64717f] hover:bg-[#f4f7fb]" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}>{showPassword ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}</button>
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-[#526071]"><input className="peer sr-only" type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /><span className="flex size-[18px] items-center justify-center rounded-[5px] border border-[#d9e1ec] bg-white peer-checked:border-[#2463eb] peer-checked:bg-[#2463eb]">{remember ? <Check size={12} strokeWidth={3} className="text-white" /> : null}</span>Запомнить</label>
          {error ? <p role="alert" className="rounded-[8px] border border-[#f3cfcf] bg-[#fdeded] p-3 text-[13px] text-[#a72f2f]">{error}</p> : null}
          <button className="ap-primary flex items-center justify-center gap-2" type="submit" disabled={isSubmitting}>{isSubmitting ? <><span className="ap-spinner" />Входим</> : "Войти"}</button>
        </form>
      </section>
      <p className="m-0 text-[14px] text-[#526071]">Нет аккаунта? <Link href="/register" className="text-[#1546ad] hover:text-[#2463eb]">Зарегистрироваться</Link></p>
    </AuthShell>
  );
}
