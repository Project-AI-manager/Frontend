"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { getApiErrorMessage } from "@/lib/api/errors";
import { getAuth } from "@/lib/api/generated/auth/auth";
import { setAuthTokens } from "@/lib/api/token";

const authApi = getAuth();

/** Витрина слева: что именно создаётся при регистрации. */
const showcasePoints = [
  "Компания + владелец",
  "Безопасный вход сразу после регистрации",
  "Переход в onboarding",
];

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
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto grid w-full max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-start">
        {/* Витрина видна только с lg, как и раньше: на узком экране форма
            занимает всю ширину и ничем не разбавляется. */}
        <aside className="hidden flex-col lg:flex">
          <Link href="/" className="w-fit text-base font-semibold">
            Автопилот
          </Link>

          <div className="mt-10 max-w-md">
            <span className="wf-tag">Быстрый старт MVP</span>

            <h2 className="mt-4 text-balance text-2xl font-semibold">
              Создай рабочее пространство и подключай первый канал.
            </h2>

            <p className="wf-muted mt-4 leading-7">
              После регистрации откроется onboarding: профиль, Telegram-канал и
              первая база знаний.
            </p>

            <ul className="mt-6 space-y-2">
              {showcasePoints.map((point) => (
                <li key={point} className="wf-fill p-4 text-sm leading-6">
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <p className="wf-muted mt-10 max-w-md text-xs leading-5">
            Автопилот — AI-сотрудник в едином окне для продаж и поддержки.
          </p>
        </aside>

        <div className="mx-auto w-full max-w-[420px] lg:mx-0">
          <Link href="/" className="text-base font-semibold lg:hidden">
            Автопилот
          </Link>

          <div className="wf-box mt-5 p-5 sm:p-6 lg:mt-0">
            <h1 className="wf-title">Создать аккаунт</h1>
            <p className="wf-muted mt-2 text-sm leading-6">
              Регистрация создает компанию и пользователя-владельца, а затем
              переводит в onboarding.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <label className="block">
                <span className="wf-label">Компания</span>
                <input
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  className="wf-field"
                  required
                />
              </label>

              <label className="block">
                <span className="wf-label">Имя</span>
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="wf-field"
                />
              </label>

              <label className="block">
                <span className="wf-label">Email</span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="wf-field"
                  type="email"
                  autoComplete="email"
                  required
                />
              </label>

              <label className="block">
                <span className="wf-label">Пароль</span>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="wf-field"
                  type="password"
                  autoComplete="new-password"
                  required
                />
              </label>

              {error ? <p className="wf-error">{error}</p> : null}

              <button
                disabled={isSubmitting}
                className="wf-btn wf-btn-primary w-full"
                type="submit"
              >
                {isSubmitting ? "Создаем..." : "Создать аккаунт"}
              </button>
            </form>
          </div>

          <p className="wf-muted mt-5 text-center text-sm">
            Уже есть аккаунт?{" "}
            <Link
              href="/login"
              className="text-ink underline underline-offset-4"
            >
              Войти
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
