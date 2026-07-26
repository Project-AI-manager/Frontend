"use client";

import { RefreshCw } from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AppShell } from "@/components/layout/app-shell";
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
  const isRefreshing =
    aiQuery.isFetching ||
    workspaceQuery.isFetching ||
    billingQuery.isFetching ||
    integrationsHealthQuery.isFetching;
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

  /* Значения тарифа для метрики и полосы расхода диалогов. */
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
      <div className="mx-auto max-w-5xl space-y-4 sm:space-y-5">
        {/* Шапка экрана: назначение настроек, общее обновление данных, статусы загрузки. */}
        <section className="wf-box p-4 sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="wf-kicker">Рабочее пространство</p>
              <h2 className="wf-title mt-1 text-balance">
                Настройки ассистента
              </h2>
              <p className="wf-muted mt-1.5 max-w-3xl text-sm leading-6">
                Настрой поведение AI, название компании и проверь готовность
                сервисов перед запуском автоответов.
              </p>
            </div>
            <button
              type="button"
              onClick={refreshAll}
              className="wf-btn shrink-0"
            >
              <RefreshCw size={18} className="text-muted" />
              {isRefreshing ? "Обновляем..." : "Обновить"}
            </button>
          </div>

          {isPageLoading ? (
            <LoadingRows
              className="mt-4"
              label="Загружаем настройки"
              description="Загружаем AI, компанию и тариф."
              rows={3}
            />
          ) : pageError ? (
            <div role="alert" className="wf-fill mt-4 p-4">
              <p className="text-sm font-semibold">
                Не удалось загрузить настройки
              </p>
              <p className="wf-muted mt-1 text-sm leading-6">
                {getApiErrorMessage(
                  pageError,
                  "Обнови страницу или повтори попытку позже.",
                )}
              </p>
            </div>
          ) : null}

          {notice ? (
            <p
              role="status"
              className="wf-fill mt-4 break-words px-3 py-2 text-sm leading-6"
            >
              {notice}
            </p>
          ) : null}
        </section>

        {/* Поведение AI: модель, порог автоответа и инструкция ассистента. */}
        <SettingsSection
          onSubmit={handleAiSubmit}
          kicker="Ассистент"
          title="Поведение AI"
          description="Эти параметры определяют стиль ответа и условия автоматической отправки."
          footer={
            <button
              type="submit"
              disabled={isSaving || aiQuery.isLoading}
              className="wf-btn wf-btn-primary"
            >
              {updateAiMutation.isPending
                ? "Сохраняем..."
                : "Сохранить AI-настройки"}
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
                className="wf-field text-sm"
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

          <div className="wf-divider" />

          <SettingRow
            htmlFor="settings-embedding-model"
            label="Модель поиска по знаниям"
            control={
              <input
                id="settings-embedding-model"
                value={embeddingModel}
                onChange={(event) => setEmbeddingModelDraft(event.target.value)}
                className="wf-field text-sm"
                disabled={isSaving || aiQuery.isLoading}
              />
            }
          />

          <div className="wf-divider" />

          <SettingRow
            labelId="settings-auto-reply-label"
            hintId="settings-auto-reply-hint"
            label="Автоответы"
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
                className="inline-flex min-h-10 items-center gap-3 text-sm"
              >
                <span
                  aria-hidden="true"
                  className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-line p-[2px] ${
                    autoReplyEnabled ? "bg-ink" : "bg-fill"
                  }`}
                >
                  <span
                    className={`size-[18px] rounded-full border border-line bg-white ${
                      autoReplyEnabled ? "translate-x-[18px]" : "translate-x-0"
                    }`}
                  />
                </span>
                <span className={autoReplyEnabled ? "font-medium" : "wf-muted"}>
                  {autoReplyEnabled ? "Включены" : "Выключены"}
                </span>
              </button>
            }
          />

          <div className="wf-divider" />

          {/* Порог автоответа: текущее значение рядом с подписью. */}
          <div className="py-3">
            <label htmlFor="settings-confidence-threshold" className="wf-label">
              Порог уверенности:{" "}
              <span className="font-semibold tabular-nums">
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
              className="mt-1 h-10 w-full accent-ink"
              disabled={isSaving || aiQuery.isLoading}
            />
            <div
              className="wf-muted flex items-center justify-between text-xs tabular-nums"
              aria-hidden="true"
            >
              <span>0%</span>
              <span>100%</span>
            </div>
            <p className="wf-hint">
              Если уверенность модели выше порога, ответ уходит клиенту
              автоматически.
            </p>
          </div>

          <div className="wf-divider" />

          <div className="py-3">
            <label htmlFor="settings-system-prompt" className="wf-label">
              Инструкция для ассистента
            </label>
            <textarea
              id="settings-system-prompt"
              rows={7}
              value={systemPrompt}
              onChange={(event) => setSystemPromptDraft(event.target.value)}
              className="wf-field text-sm"
              placeholder="Например: отвечай кратко, не выдумывай цены, если данных нет — эскалируй менеджеру."
              disabled={isSaving || aiQuery.isLoading}
            />
            <p className="wf-hint">
              Инструкция применяется ко всем новым ответам ассистента.
            </p>
          </div>

          <div className="wf-divider" />

          {/* Итог выбора модели — виден до сохранения формы. */}
          <div className="py-3">
            <div className="wf-fill flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold">
                  Модель для новых ответов
                </h3>
                <p className="wf-muted mt-1.5 text-sm leading-6">
                  После сохранения выбранная модель будет использоваться в новых
                  диалогах и при проверке базы знаний.
                </p>
              </div>
              <div className="wf-box min-w-0 shrink-0 p-3 sm:w-52">
                <p className="wf-kicker">Текущая модель</p>
                <p className="mt-1 truncate text-sm font-semibold">
                  {providerLabel(llmProvider)}
                </p>
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* Компания: название и технические идентификаторы пространства. */}
        <SettingsSection
          onSubmit={handleWorkspaceSubmit}
          kicker="Рабочее пространство"
          title="Компания"
          description="Название используется в кабинете и профиле ассистента."
          footer={
            <button
              type="submit"
              disabled={
                updateWorkspaceMutation.isPending || workspaceQuery.isLoading
              }
              className="wf-btn wf-btn-primary"
            >
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
                className="wf-field text-sm"
                disabled={
                  updateWorkspaceMutation.isPending || workspaceQuery.isLoading
                }
              />
            }
          />

          <div className="wf-divider" />

          <div className="grid gap-2 py-3 sm:grid-cols-3">
            <InfoTile label="Workspace ID" value={workspace?.id ?? "—"} />
            <InfoTile label="Slug" value={workspace?.slug ?? "—"} />
            <InfoTile label="Статус" value={workspace?.status ?? "—"} />
          </div>
        </SettingsSection>

        {/* Тариф: план и расход диалогов. */}
        <section className="wf-fill p-4 sm:p-5">
          <p className="wf-kicker">Биллинг</p>
          <h2 className="wf-title mt-1 text-balance">Тариф и лимиты</h2>
          <p className="wf-muted mt-1.5 max-w-3xl text-sm leading-6">
            Данные приходят из Subscription, Plan и UsageCounter.
          </p>

          <div className="mt-4 grid gap-2 md:grid-cols-2">
            <div className="wf-box min-w-0 p-3">
              <p className="wf-kicker">План</p>
              <p className="mt-1 truncate text-lg font-semibold">
                {billing?.plan_name ?? "Trial"}
              </p>
            </div>

            <div className="wf-box min-w-0 p-3">
              <p className="wf-kicker">Диалоги</p>
              <p className="mt-1 truncate text-lg font-semibold tabular-nums">
                {`${dialogsUsed} / ${dialogsLimit}`}
              </p>
              <span
                className="mt-2 block h-2 w-full overflow-hidden rounded-full border border-line bg-fill"
                aria-hidden="true"
              >
                <span
                  className="block h-full bg-ink"
                  style={{ width: `${dialogsPercent}%` }}
                />
              </span>
            </div>
          </div>

          <div className="mt-2 grid gap-2 sm:grid-cols-3">
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

        <div className="grid items-start gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          {/* Диагностика: состояние внешних сервисов и ручная проверка модели. */}
          <SettingsSection
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
                className="wf-btn"
              >
                {probeLlmMutation.isPending
                  ? "Проверяем..."
                  : "Проверить модель ответов"}
              </button>
            }
          >
            {integrationsHealthQuery.error ? (
              <div role="alert" className="wf-fill mb-3 p-4">
                <p className="text-sm font-semibold">
                  Не удалось проверить сервисы
                </p>
                <p className="wf-muted mt-1 text-sm leading-6">
                  {getApiErrorMessage(
                    integrationsHealthQuery.error,
                    "Обнови страницу или повтори попытку позже.",
                  )}
                </p>
              </div>
            ) : null}

            <ul className="space-y-2">
              <li>
                <IntegrationStatusCard
                  probe={integrationsHealth?.llm}
                  fallbackName="LLM"
                />
              </li>
              <li>
                <IntegrationStatusCard
                  probe={integrationsHealth?.qdrant}
                  fallbackName="Qdrant"
                />
              </li>
              <li>
                <IntegrationStatusCard
                  probe={integrationsHealth?.email}
                  fallbackName="Email"
                />
              </li>
              <li>
                <IntegrationStatusCard
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
            kicker="Доступ"
            title="Команда"
            description="Управление доступом появится в одном из следующих обновлений."
          >
            <p className="wf-fill wf-muted p-4 text-sm leading-6">
              Сейчас здесь отображается только информация о владельце. Состав
              команды пока нельзя менять в кабинете.
            </p>
          </SettingsSection>
        </div>
      </div>
    </AppShell>
  );
}

/** Секция настроек: шапка с кикером, тело со строками и футер с сохранением. */
function SettingsSection({
  kicker,
  title,
  description,
  action,
  footer,
  onSubmit,
  children,
}: {
  kicker: string;
  title: string;
  description: string;
  action?: ReactNode;
  footer?: ReactNode;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}) {
  const header = (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <p className="wf-kicker">{kicker}</p>
        <h2 className="wf-title mt-1 text-balance">{title}</h2>
        <p className="wf-muted mt-1.5 max-w-3xl text-sm leading-6">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );

  const body = (
    <>
      <div className="wf-divider my-4" />
      {children}
    </>
  );

  const foot = footer ? (
    <>
      <div className="wf-divider my-4" />
      <div className="flex flex-wrap justify-end gap-2">{footer}</div>
    </>
  ) : null;

  if (onSubmit) {
    return (
      <form onSubmit={onSubmit} className="wf-box p-4 sm:p-5">
        {header}
        {body}
        {foot}
      </form>
    );
  }

  return (
    <section className="wf-box p-4 sm:p-5">
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
    <div className="grid gap-2 py-3 md:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] md:items-center md:gap-6">
      <div className="min-w-0">
        {htmlFor ? (
          <label htmlFor={htmlFor} id={labelId} className="wf-label">
            {label}
          </label>
        ) : (
          <span id={labelId} className="wf-label">
            {label}
          </span>
        )}
        {hint ? (
          <p id={hintId} className="wf-hint max-w-xl">
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
    <div className="wf-fill min-w-0 p-3">
      <p className="wf-kicker">{label}</p>
      <p title={value} className="mt-1 truncate text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}

function BillingStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="wf-box min-w-0 p-3">
      <p className="wf-kicker">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold tabular-nums">
        {value}
      </p>
    </div>
  );
}

function IntegrationStatusCard({
  probe,
  fallbackName,
}: {
  probe?: IntegrationProbeResponse;
  fallbackName: string;
}) {
  const status = probe?.status ?? "disabled";

  return (
    <div className="wf-box flex items-start justify-between gap-3 p-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{probe?.name ?? fallbackName}</p>
        <p className="wf-muted mt-1 text-sm leading-5">
          {probe?.message ?? "Статус еще не загружен."}
        </p>
      </div>
      <span className="wf-tag shrink-0">
        <span className="wf-dot" />
        {statusLabel(status)}
      </span>
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
    <div className="wf-fill mt-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold">Результат проверки</h3>
        <span className="wf-tag">
          <span className="wf-dot" />
          {statusLabel(probe.status)}
        </span>
      </div>
      <p className="wf-muted mt-2 text-sm leading-6">{probe.message}</p>
      {detailRows.length ? (
        <dl className="mt-3 border-t border-line">
          {detailRows.map(([key, value]) => (
            <div
              key={key}
              className="grid gap-1 border-b border-line-soft py-2 last:border-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:gap-4"
            >
              <dt className="wf-kicker min-w-0 truncate">{key}</dt>
              <dd className="min-w-0 break-words text-sm">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

/** Состояние загрузки: скелетоны для глаз, текст — для скринридера. */
function LoadingRows({
  label,
  description,
  rows,
  className = "",
}: {
  label: string;
  description?: string;
  rows: number;
  className?: string;
}) {
  return (
    <div role="status" aria-busy="true" className={`space-y-2 ${className}`}>
      <span className="sr-only">{label}</span>
      {description ? <span className="sr-only">{description}</span> : null}
      {Array.from({ length: rows }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className="wf-skeleton block h-12"
        />
      ))}
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
