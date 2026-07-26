"use client";

import {
  AlertCircle,
  ArrowRight,
  Building2,
  Rocket,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { getApiErrorMessage } from "@/lib/api/errors";
import { getAuth } from "@/lib/api/generated/auth/auth";
import { setAuthTokens } from "@/lib/api/token";

const authApi = getAuth();

/** Витрина слева: что именно создаётся при регистрации. */
const showcasePoints = [
  { icon: Building2, text: "Компания + владелец" },
  { icon: ShieldCheck, text: "Безопасный вход сразу после регистрации" },
  { icon: Rocket, text: "Переход в onboarding" },
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
    <main className="grid-backdrop min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:min-h-[calc(100vh-5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]">
        <aside className="blue-panel hidden flex-col p-10 lg:flex xl:p-12">
          <Link
            href="/"
            className="inline-flex w-fit shrink-0 items-center gap-3"
          >
            <span
              className="brand-mark size-10"
              style={{
                background: "#fff",
                color: "var(--color-brand)",
                boxShadow: "none",
              }}
            />
            <span className="font-display text-xl font-extrabold tracking-[-0.04em]">
              Автопилот
            </span>
          </Link>

          <div className="flex flex-1 flex-col justify-center py-12">
            <div className="max-w-lg">
              <span className="pill-tag bg-white/10 text-on-brand-strong">
                <Sparkles size={16} />
                Быстрый старт MVP
              </span>
              <h2 className="mt-6 text-balance font-display text-[2.6rem] font-extrabold leading-[1.06] xl:text-5xl">
                Создай рабочее пространство и подключай первый канал.
              </h2>
              <p className="mt-5 max-w-md leading-7 text-on-brand">
                После регистрации откроется onboarding: профиль, Telegram-канал
                и первая база знаний.
              </p>

              <ul className="mt-8 space-y-3">
                {showcasePoints.map((point) => (
                  <li
                    key={point.text}
                    className="flex items-center gap-3 rounded-md border border-white/15 bg-white/10 px-4 py-3"
                  >
                    <point.icon size={18} className="shrink-0 text-[#c9d9ff]" />
                    <span className="text-sm text-on-brand">{point.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="flex shrink-0 items-start gap-2.5 text-xs leading-5 text-on-brand">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#c9d9ff]" />
            Автопилот — AI-сотрудник в едином окне для продаж и поддержки.
          </p>
        </aside>

        <section className="flex items-center justify-center">
          <div className="w-full max-w-[440px] py-2">
            <Link
              href="/"
              className="mb-7 inline-flex items-center gap-3 lg:hidden"
            >
              <span className="brand-mark size-9" />
              <span className="font-display text-lg font-extrabold tracking-[-0.04em]">
                Автопилот
              </span>
            </Link>

            <div className="panel p-5 sm:p-7">
              <span className="icon-badge">
                <Building2 size={22} />
              </span>
              <h1 className="mt-5 font-display text-3xl font-extrabold tracking-[-0.04em]">
                Создать аккаунт
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted">
                Регистрация создает компанию и пользователя-владельца, а затем
                переводит в onboarding.
              </p>

              <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                <label className="block">
                  <span className="field-label">Компания</span>
                  <input
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    className="field"
                    required
                  />
                </label>

                <label className="block">
                  <span className="field-label">Имя</span>
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="field"
                  />
                </label>

                <label className="block">
                  <span className="field-label">Email</span>
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="field"
                    type="email"
                    autoComplete="email"
                    required
                  />
                </label>

                <label className="block">
                  <span className="field-label">Пароль</span>
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="field"
                    type="password"
                    autoComplete="new-password"
                    required
                  />
                </label>

                {error ? (
                  <div className="flex items-start gap-3 rounded-md border border-danger/25 bg-danger-soft p-4">
                    <AlertCircle size={18} className="shrink-0 text-danger" />
                    <p className="text-sm font-semibold leading-5 text-danger-ink">
                      {error}
                    </p>
                  </div>
                ) : null}

                <button
                  disabled={isSubmitting}
                  className="btn btn-primary w-full"
                  type="submit"
                >
                  {isSubmitting ? "Создаем..." : "Создать аккаунт"}
                  <ArrowRight size={18} />
                </button>
              </form>
            </div>

            <p className="mt-6 text-center text-sm text-muted">
              Уже есть аккаунт?{" "}
              <Link
                href="/login"
                className="font-bold text-brand underline decoration-[#9db7f4] underline-offset-4"
              >
                Войти
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
