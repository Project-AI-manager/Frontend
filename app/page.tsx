import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Script from "next/script";

import { OnePageRobotMount } from "@/components/landing/one-page-robot-mount";
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
    .replace(
      /<div class="product-stage reveal">[\s\S]*?(?=<div class="hero-metrics reveal")/,
      '<div class="home-robot-stage" aria-label="Интерактивный AI-сотрудник Автопилота"><div data-robot-canvas-slot></div></div>\n    </div>\n\n    ',
    )
    .replace(
      /<div class="hero-metrics reveal"[\s\S]*?<\/div>\s*<section id="problem"/,
      `<div class="hero-metrics reveal" aria-label="Ключевые преимущества">
      <div class="metric">
        <div class="metric-value">5 минут</div>
        <div class="metric-label">до запуска AI-сотрудника</div>
        <span class="hypothesis">быстрое подключение</span>
      </div>
      <div class="metric">
        <div class="metric-value">24/7</div>
        <div class="metric-label">принимает обращения клиентов</div>
        <span class="hypothesis">без пропущенных диалогов</span>
      </div>
      <div class="metric">
        <div class="metric-value">1 окно</div>
        <div class="metric-label">для сообщений из разных каналов</div>
        <span class="hypothesis">единый inbox</span>
      </div>
      <div class="metric">
        <div class="metric-value">По факту</div>
        <div class="metric-label">оплата только за использование AI</div>
        <span class="hypothesis">прозрачный расход</span>
      </div>
    </div>

    <section id="problem"`,
    )
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
    .brand-mark { width: 30px; height: 30px; border-radius: 9px; background: url('/icon.svg') center / cover no-repeat; box-shadow: 0 7px 17px rgba(36,99,235,.24); }
    .brand-mark::before { display: none; }
    html, body { overflow-x: clip; }
    .one-page-robot-stage { position: relative; width: 100%; min-height: 660px; overflow: visible; border: 0 !important; outline: 0 !important; border-radius: 0 !important; background: transparent !important; box-shadow: none !important; }
    .one-page-robot-crop { position: absolute; inset: -6% -18% -1%; overflow: visible; -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 69%, rgba(0,0,0,.94) 76%, rgba(0,0,0,.58) 84%, rgba(0,0,0,.16) 91%, transparent 97%); mask-image: linear-gradient(to bottom, #000 0%, #000 69%, rgba(0,0,0,.94) 76%, rgba(0,0,0,.58) 84%, rgba(0,0,0,.16) 91%, transparent 97%); }
    .one-page-robot-canvas { position: absolute; top: -3%; left: 50%; width: 104%; height: 124%; transform: translateX(-50%); }
    .one-page-robot-stage--static { display: grid; place-items: center; overflow: hidden; }
    .one-page-robot-static { position: relative; width: min(360px, 76vw); aspect-ratio: 1; border-radius: 32px; background: linear-gradient(135deg, rgba(36,99,235,.14), rgba(255,255,255,.4)); box-shadow: inset 0 1px 0 rgba(255,255,255,.75), 0 22px 54px rgba(18,39,76,.10); }
    .one-page-robot-static::before { content: ""; position: absolute; inset: 13%; border-radius: 28px; background: linear-gradient(145deg, #fff, #eaf1ff); box-shadow: 0 18px 50px rgba(36,99,235,.14); }
    .one-page-robot-static-orb { position: absolute; left: 50%; top: 27%; width: 42%; aspect-ratio: 1; transform: translateX(-50%); border-radius: 50%; background: radial-gradient(circle at 34% 28%, #fff 0 11%, #8eb0ff 12% 32%, #2463eb 33% 100%); box-shadow: 0 18px 36px rgba(36,99,235,.28); }
    .one-page-robot-static-panel { position: absolute; left: 50%; bottom: 21%; display: grid; width: 50%; gap: 8px; transform: translateX(-50%); }
    .one-page-robot-static-panel span { display: block; height: 10px; border-radius: 999px; background: rgba(36,99,235,.18); }
    .one-page-robot-static-panel span:nth-child(2) { width: 78%; }
    .one-page-robot-static-panel span:nth-child(3) { width: 58%; }
    .home-robot-stage { position: absolute; z-index: 1; top: 76px; left: calc(50% - 66px); width: min(720px, calc(50% + 56px)); min-height: 660px; border: 0 !important; outline: 0 !important; background: transparent !important; box-shadow: none !important; }
    .hero-metrics { position: relative; z-index: 4; }
    @media (max-width: 980px) { .home-robot-stage { position: relative; top: auto; left: auto; width: min(100% - 40px, var(--max)); min-height: 540px; margin: -54px auto 28px; } .one-page-robot-stage { min-height: 540px; } .one-page-robot-crop { inset: -6% 0 -1%; } .one-page-robot-canvas { top: -2%; width: 124%; height: 120%; } }
    @media (max-width: 620px) { .home-robot-stage { width: min(100% - 28px, var(--max)); min-height: 470px; margin-bottom: 12px; } .one-page-robot-stage { min-height: 470px; } .one-page-robot-crop { inset: -5% -22% -1%; } .one-page-robot-canvas { top: 2%; width: 165%; height: 112%; } }
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
      <OnePageRobotMount />
      <Script id="autopilot-one-page-interactions" strategy="afterInteractive">
        {script}
      </Script>
    </>
  );
}
