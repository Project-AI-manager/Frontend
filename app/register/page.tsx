"use client";

import { ArrowRight, Building2, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { getApiErrorMessage } from "@/lib/api/errors";
import { getAuth } from "@/lib/api/generated/auth/auth";
import { setAuthTokens } from "@/lib/api/token";

const authApi = getAuth();

export default function RegisterPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("New Demo Company");
  const [fullName, setFullName] = useState("New Demo Owner");
  const [email, setEmail] = useState("new-owner@example.com");
  const [password, setPassword] = useState("demo-password");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const tokens = await authApi.registerApiV1AuthRegisterPost({
        company_name: companyName,
        email,
        password,
        full_name: fullName,
      });
      setAuthTokens({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      });
      router.push("/onboarding");
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Не удалось создать аккаунт. Попробуй другой email.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="soft-grid min-h-screen px-5 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-lg border border-[#d9e1ec] bg-white shadow-[0_24px_70px_rgba(18,39,76,0.12)] lg:grid-cols-[0.9fr_1fr]">
        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <Link href="/" className="mb-10 flex items-center gap-3 lg:hidden">
              <span className="brand-mark size-10" />
              <span className="text-lg font-black">Автопилот</span>
            </Link>

            <div className="flex size-12 items-center justify-center rounded-lg bg-[#eaf1ff] text-[#2463eb]">
              <Building2 size={22} />
            </div>
            <h1 className="mt-6 text-3xl font-black tracking-tight">
              Создать аккаунт
            </h1>
            <p className="mt-2 text-sm text-[#526071]">
              Регистрация создает компанию и пользователя-владельца, а затем
              переводит в onboarding.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <label className="block text-sm">
                <span className="font-bold">Компания</span>
                <input
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  className="form-field mt-2 px-4 py-3"
                  required
                />
              </label>

              <label className="block text-sm">
                <span className="font-bold">Имя</span>
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="form-field mt-2 px-4 py-3"
                />
              </label>

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
                  autoComplete="new-password"
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
                className="primary-button w-full px-5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
              >
                {isSubmitting ? "Создаем..." : "Создать аккаунт"}
                <ArrowRight size={18} />
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-neutral-600">
              Уже есть аккаунт?{" "}
              <Link
                href="/login"
                className="font-bold text-[#2463eb] underline decoration-[#9db7f4] underline-offset-4"
              >
                Войти
              </Link>
            </p>
          </div>
        </section>

        <section className="blue-panel relative hidden rounded-none border-0 p-10 text-white lg:block">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-full bg-white/95 text-[#2463eb] shadow-lg shadow-blue-950/10">
              <span className="brand-mark size-7 shadow-none" />
            </span>
            <span className="text-xl font-black">Автопилот</span>
          </Link>

          <div className="mt-20 max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/80">
              <Sparkles size={16} className="text-[#c9d9ff]" />
              Быстрый старт MVP
            </div>
            <h2 className="mt-6 text-5xl font-black tracking-[-0.055em]">
              Создай рабочее пространство и подключай первый канал.
            </h2>
            <p className="mt-5 text-white/70">
              После регистрации откроется onboarding: профиль, Telegram-канал и
              первая база знаний.
            </p>
          </div>

          <div className="absolute bottom-10 left-10 right-10 grid gap-3">
            {[
              "Компания + владелец",
              "JWT-токены сразу после регистрации",
              "Переход в onboarding",
            ].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-white/15 bg-white/10 p-4"
              >
                <div className="flex items-center gap-3 text-sm text-white/75">
                  <CheckCircle2 size={16} className="text-[#9ee7c3]" />
                  {item}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
