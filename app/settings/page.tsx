"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { getApiErrorMessage } from "@/lib/api/errors";
import { settingsApi } from "@/lib/api/settings";

export default function SettingsPage() {
  const aiQuery = useQuery({
    queryKey: ["settings-ai"],
    queryFn: settingsApi.getAiSettings,
  });
  const billingQuery = useQuery({
    queryKey: ["settings-billing"],
    queryFn: settingsApi.getBillingSettings,
  });
  const loading = aiQuery.isLoading || billingQuery.isLoading;
  const error = aiQuery.error ?? billingQuery.error;

  return (
    <AppShell
      title="Настройки"
      description="Поведение ассистента и оплата."
      immersive
    >
      <div className="relative h-full min-h-0 overflow-hidden">
        <div className="relative flex h-full min-h-0 flex-col gap-4 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          {loading ? (
            <SettingsSkeleton />
          ) : error || !aiQuery.data || !billingQuery.data ? (
            <StateCard
              title="Настройки не загрузились"
              text={getApiErrorMessage(
                error,
                "Не удалось получить настройки с сервера.",
              )}
              onRetry={() => {
                void aiQuery.refetch();
                void billingQuery.refetch();
              }}
            />
          ) : (
            <SettingsContent ai={aiQuery.data} billing={billingQuery.data} />
          )}
        </div>
      </div>
    </AppShell>
  );
}

