"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { getAuth } from "@/lib/api/generated/auth/auth";
import { setAuthTokens } from "@/lib/api/token";

const authApi = getAuth();

export default function RegisterPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("Demo Company");
  const [fullName, setFullName] = useState("Demo Owner");
  const [email, setEmail] = useState("owner@example.com");
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
    <main className="mx-auto max-w-sm px-6 py-20">
      <h1 className="text-2xl font-bold">Создать аккаунт</h1>
      <p className="mt-2 text-sm text-gray-600">
        Регистрация создаёт компанию и пользователя-владельца.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-sm">
          <span className="font-medium">Компания</span>
          <input
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
            required
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium">Имя</span>
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium">Email</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
            type="email"
            autoComplete="email"
            required
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium">Пароль</span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
            type="password"
            autoComplete="new-password"
            required
          />
        </label>

        {error ? <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

        <button
          disabled={isSubmitting}
          className="w-full rounded bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
        >
          {isSubmitting ? "Создаём..." : "Создать аккаунт"}
        </button>
      </form>

      <p className="mt-4 text-sm">
        Уже есть аккаунт? <Link href="/login">Войти</Link>
      </p>
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
