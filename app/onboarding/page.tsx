"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { AppHeader, Card } from "@/components/navigation";

const steps = [
  {
    title: "Профиль компании",
    body: "Уточняем сферу, чтобы AI отвечал в правильном тоне.",
  },
  {
    title: "Первый канал",
    body: "Для MVP начинаем с веб-чата: он не зависит от внешних API.",
  },
  {
    title: "База знаний",
    body: "Загрузите прайс, FAQ или условия доставки — это источник ответов.",
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const current = steps[step];

  function next() {
    if (step === steps.length - 1) {
      router.push("/inbox");
      return;
    }
    setStep((value) => value + 1);
  }

  return (
    <div className="min-h-screen bg-bg">
      <AppHeader />
      <main className="mx-auto grid max-w-3xl place-items-center px-6 py-16">
        <Card className="w-full">
          <div className="mb-8">
            <p className="text-sm font-bold text-brand">Шаг {step + 1} из 3</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-bg">
              <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${((step + 1) / 3) * 100}%` }} />
            </div>
          </div>
          <h1 className="font-display text-4xl font-black">{current.title}</h1>
          <p className="mt-3 text-ink/65">{current.body}</p>

          <div className="mt-8 rounded-2xl border border-border bg-bg p-5">
            {step === 0 && (
              <div className="grid gap-4">
                <input className="rounded-lg border border-border bg-white px-4 py-3" defaultValue="ООО Север" />
                <select className="rounded-lg border border-border bg-white px-4 py-3" defaultValue="retail">
                  <option value="retail">Розничная торговля</option>
                  <option value="service">Услуги</option>
                  <option value="clinic">Клиника / бьюти</option>
                </select>
              </div>
            )}
            {step === 1 && (
              <div>
                <div className="mb-4 grid gap-3 sm:grid-cols-4">
                  {["Веб-чат", "Avito", "VK", "MAX"].map((channel, index) => (
                    <button
                      key={channel}
                      className={`rounded-lg border px-4 py-3 text-sm font-bold ${
                        index === 0 ? "border-brand bg-status-auto-bg text-brand" : "border-border bg-white text-ink/60"
                      }`}
                    >
                      {channel}
                    </button>
                  ))}
                </div>
                <code className="block rounded-lg bg-ink p-4 text-sm text-white">
                  {`<script src="https://edino.ai/widget.js" data-workspace="sever"></script>`}
                </code>
              </div>
            )}
            {step === 2 && (
              <div className="grid min-h-40 place-items-center rounded-xl border border-dashed border-brand bg-status-auto-bg p-8 text-center">
                <div>
                  <p className="font-bold text-brand">Перетащите документ сюда</p>
                  <p className="mt-2 text-sm text-ink/60">PDF, DOCX, TXT, Markdown. Для демо файл не требуется.</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-between">
            <button
              className="rounded-lg border border-border px-5 py-3 font-bold disabled:opacity-40"
              disabled={step === 0}
              onClick={() => setStep((value) => Math.max(0, value - 1))}
            >
              Назад
            </button>
            <button className="rounded-lg bg-brand px-5 py-3 font-bold text-white hover:bg-brand-hover" onClick={next}>
              {step === steps.length - 1 ? "Перейти в диалоги" : "Далее"}
            </button>
          </div>
        </Card>
      </main>
    </div>
  );
}
