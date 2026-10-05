import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpenText,
  Check,
  ChevronDown,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { OptimizedRobotVisual } from "@/components/landing/optimized-robot-visual";
import { getSiteUrl } from "@/lib/site";
import styles from "./landing.module.css";

export const metadata: Metadata = {
  title: "ИИ-ассистент для клиентских обращений",
  description:
    "Автопилот отвечает на вопросы клиентов в Telegram по материалам вашей компании. Диалоги, контроль менеджера и расход токенов — в одном кабинете. 1 000 ₽ на старт.",
  alternates: { canonical: getSiteUrl("/") },
  openGraph: {
    url: getSiteUrl("/"),
    title: "Автопилот — освободите команду от повторяющихся вопросов",
    description:
      "ИИ-ассистент для клиентских обращений в Telegram. Ответы по знаниям компании, контроль менеджера и оплата за токены.",
  },
};

const features = [
  {
    icon: BookOpenText,
    title: "Знает ваш бизнес",
    text: "Добавьте каталог, прайс и инструкции. Ассистент находит информацию в материалах компании и учитывает историю переписки.",
    detail: "PDF · DOCX · XLSX · TXT · Markdown",
  },
  {
    icon: ShieldCheck,
    title: "Работает вместе с командой",
    text: "Если знаний недостаточно или вопрос требует участия человека, подключается менеджер. Переписка и контекст остаются в кабинете.",
    detail: "Автоответы и передача человеку",
  },
  {
    icon: MessageCircle,
    title: "Держит диалоги под контролем",
    text: "Смотрите обращения, отвечайте вручную и следите за работой ассистента. Руководитель видит активность команды и расход на ИИ.",
    detail: "Единый кабинет и аналитика",
  },
];
const audiences = [
  {
    label: "Магазины",
    title: "«Сколько стоит? Есть в наличии?»",
    text: "Вопросы о товарах, условиях заказа и доставке — с опорой на ваш каталог и правила.",
  },
  {
    label: "Сервисные компании",
    title: "«Что входит? Как заказать?»",
    text: "Информация об услугах, стоимости и порядке работы — из ваших инструкций.",
  },
  {
    label: "Небольшие команды",
    title: "«Мы снова отвечаем одно и то же»",
    text: "Повторяющиеся обращения получает ассистент. Менеджеры подключаются там, где нужен их опыт.",
  },
];
const steps = [
  {
    title: "Подключите Telegram",
    text: "Создайте аккаунт и подключите свой Telegram через кабинет. Клиенты продолжают писать в привычном канале.",
  },
  {
    title: "Добавьте знания компании",
    text: "Загрузите документы, цены и ответы на частые вопросы. Обновите базу знаний и задайте правила автоответов.",
  },
  {
    title: "Проверьте и запустите",
    text: "Посмотрите ответы на типичные вопросы. Включите ассистента и отслеживайте диалоги из одного кабинета.",
  },
];
const questions = [
  {
    question: "Чем Автопилот отличается от обычного чат-бота?",
    answer:
      "Автопилот использует документы вашей компании и контекст переписки. Вам не нужно заранее писать отдельную ветку для каждого вопроса. Вы настраиваете знания и правила работы, а диалоги остаются доступны менеджерам.",
  },
  {
    question: "Что будет, если ассистент не знает ответа?",
    answer:
      "Сложный вопрос можно передать менеджеру вместе с перепиской. В настройках вы управляете автоответами и порогом уверенности. Перед запуском стоит проверить ассистента на реальных вопросах вашей команды.",
  },
  {
    question: "Какие каналы можно подключить сейчас?",
    answer:
      "Сейчас доступно подключение Telegram. Другие каналы находятся в разработке; их доступность команда сообщит отдельно.",
  },
  {
    question: "Что такое токены и за что я плачу?",
    answer:
      "Токены — небольшие части текста, которые обрабатывает ИИ. Расход учитывает запрос, контекст и ответ ассистента. Поэтому стоимость зависит от объёма обработки, а не только от числа диалогов. Баланс и расход отображаются в кабинете.",
  },
  {
    question: "Как попробовать на своих материалах?",
    answer:
      "Зарегистрируйтесь: на аккаунте будет стартовый бонусный баланс 1 000 ₽. Добавьте документы, подключите Telegram и проверьте ответы. Если нужна помощь с первым запуском, напишите команде.",
  },
];

