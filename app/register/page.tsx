"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

// Скелет регистрации. Демо: ставит cookie и ведёт в онбординг.
export default function RegisterPage() {
  const router = useRouter();

  function startDemo() {
    document.cookie = "refresh_token=demo; path=/; max-age=2592000; SameSite=Lax";
    router.push("/onboarding");
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-20">
      <h1 className="text-2xl font-bold">Создать аккаунт</h1>
      {/* TODO: форма (компания, email, пароль) */}
      <button onClick={startDemo} className="mt-6 rounded border px-4 py-2">
        Создать (демо)
      </button>
      <p className="mt-4 text-sm">
        <Link href="/login">Войти</Link>
      </p>
    </main>
  );
}
