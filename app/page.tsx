import Link from "next/link";

import { Card, PublicHeader, StatusBadge } from "@/components/navigation";

const features = [
  "Ответы строго по базе знаний компании",
  "Единое окно для Avito, VK, MAX и веб-чата",
  "Эскалация менеджеру при низкой уверенности",
  "Кандидаты автообучения из реальных ответов",
];

const steps = [
  "Подключите первый канал",
  "Загрузите прайс, FAQ и условия",
  "ИИ отвечает по найденным источникам",
  "Сложное уходит менеджеру и пополняет базу",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <PublicHeader />
      <main>
        <section className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="mb-5 inline-flex rounded-full bg-surface px-4 py-2 text-sm font-bold text-brand ring-1 ring-border">
              AI-сотрудник для малого бизнеса в РФ
            </p>
            <h1 className="font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl">
              Отвечает клиентам из всех каналов — в одном окне
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-ink/70">
              «Едино» собирает обращения из Avito, VK, MAX и веб-чата, отвечает по вашей базе знаний
              и передаёт менеджеру только сложные случаи.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="rounded-lg bg-brand px-5 py-3 font-bold text-white hover:bg-brand-hover">
                Попробовать бесплатно
              </Link>
              <a href="#demo" className="rounded-lg border border-border px-5 py-3 font-bold hover:bg-surface">
                Смотреть структуру
              </a>
            </div>
          </div>

          <Card className="relative overflow-hidden bg-[#f7f5ef]">
            <div className="mb-6 flex flex-wrap gap-2">
              {["Avito", "VK", "MAX", "Веб-чат"].map((name) => (
                <span key={name} className="rounded-full border border-border bg-bg px-3 py-1 text-sm font-semibold">
                  {name}
                </span>
              ))}
            </div>
            <div className="rounded-2xl bg-bg p-5 shadow-[0_8px_24px_rgba(0,0,0,.05)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="font-bold">Иван П. · Avito</p>
                  <p className="text-sm text-ink/55">iPhone 15 128ГБ есть в наличии?</p>
                </div>
                <StatusBadge status="Авто" />
              </div>
              <div className="rounded-2xl bg-surface p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-brand">Ответ ИИ</span>
                  <span className="rounded-full bg-status-auto-bg px-3 py-1 text-xs font-bold text-status-auto-fg">
                    Уверенность 94%
                  </span>
                </div>
                <p className="text-sm leading-6">
                  Да, в наличии 2 шт: чёрный и синий. Цена 79 990 ₽, доставка по Казани сегодня.
                </p>
              </div>
            </div>
          </Card>
        </section>

        <section id="how" className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-4 md:grid-cols-4">
            {steps.map((step, index) => (
              <Card key={step}>
                <span className="text-sm font-black text-brand">0{index + 1}</span>
                <h3 className="mt-4 font-display text-xl font-black">{step}</h3>
              </Card>
            ))}
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 py-12">
          <div className="mb-8 max-w-3xl">
            <h2 className="font-display text-4xl font-black">Что входит в MVP</h2>
            <p className="mt-3 text-ink/65">
              Без раздутой CRM: только ядро, которое проверяет ценность — база знаний, единое окно,
              AI-черновики/автоответы и контроль менеджера.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {features.map((feature) => (
              <Card key={feature}>
                <p className="text-lg font-bold">{feature}</p>
              </Card>
            ))}
          </div>
        </section>

        <section id="demo" className="mx-auto max-w-7xl px-6 py-12">
          <Card className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand">Демо-слот</p>
              <h2 className="mt-3 font-display text-4xl font-black">Здесь будет видео продукта</h2>
              <p className="mt-4 text-ink/65">
                Пока вместо ролика — структурная заглушка: канал → RAG → уверенность → автоответ или менеджер.
              </p>
            </div>
            <div className="grid aspect-video place-items-center rounded-2xl border border-border bg-bg">
              <div className="grid h-20 w-20 place-items-center rounded-full bg-brand text-3xl text-white">▶</div>
            </div>
          </Card>
        </section>

        <section id="pricing" className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Старт", "4 900 ₽", "до 500 диалогов"],
              ["Бизнес", "12 900 ₽", "до 2 000 диалогов"],
              ["Команда", "29 900 ₽", "до 7 000 диалогов"],
            ].map(([name, price, limit]) => (
              <Card key={name} className={name === "Бизнес" ? "ring-2 ring-brand" : ""}>
                <h3 className="font-display text-2xl font-black">{name}</h3>
                <p className="mt-4 text-3xl font-black">{price}</p>
                <p className="mt-2 text-sm text-ink/60">{limit}</p>
                <Link href="/register" className="mt-6 inline-flex rounded-lg bg-brand px-4 py-2 font-bold text-white">
                  Выбрать
                </Link>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-sm text-ink/60">
          <p>© 2026 Едино</p>
          <div className="flex gap-4">
            <Link href="/legal/privacy">Политика конфиденциальности</Link>
            <Link href="/legal/terms">Условия</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
