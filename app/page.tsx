import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { HomeClient } from "./home-client";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

const features = [
  {
    title: "Единое окно",
    text: "Telegram и будущие каналы собираются в одну рабочую ленту без переключения между вкладками.",
  },
  {
    title: "База знаний",
    text: "Документы, ответы менеджеров и кандидаты автообучения становятся источником для AI.",
  },
  {
    title: "Ответ по базе",
    text: "AI готовит черновик, показывает источники и не делает вид, что знает больше, чем знает база.",
  },
  {
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
    tag: "Цель MVP",
  },
  {
    value: "1 канал",
    label: "Telegram-first MVP",
    tag: "Сейчас",
  },
  {
    value: "100%",
    label: "контроль менеджера на старте",
    tag: "По умолчанию",
  },
  {
    value: "0 ₽",
    label: "демо-кабинет на время проверки",
    tag: "Демо",
  },
];

const answerRules = [
  {
    title: "Только источники компании",
    text: "Черновик собирается из документов базы знаний, и рядом видно, что именно использовано.",
  },
  {
    title: "Порог уверенности",
    text: "Если уверенности не хватает, автопилот не отправляет ответ клиенту сам.",
  },
  {
    title: "Эскалация менеджеру",
    text: "Нетиповой диалог уходит человеку вместе с историей переписки и найденными источниками.",
  },
];

const confidenceRoutes = [
  {
    text: "Источники найдены, вопрос типовой",
    tag: "Черновик",
  },
  {
    text: "Контекста не хватает",
    tag: "Менеджеру",
  },
  {
    text: "Ответа нет в базе знаний",
    tag: "Не отвечаем",
  },
];

const demoTags = [
  "Telegram-first",
  "Ответы по базе знаний",
  "Эскалация менеджеру",
];

const demoIncludes = [
  "Полный кабинет менеджера",
  "Своя база знаний",
  "Без карты и обязательств",
];

