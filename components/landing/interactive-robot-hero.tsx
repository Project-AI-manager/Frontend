"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart3, Check, Clock3, FileText, MessagesSquare, ShieldCheck, Store, Wrench, Building2, BriefcaseBusiness } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { SplineScene } from "@/components/ui/splite";

const sceneUrl = "/spline/friendly-robot.splinecode";

const navItems = [
  { href: "#abilities", label: "Возможности" },
  { href: "#how", label: "Как работает" },
  { href: "#price", label: "Оплата" },
  { href: "#audiences", label: "Для кого" },
];

const storySections = [
  {
    id: "abilities",
    eyebrow: "Все обращения перед глазами",
    title: <>Один AI-сотрудник. <span className="text-[#2463eb]">Все продажи.</span></>,
    text: "Он принимает новые обращения, отвечает по базе знаний и продолжает диалог, пока клиенту не понадобится менеджер.",
    side: "right",
  },
  {
    id: "how",
    eyebrow: "Знает ваш бизнес",
    title: <>Отвечает не наугад, а <span className="text-[#2463eb]">по вашим материалам.</span></>,
    text: "Загрузите условия, каталоги и инструкции. AI использует их в ответах и показывает, на какие знания опирался.",
    side: "left",
  },
  {
    id: "cases",
    eyebrow: "Человек остаётся главным",
    title: <>Сложный вопрос? <span className="text-[#2463eb]">Позовёт менеджера.</span></>,
    text: "Если информации недостаточно или решение требует человека, робот не фантазирует — он сохраняет контекст и передаёт диалог.",
    side: "right",
  },
  {
    id: "price",
    eyebrow: "Прозрачная экономика",
    title: <>Платите только за <span className="text-[#2463eb]">реальное использование.</span></>,
    text: "Стартовый баланс — 1 000 ₽. Стоимость зависит от фактических запросов к AI: расход и история использования видны в кабинете.",
    side: "left",
  },
] as const;

const journeySteps = [
  {
    number: "01",
    title: "Сообщение приходит в единое окно",
    text: "Менеджеру не нужно держать открытыми несколько приложений и собирать историю вручную.",
  },
  {
    number: "02",
    title: "AI находит ответ в материалах компании",
    text: "Условия, документы и каталоги становятся рабочей базой знаний сотрудника.",
  },
  {
    number: "03",
    title: "Разговор продолжается в нужном тоне",
    text: "Автопилот сохраняет контекст и ведёт клиента дальше, а не начинает каждый ответ заново.",
  },
  {
    number: "04",
    title: "Сложное решение принимает человек",
    text: "Диалог передаётся менеджеру вместе с контекстом и пометкой «Нужен человек».",
  },
] as const;

function MarketingHeader() {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[14px] z-50 flex justify-center px-3 sm:px-5">
      <header className="pointer-events-auto flex h-[68px] w-full max-w-[860px] items-center justify-between gap-2 overflow-hidden rounded-full border border-[rgba(36,99,235,.2)] bg-[linear-gradient(135deg,rgba(247,250,255,.96),rgba(255,255,255,.88))] px-2.5 py-2 shadow-[0_16px_42px_rgba(18,39,76,.13),inset_0_1px_0_rgba(255,255,255,.94)] backdrop-blur-xl">
        <Link href="/" aria-label="Автопилот — на главную" className="group flex shrink-0 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-2.5 text-[13px] font-extrabold tracking-[-.02em] transition hover:bg-[#eaf1ff]">
          <Image
            src="/icon.svg"
            alt=""
            width={30}
            height={30}
            priority
            aria-hidden="true"
            className="size-[30px] shrink-0 rounded-[9px] shadow-[0_7px_17px_rgba(36,99,235,.24)]"
          />
          Автопилот
        </Link>
        <nav aria-label="Основная навигация" className="hidden min-w-0 flex-1 items-center justify-center gap-1 md:flex">
          {navItems.map((item) => <a key={item.href} href={item.href} className="rounded-full px-3 py-2.5 text-[13px] font-semibold text-[#526071] transition hover:-translate-y-0.5 hover:bg-[#eaf1ff] hover:text-[#2463eb]">{item.label}</a>)}
        </nav>
        <div className="flex shrink-0 items-center gap-1 text-[12px] font-bold sm:text-[13px]">
          <Link href="/login" className="rounded-full px-2.5 py-2.5 text-[#526071] transition hover:bg-[#f4f7fb] hover:text-[#101828] sm:px-3.5">Войти</Link>
          <Link href="/register" className="rounded-full bg-[#2463eb] px-3 py-2.5 text-white shadow-[0_8px_18px_rgba(36,99,235,.24)] transition hover:-translate-y-0.5 hover:bg-[#1546ad] sm:px-4">Регистрация</Link>
        </div>
      </header>
    </div>
  );
}

