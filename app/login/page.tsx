"use client";

import {
  AlertCircle,
  ArrowRight,
  Cable,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { emailApi } from "@/lib/api/email";
import { getApiErrorMessage } from "@/lib/api/errors";
import { getAuth } from "@/lib/api/generated/auth/auth";
import { setAuthTokens } from "@/lib/api/token";

const authApi = getAuth();
const DEMO_EMAIL = "owner.demo@example.com";
const DEMO_PASSWORD = "demo-password";

/** Витрина слева: держит доверие, пока пользователь вводит данные. */
const showcasePoints = [
  { icon: ShieldCheck, text: "Безопасная сессия между входами" },
  { icon: KeyRound, text: "Email-регистрация и восстановление пароля" },
  { icon: Cable, text: "Интеграции проверяются из настроек" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState(DEMO_EMAIL);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const [isResetRequesting, setIsResetRequesting] = useState(false);
  const [isResetConfirming, setIsResetConfirming] = useState(false);

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
        getApiErrorMessage(
          err,
          "Не удалось войти. Проверь email и пароль.",
        ),
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

  async function handleResetRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextEmail = resetEmail.trim();

    if (!nextEmail) {
      setResetNotice("Укажи email для восстановления пароля.");
      return;
    }

    setResetNotice(null);
    setIsResetRequesting(true);

    try {
      const response = await emailApi.requestPasswordReset(nextEmail);
      if (response.dev_token) {
        setResetToken(response.dev_token);
        setResetNotice(
          `Письмо записано в dev outbox. Token: ${response.dev_token}`,
        );
        return;
      }

      setResetNotice(
        response.sent
          ? "Письмо для восстановления отправлено."
          : "Если email есть в системе, инструкция будет отправлена.",
      );
    } catch (err) {
      setResetNotice(
        getApiErrorMessage(
          err,
          "Не удалось запросить восстановление пароля.",
        ),
      );
    } finally {
      setIsResetRequesting(false);
    }
  }

  async function handleResetConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = resetToken.trim();
    const passwordValue = newPassword.trim();

    if (!token || !passwordValue) {
      setResetNotice("Вставь token и новый пароль.");
      return;
    }

    setResetNotice(null);
    setIsResetConfirming(true);

    try {
      await emailApi.confirmPasswordReset(token, passwordValue);
      setPassword(passwordValue);
      setNewPassword("");
      setResetToken("");
      setResetNotice("Пароль обновлен. Теперь можно войти с новым паролем.");
    } catch (err) {
      setResetNotice(
        getApiErrorMessage(err, "Не удалось обновить пароль по token."),
      );
    } finally {
      setIsResetConfirming(false);
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
                Кабинет уже ждет
              </span>
              <h2 className="mt-6 text-balance font-display text-[2.6rem] font-extrabold leading-[1.06] xl:text-5xl">
                Вернись к диалогам без лишней рутины.
              </h2>
              <p className="mt-5 max-w-md leading-7 text-on-brand">
                После входа откроется inbox: обращения клиентов, база знаний,
                черновики AI и настройки интеграций в одном рабочем контуре.
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
                <LockKeyhole size={22} />
              </span>
              <h1 className="mt-5 font-display text-3xl font-extrabold tracking-[-0.04em]">
                Вход
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted">
                Используй тестового пользователя или свой аккаунт после
                регистрации.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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

                <div>
                  <label className="block">
                    <span className="field-label">Пароль</span>
                    <input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="field"
                      type="password"
                      autoComplete="current-password"
                      required
                    />
                  </label>
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsResetOpen((open) => !open)}
                      aria-expanded={isResetOpen}
                      className="cursor-pointer text-sm font-semibold text-brand underline decoration-[#9db7f4] underline-offset-4 transition-colors hover:text-brand-dark"
                    >
                      Забыли пароль?
                    </button>
                  </div>
                </div>

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
                  {isSubmitting ? "Входим..." : "Войти"}
                  <ArrowRight size={18} />
                </button>
              </form>

              {isResetOpen ? (
                <div className="soft-panel mt-4 p-4 sm:p-5">
                  <div className="flex items-center gap-2.5">
                    <span className="icon-badge icon-badge-sm shrink-0">
                      <KeyRound size={17} />
                    </span>
                    <h3 className="font-display text-base font-extrabold">
                      Восстановление пароля
                    </h3>
                  </div>
                  <p className="field-hint">
                    Для локальной проверки код восстановления появится сразу
                    после запроса.
                  </p>

                  <form
                    onSubmit={handleResetRequest}
                    className="mt-4 space-y-2.5"
                  >
                    <label className="block">
                      <span className="field-label">
                        Email для восстановления
                      </span>
                      <input
                        value={resetEmail}
                        onChange={(event) => setResetEmail(event.target.value)}
                        className="field"
                        type="email"
                        autoComplete="email"
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={isResetRequesting}
                      className="btn btn-secondary btn-sm w-full"
                    >
                      {isResetRequesting ? "Запрашиваем..." : "Получить token"}
                      <Mail size={16} />
                    </button>
                  </form>

                  <div className="divider my-4" />

                  <form
                    onSubmit={handleResetConfirm}
                    className="grid gap-2.5 sm:grid-cols-2"
                  >
                    <label htmlFor="reset-token" className="block">
                      <span className="sr-only">Token</span>
                      <input
                        id="reset-token"
                        value={resetToken}
                        onChange={(event) => setResetToken(event.target.value)}
                        className="field text-sm"
                        placeholder="Token"
                      />
                    </label>
                    <label htmlFor="reset-new-password" className="block">
                      <span className="sr-only">Новый пароль</span>
                      <input
                        id="reset-new-password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        className="field text-sm"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Новый пароль"
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={isResetConfirming}
                      className="btn btn-primary btn-sm w-full sm:col-span-2"
                    >
                      {isResetConfirming ? "..." : "Сменить"}
                    </button>
                  </form>

                  {resetNotice ? (
                    <p className="mt-3 break-words rounded-md border border-line bg-white p-3 text-sm font-semibold leading-6 text-ink-soft">
                      {resetNotice}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-6 flex items-center gap-3">
                <span className="divider flex-1" />
                <span className="micro-label">или</span>
                <span className="divider flex-1" />
              </div>

              <button
                disabled={isSubmitting}
                onClick={handleDemoLogin}
                className="btn btn-secondary mt-6 w-full text-sm sm:text-base"
                type="button"
              >
                {isSubmitting
                  ? "Открываем демо..."
                  : "Войти в демо без регистрации"}
                <Sparkles size={18} />
              </button>
            </div>

            <p className="mt-6 text-center text-sm text-muted">
              Нет аккаунта?{" "}
              <Link
                href="/register"
                className="font-bold text-brand underline decoration-[#9db7f4] underline-offset-4"
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
