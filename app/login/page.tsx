"use client";

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

/** Витрина слева: что именно ждёт пользователя после входа. */
const showcasePoints = [
  "Безопасная сессия между входами",
  "Email-регистрация и восстановление пароля",
  "Интеграции проверяются из настроек",
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
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto grid w-full max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-start">
        {/* Витрина видна только с lg, как и раньше: на узком экране форма
            занимает всю ширину и ничем не разбавляется. */}
        <aside className="hidden flex-col lg:flex">
          <Link href="/" className="w-fit text-base font-semibold">
            Автопилот
          </Link>

          <div className="mt-10 max-w-md">
            <span className="wf-tag">Кабинет уже ждет</span>

            <h2 className="mt-4 text-balance text-2xl font-semibold">
              Вернись к диалогам без лишней рутины.
            </h2>

            <p className="wf-muted mt-4 leading-7">
              После входа откроется inbox: обращения клиентов, база знаний,
              черновики AI и настройки интеграций в одном рабочем контуре.
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
            <h1 className="wf-title">Вход</h1>
            <p className="wf-muted mt-2 text-sm leading-6">
              Используй тестового пользователя или свой аккаунт после регистрации.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
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

              <div>
                <label className="block">
                  <span className="wf-label">Пароль</span>
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="wf-field"
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
                    className="wf-muted cursor-pointer text-sm underline underline-offset-4"
                  >
                    Забыли пароль?
                  </button>
                </div>
              </div>

              {error ? <p className="wf-error">{error}</p> : null}

              <button
                disabled={isSubmitting}
                className="wf-btn wf-btn-primary w-full"
                type="submit"
              >
                {isSubmitting ? "Входим..." : "Войти"}
              </button>
            </form>

            {isResetOpen ? (
              <div className="wf-fill mt-4 p-4">
                <h2 className="text-sm font-semibold">Восстановление пароля</h2>
                <p className="wf-hint">
                  Для локальной проверки код восстановления появится сразу после
                  запроса.
                </p>

                <form onSubmit={handleResetRequest} className="mt-4 space-y-3">
                  <label className="block">
                    <span className="wf-label">Email для восстановления</span>
                    <input
                      value={resetEmail}
                      onChange={(event) => setResetEmail(event.target.value)}
                      className="wf-field"
                      type="email"
                      autoComplete="email"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={isResetRequesting}
                    className="wf-btn w-full"
                  >
                    {isResetRequesting ? "Запрашиваем..." : "Получить token"}
                  </button>
                </form>

                <div className="wf-divider my-4" />

                <form
                  onSubmit={handleResetConfirm}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  <label htmlFor="reset-token" className="block">
                    <span className="sr-only">Token</span>
                    <input
                      id="reset-token"
                      value={resetToken}
                      onChange={(event) => setResetToken(event.target.value)}
                      className="wf-field text-sm"
                      placeholder="Token"
                    />
                  </label>
                  <label htmlFor="reset-new-password" className="block">
                    <span className="sr-only">Новый пароль</span>
                    <input
                      id="reset-new-password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      className="wf-field text-sm"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Новый пароль"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={isResetConfirming}
                    className="wf-btn wf-btn-primary w-full sm:col-span-2"
                  >
                    {isResetConfirming ? "..." : "Сменить"}
                  </button>
                </form>

                {resetNotice ? (
                  <p className="wf-box mt-3 break-words p-3 text-sm leading-6">
                    {resetNotice}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="mt-5 flex items-center gap-3">
              <span className="wf-divider flex-1" />
              <span className="wf-muted text-xs">или</span>
              <span className="wf-divider flex-1" />
            </div>

            <button
              disabled={isSubmitting}
              onClick={handleDemoLogin}
              className="wf-btn mt-5 w-full"
              type="button"
            >
              {isSubmitting
                ? "Открываем демо..."
                : "Войти в демо без регистрации"}
            </button>
          </div>

          <p className="wf-muted mt-5 text-center text-sm">
            Нет аккаунта?{" "}
            <Link
              href="/register"
              className="text-ink underline underline-offset-4"
            >
              Создать аккаунт
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
