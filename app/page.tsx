import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  DatabaseZap,
  LineChart,
  Network,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

const painPoints = [
  {
    title: "Лиды теряются ночью и в пиках",
    text: "Клиенты пишут 24/7, а менеджеры отвечают только в рабочее время.",
  },
  {
    title: "Каналы раздроблены",
    text: "Avito, VK, Telegram, MAX и сайт живут отдельно, команда постоянно переключается.",
  },
  {
    title: "Новые менеджеры отвечают неточно",
    text: "Прайсы, правила и статусы хранятся в разных местах, обучение занимает недели.",
  },
  {
    title: "Кнопочные боты не спасают",
    text: "Сценарии ломаются на нестандартных вопросах и раздражают клиентов.",
  },
];

const solutionSteps = [
  {
    icon: Network,
    title: "Собираем обращения",
    text: "Подключаем Telegram-first, затем web-chat, Avito, VK и MAX через канальные адаптеры.",
  },
  {
    icon: DatabaseZap,
    title: "Отвечаем по базе знаний",
    text: "RAG ищет релевантные фрагменты в документах компании и не отвечает из головы.",
  },
  {
    icon: ShieldCheck,
    title: "Эскалируем риск",
    text: "Если уверенность ниже порога, менеджер получает AI-черновик и источники.",
  },
  {
    icon: BrainCircuit,
    title: "Дообновляем знания",
    text: "Ответ менеджера превращается в кандидата для базы знаний и улучшает будущие ответы.",
  },
];

const marketFacts = [
  ["6,8 млн+", "субъектов МСП в РФ"],
  ["8-11 млрд ₽", "рынок ботов и разговорного AI в РФ"],
  ["98,6 млрд ₽", "российский B2B SaaS"],
  ["1,2 млн", "МСП уже используют Avito"],
];

const pricing = [
  ["Пилот", "30-70 тыс. ₽", "14-30 дней, 1-2 канала, KPI внедрения"],
  ["Старт", "14 900 ₽/мес", "1 500 диалогов, 1 канал, 2 пользователя"],
  ["База", "39 900 ₽/мес", "6 000 диалогов, 3 канала, аналитика"],
  ["Рост", "89 900 ₽/мес", "20 000 диалогов, API/CRM, приоритет"],
];

const competitors = [
  ["Jivo / Chat2Desk / Usedesk", "сильное единое окно", "AI вторичен, RAG и самообучение не ядро"],
  ["Bitrix24 / CRM", "широкая база МСП", "сложнее внедрять как быстрый AI-срез"],
  ["Just AI / Naumen / edna", "enterprise-автоматизация", "дорого и тяжело для малого бизнеса"],
  ["Intercom Fin / Ada / Sierra", "мировой класс AI-агентов", "нет локальных каналов РФ и российского контура"],
];

const traction = [
  "Подана грантовая заявка СтС-619324 на 1 млн ₽ на 12 месяцев.",
  "Есть backend + frontend репозитории и рабочий кабинет MVP.",
  "Реализован Telegram-first срез: channel connect, webhook intake, mock AI, сохранение диалогов.",
  "Backend: auth, tenants, база знаний, ML mock flow, seed и 27 тестов по аудиту вики.",
];

