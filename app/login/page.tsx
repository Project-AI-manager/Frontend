"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { getAuth } from "@/lib/api/generated/auth/auth";
import { setAuthTokens } from "@/lib/api/token";

const authApi = getAuth();

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("owner@example.com");
  const [password, setPassword] = useState("demo-password");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const tokens = await authApi.loginApiV1AuthLoginPost({ email, password });
      setAuthTokens({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      });
      router.push("/inbox");
    } catch (err) {
      setError(getErrorMessage(err, "Не удалось войти. Проверь email и пароль."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-20">
      <h1 className="text-2xl font-bold">Вход</h1>
      <p className="mt-2 text-sm text-gray-600">
        Войди в аккаунт, чтобы проверить кабинет и API-связку.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
            autoComplete="current-password"
            required
          />
        </label>

        {error ? <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

        <button
          disabled={isSubmitting}
          className="w-full rounded bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
        >
          {isSubmitting ? "Входим..." : "Войти"}
        </button>
      </form>

      <p className="mt-4 text-sm">
        Нет аккаунта? <Link href="/register">Создать аккаунт</Link>
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