function SiteHeader() {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[14px] z-30 flex justify-center px-3 sm:px-5">
      <header className="pointer-events-auto flex h-[66px] w-full max-w-[960px] items-center justify-between gap-1 overflow-hidden rounded-full border border-[rgba(36,99,235,.18)] bg-[linear-gradient(135deg,rgba(247,250,255,.98),rgba(255,255,255,.98))] px-2.5 py-2 shadow-[0_12px_32px_rgba(18,39,76,.10),inset_0_1px_0_rgba(255,255,255,.94)] sm:h-[68px] sm:gap-2">
        <a
          href="#top"
          className="flex items-center gap-2.5"
          aria-label="Автопилот — к началу страницы"
        >
          <Image
            src="/icon.svg"
            alt=""
            width={32}
            height={32}
            priority
            className="rounded-[10px]"
          />
          <span className="pr-1 font-heading text-[15px] font-extrabold tracking-[-.04em] sm:pr-3 sm:text-[16px]">
            Автопилот
          </span>
        </a>
        <nav
          aria-label="Главная навигация"
          className={`${styles.headerNav} hidden min-w-0 flex-1 items-center justify-center gap-1 text-[12px] font-semibold md:flex`}
        >
          <a
            className="rounded-full px-3 py-2.5 transition hover:bg-[#eaf1ff] hover:text-[#2463eb]"
            href="#product"
          >
            Возможности
          </a>
          <a
            className="rounded-full px-3 py-2.5 transition hover:bg-[#eaf1ff] hover:text-[#2463eb]"
            href="#how"
          >
            Как работает
          </a>
          <a
            className="rounded-full px-3 py-2.5 transition hover:bg-[#eaf1ff] hover:text-[#2463eb]"
            href="#payment"
          >
            Оплата
          </a>
        </nav>
        <div className="flex shrink-0 items-center gap-1 text-[11px] font-bold sm:gap-1.5 sm:text-[12px]">
          <Link
            prefetch={false}
            href="/login"
            className={`${styles.headerLogin} rounded-full px-2.5 py-2.5 transition hover:bg-white sm:px-3`}
          >
            Войти
          </Link>
          <Link
            prefetch={false}
            href="/register"
            className={`${styles.headerCta} rounded-full px-3 py-2.5 transition sm:px-4`}
          >
            Попробовать
          </Link>
        </div>
      </header>
    </div>
  );
}

