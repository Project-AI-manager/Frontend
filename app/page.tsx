import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  BrainCircuit,
  CheckCircle2,
  FileText,
  Gauge,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { AutopilotScene, HomeClient } from "./home-client";
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
  {
    num: "01",
    title: "Каналы",
    text: "Подключаем Telegram и собираем первые реальные обращения.",
  },
  {
    num: "02",
    title: "База знаний",
    text: "Загружаем FAQ, условия, инструкции и ответы менеджеров.",
  },
  {
    num: "03",
    title: "Ответ",
    text: "AI собирает черновик по источникам и передаёт сложное менеджеру.",
  },
  {
    num: "04",
    title: "Контроль",
    text: "Менеджер подтверждает качество и постепенно усиливает базу.",
  },
];

const metrics = [
  {
    value: "70-80%",
    label: "типовых обращений в проверяемой цели",
    chip: "Цель MVP",
    chipClass: "chip-amber",
  },
  {
    value: "1 канал",
    label: "Telegram-first MVP",
    chip: "Сейчас",
    chipClass: "chip-amber",
  },
  {
    value: "100%",
    label: "контроль менеджера на старте",
    chip: "По умолчанию",
    chipClass: "chip-amber",
  },
  {
    value: "0 ₽",
    label: "демо-кабинет на время проверки",
    chip: "Демо",
    chipClass: "chip-amber",
  },
];

const answerRules = [
  {
    icon: FileText,
    title: "Только источники компании",
    text: "Черновик собирается из документов базы знаний, и рядом видно, что именно использовано.",
  },
  {
    icon: Gauge,
    title: "Порог уверенности",
    text: "Если уверенности не хватает, автопилот не отправляет ответ клиенту сам.",
  },
  {
    icon: UserCheck,
    title: "Эскалация менеджеру",
    text: "Нетиповой диалог уходит человеку вместе с историей переписки и найденными источниками.",
  },
];

const confidenceRoutes = [
  {
    text: "Источники найдены, вопрос типовой",
    chip: "Черновик",
    chipClass: "chip-green",
  },
  {
    text: "Контекста не хватает",
    chip: "Менеджеру",
    chipClass: "chip-amber",
  },
  {
    text: "Ответа нет в базе знаний",
    chip: "Не отвечаем",
    chipClass: "chip-red",
  },
];

