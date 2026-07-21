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

import { HomeClient } from "./home-client";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

const features = [
  {
    icon: MessageSquareText,
    title: "Единое окно",
    text: "Telegram и будущие каналы собираются в одну рабочую ленту без переключения между вкладками.",
  },
  {
    icon: BrainCircuit,
    title: "База знаний",
    text: "Документы, ответы менеджеров и кандидаты автообучения становятся источником для AI.",
  },
  {
    icon: Bot,
    title: "Ответ по базе",
    text: "AI готовит черновик, показывает источники и не делает вид, что знает больше, чем знает база.",
  },
  {
    icon: ShieldCheck,
    title: "Контроль человека",
    text: "Порог уверенности и эскалация держат качество под контролем на раннем этапе внедрения.",
  },
];

const steps = [
  ["1. Каналы", "Подключаем Telegram и собираем первые реальные обращения."],
  ["2. База знаний", "Загружаем FAQ, условия, инструкции и ответы менеджеров."],
  [
    "3. Ответ",
    "AI собирает черновик по источникам и передаёт сложное менеджеру.",
  ],
  [
    "4. Контроль",
    "Менеджер подтверждает качество и постепенно усиливает базу.",
  ],
];

const metrics = [
  ["70-80%", "типовых обращений в проверяемой цели"],
  ["1 канал", "Telegram-first MVP"],
  ["100%", "контроль менеджера на старте"],
];