interface CurtainProps {
  from: -1 | 1;
  to: -1 | 1;
  tone: "blue" | "dark";
  eyebrow: string;
  title: string;
  text: string;
  steps: readonly string[];
}

function FullWidthCurtain({ from, to, tone, eyebrow, title, text, steps }: CurtainProps) {
  const dark = tone === "dark";

  return (
    <section
      data-robot-curtain-from={from}
      data-robot-curtain-to={to}
      className="relative h-[145dvh] sm:h-[165dvh] lg:h-[175dvh]"
    >
      <div
        className={`sticky top-0 z-20 flex h-dvh w-full items-center overflow-hidden px-4 py-24 text-white sm:px-8 lg:px-12 ${
          dark ? "bg-[#101828]" : "bg-[#1546ad]"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(255,255,255,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.055)_1px,transparent_1px)] [background-size:56px_56px]" />
        <div className={`pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[920px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px] ${dark ? "bg-[#2463eb]/20" : "bg-[#8eb0ff]/18"}`} />
        <div className="relative mx-auto w-full max-w-[1240px] text-center">
          <p className={`text-[11px] font-extrabold uppercase tracking-[.16em] ${dark ? "text-[#8eb0ff]" : "text-[#cddfff]"}`}>{eyebrow}</p>
          <h2 className="mx-auto mt-6 max-w-[1020px] font-heading text-[clamp(48px,7vw,96px)] font-bold leading-[.91] tracking-[-.065em] text-balance">{title}</h2>
          <p className={`mx-auto mt-7 max-w-[760px] text-[17px] leading-[1.65] sm:text-[19px] ${dark ? "text-[#b7c1d0]" : "text-[#e5edff]"}`}>{text}</p>
          <div className="mx-auto mt-9 flex max-w-[940px] flex-col items-stretch justify-center gap-2 sm:flex-row sm:items-center">
            {steps.map((step, index) => (
              <div key={step} className="contents">
                <span className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold shadow-[inset_0_1px_0_rgba(255,255,255,.12)] backdrop-blur-sm">{step}</span>
                {index < steps.length - 1 ? <ArrowRight className="mx-auto size-4 rotate-90 text-white/45 sm:rotate-0" aria-hidden="true" /> : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StorySection({ section }: { section: (typeof storySections)[number] }) {
  return (
    <section
      id={section.id}
      data-robot-side={section.side === "left" ? "1" : "-1"}
      className="flex min-h-[115dvh] scroll-mt-24 items-center px-4 py-24 sm:min-h-[125dvh] sm:px-8 lg:min-h-[135dvh] lg:px-12"
    >
      <div className={`mx-auto flex w-full max-w-[1240px] ${section.side === "right" ? "justify-end" : "justify-start"}`}>
        <article className="max-w-[620px] rounded-[28px] border border-white/80 bg-white/90 p-7 shadow-[0_24px_70px_rgba(18,39,76,.10)] sm:bg-white/78 sm:p-11 sm:backdrop-blur-[10px]">
          <p className="text-[11px] font-extrabold uppercase tracking-[.14em] text-[#2463eb]">{section.eyebrow}</p>
          <h2 className="mt-5 font-heading text-[clamp(44px,5.2vw,74px)] font-bold leading-[.94] tracking-[-.06em] text-balance">{section.title}</h2>
          <p className="mt-6 max-w-[540px] text-[17px] leading-[1.65] text-[#526071]">{section.text}</p>
        </article>
      </div>
    </section>
  );
}

const audiences = [
  { icon: Store, title: "Онлайн-магазины", text: "Вопросы о товаре, наличии, доставке и подборе." },
  { icon: Wrench, title: "Услуги", text: "Первичный запрос, квалификация и подготовка к записи." },
  { icon: Building2, title: "Производство", text: "Ответы по каталогам, условиям и типовым расчётам." },
  { icon: BriefcaseBusiness, title: "B2B и агентства", text: "Длинные диалоги с сохранением контекста клиента." },
] as const;

const capabilities = [
  { icon: MessagesSquare, title: "Единый inbox", text: "Telegram, WhatsApp и Avito уже подключаются; VK, Instagram и MAX — скоро." },
  { icon: FileText, title: "База знаний", text: "Загружайте PDF, DOCX, XLSX, MD и TXT — ответы строятся по вашим материалам." },
  { icon: ShieldCheck, title: "Контроль ответа", text: "Сложный диалог получает статус «Нужен человек» и передаётся менеджеру." },
  { icon: BarChart3, title: "Аналитика", text: "Следите за обращениями и выгружайте данные в XLSX для своей отчётности." },
] as const;

function ValueStrip() {
  const items = [
    { value: "5 минут", label: "от регистрации до первой смены" },
    { value: "3 канала", label: "Telegram, WhatsApp и Avito в одном окне" },
    { value: "По факту", label: "оплата только за использование AI" },
  ] as const;

  return (
    <section className="relative z-20 border-y border-[#d9e1ec] bg-white px-4 py-7 sm:px-8 lg:px-12">
      <div className="mx-auto grid max-w-[1240px] gap-6 sm:grid-cols-3 sm:gap-0">
        {items.map((item, index) => (
          <div key={item.value} className={`text-center sm:px-8 ${index ? "sm:border-l sm:border-[#d9e1ec]" : ""}`}>
            <p className="font-heading text-[30px] font-bold tracking-[-.045em] text-[#2463eb]">{item.value}</p>
            <p className="mt-1 text-sm leading-[1.45] text-[#64717f]">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function JourneySection() {
  return (
    <section id="how" className="relative z-20 scroll-mt-24 bg-white px-4 py-28 sm:px-8 lg:px-12 lg:py-36">
      <div className="mx-auto max-w-[1240px]">
        <div className="max-w-[940px]">
          <p className="text-[11px] font-extrabold uppercase tracking-[.14em] text-[#2463eb]">Как работает</p>
          <h2 className="mt-5 font-heading text-[clamp(46px,6vw,82px)] font-bold leading-[.93] tracking-[-.06em] text-balance">Не чат-бот со сценариями, а управляемый помощник продаж.</h2>
        </div>
        <div className="mt-14 border-y border-[#d9e1ec]">
          {journeySteps.map((step) => (
            <article key={step.number} className="grid gap-4 border-b border-[#d9e1ec] py-8 last:border-b-0 sm:grid-cols-[90px_1fr_1fr] sm:items-center sm:gap-10 sm:py-9">
              <span className="font-heading text-[30px] font-bold tracking-[-.04em] text-[#2463eb]">{step.number}</span>
              <h3 className="font-heading text-[24px] font-bold leading-[1.08] tracking-[-.04em] sm:text-[29px]">{step.title}</h3>
              <p className="text-[15px] leading-[1.6] text-[#64717f] sm:text-[16px]">{step.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AudienceSection() {
  return (
    <section id="audiences" className="relative z-20 scroll-mt-24 bg-[#eef3f9] px-4 py-28 sm:px-8 lg:px-12 lg:py-36">
      <div className="mx-auto max-w-[1240px]">
        <p className="text-[11px] font-extrabold uppercase tracking-[.14em] text-[#2463eb]">Кому подходит</p>
        <h2 className="mt-5 max-w-[920px] font-heading text-[clamp(46px,6vw,82px)] font-bold leading-[.93] tracking-[-.06em] text-balance">Там, где клиенты пишут каждый день.</h2>
        <div className="mt-14 grid gap-px overflow-hidden rounded-[28px] border border-[#d9e1ec] bg-[#d9e1ec] md:grid-cols-2 lg:grid-cols-4">
          {audiences.map(({ icon: Icon, title, text }) => (
            <article key={title} className="bg-white p-7 sm:p-9">
              <Icon className="size-7 text-[#2463eb]" strokeWidth={1.8} />
              <h3 className="mt-8 font-heading text-[24px] font-bold tracking-[-.035em]">{title}</h3>
              <p className="mt-3 text-[15px] leading-[1.6] text-[#64717f]">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SetupSection() {
  const steps = [
    { time: "0:30", title: "Создайте аккаунт", text: "Регистрация и вход в рабочий кабинет." },
    { time: "2:00", title: "Подключите канал", text: "Добавьте Telegram, WhatsApp или Avito." },
    { time: "4:00", title: "Загрузите материалы", text: "Передайте AI условия, документы и каталог." },
    { time: "5:00", title: "Проверьте первую смену", text: "Протестируйте ответы и передайте диалоги роботу." },
  ] as const;

  return (
    <section id="setup" className="relative z-20 overflow-hidden bg-white px-4 py-28 sm:px-8 lg:px-12 lg:py-36">
      <div className="pointer-events-none absolute left-[72%] top-0 size-[560px] -translate-y-1/3 rounded-full bg-[#eaf1ff] blur-[100px]" />
      <div className="relative mx-auto max-w-[1240px]">
        <div className="max-w-[900px]">
          <p className="text-[11px] font-extrabold uppercase tracking-[.14em] text-[#2463eb]">Подключение</p>
          <h2 className="mt-5 font-heading text-[clamp(46px,6vw,82px)] font-bold leading-[.93] tracking-[-.06em] text-balance">Новый сотрудник выходит на связь за 5 минут.</h2>
        </div>
        <div className="mt-14 grid gap-8 lg:grid-cols-4 lg:gap-0">
          {steps.map((step, index) => (
            <article key={step.time} className="relative lg:pr-8">
              {index < steps.length - 1 ? <div className="absolute left-11 top-6 hidden h-px w-[calc(100%-44px)] bg-[#cddfff] lg:block" /> : null}
              <div className="relative grid size-12 place-items-center rounded-full border border-[#cddfff] bg-[#f4f7fb] text-xs font-extrabold text-[#2463eb]">{index + 1}</div>
              <p className="mt-6 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.14em] text-[#64717f]"><Clock3 size={14} />{step.time}</p>
              <h3 className="mt-3 font-heading text-[23px] font-bold tracking-[-.035em]">{step.title}</h3>
              <p className="mt-3 text-[15px] leading-[1.6] text-[#64717f]">{step.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CapabilitiesSection() {
  return (
    <section className="relative z-20 bg-[#f4f7fb] px-4 py-28 sm:px-8 lg:px-12 lg:py-36">
      <div className="mx-auto grid max-w-[1240px] gap-14 lg:grid-cols-[.78fr_1.22fr] lg:gap-20">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[.14em] text-[#2463eb]">Что умеет Автопилот</p>
          <h2 className="mt-5 font-heading text-[clamp(46px,5.5vw,76px)] font-bold leading-[.93] tracking-[-.06em] text-balance">Вся работа с обращением — в одном продукте.</h2>
          <p className="mt-6 max-w-[510px] text-[17px] leading-[1.65] text-[#526071]">От первого сообщения до аналитики и подключения человека: команда видит один и тот же контекст.</p>
        </div>
        <div className="grid gap-px overflow-hidden rounded-[28px] border border-[#d9e1ec] bg-[#d9e1ec] sm:grid-cols-2">
          {capabilities.map(({ icon: Icon, title, text }) => (
            <article key={title} className="bg-white p-7 sm:p-9">
              <Icon className="size-7 text-[#2463eb]" strokeWidth={1.8} />
              <h3 className="mt-7 font-heading text-[23px] font-bold tracking-[-.035em]">{title}</h3>
              <p className="mt-3 text-[15px] leading-[1.6] text-[#64717f]">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function InteractiveRobotHero() {
  const robotLayerRef = useRef<HTMLDivElement>(null);
  const [reduceMotion, setReduceMotion] = useState(() =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );
  const [finePointer, setFinePointer] = useState(() =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(pointer: fine)").matches
      : true,
  );

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => setReduceMotion(media.matches);
    media.addEventListener("change", syncMotionPreference);
    return () => media.removeEventListener("change", syncMotionPreference);
  }, []);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(pointer: fine)");
    const syncPointer = () => setFinePointer(media.matches);
    media.addEventListener("change", syncPointer);
    return () => media.removeEventListener("change", syncPointer);
  }, []);

  useEffect(() => {
    const layer = robotLayerRef.current;
    if (!layer) return;

    if (reduceMotion) {
      layer.style.transform = "translate3d(calc(-50% + 280px), -50%, 0) scale(1)";
      return;
    }

    type Anchor = { scroll: number; side: number };
    let anchors: Anchor[] = [];
    let targetScroll = scrollY;
    let currentScroll = scrollY;
    let frame = 0;
    let previousTime = performance.now();

    const measureAnchors = () => {
      const sectionAnchors = Array.from(document.querySelectorAll<HTMLElement>("[data-robot-side]")).map((section) => {
          const rect = section.getBoundingClientRect();
          return {
            scroll: rect.top + scrollY + rect.height / 2 - innerHeight / 2,
            side: Number(section.dataset.robotSide ?? 1),
          };
        });
      const curtainAnchors = Array.from(document.querySelectorAll<HTMLElement>("[data-robot-curtain-from]")).flatMap((section) => {
        const rect = section.getBoundingClientRect();
        const top = rect.top + scrollY;
        const travel = Math.max(1, rect.height - innerHeight);
        const margin = Math.min(innerHeight * 0.06, travel * 0.12);
        return [
          { scroll: top + margin, side: Number(section.dataset.robotCurtainFrom ?? 1) },
          { scroll: top + travel - margin, side: Number(section.dataset.robotCurtainTo ?? -1) },
        ];
      });
      anchors = [...sectionAnchors, ...curtainAnchors].sort((a, b) => a.scroll - b.scroll);
    };

    const renderPosition = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      const globalProgress = Math.min(1, Math.max(0, currentScroll / maxScroll));
      let side = 1;

      if (innerWidth >= 1024 && anchors.length > 1) {
        const nextIndex = anchors.findIndex((anchor) => anchor.scroll >= currentScroll);
        const rightIndex = nextIndex <= 0 ? 0 : nextIndex;
        const leftIndex = Math.max(0, rightIndex - 1);
        const left = anchors[leftIndex];
        const right = anchors[rightIndex] ?? left;
        const distance = Math.max(1, right.scroll - left.scroll);
        const raw = Math.min(1, Math.max(0, (currentScroll - left.scroll) / distance));
        const eased = 0.5 - 0.5 * Math.cos(Math.PI * raw);
        side = left.side + (right.side - left.side) * eased;
      }

      const amplitude = innerWidth >= 1024 ? Math.min(300, Math.max(190, innerWidth * 0.21)) : 0;
      const x = side * amplitude;
      const y = -4 + globalProgress * 12;
      const scale = innerWidth < 768 ? 0.97 : 1 - globalProgress * 0.035;
      layer.style.transform = `translate3d(calc(-50% + ${x.toFixed(2)}px), calc(-50% + ${y.toFixed(2)}svh), 0) scale(${scale.toFixed(4)})`;
    };

    const animate = (time: number) => {
      const delta = Math.min((time - previousTime) / 1000, 0.05);
      previousTime = time;
      currentScroll += (targetScroll - currentScroll) * (1 - Math.exp(-2.2 * delta));
      renderPosition();

      if (Math.abs(targetScroll - currentScroll) > 0.15) {
        frame = requestAnimationFrame(animate);
      } else {
        currentScroll = targetScroll;
        renderPosition();
        frame = 0;
      }
    };

    const requestPositionUpdate = () => {
      targetScroll = scrollY;
      if (frame) return;
      previousTime = performance.now();
      frame = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      measureAnchors();
      requestPositionUpdate();
    };

    measureAnchors();
    renderPosition();
    void document.fonts?.ready.then(handleResize);
    addEventListener("scroll", requestPositionUpdate, { passive: true });
    addEventListener("resize", handleResize, { passive: true });
    return () => {
      removeEventListener("scroll", requestPositionUpdate);
      removeEventListener("resize", handleResize);
      cancelAnimationFrame(frame);
    };
  }, [reduceMotion]);

  return (
    <main className="relative min-h-dvh overflow-x-clip bg-[#f4f7fb] text-[#101828]">
      <MarketingHeader />

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-label="Интерактивный робот следует за посетителем по странице">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(36,99,235,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(36,99,235,.035)_1px,transparent_1px)] bg-[size:56px_56px]" />
        <div className="absolute left-[62%] top-1/2 size-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#eaf1ff] blur-[95px]" />
        <div
          ref={robotLayerRef}
          data-robot-layer
          className="absolute left-1/2 top-1/2 h-[108svh] w-[min(68vw,900px)] origin-center will-change-transform max-lg:h-[92svh] max-lg:w-[82vw] max-md:top-[68%] max-md:h-[58svh] max-md:w-[120vw]"
          style={{ transform: "translate3d(calc(-50% + 280px), -50%, 0) scale(1)" }}
        >
          <SplineScene scene={sceneUrl} className="size-full" globalEvents={!reduceMotion && finePointer} paused={reduceMotion} />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(244,247,251,.20)_72%,rgba(244,247,251,.58)_100%)]" />
      </div>

      <div className="relative z-10">
        <section data-robot-side="1" className="flex min-h-[110dvh] items-center px-4 pb-14 pt-28 sm:px-8 lg:px-12">
          <div className="mx-auto w-full max-w-[1240px]">
            <div className="max-w-[720px] rounded-[32px] border border-white/70 bg-white/88 p-7 shadow-[0_28px_80px_rgba(18,39,76,.11)] sm:bg-white/76 sm:p-12 sm:backdrop-blur-[10px] lg:p-16">
              <div className="inline-flex w-max items-center gap-2 rounded-full border border-[#cddfff] bg-white/80 px-3 py-2 text-[11px] font-extrabold uppercase tracking-[.12em] text-[#1546ad] shadow-soft"><span className="size-2 rounded-full bg-[#13a66b] shadow-[0_0_0_5px_rgba(19,166,107,.12)]" />AI-сотрудник на смене</div>
              <h1 className="mt-7 font-heading text-[clamp(54px,7vw,102px)] font-bold leading-[.88] tracking-[-.072em] text-balance">Виртуальный сотрудник <span className="text-[#2463eb]">по продажам.</span></h1>
              <p className="mt-7 max-w-[610px] text-[17px] leading-[1.6] text-[#526071] sm:text-[19px]">За 5 минут принимает обращения из ваших каналов, отвечает по материалам компании и передаёт сложные диалоги менеджеру.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-[12px] bg-[#2463eb] px-6 text-sm font-bold text-white shadow-[0_12px_28px_rgba(36,99,235,.22)] hover:-translate-y-0.5 hover:bg-[#1546ad]">Создать за 5 минут <ArrowRight size={18} /></Link>
                <a href="#abilities" className="inline-flex min-h-[54px] items-center justify-center rounded-[12px] border border-[#d9e1ec] bg-white/80 px-6 text-sm font-bold hover:bg-[#eaf1ff]">Листать вместе с роботом</a>
              </div>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#64717f]">{["Telegram, WhatsApp и Avito", "Ответы по вашим данным", "Оплата за использование AI"].map((item) => <span key={item} className="inline-flex items-center gap-1.5"><Check size={15} className="text-[#13a66b]" />{item}</span>)}</div>
            </div>
          </div>
        </section>

        <ValueStrip />

        <StorySection section={storySections[0]} />

        <FullWidthCurtain
          from={-1}
          to={1}
          tone="blue"
          eyebrow="Не просто чат-бот"
          title="Он ведёт диалог целиком, а не отвечает на отдельные сообщения."
          text="Сообщения из подключённых каналов собираются в одном окне. Автопилот сохраняет контекст и использует материалы вашей компании, чтобы продолжить разговор."
          steps={["Получил сообщение", "Сохранил контекст", "Нашёл ответ"]}
        />

        <JourneySection />

        <StorySection section={storySections[1]} />

        <AudienceSection />

        <SetupSection />

        <StorySection section={storySections[2]} />

        <FullWidthCurtain
          from={-1}
          to={1}
          tone="dark"
          eyebrow="Автоматизация под контролем"
          title="Робот делает рутину. Менеджер подключается там, где нужен человек."
          text="Если данных недостаточно или решение требует человека, Автопилот передаёт диалог вместе с контекстом — менеджеру не нужно начинать разговор заново."
          steps={["AI отвечает", "Распознаёт сложный вопрос", "Передаёт менеджеру"]}
        />

        <StorySection section={storySections[3]} />

        <CapabilitiesSection />

        <section data-robot-side="-1" className="flex min-h-[110dvh] items-center px-4 py-24 sm:px-8 lg:px-12">
          <div className="mx-auto flex w-full max-w-[1240px] justify-end">
          <div className="w-full max-w-[720px] rounded-[36px] bg-[#101828]/95 p-8 text-center text-white shadow-[0_32px_90px_rgba(18,39,76,.24)] sm:p-14">
            <p className="text-[11px] font-extrabold uppercase tracking-[.14em] text-[#8eb0ff]">Робот дошёл с вами до конца</p>
            <h2 className="mx-auto mt-6 max-w-[900px] font-heading text-[clamp(48px,6vw,86px)] font-bold leading-[.94] tracking-[-.06em]">Теперь поставьте его на первую смену.</h2>
            <p className="mx-auto mt-6 max-w-[620px] text-[17px] leading-[1.6] text-[#b7c1d0]">Подключите Telegram, загрузите материалы компании и проверьте первые ответы.</p>
            <Link href="/register" className="mt-9 inline-flex min-h-14 items-center gap-2 rounded-[12px] bg-[#2463eb] px-7 font-bold text-white hover:bg-[#356fef]">Создать виртуального сотрудника <ArrowRight size={18} /></Link>
          </div>
          </div>
        </section>
      </div>
    </main>
  );
}