export default function Home() {
  return (
    <>
      <HomeClient />
      <Header />

      <main>
        {/* ---------- HERO ---------- */}
        <section className="px-5 py-12 lg:px-8 lg:py-16">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2 lg:items-start lg:gap-12">
            <div className="min-w-0">
              <p className="wf-kicker">AI-сотрудник для клиентских обращений</p>

              <h1 className="mt-3 max-w-2xl text-balance text-2xl font-semibold text-ink sm:text-3xl">
                Единое окно с ответами по базе знаний.
              </h1>

              <p className="wf-muted mt-4 max-w-2xl leading-7">
                Автопилот собирает обращения, находит ответы в базе компании и
                помогает менеджеру отвечать быстрее. Сначала контроль человека,
                затем постепенная автоматизация.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="wf-btn wf-btn-primary">
                  Начать проверку
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <Link href="/login" className="wf-btn">
                  Войти в демо
                </Link>
              </div>

              <p className="mt-6 flex items-start gap-2 text-sm leading-6 text-muted">
                <span className="wf-dot mt-2 shrink-0" aria-hidden="true" />
                Демо-кабинет уже работает: Telegram-first канал, ответы строго по
                базе знаний, эскалация менеджеру.
              </p>
            </div>

            <div className="min-w-0">
              <div className="wf-placeholder min-h-[220px] lg:min-h-[320px]">
                Главный визуал
              </div>

              <p className="wf-muted mt-3 max-w-[560px] text-sm leading-6">
                Схема показывает путь обращения: канал — база знаний — черновик
                ответа — решение менеджера.
              </p>
            </div>
          </div>
        </section>

        {/* ---------- Полоса метрик ---------- */}
        <section className="px-5 pb-12 lg:px-8 lg:pb-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map((metric) => (
                <div key={metric.label} className="wf-box min-w-0 p-5">
                  <p className="text-xl font-semibold text-ink">
                    {metric.value}
                  </p>
                  <p className="wf-muted mt-2 text-sm leading-5">
                    {metric.label}
                  </p>
                  <span className="wf-tag mt-3">{metric.tag}</span>
                </div>
              ))}
            </div>

            <p className="mt-3 text-sm leading-5 text-muted">
              <span className="font-medium text-ink">Уточнение:</span> цифры выше
              — цели и условия проверки MVP, а не измеренный результат внедрения.
            </p>
          </div>
        </section>

        {/* ---------- Что внутри MVP ---------- */}
        <section
          id="features"
          className="scroll-mt-16 border-t border-line px-5 py-12 lg:px-8 lg:py-16"
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="wf-kicker">Что внутри MVP</p>
              <h2 className="mt-3 text-balance text-xl font-semibold text-ink sm:text-2xl">
                Минимальный продукт, который уже можно проверять на реальных
                диалогах.
              </h2>
              <p className="wf-muted mt-4 max-w-2xl leading-7">
                Ничего лишнего: канал, база знаний, черновик ответа и человек,
                который принимает решение.
              </p>
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="wf-box flex min-w-0 flex-col p-5"
                >
                  <h3 className="wf-title">{feature.title}</h3>
                  <p className="wf-muted mt-2 text-sm leading-6">
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
          className="scroll-mt-16 border-t border-line px-5 py-12 lg:px-8 lg:py-16"
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="wf-kicker">Как работает</p>
              <h2 className="mt-3 text-balance text-xl font-semibold text-ink sm:text-2xl">
                Четыре шага от канала до управляемого ответа.
              </h2>
              <p className="wf-muted mt-4 max-w-2xl leading-7">
                Логика такая же, как в one-page: канал, база знаний, ответ и
                контроль. Без лишней магии, зато с проверяемым результатом.
              </p>
            </div>

            <ol className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((step) => (
                <li key={step.num} className="wf-box min-w-0 p-5">
                  <p className="text-sm text-muted">{step.num}</p>
                  <h3 className="wf-title mt-2">{step.title}</h3>
                  <p className="wf-muted mt-2 text-sm leading-6">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------- Продукт ---------- */}
        <section
          id="product"
          className="scroll-mt-16 border-t border-line px-5 py-12 lg:px-8 lg:py-16"
        >
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
              <div className="min-w-0">
                <p className="wf-kicker">Кабинет менеджера</p>
                <h2 className="mt-3 text-balance text-xl font-semibold text-ink sm:text-2xl">
                  AI отвечает по источникам, а сложное отдаёт менеджеру.
                </h2>
              </div>

              <ul className="wf-box min-w-0 divide-y divide-line-soft">
                {answerRules.map((rule) => (
                  <li key={rule.title} className="min-w-0 p-5">
                    <p className="text-sm font-medium text-ink">{rule.title}</p>
                    <p className="wf-muted mt-1 text-sm leading-6">
                      {rule.text}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="wf-placeholder mt-8 min-h-[220px] lg:min-h-[320px]">
              Скриншот интерфейса продукта
            </div>
          </div>
        </section>

        {/* ---------- Контроль человека ---------- */}
        <section
          id="control"
          className="scroll-mt-16 border-t border-line px-5 py-12 lg:px-8 lg:py-16"
        >
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="min-w-0">
              <p className="wf-kicker">Контроль человека</p>
              <h2 className="mt-3 text-balance text-xl font-semibold text-ink sm:text-2xl">
                Пока автопилот не уверен, отвечает человек.
              </h2>
              <p className="wf-muted mt-4 max-w-xl leading-7">
                Автопилот не додумывает. Он отвечает только тем, что нашёл в базе
                знаний компании, а при низкой уверенности передаёт диалог
                менеджеру вместе с контекстом. Порог настраивается: автоматизацию
                усиливают по мере того, как база растёт.
              </p>

              <Link
                href="/register"
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-ink"
              >
                Посмотреть, как это устроено
                <ArrowUpRight
                  size={18}
                  className="text-muted"
                  aria-hidden="true"
                />
              </Link>
            </div>

            <div className="wf-box min-w-0 p-5">
              <p className="wf-kicker">Что происходит с диалогом</p>

              <ul className="mt-4 space-y-2">
                {confidenceRoutes.map((route) => (
                  <li
                    key={route.tag}
                    className="wf-fill flex flex-wrap items-center justify-between gap-3 p-4"
                  >
                    <span className="min-w-0 text-sm leading-6">
                      {route.text}
                    </span>
                    <span className="wf-tag shrink-0">{route.tag}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-4 text-sm leading-5 text-muted">
                Порог уверенности задаёт компания — на старте он держит менеджера
                в каждом диалоге.
              </p>
            </div>
          </div>
        </section>

        {/* ---------- Финальный CTA ---------- */}
        <section
          id="pricing"
          className="scroll-mt-16 border-t border-line px-5 py-12 lg:px-8 lg:py-16"
        >
          <div className="mx-auto grid max-w-7xl gap-3 lg:grid-cols-[1fr_0.5fr]">
            <div className="wf-box min-w-0 p-6 lg:p-8">
              <p className="wf-kicker">Тестовый запуск</p>
              <h2 className="mt-3 max-w-3xl text-balance text-xl font-semibold text-ink sm:text-2xl">
                Проверяем продукт на реальных обращениях, а не на красивых
                обещаниях.
              </h2>
              <p className="wf-muted mt-4 max-w-2xl leading-7">
                Демо-кабинет уже работает локально: регистрация, Telegram-first
                канал, inbox, база знаний, аналитика, настройки и профиль.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {demoTags.map((tag) => (
                  <span key={tag} className="wf-tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="wf-box flex min-w-0 flex-col p-6">
              <p className="wf-kicker">Демо</p>
              <p className="mt-3 text-xl font-semibold text-ink">0 ₽</p>
              <p className="wf-muted mt-2 text-sm leading-6">
                для локальной проверки MVP
              </p>

              <div className="wf-divider my-5" />

              <ul className="space-y-2 text-sm leading-6 text-muted">
                {demoIncludes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <div className="mt-auto pt-6">
                <Link href="/login" className="wf-btn wf-btn-primary w-full">
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
