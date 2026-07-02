"use client";

import {
  AlertCircle,
  Bot,
  Building2,
  CreditCard,
  Loader2,
  RefreshCw,
  Save,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AppShell } from "@/components/layout/app-shell";
import { getApiErrorMessage } from "@/lib/api/errors";
import { settingsApi } from "@/lib/api/settings";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [workspaceNameDraft, setWorkspaceNameDraft] = useState<string | null>(null);
  const [autoReplyEnabledDraft, setAutoReplyEnabledDraft] = useState<boolean | null>(null);
  const [confidenceThresholdDraft, setConfidenceThresholdDraft] = useState<number | null>(null);
  const [llmProviderDraft, setLlmProviderDraft] = useState<string | null>(null);
  const [embeddingModelDraft, setEmbeddingModelDraft] = useState<string | null>(null);
  const [systemPromptDraft, setSystemPromptDraft] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const aiQuery = useQuery({
    queryKey: ["settings", "ai"],
    queryFn: settingsApi.getAiSettings,
    retry: 1,
  });

  const workspaceQuery = useQuery({
    queryKey: ["settings", "workspace"],
    queryFn: settingsApi.getWorkspaceSettings,
    retry: 1,
  });

  const billingQuery = useQuery({
    queryKey: ["settings", "billing"],
    queryFn: settingsApi.getBillingSettings,
    retry: 1,
  });

  const updateAiMutation = useMutation({
    mutationFn: settingsApi.updateAiSettings,
    onSuccess: async (data) => {
      queryClient.setQueryData(["settings", "ai"], data);
      setAutoReplyEnabledDraft(null);
      setConfidenceThresholdDraft(null);
      setLlmProviderDraft(null);
      setEmbeddingModelDraft(null);
      setSystemPromptDraft(null);
      setNotice("AI-настройки сохранены. Новые ответы будут использовать этот tenant-конфиг.");
      await queryClient.invalidateQueries({ queryKey: ["settings", "ai"] });
    },
    onError: (error) => {
      setNotice(getApiErrorMessage(error, "Не удалось сохранить AI-настройки."));
    },
  });

  const updateWorkspaceMutation = useMutation({
    mutationFn: settingsApi.updateWorkspaceSettings,
    onSuccess: async (data) => {
      queryClient.setQueryData(["settings", "workspace"], data);
      setWorkspaceNameDraft(null);
      setNotice("Название компании обновлено.");
      await queryClient.invalidateQueries({ queryKey: ["settings", "workspace"] });
    },
    onError: (error) => {
      setNotice(getApiErrorMessage(error, "Не удалось сохранить компанию."));
    },
  });

  function handleAiSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    updateAiMutation.mutate({
      auto_reply_enabled: autoReplyEnabled,
      confidence_threshold: confidenceThreshold,
      llm_provider: llmProvider,
      embedding_model: embeddingModel.trim(),
      system_prompt: systemPrompt,
    });
  }

  function handleWorkspaceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = workspaceName.trim();
    if (!trimmedName) {
      setNotice("Название компании не может быть пустым.");
      return;
    }
    setNotice(null);
    updateWorkspaceMutation.mutate({ name: trimmedName });
  }

  async function refreshAll() {
    setNotice(null);
    await Promise.all([
      aiQuery.refetch(),
      workspaceQuery.refetch(),
      billingQuery.refetch(),
    ]);
  }

  const isPageLoading = aiQuery.isLoading || workspaceQuery.isLoading || billingQuery.isLoading;
  const pageError = aiQuery.error ?? workspaceQuery.error ?? billingQuery.error;
  const isSaving = updateAiMutation.isPending || updateWorkspaceMutation.isPending;
  const aiSettings = aiQuery.data;
  const billing = billingQuery.data;
  const workspace = workspaceQuery.data;
  const workspaceName = workspaceNameDraft ?? workspace?.name ?? "";
  const autoReplyEnabled = autoReplyEnabledDraft ?? aiSettings?.auto_reply_enabled ?? false;
  const confidenceThreshold = confidenceThresholdDraft ?? aiSettings?.confidence_threshold ?? 80;
  const llmProvider = llmProviderDraft ?? aiSettings?.llm_provider ?? "mock";
  const embeddingModel = embeddingModelDraft ?? aiSettings?.embedding_model ?? "multilingual-e5-large";
  const systemPrompt = systemPromptDraft ?? aiSettings?.system_prompt ?? "";
  const availableProviders = aiQuery.data?.available_providers?.length
    ? aiQuery.data.available_providers
    : ["mock", "openai-compatible", "unirouter"];

  return (
    <AppShell
      title="Настройки"
      description="Компания, AI-поведение, автоответы и тарифы теперь читаются из backend API."
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-5">
          <div className="glass-card rounded-[1.75rem] p-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.22em] text-orange-600">
                  task_207
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight">Живые настройки tenant</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
                  Эта страница работает через `GET/PUT /api/v1/settings/*`: можно включить
                  автоответы, выбрать UniRouter/OpenAI-compatible provider и обновить название компании.
                </p>
              </div>
              <button
                type="button"
                onClick={refreshAll}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                {aiQuery.isFetching || workspaceQuery.isFetching || billingQuery.isFetching ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <RefreshCw size={16} />
                )}
                Обновить
              </button>
            </div>

            {isPageLoading ? (
              <StateCard
                className="mt-6"
                icon={<Loader2 className="animate-spin" size={18} />}
                title="Загружаем настройки"
                description="Запрашиваем AI, компанию и тариф из backend."
              />
            ) : pageError ? (
              <StateCard
                className="mt-6"
                icon={<AlertCircle size={18} />}
                title="Не удалось загрузить настройки"
                description={getApiErrorMessage(pageError, "Проверь авторизацию и доступность backend.")}
                tone="error"
              />
            ) : null}

            {notice ? (
              <p className="mt-6 rounded-2xl bg-white p-4 text-sm font-semibold text-neutral-700 shadow-sm">
                {notice}
              </p>
            ) : null}
          </div>

          <form onSubmit={handleAiSubmit} className="glass-card rounded-[1.75rem] p-6">
            <SectionHeader
              icon={<Bot size={22} />}
              title="Поведение AI"
              description="TenantAIConfig влияет на `/ml/answer`, Telegram webhook и knowledge playground."
            />

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <label className="block text-sm font-bold">
                LLM provider
                <select
                  value={llmProvider}
                  onChange={(event) => setLlmProviderDraft(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  disabled={isSaving || aiQuery.isLoading}
                >
                  {availableProviders.map((provider) => (
                    <option key={provider} value={provider}>
                      {providerLabel(provider)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-bold">
                Embedding model
                <input
                  value={embeddingModel}
                  onChange={(event) => setEmbeddingModelDraft(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  disabled={isSaving || aiQuery.isLoading}
                />
              </label>
            </div>

            <div className="mt-5 rounded-3xl border border-orange-200 bg-orange-50 p-5">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <div className="flex items-center gap-2 text-sm font-black text-orange-700">
                    <SlidersHorizontal size={16} />
                    Автоответы
                  </div>
                  <p className="mt-1 text-sm leading-6 text-neutral-600">
                    Безопасный режим: AI отвечает автоматически только при наличии контекста и
                    confidence выше порога.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoReplyEnabledDraft(!autoReplyEnabled)}
                  className={`inline-flex min-w-36 items-center justify-center rounded-full px-4 py-2 text-sm font-black transition ${
                    autoReplyEnabled
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-neutral-700 shadow-sm"
                  }`}
                >
                  {autoReplyEnabled ? "Включены" : "Выключены"}
                </button>
              </div>

              <label className="mt-5 block text-sm font-bold">
                Порог уверенности: {confidenceThreshold}%
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={confidenceThreshold}
                  onChange={(event) => setConfidenceThresholdDraft(Number(event.target.value))}
                  className="mt-3 w-full accent-orange-500"
                  disabled={isSaving || aiQuery.isLoading}
                />
              </label>
            </div>

            <label className="mt-5 block text-sm font-bold">
              System prompt
              <textarea
                value={systemPrompt}
                onChange={(event) => setSystemPromptDraft(event.target.value)}
                className="mt-2 min-h-40 w-full resize-none rounded-3xl border border-black/10 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                placeholder="Например: отвечай кратко, не выдумывай цены, если данных нет — эскалируй менеджеру."
                disabled={isSaving || aiQuery.isLoading}
              />
            </label>

            <button
              type="submit"
              disabled={isSaving || aiQuery.isLoading}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-black text-white shadow-xl shadow-black/10 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {updateAiMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Сохранить AI-настройки
            </button>
          </form>

          <form onSubmit={handleWorkspaceSubmit} className="glass-card rounded-[1.75rem] p-6">
            <SectionHeader
              icon={<Building2 size={22} />}
              title="Компания"
              description="Название берется из Tenant и используется в профиле ассистента."
            />

            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto]">
              <label className="block text-sm font-bold">
                Название компании
                <input
                  value={workspaceName}
                  onChange={(event) => setWorkspaceNameDraft(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  disabled={updateWorkspaceMutation.isPending || workspaceQuery.isLoading}
                />
              </label>
              <button
                type="submit"
                disabled={updateWorkspaceMutation.isPending || workspaceQuery.isLoading}
                className="self-end rounded-2xl bg-black px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updateWorkspaceMutation.isPending ? "Сохраняем..." : "Сохранить"}
              </button>
            </div>

            <div className="mt-5 grid gap-3 text-sm md:grid-cols-3">
              <InfoTile label="Workspace ID" value={workspace?.id ?? "—"} />
              <InfoTile label="Slug" value={workspace?.slug ?? "—"} />
              <InfoTile label="Статус" value={workspace?.status ?? "—"} />
            </div>
          </form>
        </section>

        <aside className="space-y-5">
          <div className="glass-card rounded-[1.75rem] p-6">
            <SectionHeader
              icon={<CreditCard size={22} />}
              title="Тариф и лимиты"
              description="Данные приходят из Subscription, Plan и UsageCounter."
            />
            <div className="mt-5 space-y-3">
              <InfoRow label="План" value={billing?.plan_name ?? "Trial"} />
              <InfoRow label="Статус" value={billing?.subscription_status ?? "trial"} />
              <InfoRow label="Диалоги" value={`${billing?.dialogs_used ?? 0} / ${billing?.dialogs_limit ?? 0}`} />
              <InfoRow label="AI-ответы" value={String(billing?.ai_replies_used ?? 0)} />
              <InfoRow label="Лимит каналов" value={String(billing?.channel_limit ?? 0)} />
            </div>
          </div>

          <div className="rounded-[1.75rem] bg-black p-6 text-white">
            <h2 className="text-xl font-black">UniRouter готов к включению</h2>
            <p className="mt-3 text-sm leading-6 text-white/60">
              На backend теперь есть provider `unirouter`. Чтобы он реально отвечал, нужны env:
              `OPENAI_COMPATIBLE_BASE_URL`, `OPENAI_COMPATIBLE_API_KEY` и `OPENAI_COMPATIBLE_MODEL`.
            </p>
            <div className="mt-5 rounded-2xl bg-white/10 p-4 text-sm">
              <p className="font-black">Текущий provider</p>
              <p className="mt-1 text-white/70">{providerLabel(llmProvider)}</p>
            </div>
          </div>

          <div className="glass-card rounded-[1.75rem] p-6">
            <SectionHeader
              icon={<UsersRound size={22} />}
              title="Команда"
              description="Список пользователей подключим на следующем проходе настроек."
            />
            <p className="mt-4 text-sm leading-6 text-neutral-600">
              Backend уже отдает `GET /api/v1/users`, поэтому этот блок готов к расширению без
              изменения серверного контракта.
            </p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm">
        {icon}
      </span>
      <div>
        <h2 className="text-xl font-black">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-neutral-500">{description}</p>
      </div>
    </div>
  );
}

function StateCard({
  icon,
  title,
  description,
  tone = "neutral",
  className = "",
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  tone?: "neutral" | "error";
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border p-5 ${
        tone === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-black/10 bg-white text-neutral-600"
      } ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
          {icon}
        </span>
        <div>
          <p className="font-black">{title}</p>
          {description ? <p className="mt-1 text-sm leading-6 opacity-75">{description}</p> : null}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-black/5 pb-3 last:border-0">
      <span className="text-neutral-500">{label}</span>
      <span className="text-right font-bold">{value}</span>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-400">{label}</p>
      <p className="mt-2 truncate font-bold">{value}</p>
    </div>
  );
}

function providerLabel(provider: string) {
  switch (provider) {
    case "mock":
      return "mock";
    case "openai-compatible":
      return "OpenAI-compatible";
    case "unirouter":
      return "UniRouter";
    default:
      return provider;
  }
}