export default function Home() {
  return (
    <>
      <HomeClient />
      <Header />

      <main className="grid-backdrop overflow-hidden pt-24">
        {/* ---------- HERO ---------- */}
        <section className="px-5 lg:px-8">
          <div className="mx-auto grid max-w-7xl items-center gap-12 py-12 lg:grid-cols-[0.94fr_1.06fr] lg:gap-14 lg:py-20">
            <div className="reveal-block is-visible min-w-0">
              <span className="brand-kicker">
                <Sparkles size={15} />
                AI-сотрудник для клиентских обращений
              </span>

              <h1 className="font-display mt-7 max-w-4xl text-balance text-5xl font-extrabold leading-[0.98] tracking-[-0.055em] text-ink sm:text-6xl lg:text-7xl">
                Единое окно с ответами по базе знаний.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted lg:text-[22px] lg:leading-[1.5]">
                Автопилот собирает обращения, находит ответы в базе компании и
                помогает менеджеру отвечать быстрее. Сначала контроль человека,
                затем постепенная автоматизация.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="btn btn-primary px-6">
                  Начать проверку
                  <ArrowRight size={18} />
                </Link>
                <Link href="/login" className="btn btn-secondary px-6">
                  Войти в демо
                </Link>
              </div>

              <p className="mt-8 flex items-start gap-3 text-sm leading-6 text-muted">
                <span className="status-dot mt-2 shrink-0" aria-hidden="true" />
                Демо-кабинет уже работает: Telegram-first канал, ответы строго по
                базе знаний, эскалация менеджеру.
              </p>
            </div>

            <div className="reveal-block is-visible min-w-0">
              {/* Высота задана явно (не только min-h), иначе h-full внутри сцены
                  разрешается в auto и канвас не заполняет контейнер. */}
              <div className="frame-3d h-[420px] min-h-[420px] w-full p-2 sm:p-3 lg:h-[560px] lg:min-h-[560px]">
                <AutopilotScene className="h-full w-full" />
              </div>

              <p className="soft-panel mt-[14px] max-w-[560px] p-4 text-[13px] leading-6 text-muted">
                Схема показывает путь обращения: канал — база знаний — черновик
                ответа — решение менеджера.
              </p>
            </div>
          </div>
        </section>

        {/* ---------- Полоса метрик ---------- */}
        <section className="px-5 pb-16 lg:px-8 lg:pb-20">
          <div className="mx-auto max-w-7xl">
            <div
              data-reveal
              className="reveal-block panel grid grid-cols-1 overflow-hidden sm:grid-cols-2 lg:grid-cols-4"
            >
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="border-line p-6 transition-[transform,background-color] duration-[250ms] hover:relative hover:z-10 hover:-translate-y-[5px] hover:bg-mist motion-reduce:hover:translate-y-0 max-sm:border-b max-sm:last:border-b-0 sm:max-lg:[&:nth-child(-n+2)]:border-b sm:max-lg:[&:nth-child(odd)]:border-r lg:border-r lg:last:border-r-0 lg:p-7"
                >
                  <p className="font-display text-4xl font-extrabold tracking-[-0.04em] text-brand lg:text-[40px]">
                    {metric.value}
                  </p>
                  <p className="mt-2 text-sm leading-5 text-muted">
                    {metric.label}
                  </p>
                  <span className={`chip ${metric.chipClass} mt-4`}>
                    {metric.chip}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs leading-5 text-muted sm:text-right">
              <span className="font-semibold text-ink-soft">Уточнение:</span>{" "}
              цифры выше — цели и условия проверки MVP, а не измеренный результат
              внедрения.
            </p>
          </div>
        </section>

        {/* ---------- Что внутри MVP ---------- */}
        <section
          id="features"
          className="scroll-mt-28 border-t border-line-soft px-5 py-20 lg:px-8 lg:py-24"
        >
          <div className="mx-auto max-w-7xl">
            <div data-reveal className="reveal-block max-w-3xl">
              <p className="section-kicker">Что внутри MVP</p>
              <h2 className="font-display mt-4 text-balance text-4xl font-extrabold tracking-[-0.04em] text-ink lg:text-5xl">
                Минимальный продукт, который уже можно проверять на реальных
                диалогах.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
                Ничего лишнего: канал, база знаний, черновик ответа и человек,
                который принимает решение.
              </p>
            </div>

            <div
              data-reveal
              className="reveal-stagger mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4"
            >
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="card card-hover flex min-w-0 flex-col p-6 lg:p-7"
                >
                  <span className="icon-badge">
                    <feature.icon size={22} />
                  </span>
                  <h3 className="font-display mt-8 text-xl font-extrabold tracking-[-0.03em] text-ink">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted">
                    {feature.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Как работает ---------- */}
        <section
          id="how"
          className="scroll-mt-28 border-t border-line-soft bg-surface px-5 py-20 lg:px-8 lg:py-24"
        >
          <div className="mx-auto max-w-7xl">
            <div data-reveal className="reveal-block max-w-3xl">
              <p className="section-kicker">Как работает</p>
              <h2 className="font-display mt-4 text-balance text-4xl font-extrabold tracking-[-0.04em] text-ink lg:text-5xl">
                Четыре шага от канала до управляемого ответа.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
                Логика такая же, как в one-page: канал, база знаний, ответ и
                контроль. Без лишней магии, зато с проверяемым результатом.
              </p>
            </div>

            <div data-reveal className="reveal-block relative mt-14">
              <span
                aria-hidden="true"
                className="absolute inset-x-[12.5%] top-[37px] hidden h-px bg-line lg:block"
              />
              <span
                aria-hidden="true"
                className="absolute left-[12.5%] top-[37px] hidden h-px w-0 bg-brand transition-[width] duration-[1600ms] ease-out motion-reduce:duration-0 lg:block [.is-visible_&]:w-[75%]"
              />

              <ol className="relative grid gap-9 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                {steps.map((step) => (
                  <li
                    key={step.num}
                    className="group flex min-w-0 items-start gap-5 lg:flex-col lg:items-center lg:gap-0 lg:text-center"
                  >
                    <span className="inline-block shrink-0 transition-transform duration-300 ease-out group-hover:-translate-y-1 motion-reduce:transition-none">
                      <span className="num-badge">{step.num}</span>
                    </span>
                    <div className="min-w-0 lg:mt-5">
                      <h3 className="font-display text-lg font-extrabold tracking-[-0.03em] text-ink">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-muted lg:mx-auto lg:max-w-[16rem]">
                        {step.text}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ---------- Продукт ---------- */}
        <section
          id="product"
          className="scroll-mt-28 border-t border-line px-5 py-20 lg:px-8 lg:py-24"
        >
          <div className="mx-auto max-w-7xl">
            <div
              data-reveal
              className="reveal-block grid gap-8 lg:grid-cols-[1fr_0.82fr] lg:items-end"
            >
              <div className="min-w-0">
                <p className="section-kicker">Кабинет менеджера</p>
                <h2 className="font-display mt-4 text-balance text-4xl font-extrabold tracking-[-0.04em] text-ink lg:text-5xl">
                  AI отвечает по источникам, а сложное отдаёт менеджеру.
                </h2>
              </div>

              <div className="soft-panel min-w-0 p-6 lg:p-7">
                <ul className="space-y-5">
                  {answerRules.map((rule) => (
                    <li key={rule.title} className="flex items-start gap-4">
                      <span className="icon-badge shrink-0">
                        <rule.icon size={20} />
                      </span>
                      <div className="min-w-0">
                        <p className="font-display text-sm font-extrabold text-ink">
                          {rule.title}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-muted">
                          {rule.text}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div data-reveal className="reveal-block mt-12">
              <div className="frame-3d p-2 sm:p-3">
                <ProductMockup />
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Контроль человека (тёмная пауза) ---------- */}
        <section
          id="control"
          className="scroll-mt-28 border-t border-line bg-ink py-20 text-white lg:py-24"
        >
          <div className="container-page">
            <div data-reveal className="reveal-block">
              <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-16">
                <div className="min-w-0">
                  <p className="section-kicker section-kicker-inverse">
                    <ShieldCheck size={15} />
                    Контроль человека
                  </p>
                  <h2 className="font-display mt-5 text-balance text-3xl font-extrabold leading-[1.08] tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
                    Пока автопилот не уверен, отвечает человек.
                  </h2>
                  <p className="mt-6 max-w-xl text-base leading-7 text-on-brand-strong">
                    Автопилот не додумывает. Он отвечает только тем, что нашёл в
                    базе знаний компании, а при низкой уверенности передаёт диалог
                    менеджеру вместе с контекстом. Порог настраивается:
                    автоматизацию усиливают по мере того, как база растёт.
                  </p>

                  <Link
                    href="/register"
                    className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#9db7f4] transition-colors hover:text-white"
                  >
                    Посмотреть, как это устроено
                    <ArrowUpRight size={16} />
                  </Link>
                </div>

                <div className="min-w-0 rounded-md border border-white/12 bg-white/[0.05] p-6 lg:p-7">
                  <p className="section-kicker section-kicker-inverse">
                    Что происходит с диалогом
                  </p>

                  <ul className="mt-6 space-y-3">
                    {confidenceRoutes.map((route) => (
                      <li
                        key={route.chip}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.04] px-4 py-4"
                      >
                        <span className="min-w-0 text-sm leading-6 text-on-brand-strong">
                          {route.text}
                        </span>
                        <span className={`chip ${route.chipClass} shrink-0`}>
                          {route.chip}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-on-brand">
                    <Gauge size={14} className="mt-0.5 shrink-0" />
                    Порог уверенности задаёт компания — на старте он держит
                    менеджера в каждом диалоге.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Финальный CTA ---------- */}
        <section
          id="pricing"
          className="scroll-mt-28 border-t border-line px-5 pt-20 pb-24 lg:px-8 lg:pt-24 lg:pb-28"
        >
          <div
            data-reveal
            className="reveal-stagger mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_0.42fr]"
          >
            <div className="blue-panel min-w-0 p-8 lg:p-12">
              <p className="section-kicker section-kicker-inverse">
                Тестовый запуск
              </p>
              <h2 className="font-display mt-5 max-w-3xl text-balance text-4xl font-extrabold tracking-[-0.04em] text-white lg:text-5xl">
                Проверяем продукт на реальных обращениях, а не на красивых
                обещаниях.
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-7 text-on-brand-strong">
                Демо-кабинет уже работает локально: регистрация, Telegram-first
                канал, inbox, база знаний, аналитика, настройки и профиль.
              </p>

              <div className="mt-9 flex flex-wrap gap-2">
                {[
                  "Telegram-first",
                  "Ответы по базе знаний",
                  "Эскалация менеджеру",
                ].map((tag) => (
                  <span key={tag} className="pill-tag bg-white/20 text-white">
                    <CheckCircle2 size={14} />
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="panel flex min-w-0 flex-col p-6 lg:p-7">
              <p className="section-kicker">Демо</p>
              <p className="font-display mt-5 text-5xl font-extrabold tracking-[-0.055em] text-ink">
                0 ₽
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                для локальной проверки MVP
              </p>

              <div className="divider my-6" />

              <ul className="space-y-3 text-sm leading-6 text-ink-soft">
                {[
                  "Полный кабинет менеджера",
                  "Своя база знаний",
                  "Без карты и обязательств",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle2
                      size={16}
                      className="mt-1 shrink-0 text-ok"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-8">
                <Link href="/login" className="btn btn-primary w-full">
                  Открыть демо
                </Link>
              </div>
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
    {
      name: "Алина",
      message: "Можно подключить Telegram?",
      status: "AI нашёл 2 источника",
    },
    {
      name: "Павел",
      message: "Сколько стоит демо?",
      status: "Готов черновик",
    },
    {
      name: "Мария",
      message: "Нужна интеграция с CRM",
      status: "Передать менеджеру",
    },
  ];

  return (
    <div className="overflow-hidden rounded-md border border-line-soft bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-mist px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="brand-mark size-8" />
          <div>
            <p className="font-display text-sm font-extrabold tracking-[-0.02em] text-ink">
              Автопилот
            </p>
            <p className="text-xs text-muted">Кабинет менеджера</p>
          </div>
        </div>
        <span className="chip chip-blue">
          <span className="status-dot" aria-hidden="true" />
          Telegram online
        </span>
      </div>

      <div className="grid xl:grid-cols-[0.82fr_1.18fr]">
        <div className="min-w-0 border-b border-line bg-mist p-4 xl:border-b-0 xl:border-r">
          <p className="section-kicker">Входящие</p>

          <div className="mt-4 space-y-3">
            {conversations.map((item, index) => (
              <div
                key={item.name}
                className={
                  index === 0
                    ? "rounded-md border border-brand/45 bg-brand-soft p-4"
                    : "rounded-md border border-line bg-white p-4"
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-sm font-extrabold text-ink">
                      {item.name}
                    </p>
                    <p className="mt-1 text-sm leading-5 text-muted">
                      {item.message}
                    </p>
                  </div>
                  <span
                    className="mt-1 size-2 shrink-0 rounded-full bg-ok"
                    aria-hidden="true"
                  />
                </div>
                <p className="font-display mt-4 text-xs font-bold text-brand">
                  {item.status}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0 p-5 lg:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="section-kicker">Ответ по базе</p>
              <h3 className="font-display mt-2 text-2xl font-extrabold tracking-[-0.035em] text-ink">
                Подключение Telegram
              </h3>
            </div>
            <span className="chip chip-amber shrink-0">контроль</span>
          </div>

          <div className="mt-6 space-y-4">
            <div className="max-w-[86%] rounded-md border border-line bg-mist p-4 text-sm leading-6 text-muted">
              Можно подключить Telegram, чтобы заявки сразу попадали в кабинет?
            </div>
            <div className="ml-auto max-w-[92%] rounded-md bg-brand p-4 text-sm leading-6 text-white shadow-brand">
              Да. Telegram подключается через токен бота, после чего входящие
              сообщения появляются в разделе “Диалоги”. Для запуска webhook нужен
              постоянный защищённый адрес сервиса.
            </div>
          </div>

          <div className="soft-panel mt-6 p-4">
            <p className="font-display flex items-center gap-2 text-sm font-extrabold text-brand">
              <Zap size={16} />
              Источники ответа
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {["FAQ Telegram", "Настройки каналов"].map((item) => (
                <div
                  key={item}
                  className="rounded-md border border-line bg-white p-3 text-sm font-semibold text-ink"
                >
                  <CheckCircle2
                    size={15}
                    className="mb-2 text-ok"
                    aria-hidden="true"
                  />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