export default function Home() {
  return (
    <>
      <HomeClient />
      <Header />
      <main className="overflow-hidden pt-20">
        <section className="relative">
          <div className="hero-orb hero-orb-one" aria-hidden="true" />
          <div className="hero-orb hero-orb-two" aria-hidden="true" />
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:py-24">
            <div data-reveal className="reveal-block is-visible">
              <div className="brand-kicker inline-flex items-center gap-2 rounded-full bg-[#eaf1ff] px-4 py-2">
                <Sparkles size={15} />
                AI-сотрудник для клиентских обращений
              </div>

              <h1 className="mt-7 max-w-4xl text-balance text-5xl font-black leading-[0.98] tracking-[-0.055em] text-[#101828] sm:text-6xl lg:text-7xl">
                Единое окно с ответами по базе знаний.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#526071]">
                Автопилот собирает обращения, находит ответы в базе компании и
                помогает менеджеру отвечать быстрее. Сначала контроль человека,
                затем постепенная автоматизация.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="primary-button h-12 px-6">
                  Начать проверку
                  <ArrowRight size={18} />
                </Link>
                <Link href="/login" className="secondary-button h-12 px-6">
                  Войти в демо
                </Link>
              </div>

              <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
                {metrics.map(([value, label]) => (
                  <div key={label} className="surface-card p-5">
                    <p className="text-3xl font-black tracking-[-0.04em] text-[#2463eb]">
                      {value}
                    </p>
                    <p className="mt-2 text-sm leading-5 text-[#526071]">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div data-reveal className="reveal-block is-visible product-float">
              <ProductMockup />
            </div>
          </div>
        </section>

        <section id="features" data-reveal className="reveal-block mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="max-w-3xl">
            <p className="brand-kicker">Что внутри MVP</p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-[#101828]">
              Минимальный продукт, который уже можно проверять на реальных
              диалогах.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="surface-card p-6 transition hover:-translate-y-1 hover:border-[rgba(36,99,235,0.35)]"
              >
                <span className="flex size-12 items-center justify-center rounded-lg bg-[#eaf1ff] text-[#2463eb]">
                  <feature.icon size={24} />
                </span>
                <h3 className="mt-8 text-lg font-black">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#526071]">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" data-reveal className="reveal-block bg-[#f4f7fb] py-20">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
              <div>
                <p className="brand-kicker">Как работает</p>
                <h2 className="mt-4 text-4xl font-black tracking-[-0.04em]">
                  Четыре шага от канала до управляемого ответа.
                </h2>
                <p className="mt-4 text-[#526071]">
                  Логика такая же, как в one-page: канал, база знаний, ответ и
                  контроль. Без лишней магии, зато с проверяемым результатом.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {steps.map(([title, text]) => (
                  <article key={title} className="surface-card min-h-40 p-6">
                    <p className="brand-kicker">{title}</p>
                    <p className="mt-8 text-lg font-black">{text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" data-reveal className="reveal-block mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.45fr]">
            <div className="blue-panel p-8 lg:p-10">
              <p className="text-sm font-black uppercase tracking-[0.08em] text-[#c9d9ff]">
                Тестовый запуск
              </p>
              <h2 className="mt-5 max-w-3xl text-4xl font-black tracking-[-0.04em]">
                Проверяем продукт на реальных обращениях, а не на красивых
                обещаниях.
              </h2>
              <p className="mt-5 max-w-2xl leading-7 text-white/75">
                Демо-кабинет уже работает локально: регистрация, Telegram-first
                канал, inbox, база знаний, аналитика, настройки и профиль.
              </p>
            </div>

            <div className="surface-card p-6">
              <p className="brand-kicker">Демо</p>
              <p className="mt-5 text-5xl font-black tracking-[-0.055em]">
                0 ₽
              </p>
              <p className="mt-2 text-sm leading-6 text-[#526071]">
                для локальной проверки MVP
              </p>
              <Link
                href="/login"
                className="primary-button mt-8 h-12 w-full px-5"
              >
                Открыть демо
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function ProductMockup() {
  const conversations = [
    ["Алина", "Можно подключить Telegram?", "AI нашёл 2 источника"],
    ["Павел", "Сколько стоит демо?", "Готов черновик"],
    ["Мария", "Нужна интеграция с CRM", "Передать менеджеру"],
  ];

  return (
    <div className="surface-card p-4">
      <div className="overflow-hidden rounded-lg border border-[#d9e1ec] bg-white shadow-[0_24px_70px_rgba(18,39,76,0.12)]">
        <div className="flex items-center justify-between border-b border-[#d9e1ec] bg-[#f8fbff] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="brand-mark size-8" />
            <div>
              <p className="text-sm font-black">Автопилот</p>
              <p className="text-xs text-[#526071]">Кабинет менеджера</p>
            </div>
          </div>
          <span className="rounded-full bg-[#eaf1ff] px-3 py-1 text-xs font-black text-[#1546ad]">
            Telegram online
          </span>
        </div>

        <div className="grid min-h-[430px] lg:grid-cols-[0.85fr_1.15fr]">
          <div className="border-r border-[#d9e1ec] bg-[#f8fbff] p-4">
            <p className="brand-kicker">Входящие</p>
            <div className="mt-4 space-y-3">
              {conversations.map(([name, message, status], index) => (
                <div
                  key={name}
                  className={`rounded-lg border p-4 ${
                    index === 0
                      ? "border-[rgba(36,99,235,0.45)] bg-[#eaf1ff]"
                      : "border-[#d9e1ec] bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black">{name}</p>
                      <p className="mt-1 text-sm text-[#526071]">{message}</p>
                    </div>
                    <span className="size-2 rounded-full bg-[#13a66b]" />
                  </div>
                  <p className="mt-4 text-xs font-bold text-[#2463eb]">
                    {status}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="brand-kicker">Ответ по базе</p>
                <h3 className="mt-2 text-2xl font-black">
                  Подключение Telegram
                </h3>
              </div>
              <span className="rounded-full bg-[#fff5df] px-3 py-1 text-xs font-black text-[#94600b]">
                контроль
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <div className="max-w-[78%] rounded-lg border border-[#d9e1ec] bg-[#f8fbff] p-4 text-sm leading-6 text-[#526071]">
                Можно подключить Telegram, чтобы заявки сразу попадали в
                кабинет?
              </div>
              <div className="ml-auto max-w-[86%] rounded-lg bg-[#2463eb] p-4 text-sm leading-6 text-white">
                Да. Telegram подключается через токен бота, после чего входящие
                сообщения появляются в разделе “Диалоги”. Для запуска webhook
                нужен постоянный защищённый адрес сервиса.
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-[#d9e1ec] bg-[#f8fbff] p-4">
              <div className="flex items-center gap-2 text-sm font-black text-[#2463eb]">
                <Zap size={16} />
                Источники ответа
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {["FAQ Telegram", "Настройки каналов"].map((item) => (
                  <div
                    key={item}
                    className="rounded-lg border border-[#d9e1ec] bg-white p-3 text-sm font-bold"
                  >
                    <CheckCircle2 size={15} className="mb-2 text-[#13a66b]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
