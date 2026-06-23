"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Logo } from "@/components/navigation";

export default function RegisterPage() {
  const router = useRouter();

  function startDemo() {
    document.cookie = "refresh_token=demo; path=/; max-age=2592000; SameSite=Lax";
    router.push("/onboarding");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-bg px-6 py-12">
      <section className="w-full max-w-md rounded-[10px] border border-border bg-surface p-8 shadow-sm">
        <div className="mb-8 text-center">
          <Logo />
          <h1 className="mt-6 font-display text-3xl font-black">Создать аккаунт</h1>
          <p className="mt-2 text-sm text-ink/60">Минимальная регистрация: компания, email и пароль.</p>
        </div>
        <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
          <input className="w-full rounded-lg border border-border bg-bg px-4 py-3 outline-none focus:ring-2 focus:ring-brand" placeholder="Название компании" defaultValue="ООО Север" />
          <input className="w-full rounded-lg border border-border bg-bg px-4 py-3 outline-none focus:ring-2 focus:ring-brand" placeholder="Email" defaultValue="owner@sever.ru" />
          <input type="password" className="w-full rounded-lg border border-border bg-bg px-4 py-3 outline-none focus:ring-2 focus:ring-brand" placeholder="Пароль" defaultValue="demo-password" />
          <button type="button" onClick={startDemo} className="w-full rounded-lg bg-brand px-4 py-3 font-bold text-white hover:bg-brand-hover">
            Создать и настроить
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-ink/60">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="font-bold text-brand">
            Войти
          </Link>
        </p>
      </section>
    </main>
  );
}
