"use client";

import {
  Activity,
  AlertCircle,
  Bot,
  Building2,
  CreditCard,
  Database,
  Loader2,
  Mail,
  RefreshCw,
  Save,
  Send,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AppShell } from "@/components/layout/app-shell";
import { StateCard } from "@/components/ui/state-card";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { IntegrationProbeResponse } from "@/lib/api/generated/ai.schemas";
import { integrationsApi } from "@/lib/api/integrations";
import { settingsApi } from "@/lib/api/settings";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [workspaceNameDraft, setWorkspaceNameDraft] = useState<string | null>(
    null,
  );
  const [autoReplyEnabledDraft, setAutoReplyEnabledDraft] = useState<
    boolean | null
  >(null);
  const [confidenceThresholdDraft, setConfidenceThresholdDraft] = useState<
    number | null
  >(null);
  const [llmProviderDraft, setLlmProviderDraft] = useState<string | null>(null);
  const [embeddingModelDraft, setEmbeddingModelDraft] = useState<string | null>(
    null,
  );
  const [systemPromptDraft, setSystemPromptDraft] = useState<string | null>(
    null,
  );
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

  const integrationsHealthQuery = useQuery({
    queryKey: ["integrations", "health"],
    queryFn: integrationsApi.getHealth,
    retry: 1,
  });

  const probeLlmMutation = useMutation({
    mutationFn: integrationsApi.probeLlm,
    onSuccess: async () => {
      setNotice("LLM probe выполнен. Обновляем статусы интеграций.");
      await integrationsHealthQuery.refetch();
    },
    onError: (error) => {
      setNotice(getApiErrorMessage(error, "Не удалось проверить LLM."));
    },
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
      setNotice("AI-настройки сохранены. Они применятся к новым ответам.");
      await queryClient.invalidateQueries({ queryKey: ["settings", "ai"] });
    },
    onError: (error) => {
      setNotice(
        getApiErrorMessage(error, "Не удалось сохранить AI-настройки."),
      );
    },
  });

  const updateWorkspaceMutation = useMutation({
    mutationFn: settingsApi.updateWorkspaceSettings,
    onSuccess: async (data) => {
      queryClient.setQueryData(["settings", "workspace"], data);
      setWorkspaceNameDraft(null);
      setNotice("Название компании обновлено.");
      await queryClient.invalidateQueries({
        queryKey: ["settings", "workspace"],
      });
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
      integrationsHealthQuery.refetch(),
    ]);
  }

  const isPageLoading =
    aiQuery.isLoading || workspaceQuery.isLoading || billingQuery.isLoading;
  const pageError = aiQuery.error ?? workspaceQuery.error ?? billingQuery.error;
  const isSaving =
    updateAiMutation.isPending || updateWorkspaceMutation.isPending;
  const aiSettings = aiQuery.data;
  const billing = billingQuery.data;
  const integrationsHealth = integrationsHealthQuery.data;
  const workspace = workspaceQuery.data;
  const workspaceName = workspaceNameDraft ?? workspace?.name ?? "";
  const autoReplyEnabled =
    autoReplyEnabledDraft ?? aiSettings?.auto_reply_enabled ?? false;
  const confidenceThreshold =
    confidenceThresholdDraft ?? aiSettings?.confidence_threshold ?? 80;
  const llmProvider = llmProviderDraft ?? aiSettings?.llm_provider ?? "mock";
  const embeddingModel =
    embeddingModelDraft ??
    aiSettings?.embedding_model ??
    "multilingual-e5-large";
  const systemPrompt = systemPromptDraft ?? aiSettings?.system_prompt ?? "";
  const availableProviders = aiQuery.data?.available_providers?.length
    ? aiQuery.data.available_providers
    : ["mock", "openai-compatible", "unirouter"];

  /* Значения тарифа для крупной метрики и полосы расхода диалогов. */
  const dialogsUsed = billing?.dialogs_used ?? 0;
  const dialogsLimit = billing?.dialogs_limit ?? 0;
  const dialogsPercent =
    dialogsLimit > 0
      ? Math.min(100, Math.round((dialogsUsed / dialogsLimit) * 100))
      : 0;

  return (
    <AppShell
      title="Настройки"
      description="Управление компанией, поведением AI и состоянием интеграций."
    >
      <div className="mx-auto max-w-5xl space-y-5 sm:space-y-6">
        {/* Шапка экрана: назначение настроек, общее обновление данных, статусы загрузки. */}
        <section className="panel overflow-hidden">
          <div className="soft-grid flex flex-col justify-between gap-4 border-b border-line bg-mist p-5 sm:p-6 md:flex-row md:items-start">
            <div className="min-w-0">
              <span className="brand-kicker">
                <Building2 size={16} aria-hidden="true" />
                Рабочее пространство
              </span>
              <h2 className="mt-2 text-balance font-display text-xl font-extrabold tracking-[-0.04em] sm:text-2xl">
                Настройки ассистента
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Настрой поведение AI, название компании и проверь готовность
                сервисов перед запуском автоответов.
              </p>
            </div>
            <button
              type="button"
              onClick={refreshAll}
              className="btn btn-secondary btn-sm shrink-0"
            >
              {aiQuery.isFetching ||
              workspaceQuery.isFetching ||
              billingQuery.isFetching ||
              integrationsHealthQuery.isFetching ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
              Обновить
            </button>
          </div>

          {isPageLoading ? (
            <div className="p-5 sm:p-6">
              <StateCard
                variant="loading"
                title="Загружаем настройки"
                description="Загружаем AI, компанию и тариф."
              />
            </div>
          ) : pageError ? (
            <div className="p-5 sm:p-6">
              <StateCard
                variant="error"
                icon={<AlertCircle size={22} />}
                title="Не удалось загрузить настройки"
                description={getApiErrorMessage(
                  pageError,
                  "Обнови страницу или повтори попытку позже.",
                )}
              />
            </div>
          ) : null}

          {notice ? (
            <div className="border-t border-line p-5 sm:p-6">
              <p role="status" className="notice notice-brand font-semibold">
                {notice}
              </p>
            </div>
          ) : null}
        </section>

        {/* Поведение AI: модель, порог автоответа и инструкция ассистента. */}
        <SettingsSection
          onSubmit={handleAiSubmit}
          icon={<Bot size={22} />}
          kicker="Ассистент"
          title="Поведение AI"
          description="Эти параметры определяют стиль ответа и условия автоматической отправки."
          footer={
            <button
              type="submit"
              disabled={isSaving || aiQuery.isLoading}
              className="btn btn-primary"
            >
              {updateAiMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Сохранить AI-настройки
            </button>
          }
        >
          <SettingRow
            htmlFor="settings-llm-provider"
            label="Модель ответов"
            control={
              <select
                id="settings-llm-provider"
                value={llmProvider}
                onChange={(event) => setLlmProviderDraft(event.target.value)}
                className="field text-sm"
                disabled={isSaving || aiQuery.isLoading}
              >
                {availableProviders.map((provider) => (
                  <option key={provider} value={provider}>
                    {providerLabel(provider)}
                  </option>
                ))}
              </select>
            }
          />

          <div className="divider" />

          <SettingRow
            htmlFor="settings-embedding-model"
            label="Модель поиска по знаниям"
            control={
              <input
                id="settings-embedding-model"
                value={embeddingModel}
                onChange={(event) => setEmbeddingModelDraft(event.target.value)}
                className="field text-sm"
                disabled={isSaving || aiQuery.isLoading}
              />
            }
          />

          <div className="divider" />

          <SettingRow
            labelId="settings-auto-reply-label"
            hintId="settings-auto-reply-hint"
            label={
              <>
                <SlidersHorizontal
                  size={16}
                  className="mr-2 inline-block align-[-3px] text-brand"
                  aria-hidden="true"
                />
                Автоответы
              </>
            }
            hint="Безопасный режим: AI отвечает автоматически только при наличии контекста и confidence выше порога."
            control={
              /* Подпись строки — не <label>, поэтому связываем её с переключателем
                 явно: без этого скринридер читает только «Выключены». */
              <button
                type="button"
                role="switch"
                aria-checked={autoReplyEnabled}
                aria-labelledby="settings-auto-reply-label"
                aria-describedby="settings-auto-reply-hint"
                onClick={() => setAutoReplyEnabledDraft(!autoReplyEnabled)}
                className="inline-flex min-h-10 items-center gap-3 rounded-md py-1 font-display text-sm font-bold transition"
              >
                <span
                  aria-hidden="true"
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border p-[2px] transition-colors ${
                    autoReplyEnabled
                      ? "border-brand bg-brand"
                      : "border-line bg-surface"
                  }`}
                >
                  <span
                    className={`size-[18px] rounded-full bg-white shadow-soft transition-transform duration-200 ${
                      autoReplyEnabled ? "translate-x-[20px]" : "translate-x-0"
                    }`}
                  />
                </span>
                <span
                  className={
                    autoReplyEnabled ? "text-brand-dark" : "text-muted"
                  }
                >
                  {autoReplyEnabled ? "Включены" : "Выключены"}
                </span>
              </button>
            }
          />

          <div className="divider" />

          {/* Порог автоответа: текущее значение крупным синим числом. */}
          <div className="py-5">
            <label
              htmlFor="settings-confidence-threshold"
              className="field-label"
            >
              Порог уверенности:{" "}
              <span className="font-display text-3xl font-extrabold tabular-nums tracking-[-0.04em] text-brand">
                {confidenceThreshold}%
              </span>
            </label>
            <input
              id="settings-confidence-threshold"
              type="range"
              min={0}
              max={100}
              value={confidenceThreshold}
              onChange={(event) =>
                setConfidenceThresholdDraft(Number(event.target.value))
              }
              className="mt-2 h-10 w-full accent-brand [&::-webkit-slider-thumb]:size-6"
              disabled={isSaving || aiQuery.isLoading}
            />
            <div
              className="micro-label mt-1 flex items-center justify-between tabular-nums"
              aria-hidden="true"
            >
              <span>0%</span>
              <span>100%</span>
            </div>
            <p className="field-hint">
              Если уверенность модели выше порога, ответ уходит клиенту
              автоматически.
            </p>
          </div>

          <div className="divider" />

          <div className="py-5">
            <label htmlFor="settings-system-prompt" className="field-label">
              Инструкция для ассистента
            </label>
            <textarea
              id="settings-system-prompt"
              rows={7}
              value={systemPrompt}
              onChange={(event) => setSystemPromptDraft(event.target.value)}
              className="field text-sm"
              placeholder="Например: отвечай кратко, не выдумывай цены, если данных нет — эскалируй менеджеру."
              disabled={isSaving || aiQuery.isLoading}
            />
            <p className="field-hint">
              Инструкция применяется ко всем новым ответам ассистента.
            </p>
          </div>

          <div className="divider" />

          {/* Итог выбора модели — виден до сохранения формы. */}
          <div className="py-5">
            <div className="soft-panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-5 sm:p-6">
              <span className="icon-badge shrink-0" aria-hidden="true">
                <Bot size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-base font-extrabold tracking-[-0.02em]">
                  Модель для новых ответов
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-muted">
                  После сохранения выбранная модель будет использоваться в новых
                  диалогах и при проверке базы знаний.
                </p>
              </div>
              <div className="min-w-0 shrink-0 rounded-md border border-line bg-white px-4 py-3 sm:w-52">
                <p className="micro-label">Текущая модель</p>
                <p className="mt-1 truncate font-display text-sm font-extrabold tracking-[-0.02em] text-brand">
                  {providerLabel(llmProvider)}
                </p>
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* Компания: название и технические идентификаторы пространства. */}
        <SettingsSection
          onSubmit={handleWorkspaceSubmit}
          icon={<Building2 size={22} />}
          kicker="Рабочее пространство"
          title="Компания"
          description="Название используется в кабинете и профиле ассистента."
          footer={
            <button
              type="submit"
              disabled={
                updateWorkspaceMutation.isPending || workspaceQuery.isLoading
              }
              className="btn btn-primary"
            >
              {updateWorkspaceMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {updateWorkspaceMutation.isPending ? "Сохраняем..." : "Сохранить"}
            </button>
          }
        >
          <SettingRow
            htmlFor="settings-workspace-name"
            label="Название компании"
            control={
              <input
                id="settings-workspace-name"
                value={workspaceName}
                onChange={(event) => setWorkspaceNameDraft(event.target.value)}
                className="field text-sm"
                disabled={
                  updateWorkspaceMutation.isPending || workspaceQuery.isLoading
                }
              />
            }
          />

          <div className="divider" />

          <div className="grid gap-3 py-5 sm:grid-cols-3">
            <InfoTile label="Workspace ID" value={workspace?.id ?? "—"} />
            <InfoTile label="Slug" value={workspace?.slug ?? "—"} />
            <InfoTile label="Статус" value={workspace?.status ?? "—"} />
          </div>
        </SettingsSection>

        {/* Тариф: план и расход диалогов вынесены в акцентную синюю панель. */}
        <section className="blue-panel overflow-hidden">
          <div className="border-b border-white/15 p-5 sm:p-6">
            <span className="section-kicker section-kicker-inverse">
              <CreditCard size={16} aria-hidden="true" />
              Биллинг
            </span>
            <h2 className="mt-2 font-display text-xl font-extrabold tracking-[-0.04em] sm:text-2xl">
              Тариф и лимиты
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-on-brand-strong">
              Данные приходят из Subscription, Plan и UsageCounter.
            </p>
          </div>

          <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-2">
            <div className="min-w-0 rounded-md bg-white/10 p-5 sm:p-6">
              {/* Модификатор ! обязателен: .micro-label объявлен вне каскадных
                  слоёв и иначе перебивает утилиту своим тёмным var(--faint).
                  Здесь -strong, а не -on-brand: подложка bg-white/10 осветляет
                  синий, и на ней #dbe6ff даёт ~4.2:1 вместо нужных 4.5:1. */}
              <p className="micro-label text-on-brand-strong!">План</p>
              <p className="mt-2 truncate font-display text-2xl font-extrabold tracking-[-0.04em]">
                {billing?.plan_name ?? "Trial"}
              </p>
            </div>

            <div className="min-w-0 rounded-md bg-white/10 p-5 sm:p-6">
              <p className="micro-label text-on-brand-strong!">Диалоги</p>
              <p className="mt-2 truncate font-display text-2xl font-extrabold tabular-nums tracking-[-0.04em]">
                {`${dialogsUsed} / ${dialogsLimit}`}
              </p>
              <span
                className="mt-3 block h-2 w-full overflow-hidden rounded-full bg-white/20"
                aria-hidden="true"
              >
                <span
                  className="block h-full rounded-full bg-white transition-all duration-500 motion-reduce:transition-none"
                  style={{ width: `${dialogsPercent}%` }}
                />
              </span>
            </div>
          </div>

          <div className="grid divide-y divide-white/15 border-t border-white/15 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <BillingStat
              label="Статус"
              value={billing?.subscription_status ?? "trial"}
            />
            <BillingStat
              label="AI-ответы"
              value={String(billing?.ai_replies_used ?? 0)}
            />
            <BillingStat
              label="Лимит каналов"
              value={String(billing?.channel_limit ?? 0)}
            />
          </div>
        </section>

        <div className="grid items-start gap-5 sm:gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          {/* Диагностика: состояние внешних сервисов и ручная проверка модели. */}
          <SettingsSection
            padded
            icon={<Activity size={22} />}
            kicker="Интеграции"
            title="Диагностика интеграций"
            description="Проверка модели, базы знаний, почты и Telegram."
            footer={
              <button
                type="button"
                onClick={() => {
                  setNotice(null);
                  probeLlmMutation.mutate();
                }}
                disabled={probeLlmMutation.isPending}
                className="btn btn-secondary"
              >
                {probeLlmMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Bot size={16} />
                )}
                Проверить модель ответов
              </button>
            }
          >
            {integrationsHealthQuery.error ? (
              <StateCard
                variant="error"
                icon={<AlertCircle size={22} />}
                title="Не удалось проверить сервисы"
                description={getApiErrorMessage(
                  integrationsHealthQuery.error,
                  "Обнови страницу или повтори попытку позже.",
                )}
                className="mb-4"
              />
            ) : null}

            <ul className="space-y-3">
              <li>
                <IntegrationStatusCard
                  icon={<Bot size={20} />}
                  probe={integrationsHealth?.llm}
                  fallbackName="LLM"
                />
              </li>
              <li>
                <IntegrationStatusCard
                  icon={<Database size={20} />}
                  probe={integrationsHealth?.qdrant}
                  fallbackName="Qdrant"
                />
              </li>
              <li>
                <IntegrationStatusCard
                  icon={<Mail size={20} />}
                  probe={integrationsHealth?.email}
                  fallbackName="Email"
                />
              </li>
              <li>
                <IntegrationStatusCard
                  icon={<Send size={20} />}
                  probe={integrationsHealth?.telegram}
                  fallbackName="Telegram"
                />
              </li>
            </ul>

            {probeLlmMutation.data ? (
              <ProbeDetails probe={probeLlmMutation.data} />
            ) : null}
          </SettingsSection>

          {/* Команда: раздел-заглушка до появления управления доступом. */}
          <SettingsSection
            padded
            icon={<UsersRound size={22} />}
            kicker="Доступ"
            title="Команда"
            description="Управление доступом появится в одном из следующих обновлений."
          >
            <div className="soft-panel flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
              <span className="icon-badge shrink-0" aria-hidden="true">
                <UsersRound size={22} />
              </span>
              <p className="min-w-0 flex-1 text-sm leading-6 text-muted">
                Сейчас здесь отображается только информация о владельце. Состав
                команды пока нельзя менять в кабинете.
              </p>
            </div>
          </SettingsSection>
        </div>
      </div>
    </AppShell>
  );
}

/** Секция настроек: шапка с кикером, тело со строками и футер с сохранением. */
function SettingsSection({
  icon,
  kicker,
  title,
  description,
  action,
  footer,
  padded = false,
  onSubmit,
  children,
}: {
  icon: ReactNode;
  kicker: string;
  title: string;
  description: string;
  action?: ReactNode;
  footer?: ReactNode;
  padded?: boolean;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}) {
  const header = (
    <div className="flex flex-col gap-4 border-b border-line p-5 sm:p-6 md:flex-row md:items-start md:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <span className="icon-badge shrink-0" aria-hidden="true">
          {icon}
        </span>
        <div className="min-w-0">
          <span className="section-kicker">{kicker}</span>
          <h2 className="mt-1.5 text-balance font-display text-xl font-extrabold tracking-[-0.04em] sm:text-2xl">
            {title}
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted">
            {description}
          </p>
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );

  /* Без padded вертикальный ритм задают сами строки (py-5), поэтому
     панельный p-5 sm:p-6 добираем только горизонтально. */
  const body = (
    <div className={`px-5 sm:px-6 ${padded ? "py-5 sm:py-6" : ""}`}>
      {children}
    </div>
  );

  const foot = footer ? (
    <div className="flex flex-wrap justify-end gap-3 border-t border-line bg-mist px-5 py-4 sm:px-6">
      {footer}
    </div>
  ) : null;

  if (onSubmit) {
    return (
      <form onSubmit={onSubmit} className="panel overflow-hidden">
        {header}
        {body}
        {foot}
      </form>
    );
  }

  return (
    <section className="panel overflow-hidden">
      {header}
      {body}
      {foot}
    </section>
  );
}

/** Строка настройки: подпись и пояснение слева, контрол справа. */
function SettingRow({
  label,
  hint,
  htmlFor,
  labelId,
  hintId,
  control,
}: {
  label: ReactNode;
  hint?: string;
  htmlFor?: string;
  /** Для контролов без <label>: id подписи и подсказки под aria-labelledby/-describedby. */
  labelId?: string;
  hintId?: string;
  control: ReactNode;
}) {
  return (
    <div className="grid gap-2 py-5 md:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] md:items-center md:gap-8">
      <div className="min-w-0">
        {htmlFor ? (
          <label htmlFor={htmlFor} id={labelId} className="field-label">
            {label}
          </label>
        ) : (
          <span id={labelId} className="field-label">
            {label}
          </span>
        )}
        {hint ? (
          <p id={hintId} className="field-hint max-w-xl">
            {hint}
          </p>
        ) : null}
      </div>
      <div className="min-w-0">{control}</div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="soft-panel min-w-0 p-5 sm:p-6">
      <p className="micro-label">{label}</p>
      <p
        title={value}
        className="mt-1.5 truncate font-display text-sm font-extrabold tracking-[-0.02em]"
      >
        {value}
      </p>
    </div>
  );
}

function BillingStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-5 py-4 sm:px-6">
      {/* text-on-brand! — .micro-label вне каскадных слоёв перебивает утилиту цвета. */}
      <p className="micro-label text-on-brand!">{label}</p>
      <p className="mt-1 truncate font-display text-base font-extrabold tabular-nums tracking-[-0.02em]">
        {value}
      </p>
    </div>
  );
}

function IntegrationStatusCard({
  icon,
  probe,
  fallbackName,
}: {
  icon: ReactNode;
  probe?: IntegrationProbeResponse;
  fallbackName: string;
}) {
  const status = probe?.status ?? "disabled";

  return (
    <div className="card card-hover p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="icon-badge shrink-0" aria-hidden="true">
            {icon}
          </span>
          <div className="min-w-0">
            <p className="font-display text-[15px] font-extrabold tracking-[-0.02em]">
              {probe?.name ?? fallbackName}
            </p>
            <p className="mt-1 text-sm leading-5 text-muted">
              {probe?.message ?? "Статус еще не загружен."}
            </p>
          </div>
        </div>
        <span className={`chip shrink-0 ${statusChipClass(status)}`}>
          {statusLabel(status)}
        </span>
      </div>
    </div>
  );
}

function ProbeDetails({ probe }: { probe: IntegrationProbeResponse }) {
  const details = probe.details ?? {};
  const detailRows = Object.entries(details).map(([key, value]) => [
    key,
    typeof value === "string" ? value : JSON.stringify(value),
  ]);

  return (
    <div className="soft-panel mt-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-base font-extrabold tracking-[-0.02em]">
          Результат проверки
        </h3>
        <span className={`chip ${statusChipClass(probe.status)}`}>
          {statusLabel(probe.status)}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted">{probe.message}</p>
      {detailRows.length ? (
        <dl className="mt-4 border-t border-line">
          {detailRows.map(([key, value]) => (
            <div
              key={key}
              className="grid gap-1 border-b border-line py-2.5 last:border-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:gap-4"
            >
              <dt className="micro-label min-w-0 truncate">{key}</dt>
              <dd className="min-w-0 break-words text-sm font-semibold text-ink">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

function statusLabel(status: string) {
  switch (status) {
    case "ok":
      return "OK";
    case "not_configured":
      return "Не настроено";
    case "error":
      return "Ошибка";
    case "disabled":
      return "Отключено";
    default:
      return status;
  }
}

function statusChipClass(status: string) {
  switch (status) {
    case "ok":
      return "chip-green";
    case "not_configured":
      return "chip-amber";
    case "error":
      return "chip-red";
    case "disabled":
      return "chip-grey";
    default:
      return "chip-blue";
  }
}

function providerLabel(provider: string) {
  switch (provider) {
    case "mock":
      return "Демонстрационная модель";
    case "openai-compatible":
      return "OpenAI-compatible";
    case "unirouter":
      return "UniRouter";
    default:
      return provider;
  }
}
