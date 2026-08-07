"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

import { AuthShell } from "@/components/ui/auth-shell";
import { getApiErrorMessage } from "@/lib/api/errors";
import { getAuth } from "@/lib/api/generated/auth/auth";

const authApi = getAuth();

export default function ConfirmPasswordResetPage() {
  return (
    <Suspense fallback={<AuthShell><section className="ap-auth-card" aria-label="Загружаем восстановление пароля"><div className="mx-auto ap-spinner border-[#2463eb]/25 border-t-[#2463eb]" /></section></AuthShell>}>
      <ConfirmPasswordResetContent />
    </Suspense>
  );
}

function ConfirmPasswordResetContent() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState(() => {
    const queryToken = searchParams.get("token")?.trim();
    const devToken = typeof window !== "undefined" && process.env.NODE_ENV === "development"
      ? sessionStorage.getItem("autopilot_password_reset_dev_token")
      : null;
    return queryToken || devToken || "";
  });
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password !== passwordRepeat) {
      setError("Пароли не совпадают.");
      return;
    }
    setIsSubmitting(true);
    try {
      await authApi.confirmPasswordResetApiV1AuthPasswordResetConfirmPost({ token: token.trim(), new_password: password });
      sessionStorage.removeItem("autopilot_password_reset_dev_token");
      setDone(true);
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Код не подошёл или истёк. Запросите новый код."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <section className="ap-auth-card" aria-labelledby="password-confirm-title">
        {done ? (
          <div className="text-center">
            <h1 id="password-confirm-title" className="font-heading text-[24px] font-extrabold tracking-[-0.04em]">Пароль изменён</h1>
            <p role="status" className="mt-3 text-sm text-[#526071]">Теперь можно войти с новым паролем.</p>
            <Link href="/login" className="ap-primary mt-5 inline-flex items-center justify-center">Войти</Link>
          </div>
        ) : (
          <>
            <h1 id="password-confirm-title" className="text-center font-heading text-[24px] font-extrabold tracking-[-0.04em]">Новый пароль</h1>
            <p className="mt-3 text-center text-sm text-[#526071]">Введите код из письма и придумайте новый пароль.</p>
            <div className="my-[18px] h-px bg-[#e5eaf1]" />
            <form onSubmit={submit} className="flex flex-col gap-[18px]">
              <label className="ap-label">Код из письма<input className="ap-input" inputMode="numeric" autoComplete="one-time-code" value={token} onChange={(event) => setToken(event.target.value)} minLength={6} maxLength={64} placeholder="123456" required /></label>
              <PasswordInput id="reset-password" label="Новый пароль" value={password} onChange={setPassword} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} />
              <label className="ap-label">Повторите пароль<input className="ap-input" type={showPassword ? "text" : "password"} value={passwordRepeat} onChange={(event) => setPasswordRepeat(event.target.value)} autoComplete="new-password" minLength={8} required /></label>
              {error ? <p role="alert" className="rounded-[8px] border border-[#f3cfcf] bg-[#fdeded] p-3 text-[13px] text-[#a72f2f]">{error}</p> : null}
              <button className="ap-primary flex items-center justify-center gap-2" type="submit" disabled={isSubmitting}>{isSubmitting ? <><span className="ap-spinner" />Сохраняем</> : "Сохранить пароль"}</button>
            </form>
          </>
        )}
      </section>
      <p className="m-0 text-[14px] text-[#526071]"><Link href="/password-reset" className="text-[#1546ad] hover:text-[#2463eb]">Запросить новый код</Link></p>
    </AuthShell>
  );
}

function PasswordInput({ id, label, value, onChange, visible, onToggle }: { id: string; label: string; value: string; onChange: (value: string) => void; visible: boolean; onToggle: () => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold">{label}</label>
      <div className="flex items-center rounded-[8px] border border-[#d9e1ec] bg-white pr-1 focus-within:border-[#2463eb] focus-within:shadow-[0_0_0_3px_#eaf1ff]">
        <input id={id} className="min-h-11 min-w-0 flex-1 rounded-[8px] border-0 bg-transparent px-3.5 text-[14px] outline-none" type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} autoComplete="new-password" minLength={8} required />
        <button type="button" onClick={onToggle} aria-label={visible ? "Скрыть пароль" : "Показать пароль"} className="flex size-9 shrink-0 items-center justify-center rounded-[8px] text-[#64717f] hover:bg-[#f4f7fb]">{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
      </div>
    </div>
  );
}
