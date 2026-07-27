import Link from "next/link";

import { AuthShell } from "@/components/ui/auth-shell";

export default function NotFound() {
  return (
    <AuthShell>
      <section className="ap-auth-card text-center">
        <p className="font-heading text-[64px] font-extrabold leading-none tracking-[-0.055em] text-[#2463eb]">404</p>
        <h1 className="mt-5 font-heading text-[24px] font-extrabold tracking-[-0.04em]">Страница не найдена</h1>
        <p className="mt-3 text-[14px] leading-[1.6] text-[#526071]">Возможно, адрес изменился или в ссылке есть ошибка.</p>
        <Link href="/inbox" className="ap-primary mt-6 inline-flex w-full items-center justify-center">Вернуться в кабинет</Link>
      </section>
    </AuthShell>
  );
}
