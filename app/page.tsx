import Link from "next/link";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

const sections = [
  ["product", "Что делает продукт", "Единое окно для диалогов, базы знаний и каналов."],
  ["workflow", "Как работает", "Сообщение → поиск знаний → черновик или автоматический ответ."],
  ["pricing", "Тарифы", "Место под будущие тарифы и ограничения продукта."],
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--canvas)]">
      <Header />
      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] wire-muted">Черновой макет главной</p>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">AI-менеджер для работы с обращениями клиентов</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 wire-muted">Здесь позже появятся финальное позиционирование, стиль, графика и продуктовые доказательства.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link href="/register" className="wire-button-dark">Попробовать</Link><Link href="/login" className="wire-button">Войти</Link></div>
          </div>
          <div className="wire-panel min-h-80 p-5" aria-label="Место под главный визуал">
            <div className="grid h-full place-items-center border border-dashed border-[var(--line)] text-sm wire-muted">Главный визуал / интерфейс продукта</div>
          </div>
        </section>
        <div className="mx-auto max-w-6xl px-5 pb-20">
          {sections.map(([id, title, text], index) => (
            <section id={id} key={id} className="grid gap-6 border-t border-[var(--line)] py-12 md:grid-cols-[80px_1fr_1fr]">
              <span className="text-sm wire-muted">0{index + 1}</span><h2 className="text-2xl font-bold">{title}</h2><p className="leading-7 wire-muted">{text}</p>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
