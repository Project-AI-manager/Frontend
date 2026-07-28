import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Script from "next/script";

import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: getSiteUrl("/") },
  openGraph: { url: getSiteUrl("/") },
};

const sourceCandidates = [
  path.join(process.cwd(), "autopilot-one-page.html"),
  path.resolve(process.cwd(), "..", "Автопилот_one-page.html"),
];

function getOnePageSource() {
  const sourcePath = sourceCandidates.find((candidate) => existsSync(candidate));

  if (!sourcePath) {
    throw new Error("Не найден исходный макет Автопилота.");
  }

  return readFileSync(sourcePath, "utf8");
}

function prepareOnePage(source: string) {
  const styles = source.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? "";
  const script = source.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? "";
  const body = source.match(/<body>([\s\S]*?)<script>/)?.[1] ?? "";

  const navigation = `
    <nav class="nav" aria-label="Навигация">
      <a href="#problem"><span>Проблема</span></a>
      <a href="#product"><span>Продукт</span></a>
      <a href="#market"><span>Рынок</span></a>
      <a href="#traction"><span>Статус</span></a>
    </nav>
    <div class="auth-actions" aria-label="Аккаунт">
      <a class="auth-login" href="/login">Войти</a>
      <a class="auth-register" href="/register">Регистрация</a>
    </div>`;

  const content = body
    .replace(/src="data:image\/png;base64,[^"]+"/, 'src="/autopilot-console-web.jpg"')
    .replace(/<nav class="nav" aria-label="Навигация">[\s\S]*?<\/nav>/, navigation)
    .replace(
      /<div class="hero-actions">[\s\S]*?<\/div>\s*<\/div>\s*<div class="product-stage/,
      `<div class="hero-actions">
          <a class="button" href="/register">Создать аккаунт <span aria-hidden="true">→</span></a>
          <a class="button secondary" href="/login">Войти</a>
        </div>
      </div>

      <div class="product-stage`,
    );

  const authStyles = `
    .auth-actions { display: flex; flex: none; align-items: center; gap: 6px; }
    .auth-login, .auth-register { padding: 10px 13px; border-radius: 999px; font-size: 13px; font-weight: 750; text-decoration: none; transition: transform .2s ease, background .2s ease, box-shadow .2s ease; }
    .auth-login:hover { background: rgba(36,99,235,.08); transform: translateY(-1px); }
    .auth-register { background: var(--blue); color: white; box-shadow: 0 8px 18px rgba(36,99,235,.24); }
    .auth-register:hover { background: var(--blue-dark); transform: translateY(-1px); box-shadow: 0 12px 24px rgba(36,99,235,.3); }
    @media (max-width: 760px) { .topbar-inner { gap: 4px; } .nav { display: none; } .auth-login, .auth-register { padding: 9px 10px; font-size: 12px; } .brand { padding-right: 4px; } }
  `;

  return { content, styles: `${styles}\n${authStyles}`, script };
}

export default function HomePage() {
  const source = getOnePageSource();
  const { content, styles, script } = prepareOnePage(source);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div dangerouslySetInnerHTML={{ __html: content }} />
      <Script id="autopilot-one-page-interactions" strategy="afterInteractive">
        {script}
      </Script>
    </>
  );
}
