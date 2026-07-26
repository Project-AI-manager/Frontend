"use client";

import {
  AlertCircle,
  Archive,
  BrainCircuit,
  CheckCircle2,
  FileText,
  Layers,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  UserRound,
  XCircle,
} from "lucide-react";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AppShell } from "@/components/layout/app-shell";
import { StateCard } from "@/components/ui/state-card";
import { getApiErrorMessage } from "@/lib/api/errors";
import type {
  KnowledgeCandidateResponse,
  KnowledgeDocumentCreate,
  KnowledgeDocumentResponse,
  MLAnswerResponse,
} from "@/lib/api/generated/ai.schemas";
import { getKnowledge } from "@/lib/api/generated/knowledge/knowledge";

const knowledgeApi = getKnowledge();

export default function KnowledgePage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [question, setQuestion] = useState(
    "Сколько занимает подключение Telegram?",
  );
  const [answer, setAnswer] = useState<MLAnswerResponse | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
  );
  const [notice, setNotice] = useState<string | null>(null);

  const {
    data: documentsData,
    isLoading: isDocumentsLoading,
    isFetching: isDocumentsFetching,
    error: documentsError,
    refetch: refetchDocuments,
  } = useQuery({
    queryKey: ["knowledge", "documents"],
    queryFn: () => knowledgeApi.listDocumentsApiV1KnowledgeDocumentsGet(),
    retry: 1,
  });

  const documents = useMemo(
    () => normalizeDocuments(documentsData),
    [documentsData],
  );
  const activeDocumentId = selectedDocumentId ?? documents[0]?.id ?? null;

  const {
    data: documentDetail,
    isLoading: isDetailLoading,
    error: detailError,
  } = useQuery({
    queryKey: ["knowledge", "documents", activeDocumentId],
    queryFn: () =>
      knowledgeApi.getDocumentApiV1KnowledgeDocumentsDocumentIdGet(
        activeDocumentId ?? "",
      ),
    enabled: Boolean(activeDocumentId),
    retry: 1,
  });

  const {
    data: candidatesData,
    isLoading: isCandidatesLoading,
    isFetching: isCandidatesFetching,
    error: candidatesError,
  } = useQuery({
    queryKey: ["knowledge", "candidates"],
    queryFn: () => knowledgeApi.listCandidatesApiV1KnowledgeCandidatesGet(),
    retry: 1,
  });

  const candidates = useMemo(
    () => normalizeCandidates(candidatesData),
    [candidatesData],
  );
  const pendingCandidates = candidates.filter(
    (candidate) => candidate.status === "pending",
  );

  const createDocumentMutation = useMutation({
    mutationFn: (payload: KnowledgeDocumentCreate) =>
      knowledgeApi.uploadDocumentApiV1KnowledgeDocumentsPost(payload),
    onSuccess: async (created) => {
      setTitle("");
      setText("");
      setSelectedDocumentId(created.id);
      setNotice("Документ добавлен и разбит на фрагменты.");
      await queryClient.invalidateQueries({
        queryKey: ["knowledge", "documents"],
      });
    },
    onError: (error) => {
      setNotice(getApiErrorMessage(error, "Не удалось добавить документ."));
    },
  });

  const archiveDocumentMutation = useMutation({
    mutationFn: (documentId: string) =>
      knowledgeApi.archiveDocumentApiV1KnowledgeDocumentsDocumentIdArchivePost(
        documentId,
      ),
    onSuccess: async () => {
      setNotice("Документ архивирован.");
      await queryClient.invalidateQueries({
        queryKey: ["knowledge", "documents"],
      });
    },
    onError: (error) => {
      setNotice(getApiErrorMessage(error, "Не удалось архивировать документ."));
    },
  });

  const askMutation = useMutation({
    mutationFn: (message: string) =>
      knowledgeApi.askApiV1KnowledgeAskPost({ message }),
    onSuccess: (result) => {
      setAnswer(result);
      setNotice(null);
    },
    onError: (error) => {
      setNotice(
        getApiErrorMessage(error, "Не удалось получить проверочный ответ."),
      );
    },
  });

  const approveCandidateMutation = useMutation({
    mutationFn: (candidateId: string) =>
      knowledgeApi.approveCandidateApiV1KnowledgeCandidatesCandidateIdApprovePost(
        candidateId,
      ),
    onSuccess: async () => {
      setNotice("Кандидат принят и добавлен в базу знаний.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["knowledge", "documents"] }),
        queryClient.invalidateQueries({
          queryKey: ["knowledge", "candidates"],
        }),
      ]);
    },
    onError: (error) => {
      setNotice(getApiErrorMessage(error, "Не удалось принять кандидата."));
    },
  });

  const rejectCandidateMutation = useMutation({
    mutationFn: (candidateId: string) =>
      knowledgeApi.rejectCandidateApiV1KnowledgeCandidatesCandidateIdRejectPost(
        candidateId,
      ),
    onSuccess: async () => {
      setNotice("Кандидат отклонён.");
      await queryClient.invalidateQueries({
        queryKey: ["knowledge", "candidates"],
      });
    },
    onError: (error) => {
      setNotice(getApiErrorMessage(error, "Не удалось отклонить кандидата."));
    },
  });

  function handleCreateDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    const trimmedTitle = title.trim();
    const trimmedText = text.trim();

    if (!trimmedTitle || !trimmedText) {
      setNotice("Заполни название и текст документа.");
      return;
    }

    createDocumentMutation.mutate({
      title: trimmedTitle,
      text: trimmedText,
      source_type: "manual",
      tags: { source: "manual-ui" },
    });
  }

  function handleAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      setNotice("Напиши вопрос для проверки ответа.");
      return;
    }

    askMutation.mutate(trimmedQuestion);
  }

  const isCandidateActionPending =
    approveCandidateMutation.isPending || rejectCandidateMutation.isPending;

  return (
    <AppShell
      title="База знаний"
      description="Управляйте знаниями по одному процессу: добавьте материал, проверьте извлечение и подтвердите улучшения."
      actions={
        <span className="hidden sm:inline-flex">
          <a href="#knowledge-add-document" className="btn btn-primary btn-sm">
            <Plus size={16} />
            Добавить документ
          </a>
        </span>
      }
    >
      <div className="space-y-5 sm:space-y-6">
        {/* Полоса метрик: три шага процесса — материалы, проверка, улучшения. */}
        <section className="card overflow-hidden">
          <div className="border-b border-line-soft px-5 py-4 sm:px-6">
            <span className="section-kicker">
              <BrainCircuit size={16} />
              База знаний
            </span>
          </div>

          <div className="grid divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
            <ProcessMetric
              number="01"
              label="Материалы"
              value={`${documents.length} документов`}
            />
            <ProcessMetric
              number="02"
              label="Проверка ответа"
              value={answer ? "Ответ получен" : "Готов к тесту"}
            />
            <ProcessMetric
              number="03"
              label="Улучшения"
              value={`${pendingCandidates.length} на проверке`}
            />
          </div>

          {notice ? (
            <div className="border-t border-line px-5 py-4 sm:px-6">
              <p role="status" className="notice notice-brand">
                {notice}
              </p>
            </div>
          ) : null}
        </section>

        {/* 01 — документы и фрагменты. */}
        <KnowledgeSection
          number="01"
          title="Материалы"
          description="Добавьте проверенную информацию — сервис сохранит её, разобьёт на фрагменты и включит в поиск."
          action={
            <button
              type="button"
              onClick={() => refetchDocuments()}
              className="btn btn-secondary btn-sm"
            >
              {isDocumentsFetching ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
              Обновить
            </button>
          }
        >
          <div className="grid gap-6 xl:grid-cols-[minmax(300px,0.78fr)_minmax(0,1.22fr)]">
            <form
              id="knowledge-add-document"
              onSubmit={handleCreateDocument}
              className="panel h-fit scroll-mt-24 p-5 sm:p-6"
            >
              <div className="flex items-center gap-3">
                <span className="icon-badge shrink-0" aria-hidden="true">
                  <Plus size={20} />
                </span>
                <h3 className="font-display text-base font-extrabold tracking-[-0.02em]">
                  Новый документ
                </h3>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label htmlFor="knowledge-title" className="field-label">
                    Название
                  </label>
                  <input
                    id="knowledge-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="field text-sm"
                    placeholder="Например, FAQ по доставке"
                    disabled={createDocumentMutation.isPending}
                  />
                </div>

                <div>
                  <label htmlFor="knowledge-text" className="field-label">
                    Содержание
                  </label>
                  <textarea
                    id="knowledge-text"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    className="field text-sm"
                    placeholder="Условия, ответы и инструкции для ассистента..."
                    disabled={createDocumentMutation.isPending}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={createDocumentMutation.isPending}
                className="btn btn-primary mt-5 w-full"
              >
                {createDocumentMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Plus size={16} />
                )}
                Добавить в базу
              </button>
            </form>

            <div className="min-w-0">
              <div className="micro-label mb-3 hidden items-center gap-5 px-5 lg:flex">
                <span className="min-w-0 flex-1">Документ</span>
                <span className="w-[104px] flex-none">Источник</span>
                <span className="w-[118px] flex-none">Статус</span>
                <span className="w-[84px] flex-none text-right">Фрагменты</span>
              </div>

              {isDocumentsLoading ? (
                <StateCard
                  variant="loading"
                  title="Загружаем документы"
                  rows={4}
                />
              ) : documentsError ? (
                <StateCard
                  variant="error"
                  icon={<AlertCircle size={22} />}
                  title="Не удалось загрузить документы"
                  description={getApiErrorMessage(
                    documentsError,
                    "Проверь авторизацию и подключение к сервису.",
                  )}
                  action={
                    <button
                      type="button"
                      onClick={() => refetchDocuments()}
                      className="btn btn-secondary btn-sm"
                    >
                      <RotateCcw size={16} />
                      Повторить
                    </button>
                  }
                />
              ) : documents.length > 0 ? (
                <ul className="space-y-3">
                  {documents.map((document) => {
                    const isActive = document.id === activeDocumentId;

                    return (
                      <li key={document.id}>
                        {/* Выделение — рамкой и заливкой, а не outline: outline теперь
                            глобально означает клавиатурный фокус. border-brand!/bg-brand-soft! —
                            .card объявлен вне каскадных слоёв, обычные утилиты цвета его
                            не перебивают. Имя кнопки задаём явно: иначе скринридер
                            склеивает его из даты, чипов и числа фрагментов. */}
                        <button
                          type="button"
                          aria-pressed={isActive}
                          aria-label={`${document.title}, статус ${statusLabel(
                            document.status,
                          )}, фрагментов ${document.chunks_count}`}
                          onClick={() => setSelectedDocumentId(document.id)}
                          className={`card card-hover w-full px-5 py-4 text-left ${
                            isActive
                              ? "border-brand! bg-brand-soft! shadow-soft"
                              : ""
                          }`}
                        >
                          <span
                            className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-5"
                            aria-hidden="true"
                          >
                            <span className="flex min-w-0 items-center gap-3 lg:flex-1">
                              <span
                                className={`icon-badge icon-badge-sm shrink-0 ${
                                  isActive ? "bg-brand! text-white!" : ""
                                }`}
                              >
                                <FileText size={17} />
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate font-display text-[15px] font-extrabold tracking-[-0.02em]">
                                  {document.title}
                                </span>
                                <span className="mt-0.5 block truncate text-xs tabular-nums text-faint">
                                  {formatDate(document.updated_at)}
                                </span>
                              </span>
                            </span>

                            <span className="flex flex-wrap items-center gap-2 lg:contents">
                              <span className="lg:w-[104px] lg:flex-none">
                                <span className="chip chip-grey">
                                  {document.source_type}
                                </span>
                              </span>
                              <span className="lg:w-[118px] lg:flex-none">
                                <StatusChip status={document.status} />
                              </span>
                              <span className="ml-auto flex items-baseline lg:ml-0 lg:w-[84px] lg:flex-none lg:justify-end">
                                <span className="font-display text-lg font-extrabold tabular-nums text-brand">
                                  {document.chunks_count}
                                </span>
                              </span>
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <StateCard
                  icon={<FileText size={22} />}
                  title="Документов пока нет"
                  description="Добавьте первый материал, чтобы ассистент начал отвечать по вашей базе."
                  action={
                    <a
                      href="#knowledge-add-document"
                      className="btn btn-primary btn-sm"
                    >
                      <Plus size={16} />
                      Добавить документ
                    </a>
                  }
                />
              )}
            </div>
          </div>

          <div className="mt-7 border-t border-line pt-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <span className="icon-badge shrink-0" aria-hidden="true">
                  <Layers size={20} />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-base font-extrabold tracking-[-0.02em]">
                    Что запомнил ассистент
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    Фрагменты выбранного документа, доступные поиску.
                  </p>
                </div>
              </div>

              {activeDocumentId ? (
                <button
                  type="button"
                  onClick={() =>
                    archiveDocumentMutation.mutate(activeDocumentId)
                  }
                  disabled={archiveDocumentMutation.isPending}
                  className="btn btn-secondary btn-sm self-start sm:self-auto"
                >
                  {archiveDocumentMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Archive size={16} />
                  )}
                  Архивировать документ
                </button>
              ) : null}
            </div>

            <div className="mt-5">
              {isDetailLoading ? (
                <StateCard
                  variant="loading"
                  title="Загружаем фрагменты"
                  rows={3}
                />
              ) : detailError ? (
                <StateCard
                  variant="error"
                  icon={<AlertCircle size={22} />}
                  title="Не удалось открыть документ"
                  description={getApiErrorMessage(
                    detailError,
                    "Выбери другой документ или обнови список.",
                  )}
                />
              ) : documentDetail ? (
                documentDetail.chunks.length > 0 ? (
                  <ul className="space-y-2.5">
                    {documentDetail.chunks.map((chunk) => (
                      <li key={chunk.id}>
                        <article className="soft-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-4">
                          <span className="num-badge num-badge-sm shrink-0">
                            #{chunk.position + 1}
                          </span>
                          <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm leading-6 text-ink-soft">
                            {chunk.text}
                          </p>
                          <span className="chip chip-grey shrink-0 self-start">
                            {chunk.token_count} токенов
                          </span>
                        </article>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <StateCard
                    icon={<FileText size={22} />}
                    title="Фрагментов нет"
                    description="Документ ещё обрабатывается или не содержит подходящего текста."
                  />
                )
              ) : (
                <StateCard
                  icon={<FileText size={22} />}
                  title="Документ не выбран"
                  description="Выберите материал в таблице, чтобы проверить его фрагменты."
                />
              )}
            </div>
          </div>
        </KnowledgeSection>

        {/* 02 — проверка ответа тем же поиском, что и в рабочих диалогах. */}
        <KnowledgeSection
          number="02"
          title="Проверка ответа"
          description="Задайте реальный вопрос клиента. Режим проверки использует тот же поиск по знаниям, что и рабочие диалоги."
        >
          <form
            onSubmit={handleAsk}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <label htmlFor="knowledge-question" className="sr-only">
              Вопрос клиента
            </label>
            <input
              id="knowledge-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              className="field flex-1 text-sm"
              placeholder="Вопрос клиента"
              disabled={askMutation.isPending}
            />
            <button
              type="submit"
              disabled={askMutation.isPending}
              className="btn btn-primary shrink-0"
            >
              {askMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
              Проверить ответ
            </button>
          </form>

          {answer ? (
            <div className="soft-panel mt-5 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="icon-badge shrink-0" aria-hidden="true">
                  <Sparkles size={20} />
                </span>
                <h3 className="font-display text-base font-extrabold tracking-[-0.02em]">
                  Ответ AI
                </h3>
                <span className="chip chip-blue">
                  Уверенность {Math.round(answer.confidence * 100)}%
                </span>
                <span className="chip chip-grey">{answer.decision}</span>
              </div>

              <p className="mt-4 break-words text-sm leading-7 text-ink-soft">
                {answer.answer}
              </p>

              <div className="mt-5 grid gap-2.5">
                {answer.sources.length > 0 ? (
                  answer.sources.map((source) => (
                    <article key={source.id} className="card p-4">
                      <p className="font-display text-sm font-extrabold tracking-[-0.02em]">
                        {source.title}
                      </p>
                      <p className="mt-1.5 line-clamp-3 text-xs leading-5 text-muted">
                        {source.text}
                      </p>
                    </article>
                  ))
                ) : (
                  <p className="rounded-md border border-line bg-white px-4 py-3 text-sm leading-6 text-muted">
                    Источников не найдено. Добавьте документ или уточните
                    вопрос.
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </KnowledgeSection>

        {/* 03 — автообучение: отдельная зона с мини-диалогами кандидатов. */}
        <KnowledgeSection
          number="03"
          title="Предложения для базы"
          description="Ответы менеджеров становятся кандидатами. Подтверждайте только точные и повторно используемые знания."
          accent
          action={
            isCandidatesFetching ? (
              <Loader2 size={18} className="animate-spin text-faint" />
            ) : undefined
          }
        >
          {isCandidatesLoading ? (
            <StateCard
              variant="loading"
              title="Загружаем кандидатов"
              rows={3}
            />
          ) : candidatesError ? (
            <StateCard
              variant="error"
              icon={<AlertCircle size={22} />}
              title="Не удалось загрузить кандидатов"
              description={getApiErrorMessage(
                candidatesError,
                "Проверь подключение к сервису.",
              )}
            />
          ) : pendingCandidates.length > 0 ? (
            <ul className="grid gap-4 xl:grid-cols-2">
              {pendingCandidates.map((candidate) => (
                <li key={candidate.id}>
                  <article className="card card-hover h-full p-5 sm:p-6">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="status-dot"
                        data-tone="amber"
                        aria-hidden="true"
                      />
                      {/* text-brand! — .micro-label объявлен вне каскадных слоёв. */}
                      <span className="micro-label text-brand!">
                        {candidate.suggested_by}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <span
                          className="icon-badge icon-badge-sm shrink-0 bg-surface! text-muted!"
                          aria-hidden="true"
                        >
                          <MessageSquare size={16} />
                        </span>
                        <p className="min-w-0 flex-1 break-words rounded-md border border-line bg-mist px-4 py-3 font-display text-sm font-bold leading-6 text-ink">
                          {candidate.question}
                        </p>
                      </div>

                      <div className="flex items-start gap-3 sm:pl-12">
                        <p className="min-w-0 flex-1 break-words rounded-md border border-brand/20 bg-brand-soft px-4 py-3 text-sm leading-6 text-ink-soft">
                          {candidate.answer}
                        </p>
                        <span
                          className="icon-badge icon-badge-sm shrink-0 bg-brand! text-white!"
                          aria-hidden="true"
                        >
                          <UserRound size={16} />
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2 border-t border-line-soft pt-4">
                      <button
                        type="button"
                        onClick={() =>
                          approveCandidateMutation.mutate(candidate.id)
                        }
                        disabled={isCandidateActionPending}
                        className="btn btn-primary btn-sm"
                      >
                        <CheckCircle2 size={16} />
                        Принять
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          rejectCandidateMutation.mutate(candidate.id)
                        }
                        disabled={isCandidateActionPending}
                        className="btn btn-danger btn-sm"
                      >
                        <XCircle size={16} />
                        Отклонить
                      </button>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          ) : (
            <StateCard
              icon={<BrainCircuit size={22} />}
              title="Очередь обработана"
              description="Новые кандидаты появятся после ответов менеджера в диалогах."
            />
          )}
        </KnowledgeSection>
      </div>
    </AppShell>
  );
}

function ProcessMetric({
  number,
  label,
  value,
}: {
  number: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-5 sm:px-6">
      <span className="num-badge num-badge-sm shrink-0">{number}</span>
      <div className="min-w-0">
        <p className="micro-label">{label}</p>
        <div className="mt-1">
          <MetricValue value={value} />
        </div>
      </div>
    </div>
  );
}

/** Разделяет «3 документов» на крупное синее число и подпись, не меняя текст. */
function MetricValue({ value }: { value: string }) {
  const match = /^(\d+)\s+(.+)$/.exec(value);

  if (!match) {
    return (
      <span className="font-display text-lg font-extrabold tracking-[-0.02em] text-ink">
        {value}
      </span>
    );
  }

  return (
    <span className="flex flex-wrap items-baseline gap-x-2">
      <span className="font-display text-3xl font-extrabold tabular-nums tracking-[-0.04em] text-brand">
        {match[1]}
      </span>
      <span className="text-sm font-semibold text-muted">{match[2]}</span>
    </span>
  );
}

function KnowledgeSection({
  number,
  title,
  description,
  action,
  accent = false,
  children,
}: {
  number: string;
  title: string;
  description: string;
  action?: ReactNode;
  accent?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="card overflow-hidden">
      <div
        className={`flex flex-col justify-between gap-4 border-b border-line px-5 py-5 sm:px-6 md:flex-row md:items-start ${
          accent ? "soft-grid bg-mist" : "bg-white"
        }`}
      >
        <div className="flex min-w-0 items-start gap-4">
          <span className="num-badge num-badge-sm shrink-0">{number}</span>
          <div className="min-w-0">
            <h2 className="text-balance font-display text-xl font-extrabold tracking-[-0.04em] sm:text-2xl">
              {title}
            </h2>
            <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted">
              {description}
            </p>
          </div>
        </div>
        {action ? <div className="shrink-0 md:pt-1">{action}</div> : null}
      </div>

      <div className={`px-5 py-6 sm:px-6 ${accent ? "bg-mist/50" : ""}`}>
        {children}
      </div>
    </section>
  );
}

function StatusChip({ status }: { status: string }) {
  const toneClass =
    status === "ready"
      ? "chip-green"
      : status === "archived"
        ? "chip-grey"
        : status === "failed"
          ? "chip-red"
          : "chip-amber";

  return <span className={`chip ${toneClass}`}>{statusLabel(status)}</span>;
}

function statusLabel(status: string) {
  switch (status) {
    case "ready":
      return "Готов";
    case "archived":
      return "Архив";
    case "processing":
      return "Обработка";
    case "failed":
      return "Ошибка";
    default:
      return status || "Неизвестно";
  }
}

function normalizeDocuments(value: KnowledgeDocumentResponse[] | undefined) {
  return Array.isArray(value) ? value : [];
}

function normalizeCandidates(value: KnowledgeCandidateResponse[] | undefined) {
  return Array.isArray(value) ? value : [];
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