export default function HomePage() {
  return (
    <main id="top" className={styles.page}>
      <SiteHeader />
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={`${styles.container} ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              <span /> ИИ-ассистент для вашего бизнеса
            </p>
            <h1 id="hero-title">
              Клиентам — ответы.
              <br />
              <span>Команде — время.</span>
            </h1>
            <p className={styles.heroDescription}>
              Автопилот отвечает на повторяющиеся вопросы в Telegram по знаниям
              вашей компании. Сложные обращения передаёт менеджеру.
            </p>
            <div className={styles.heroActions}>
              <Link
                prefetch={false}
                href="/register"
                className={styles.primaryButton}
              >
                Попробовать бесплатно{" "}
                <ArrowUpRight size={19} aria-hidden="true" />
              </Link>
              <a href="#how" className={styles.textButton}>
                Как это работает <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
            <p className={styles.heroNote}>
              <Check size={15} aria-hidden="true" /> 1 000 ₽ на старт · без
              подписки
            </p>
          </div>
          <div className={styles.heroRobot}>
            <OptimizedRobotVisual />
          </div>
        </div>
        <div className={`${styles.container} ${styles.heroFoot}`}>
          <span>Ваши знания. Ваши правила. Ваш контроль.</span>
          <a href="#product">
            Познакомиться с Автопилотом{" "}
            <ArrowRight size={15} aria-hidden="true" />
          </a>
        </div>
      </section>

      <section
        id="product"
        className={styles.section}
        aria-labelledby="product-title"
      >
        <div className={styles.container}>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>Помощник, который знает контекст</p>
            <h2 id="product-title">
              От первого вопроса
              <br />
              до участия менеджера.
            </h2>
            <p className={styles.sectionIntro}>
              Повторяющиеся вопросы больше не должны забирать всё внимание
              команды. Автопилот помогает с рутиной и сохраняет человеческий
              контроль.
            </p>
          </div>
          <div className={styles.featureGrid}>
            {features.map(({ icon: Icon, title, text, detail }, index) => (
              <article key={title} className={styles.feature}>
                <div className={styles.featureTop}>
                  <Icon size={24} strokeWidth={1.5} aria-hidden="true" />
                  <span>0{index + 1}</span>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
                <span className={styles.featureDetail}>{detail}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className={`${styles.section} ${styles.audienceSection}`}
        aria-labelledby="audience-title"
      >
        <div className={styles.container}>
          <div className={styles.splitHeading}>
            <div>
              <p className={styles.eyebrow}>
                Для бизнеса, который общается в чатах
              </p>
              <h2 id="audience-title">
                Узнаёте свои
                <br />
                рабочие будни?
              </h2>
            </div>
            <p>
              Автопилот подходит командам, которые регулярно получают похожие
              вопросы и хотят уделять больше времени клиентам со сложными
              задачами.
            </p>
          </div>
          <div className={styles.audienceGrid}>
            {audiences.map((item) => (
              <article key={item.label}>
                <p className={styles.audienceLabel}>{item.label}</p>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="how"
        className={`${styles.section} ${styles.howSection}`}
        aria-labelledby="how-title"
      >
        <div className={styles.container}>
          <div className={styles.splitHeading}>
            <div>
              <p className={styles.eyebrow}>
                От ваших материалов к первым ответам
              </p>
              <h2 id="how-title">
                Начните с того,
                <br />
                что уже есть.
              </h2>
            </div>
            <p>
              Telegram, документы компании и вопросы клиентов. Вы задаёте
              основу, Автопилот помогает вести диалоги.
            </p>
          </div>
          <ol className={styles.steps}>
            {steps.map((step, index) => (
              <li key={step.title}>
                <span className={styles.stepNumber}>0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
          <div className={styles.howFoot}>
            <p>
              Настройки и переписка доступны вашей команде в одном кабинете.
            </p>
            <Link
              prefetch={false}
              href="/register"
              className={styles.lightButton}
            >
              Начать настройку <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section
        id="payment"
        className={`${styles.section} ${styles.paymentSection}`}
        aria-labelledby="payment-title"
      >
        <div className={`${styles.container} ${styles.paymentGrid}`}>
          <div>
            <p className={styles.eyebrow}>Оплата за токены</p>
            <h2 id="payment-title">
              Расход зависит
              <br />
              от работы ИИ.
            </h2>
            <p className={styles.paymentDescription}>
              Без ежемесячной подписки. Использование учитывается по токенам —
              объёму текста, который ассистент обрабатывает в запросах и
              ответах.
            </p>
            <ul className={styles.paymentList}>
              <li>
                <Check size={17} aria-hidden="true" /> Баланс и расход видны в
                кабинете
              </li>
              <li>
                <Check size={17} aria-hidden="true" /> Стоимость зависит от
                объёма обработки
              </li>
              <li>
                <Check size={17} aria-hidden="true" /> Можно начать со
                стартового бонуса
              </li>
            </ul>
          </div>
          <div className={styles.bonus}>
            <p className={styles.eyebrow}>Для знакомства с Автопилотом</p>
            <p className={styles.bonusAmount}>
              1 000 <span>₽</span>
            </p>
            <h3>
              На первые ответы
              <br />
              вашим клиентам.
            </h3>
            <p className={styles.bonusDescription}>
              Стартовый бонусный баланс после регистрации. Проверьте ассистента
              на своих материалах и оцените расход.
            </p>
            <Link
              prefetch={false}
              href="/register"
              className={styles.primaryButton}
            >
              Получить стартовый баланс{" "}
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section
        className={`${styles.section} ${styles.faqSection}`}
        aria-labelledby="faq-title"
      >
        <div className={`${styles.container} ${styles.faqGrid}`}>
          <div>
            <p className={styles.eyebrow}>Перед первым запуском</p>
            <h2 id="faq-title">
              Есть вопросы?
              <br />
              Разберёмся.
            </h2>
            <a
              href="https://t.me/timir_za"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.contactLink}
            >
              Написать команде <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          </div>
          <div className={styles.questions}>
            {questions.map(({ question, answer }) => (
              <details key={question}>
                <summary>
                  {question}
                  <ChevronDown size={19} aria-hidden="true" />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.finalSection} aria-labelledby="start-title">
        <div className={`${styles.container} ${styles.finalGrid}`}>
          <div>
            <p className={styles.eyebrow}>Освободите время для важного</p>
            <h2 id="start-title">
              Пусть повторяющиеся
              <br />
              вопросы ведёт Автопилот.
            </h2>
            <p>
              Начните со своих документов и одного канала.
              <br />
              Первый бонусный баланс — уже на аккаунте.
            </p>
          </div>
          <div className={styles.finalActions}>
            <Link
              prefetch={false}
              href="/register"
              className={styles.lightButton}
            >
              Попробовать бесплатно{" "}
              <ArrowUpRight size={19} aria-hidden="true" />
            </Link>
            <a
              href="https://t.me/timir_za"
              target="_blank"
              rel="noopener noreferrer"
            >
              Обсудить запуск с командой{" "}
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerTop}>
            <a href="#top" className={styles.footerBrand}>
              <Image src="/icon.svg" alt="" width={30} height={30} />
              Автопилот
            </a>
            <p>
              ИИ-ассистент для клиентских обращений.
              <br />
              Ваши знания становятся помощью для клиентов.
            </p>
            <div className={styles.footerContacts}>
              <a
                href="https://t.me/timir_za"
                target="_blank"
                rel="noopener noreferrer"
              >
                Telegram <ArrowUpRight size={14} aria-hidden="true" />
              </a>
              <a href="mailto:timurzakirov@kpfu.ru">timurzakirov@kpfu.ru</a>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <span>© Автопилот, 2026</span>
            <div>
              <Link prefetch={false} href="/legal/privacy">
                Конфиденциальность
              </Link>
              <Link prefetch={false} href="/legal/terms">
                Условия использования
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
