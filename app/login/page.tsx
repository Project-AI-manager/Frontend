"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Logo } from "@/components/navigation";

export default function LoginPage() {
  const router = useRouter();

  function enterDemo() {
    document.cookie = "refresh_token=demo; path=/; max-age=2592000; SameSite=Lax";
    router.push("/inbox");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-bg px-6 py-12">
      <section className="w-full max-w-md rounded-[10px] border border-border bg-surface p-8 shadow-sm">
        <div className="mb-8 text-center">
          <Logo />
          <h1 className="mt-6 font-display text-3xl font-black">Вход</h1>
          <p className="mt-2 text-sm text-ink/60">Пока auth-API в разработке, кнопка ниже открывает демо-кабинет.</p>
        </div>
        <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
          <label className="block">
            <span className="text-sm font-bold">Email</span>
            <input className="mt-2 w-full rounded-lg border border-border bg-bg px-4 py-3 outline-none focus:ring-2 focus:ring-brand" defaultValue="owner@sever.ru" />
          </label>
          <label className="block">
            <span className="text-sm font-bold">Пароль</span>
            <input type="password" className="mt-2 w-full rounded-lg border border-border bg-bg px-4 py-3 outline-none focus:ring-2 focus:ring-brand" defaultValue="demo-password" />
          </label>
          <button type="button" onClick={enterDemo} className="w-full rounded-lg bg-brand px-4 py-3 font-bold text-white hover:bg-brand-hover">
            Войти в демо
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-ink/60">
          Нет аккаунта?{" "}
          <Link href="/register" className="font-bold text-brand">
            Создать
          </Link>
        </p>
      </section>
    </main>
  );
}