const roadmap = [
  ["01", "Пилотный контур", "Telegram, inbox, база знаний, ручной контроль и первые пилоты."],
  ["02", "AI-ядро", "Qdrant/embeddings, YandexGPT/GigaChat, real outbound, настройки уверенности."],
  ["03", "Каналы и масштаб", "Web-chat, Avito/VK, аналитика ROI, тарифы и платные внедрения."],
];

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <section className="relative overflow-hidden border-b border-slate-200 bg-white">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(47,111,237,0.08)_1px,transparent_1px),linear-gradient(rgba(47,111,237,0.08)_1px,transparent_1px)] bg-[size:48px_48px]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[0.88fr_1.12fr] lg:px-8 lg:py-20">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                <Sparkles size={16} />
                AI-сотрудник для малого и среднего бизнеса
              </div>

              <h1 className="mt-7 max-w-4xl text-balance text-5xl font-black text-slate-950 sm:text-6xl">
                Единое окно, где AI отвечает клиентам по базе знаний компании.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                «Едино» собирает обращения из цифровых каналов, готовит точные ответы через
                RAG, передаёт сложные случаи менеджеру и учится на реальных диалогах.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-700 px-6 py-3 font-bold text-white shadow-lg shadow-blue-700/20 transition hover:-translate-y-0.5"
                >
                  Попробовать MVP
                  <ArrowRight size={18} />
                </Link>
                <a
                  href="#investment"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 font-bold text-slate-800 transition hover:bg-slate-50"
                >
                  Инвесторский запрос
                </a>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {[
                  ["Telegram-first", "первый рабочий канал"],
                  ["RAG + эскалация", "защита от ошибок AI"],
                  ["SaaS по диалогам", "понятная модель выручки"],
                ].map(([value, label]) => (
                  <div key={value} className="rounded-lg border border-slate-200 bg-white/90 p-4 shadow-sm">
                    <p className="text-lg font-black text-slate-950">{value}</p>
                    <p className="mt-1 text-sm text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <Image
                src="/product-console.png"
                alt="Мокап кабинета Едино с диалогами, AI-черновиком и метрикой уверенности"
                width={1600}
                height={1000}
                priority
                className="rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15"
              />
            </div>
          </div>
        </section>

        <section id="problem" className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <SectionLead
            eyebrow="1. Проблема"
            title="МСП теряет деньги не из-за спроса, а из-за скорости и качества коммуникации."
            text="У компаний уже есть клиенты в цифровых каналах, но обработка обращений остаётся ручной, разрозненной и плохо масштабируемой."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {painPoints.map((item) => (
              <div key={item.title} className="border-l-4 border-blue-700 bg-slate-50 p-5">
                <h3 className="text-lg font-black text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="solution" className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
            <SectionLead
              eyebrow="2. Решение"
              title="AI-сотрудник работает рядом с менеджером, а не вместо контроля."
              text="Ценность продукта в связке: единый inbox, ответы по базе знаний, порог уверенности, эскалация и самообновление базы."
            />
            <div className="mt-10 grid gap-4 lg:grid-cols-4">
              {solutionSteps.map((step) => (
                <div key={step.title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <step.icon size={28} className="text-blue-700" />
                  <h3 className="mt-5 text-lg font-black text-slate-950">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="market" className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <SectionLead
              eyebrow="3. ЦА и рынок"
              title="Первый ICP - digital-МСП с 50-500 диалогами в день."
              text="Продавцы Avito, интернет-магазины, сервисные компании, клиники, бьюти, агентства и локальная торговля: 1-10 менеджеров, несколько каналов, высокая цена пропущенного лида."
            />
            <div className="mt-8 rounded-lg bg-blue-700 p-6 text-white">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-100">TAM / SAM / SOM</p>
              <p className="mt-4 text-2xl font-black">TAM: 99-295 млрд ₽/год</p>
              <p className="mt-2 text-sm leading-6 text-blue-50">
                Оценка снизу вверх: digital-facing МСП x SaaS-чек. SAM: 4,3-18 млрд ₽/год
                для компаний с большим потоком обращений. SOM 24 мес: 100-500 клиентов,
                7-54 млн ₽ ARR.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {marketFacts.map(([value, label]) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-3xl font-black text-slate-950">{value}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="model" className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
            <SectionLead
              eyebrow="4. Бизнес-модель и unit-экономика"
              title="Подписка по пакетам диалогов плюс платные пилоты."
              text="Единица ценности и тарификации - обработанный диалог. Чем лучше база знаний, тем выше доля автоответов и валовая маржа."
            />
            <div className="mt-8 grid gap-4 lg:grid-cols-4">
              {pricing.map(([name, price, text]) => (
                <div key={name} className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-blue-700">{name}</p>
                  <p className="mt-3 text-2xl font-black text-slate-950">{price}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {[
                ["ARPA", "35 тыс. ₽/мес", WalletCards],
                ["Payback", "около 5 мес", Clock3],
                ["LTV:CAC", "5,1x при churn 4%", LineChart],
              ].map(([label, value, Icon]) => (
                <div key={label as string} className="flex items-center gap-4 rounded-lg bg-blue-700 p-5 text-white">
                  <Icon size={30} />
                  <div>
                    <p className="text-sm text-blue-100">{label as string}</p>
                    <p className="text-2xl font-black">{value as string}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="competition" className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <SectionLead
            eyebrow="5. Конкуренты и УТП"
            title="Наша ниша - не ещё один inbox, а AI-сотрудник под локальные каналы РФ."
            text="Конкуренты сильны в отдельных слоях: единое окно, CRM, enterprise-боты или глобальные AI-агенты. Мы собираем нужную комбинацию для МСП."
          />
          <div className="mt-8 overflow-hidden rounded-lg border border-slate-200">
            {competitors.map(([name, strong, weak]) => (
              <div key={name} className="grid gap-3 border-b border-slate-200 bg-white p-5 last:border-b-0 md:grid-cols-[0.9fr_1fr_1fr]">
                <p className="font-black text-slate-950">{name}</p>
                <p className="text-sm leading-6 text-slate-600">{strong}</p>
                <p className="text-sm leading-6 text-slate-600">{weak}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="traction" className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[1fr_0.95fr] lg:px-8">
            <div>
              <SectionLead
                eyebrow="6. Текущий трекшн"
                title="У проекта уже есть грантовый фундамент и первый технический срез."
                text="Честный статус: это ранний MVP, без выручки и боевых пилотов, но уже не только презентация."
              />
              <div className="mt-8 space-y-3">
                {traction.map((item) => (
                  <div key={item} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4">
                    <CheckCircle2 className="mt-0.5 shrink-0 text-blue-700" size={20} />
                    <p className="text-sm leading-6 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-slate-950 p-7 text-white">
              <BarChart3 className="text-blue-300" size={34} />
              <h3 className="mt-5 text-3xl font-black">Главная метрика пилота</h3>
              <p className="mt-4 text-slate-300">
                Доказать, что AI закрывает 30-50% типовых обращений без потери качества и
                снижает среднее время ответа в несколько раз.
              </p>
              <div className="mt-8 grid gap-3">
                {["доля автоответов", "answer acceptance rate", "экономия часов менеджера", "конверсия pilot → SaaS"].map(
                  (metric) => (
                    <div key={metric} className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm font-semibold">
                      {metric}
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="roadmap" className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <SectionLead
            eyebrow="7. Стратегия развития"
            title="Сначала доказать ценность на Telegram, затем расширять каналы и монетизацию."
            text="Фокус roadmap - не ширина функций, а сквозной контур, который можно продать и измерить."
          />
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {roadmap.map(([num, title, text]) => (
              <div key={num} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-black text-blue-700">{num}</p>
                <h3 className="mt-3 text-xl font-black text-slate-950">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="investment" className="bg-blue-700">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 text-white lg:grid-cols-[1fr_0.9fr] lg:px-8">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-100">8. Запрос</p>
              <h2 className="mt-4 text-4xl font-black">Ищем 3-5 млн ₽ на 12 месяцев роста.</h2>
              <p className="mt-4 max-w-2xl text-blue-50">
                Цель - довести MVP до платных пилотов, подключить real AI/RAG, завершить каналы
                Telegram/web-chat/Avito и подтвердить unit-экономику на первых клиентах.
              </p>
            </div>
            <div className="grid gap-3">
              {[
                ["45%", "разработка продукта и AI/RAG"],
                ["25%", "интеграции каналов и инфраструктура"],
                ["20%", "продажи, пилоты и customer success"],
                ["10%", "юридическое, безопасность, операционные расходы"],
              ].map(([value, label]) => (
                <div key={label} className="flex items-center gap-4 rounded-lg bg-white p-4 text-slate-950">
                  <p className="w-16 text-2xl font-black text-blue-700">{value}</p>
                  <p className="text-sm font-semibold">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function SectionLead({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-700">{eyebrow}</p>
      <h2 className="mt-4 text-4xl font-black text-slate-950">{title}</h2>
      <p className="mt-4 text-base leading-7 text-slate-600">{text}</p>
    </div>
  );
}
