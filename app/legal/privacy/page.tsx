import type { Metadata } from "next";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { getSiteUrl, SITE_HOST_DISPLAY } from "@/lib/site";

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
  alternates: { canonical: getSiteUrl("/legal/privacy") },
  openGraph: { url: getSiteUrl("/legal/privacy") },
};

const sections = ["Общие положения", "Какие данные собираем", "Как используем", "Хранение и защита", "Передача данных", "Права пользователя"];

export default function PrivacyPage() {
  return <><Header /><main className="bg-white px-5 py-12 text-[#101828] lg:px-12 lg:py-14"><div className="mx-auto grid max-w-[1180px] gap-10 md:grid-cols-[220px_1px_minmax(0,720px)] lg:gap-12"><aside className="hidden flex-col gap-3 md:flex"><p className="mb-1 text-[11px] font-extrabold uppercase tracking-[.12em] text-[#64717f]">Разделы</p>{sections.map((section, index) => <a key={section} href={`#privacy-${index + 1}`} className={`text-sm ${index === 0 ? "font-semibold text-[#1546ad]" : "text-[#526071] hover:text-[#1546ad]"}`}>{index + 1}. {section}</a>)}</aside><div className="hidden bg-[#e5eaf1] md:block" /><article className="space-y-6"><div><p className="text-[11px] font-extrabold uppercase tracking-[.12em] text-[#64717f]">Редакция от 27 июля 2026</p><h1 className="mt-2 text-4xl font-extrabold tracking-[-.05em]">Политика конфиденциальности</h1></div><div className="h-px bg-[#e5eaf1]" /><LegalSection id="privacy-1" title="1. Общие положения"><p>Политика описывает обработку данных пользователей сервиса «Автопилот», их сотрудников и клиентов, обращения которых поступают через подключённые каналы.</p></LegalSection><LegalSection id="privacy-2" title="2. Какие данные мы собираем"><p>Мы можем обрабатывать имя, контактные данные, сведения о компании, настройки аккаунта, сообщения клиентов и документы, которые пользователь загружает в базу знаний.</p><ul className="list-disc space-y-2 pl-6"><li>данные аккаунта и авторизации;</li><li>содержимое подключённых каналов;</li><li>технические журналы и статистику использования.</li></ul></LegalSection><LegalSection id="privacy-3" title="3. Как используем данные"><p>Данные нужны для работы кабинета, подготовки ответов, аналитики, поддержки пользователей и обеспечения безопасности. Содержимое одного рабочего пространства не используется для ответов другому.</p></LegalSection><blockquote className="border-l-2 border-[#2463eb] bg-[#f8fbff] p-5 text-[15px] leading-7 text-[#526071]">Пользователь самостоятельно определяет законные основания для передачи сервису данных своих клиентов и отвечает за информирование таких лиц.</blockquote><LegalSection id="privacy-4" title="4. Хранение и защита"><p>Мы применяем разграничение доступа, шифрование секретов интеграций и технические меры для защиты данных. Срок хранения зависит от назначения данных и обязательных требований закона.</p></LegalSection><LegalSection id="privacy-5" title="5. Передача данных"><p>Данные могут передаваться поставщикам инфраструктуры и AI-моделей только в объёме, необходимом для оказания услуги, а также государственным органам в предусмотренных законом случаях.</p></LegalSection><p className="pt-2 text-[13px] text-[#64717f]">Вопросы о данных: <a className="text-[#1546ad] underline" href="mailto:privacy@xn--80aesmncewf.space">privacy@{SITE_HOST_DISPLAY}</a></p></article></div></main><Footer /></>;
}

function LegalSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) { return <section id={id} className="scroll-mt-24 space-y-4"><h2 className="text-xl font-extrabold tracking-[-.04em]">{title}</h2><div className="space-y-4 text-pretty text-base leading-[1.7]">{children}</div></section>; }
