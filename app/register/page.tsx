"use client";

import axios from "axios";
import { ArrowRight, Building2, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

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
      setError(getErrorMessage(err, "Не удалось создать аккаунт. Попробуй другой email."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="soft-grid min-h-screen px-5 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-2xl shadow-black/10 lg:grid-cols-[0.9fr_1fr]">
        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <Link href="/" className="mb-10 flex items-center gap-3 lg:hidden">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-black text-sm font-black text-white">
                Е
              </span>
              <span className="text-lg font-black">Едино</span>
            </Link>

            <div className="flex size-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
              <Building2 size={22} />
            </div>
            <h1 className="mt-6 text-3xl font-black tracking-tight">Создать аккаунт</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Регистрация создаёт компанию и пользователя-владельца.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <label className="block text-sm">
                <span className="font-bold">Компания</span>
                <input
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-neutral-50 px-4 py-3 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  required
                />
              </label>

              <label className="block text-sm">
                <span className="font-bold">Имя</span>
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-neutral-50 px-4 py-3 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                />
              </label>

              <label className="block text-sm">
                <span className="font-bold">Email</span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-neutral-50 px-4 py-3 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
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
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-neutral-50 px-4 py-3 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3 font-bold text-white shadow-xl shadow-black/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
              >
                {isSubmitting ? "Создаём..." : "Создать аккаунт"}
                <ArrowRight size={18} />
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-neutral-600">
              Уже есть аккаунт?{" "}
              <Link href="/login" className="font-bold text-black underline decoration-orange-300 underline-offset-4">
                Войти
              </Link>
            </p>
          </div>
        </section>

        <section className="relative hidden bg-[#17130f] p-10 text-white lg:block">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-white text-sm font-black text-black">
              Е
            </span>
            <span className="text-xl font-black">Едино</span>
          </Link>

          <div className="mt-20 max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/80">
              <Sparkles size={16} className="text-orange-300" />
              Быстрый старт MVP
            </div>
            <h2 className="mt-6 text-5xl font-black tracking-[-0.05em]">
              Создай рабочее пространство и подключай первый канал.
            </h2>
            <p className="mt-5 text-white/60">
              После регистрации откроется onboarding: профиль, Telegram-канал и первая база знаний.
            </p>
          </div>

          <div className="absolute bottom-10 left-10 right-10 grid gap-3">
            {["Компания + владелец", "JWT-токены сразу после регистрации", "Переход в onboarding"].map((item) => (
              <div key={item} className="rounded-3xl border border-white/10 bg-white/8 p-4">
                <div className="flex items-center gap-3 text-sm text-white/75">
                  <CheckCircle2 size={16} className="text-emerald-300" />
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

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") {
      return detail;
    }
  }
  return fallback;
}
