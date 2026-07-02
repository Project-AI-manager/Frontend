"use client";

import { ArrowRight, CheckCircle2, LockKeyhole, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { getAuth } from "@/lib/api/generated/auth/auth";
import { getApiErrorMessage } from "@/lib/api/errors";
import { setAuthTokens } from "@/lib/api/token";

const authApi = getAuth();
const DEMO_EMAIL = "owner.demo@example.com";
const DEMO_PASSWORD = "demo-password";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function signIn(nextEmail: string, nextPassword: string) {
    setError("");
    setIsSubmitting(true);

    try {
      const tokens = await authApi.loginApiV1AuthLoginPost({
        email: nextEmail,
        password: nextPassword,
      });
      setAuthTokens({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      });
      router.push("/inbox");
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Не удалось войти. Проверь email и пароль."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await signIn(email, password);
  }

  async function handleDemoLogin() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    await signIn(DEMO_EMAIL, DEMO_PASSWORD);
  }

  return (
    <main className="soft-grid min-h-screen px-5 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-lg border border-[#d9e1ec] bg-white shadow-[0_24px_70px_rgba(18,39,76,0.12)] lg:grid-cols-[1fr_0.9fr]">
        <section className="blue-panel relative hidden rounded-none border-0 p-10 text-white lg:block">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-full bg-white/95 text-[#2463eb] shadow-lg shadow-blue-950/10">
              <span className="brand-mark size-7 shadow-none" />
            </span>
            <span className="text-xl font-black">Автопилот</span>
          </Link>

          <div className="mt-24 max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/80">
              <Sparkles size={16} className="text-[#c9d9ff]" />
              Кабинет уже ждёт
            </div>
            <h1 className="mt-6 text-5xl font-black tracking-[-0.055em]">
              Вернись к диалогам без лишней рутины.
            </h1>
            <p className="mt-5 text-white/70">
              После входа ты попадёшь в inbox, где собраны обращения, база
              знаний и черновики AI.
            </p>
          </div>

          <div className="absolute bottom-10 left-10 right-10 rounded-lg border border-white/15 bg-white/10 p-5">
            {[
              "JWT-сессия",
              "Access token в запросах",
              "Refresh cookie для кабинета",
            ].map((item) => (
              <div
                key={item}
                className="mt-3 first:mt-0 flex items-center gap-3 text-sm text-white/75"
              >
                <CheckCircle2 size={16} className="text-[#9ee7c3]" />
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <Link href="/" className="mb-10 flex items-center gap-3 lg:hidden">
              <span className="brand-mark size-10" />
              <span className="text-lg font-black">Автопилот</span>
            </Link>

            <div className="flex size-12 items-center justify-center rounded-lg bg-[#eaf1ff] text-[#2463eb]">
              <LockKeyhole size={22} />
            </div>
            <h2 className="mt-6 text-3xl font-black tracking-tight">Вход</h2>
            <p className="mt-2 text-sm text-[#526071]">
              Используй тестового пользователя или свой аккаунт после
              регистрации.
            </p>

            <button
              disabled={isSubmitting}
              onClick={handleDemoLogin}
              className="primary-button mt-6 w-full px-5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
            >
              {isSubmitting
                ? "Открываем демо..."
                : "Войти в демо без регистрации"}
              <Sparkles size={18} />
            </button>

            <div className="mt-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">
              <span className="h-px flex-1 bg-[#d9e1ec]" />
              или
              <span className="h-px flex-1 bg-[#d9e1ec]" />
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <label className="block text-sm">
                <span className="font-bold">Email</span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="form-field mt-2 px-4 py-3"
                  type="email"
                  autoComplete="email"
                  required
                />
              </label>

              <label className="block text-sm">
                <span className="font-bold">Пароль</span>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="form-field mt-2 px-4 py-3"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </label>

              {error ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                  {error}
                </p>
              ) : null}

              <button
                disabled={isSubmitting}
                className="secondary-button w-full px-5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
              >
                {isSubmitting ? "Входим..." : "Войти"}
                <ArrowRight size={18} />
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-neutral-600">
              Нет аккаунта?{" "}
              <Link
                href="/register"
                className="font-bold text-[#2463eb] underline decoration-[#9db7f4] underline-offset-4"
              >
                Создать аккаунт
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