function SettingsContent({
  ai,
  billing,
}: {
  ai: Awaited<ReturnType<typeof settingsApi.getAiSettings>>;
  billing: Awaited<ReturnType<typeof settingsApi.getBillingSettings>>;
}) {
  const client = useQueryClient();
  const [enabled, setEnabled] = useState(ai.auto_reply_enabled);
  const [threshold, setThreshold] = useState(ai.confidence_threshold);
  const saveTimer = useRef<number | null>(null);
  const save = useMutation({
    mutationFn: (next: {
      auto_reply_enabled: boolean;
      confidence_threshold: number;
    }) => settingsApi.updateAiSettings(next),
    onSuccess: (data) => client.setQueryData(["settings-ai"], data),
  });

  useEffect(
    () => () => {
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    },
    [],
  );

  function autoSave(nextEnabled: boolean, nextThreshold: number) {
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      save.mutate({
        auto_reply_enabled: nextEnabled,
        confidence_threshold: nextThreshold,
      });
    }, 300);
  }

  function changeEnabled(next: boolean) {
    setEnabled(next);
    autoSave(next, threshold);
  }

  function changeThreshold(next: number) {
    setThreshold(next);
    autoSave(enabled, next);
  }

  return (
    <>
      {save.isError ? (
        <p
          role="alert"
          className="rounded-lg border border-[#d84545]/30 bg-[#fdeded] px-4 py-3 text-sm text-[#a72f2f]"
        >
          {getApiErrorMessage(save.error, "Не удалось сохранить настройки.")}
        </p>
      ) : null}

      <SettingsCard title="Поведение ассистента">
        <div data-tour="tour-settings-auto-replies" className="-mx-1 -my-[18px] flex items-center justify-between gap-6 rounded-[10px] px-1 py-[18px]">
          <span className="text-sm font-semibold">Отвечать автоматически</span>
          <Toggle
            checked={enabled}
            onChange={changeEnabled}
            label="Автоматические ответы"
          />
        </div>
        <Divider />
        <div data-tour="tour-settings-confidence" className="-mx-1 -mt-[18px] -mb-6 flex flex-col gap-2.5 rounded-[10px] px-1 pt-[18px] pb-6">
          <div className="flex items-baseline justify-between gap-4">
            <label htmlFor="confidence" className="text-sm font-semibold">
              Доля автоматических ответов
            </label>
            <output
              htmlFor="confidence"
              className="shrink-0 text-sm font-semibold tabular-nums text-[#1546ad]"
            >
              {threshold}%
            </output>
          </div>
          <div className="relative flex h-[26px] items-center">
            <div className="h-1.5 w-full rounded-full border border-[#e5eaf1] bg-[#f4f7fb]" />
            <div
              className="pointer-events-none absolute left-0 h-1.5 rounded-full bg-[#2463eb]"
              style={{ width: `${threshold}%` }}
            />
            <div
              className="pointer-events-none absolute size-5 -translate-x-1/2 rounded-full border-[1.5px] border-[#2463eb] bg-white shadow-[0_10px_22px_rgba(18,39,76,.07)]"
              style={{ left: `${threshold}%` }}
            />
            <input
              id="confidence"
              type="range"
              min="0"
              max="100"
              value={threshold}
              onChange={(event) => changeThreshold(Number(event.target.value))}
              className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
            />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Оплата" tourTarget="tour-settings-billing">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:gap-8">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-extrabold uppercase tracking-[.12em] text-[#64717f]">
              Баланс
            </span>
            <span className="font-heading text-[30px] font-extrabold tracking-[-.04em] tabular-nums text-[#2463eb]">
              {formatRubles(billing.balance_kopecks)}
            </span>
            <span className="text-[13px] tabular-nums text-[#64717f]">
              Бонусный баланс для работы ассистента
            </span>
          </div>
          <div className="hidden h-14 w-px bg-[#e5eaf1] md:block" />
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-extrabold uppercase tracking-[.12em] text-[#64717f]">
              Расход за текущий месяц
            </span>
            <span className="font-heading text-2xl font-extrabold tracking-[-.04em] tabular-nums">
              {formatRubles(billing.expenses_kopecks)}
            </span>
            <span className="text-[13px] text-[#64717f]">Обновляется по фактическому использованию</span>
          </div>
          <TopUpForm />
        </div>
      </SettingsCard>

    </>
  );
}

function formatRubles(kopecks: number) {
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(kopecks / 100)} ₽`;
}

function SettingsCard({
  title,
  id,
  tourTarget,
  children,
}: {
  title: string;
  id?: string;
  tourTarget?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} data-tour={tourTarget} className="flex scroll-mt-7 flex-col gap-[18px] rounded-lg border border-[#d9e1ec] bg-white p-6 shadow-[0_10px_22px_rgba(18,39,76,.07)]">
      <h2 className="font-heading text-lg font-extrabold tracking-[-.03em]">
        {title}
      </h2>
      <Divider />
      {children}
    </section>
  );
}

function Divider() {
  return <div className="h-px shrink-0 bg-[#e5eaf1]" />;
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`flex h-[26px] w-11 shrink-0 items-center rounded-full p-[3px] ${checked ? "justify-end bg-[#2463eb]" : "justify-start bg-[#d9e1ec]"}`}
    >
      <span className="size-5 rounded-full bg-white" />
    </button>
  );
}

function TopUpForm() {
  const [amount, setAmount] = useState("");

  return (
    <form
      className="flex items-center gap-2.5 md:ml-auto"
      onSubmit={(event) => {
        event.preventDefault();
        window.alert(
          "Пополнение станет доступно после подключения платёжного провайдера.",
        );
      }}
    >
      <input
        aria-label="Сумма пополнения"
        inputMode="numeric"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        placeholder="Сумма, ₽"
        className="min-h-11 w-[132px] rounded-lg border border-[#d9e1ec] bg-[#f8fbff] px-4 text-sm tabular-nums text-[#101828] placeholder:text-[#64717f] focus:border-[#2463eb] focus:outline-none focus:ring-3 focus:ring-[#eaf1ff]"
      />
      <button
        type="submit"
        className="min-h-11 rounded-lg border border-[#2463eb] bg-[#2463eb] px-5 text-sm font-semibold whitespace-nowrap text-white shadow-[0_11px_25px_rgba(36,99,235,.20)] hover:bg-[#1546ad] active:translate-y-px"
      >
        Пополнить
      </button>
    </form>
  );
}

function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Загружаем настройки">
      {[226, 174].map((height) => (
        <div
          key={height}
          className="animate-pulse rounded-lg bg-[#e5eaf1]"
          style={{ height }}
        />
      ))}
    </div>
  );
}

function StateCard({
  title,
  text,
  onRetry,
}: {
  title: string;
  text: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-[#d9e1ec] bg-white p-8 text-center">
      <RefreshCw className="text-[#2463eb]" />
      <h2 className="mt-4 text-xl font-extrabold">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-[#526071]">{text}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 rounded-lg bg-[#2463eb] px-5 py-2.5 text-sm font-semibold text-white"
      >
        Повторить
      </button>
    </div>
  );
}
