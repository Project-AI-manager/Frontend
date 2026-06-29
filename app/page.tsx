import {
  ArrowRight,
  Bot,
  BrainCircuit,
  CheckCircle2,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

const features = [
  {
    icon: MessageSquareText,
    title: "Все обращения в одном окне",
    text: "Telegram, виджет сайта и будущие каналы собираются в единую ленту диалогов.",
  },
  {
    icon: BrainCircuit,
    title: "Память компании",
    text: "База знаний хранит документы, ответы менеджеров и кандидатов для автообучения.",
  },
  {
    icon: Bot,
    title: "AI-черновики ответов",
    text: "Ассистент готовит ответ, показывает источники и не отправляет сомнительное без менеджера.",
  },
  {
    icon: ShieldCheck,
    title: "Контроль уверенности",
    text: "Порог автоответа, эскалации и ручная проверка помогают запускать AI безопасно.",
  },
];

const steps = [
  "Подключите Telegram и загрузите первые документы",
  "AI найдёт похожие знания и соберёт черновик ответа",
  "Менеджер подтверждает, исправляет или отправляет ответ вручную",
];

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <section className="soft-grid relative overflow-hidden">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 lg:grid-cols-[1fr_0.9fr] lg:px-8 lg:py-28">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm backdrop-blur">
                <Sparkles size={16} className="text-orange-500" />
                AI-менеджер для продаж и поддержки
              </div>

              <h1 className="mt-7 max-w-4xl text-balance text-5xl font-black tracking-[-0.05em] text-neutral-950 sm:text-6xl lg:text-7xl">
                Один кабинет, где AI помогает отвечать клиентам быстрее.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
                Едино собирает диалоги, подключает базу знаний и готовит ответы для менеджеров.
                Пока человек контролирует качество, AI берёт на себя рутину.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-6 py-3 font-bold text-white shadow-xl shadow-black/15 transition hover:-translate-y-0.5"
                >
                  Начать бесплатно
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white/70 px-6 py-3 font-bold backdrop-blur transition hover:bg-white"
                >
                  Войти в демо
                </Link>
              </div>

              <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
                {[
                  ["3 мин", "до первого ответа"],
                  ["1 канал", "Telegram в MVP"],
                  ["100%", "контроль менеджера"],
                ].map(([value, label]) => (
                  <div key={label} className="glass-card rounded-3xl p-4">
                    <p className="text-2xl font-black">{value}</p>
                    <p className="mt-1 text-xs text-neutral-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-[2rem] p-4">
              <div className="rounded-[1.5rem] bg-[#17130f] p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/50">Сегодня</p>
                    <p className="text-2xl font-black">Диалоги</p>
                  </div>
                  <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-bold text-emerald-300">
                    online
                  </span>
                </div>

                <div className="mt-6 space-y-3">
                  {[
                    ["Алина", "Можно подключить Telegram?", "AI нашёл 2 источника"],
                    ["Павел", "Сколько стоит демо?", "Готов автоответ"],
                    ["Мария", "Нужна интеграция с CRM", "Эскалация"],
                  ].map(([name, message, status]) => (
                    <div key={name} className="rounded-3xl border border-white/10 bg-white/8 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-bold">{name}</p>
                          <p className="mt-1 text-sm text-white/60">{message}</p>
                        </div>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                          {status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-3xl bg-white p-4 text-black">
                  <div className="flex items-center gap-2 text-sm font-bold text-orange-600">
                    <Zap size={16} />
                    Черновик AI
                  </div>
                  <p className="mt-3 text-sm leading-6 text-neutral-700">
                    Telegram подключается через токен бота. В демо-режиме можно проверить ответы
                    до запуска автоответов.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-neutral-500">
                    <CheckCircle2 size={14} />
                    Источник: FAQ Telegram
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-orange-600">
              Возможности
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight">
              Минимальный набор, чтобы сервис уже был полезным.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="glass-card rounded-[1.75rem] p-6">
                <feature.icon size={28} className="text-orange-500" />
                <h3 className="mt-5 text-lg font-black">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-neutral-600">{feature.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="grid gap-6 rounded-[2rem] bg-black p-6 text-white lg:grid-cols-[0.8fr_1fr] lg:p-10">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-orange-300">
                Как работает
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-tight">
                Сначала ассистент, потом автономность.
              </h2>
              <p className="mt-4 text-white/60">
                Мы не начинаем с магии. Сначала AI показывает черновики и источники, команда
                корректирует ответы, а база знаний постепенно становится сильнее.
              </p>
            </div>
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={step} className="rounded-3xl border border-white/10 bg-white/8 p-5">
                  <div className="flex gap-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-orange-400 font-black text-black">
                      {index + 1}
                    </span>
                    <p className="font-semibold">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="glass-card grid gap-8 rounded-[2rem] p-8 lg:grid-cols-[1fr_0.7fr] lg:p-10">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-orange-600">
                MVP-тариф
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-tight">Демо-запуск без риска.</h2>
              <p className="mt-4 max-w-2xl text-neutral-600">
                Один Telegram-канал, ручная база знаний и кабинет менеджера. Этого достаточно,
                чтобы проверить гипотезу на реальных диалогах.
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-white p-6 shadow-sm">
              <p className="text-sm font-bold text-neutral-500">Старт</p>
              <p className="mt-2 text-4xl font-black">0 ₽</p>
              <p className="mt-2 text-sm text-neutral-500">на период проверки MVP</p>
              <Link
                href="/register"
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-black px-5 py-3 font-bold text-white"
              >
                Создать аккаунт
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
