"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

// Скелет входа. Auth-API в разработке: кнопка ставит демо-cookie и пускает в кабинет.
export default function LoginPage() {
  const router = useRouter();

  function enterDemo() {
    document.cookie = "refresh_token=demo; path=/; max-age=2592000; SameSite=Lax";
    router.push("/inbox");
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-20">
      <h1 className="text-2xl font-bold">Вход</h1>
      {/* TODO: форма (email, пароль) */}
      <button onClick={enterDemo} className="mt-6 rounded border px-4 py-2">
        Войти в демо
      </button>
      <p className="mt-4 text-sm">
        <Link href="/register">Создать аккаунт</Link>
      </p>
    </main>
  );
}
