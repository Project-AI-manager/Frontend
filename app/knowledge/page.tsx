"use client";

import { Archive, Plus, RefreshCw, RotateCcw } from "lucide-react";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AppShell } from "@/components/layout/app-shell";
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
          <a href="#knowledge-add-document" className="wf-btn">
            <Plus size={18} className="text-muted" />
            Добавить документ
          </a>
        </span>
      }
    >
      <div className="space-y-5">
        {/* Полоса счётчиков: три шага процесса — материалы, проверка, улучшения. */}
        <section className="wf-box p-4 sm:p-5">
          <p className="wf-kicker">База знаний</p>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
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
            <p
              role="status"
              className="wf-fill mt-3 break-words px-3 py-2 text-sm leading-6"
            >
              {notice}
            </p>
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
              className="wf-btn"
            >
              <RefreshCw size={18} className="text-muted" />
              {isDocumentsFetching ? "Обновляем..." : "Обновить"}
            </button>
          }
        >
          <form
            id="knowledge-add-document"
            onSubmit={handleCreateDocument}
            className="wf-box scroll-mt-24 p-4 sm:p-5"
          >
            <h3 className="text-base font-semibold">Новый документ</h3>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="knowledge-title" className="wf-label">
                  Название
                </label>
                <input
                  id="knowledge-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="wf-field text-sm"
                  placeholder="Например, FAQ по доставке"
                  disabled={createDocumentMutation.isPending}
                />
              </div>

              <div>
                <label htmlFor="knowledge-text" className="wf-label">
                  Содержание
                </label>
                <textarea
                  id="knowledge-text"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  className="wf-field text-sm"
                  placeholder="Условия, ответы и инструкции для ассистента..."
                  disabled={createDocumentMutation.isPending}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={createDocumentMutation.isPending}
              className="wf-btn wf-btn-primary mt-4 w-full"
            >
              Добавить в базу
            </button>
          </form>

          <div className="mt-4">
            {isDocumentsLoading ? (
              <LoadingRows label="Загружаем документы" rows={4} />
            ) : documentsError ? (
              <div role="alert" className="wf-fill p-4">
                <p className="text-sm font-semibold">
                  Не удалось загрузить документы
                </p>
                <p className="wf-muted mt-1 text-sm leading-6">
                  {getApiErrorMessage(
                    documentsError,
                    "Проверь авторизацию и подключение к сервису.",
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => refetchDocuments()}
                  className="wf-btn mt-3"
                >
                  <RotateCcw size={18} className="text-muted" />
                  Повторить
                </button>
              </div>
            ) : documents.length > 0 ? (
              <ul className="space-y-2">
                {documents.map((document) => {
                  const isActive = document.id === activeDocumentId;

                  return (
                    <li key={document.id}>
                      {/* Выбранная строка отличается только заливкой (.wf-fill).
                          Имя кнопки задаём явно: иначе скринридер склеивает его
                          из даты, меток и числа фрагментов. */}
                      <button
                        type="button"
                        aria-pressed={isActive}
                        aria-label={`${document.title}, статус ${statusLabel(
                          document.status,
                        )}, фрагментов ${document.chunks_count}`}
                        onClick={() => setSelectedDocumentId(document.id)}
                        className={`${
                          isActive ? "wf-fill" : "wf-box"
                        } w-full p-3 text-left`}
                      >
                        <span
                          className="block truncate text-sm font-semibold"
                          aria-hidden="true"
                        >
                          {document.title}
                        </span>
                        <span
                          className="mt-2 flex flex-wrap items-center gap-2"
                          aria-hidden="true"
                        >
                          <span className="wf-tag">{document.source_type}</span>
                          <StatusTag status={document.status} />
                          <span className="wf-tag">
                            {document.chunks_count} фрагментов
                          </span>
                          <span className="wf-muted text-xs tabular-nums">
                            {formatDate(document.updated_at)}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="wf-fill p-4">
                <p className="text-sm font-semibold">Документов пока нет</p>
                <p className="wf-muted mt-1 text-sm leading-6">
                  Добавьте первый материал, чтобы ассистент начал отвечать по
                  вашей базе.
                </p>
                <a href="#knowledge-add-document" className="wf-btn mt-3">
                  <Plus size={18} className="text-muted" />
                  Добавить документ
                </a>
              </div>
            )}
          </div>

          <div className="wf-divider my-5" />

          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="text-base font-semibold">
                  Что запомнил ассистент
                </h3>
                <p className="wf-muted mt-1 text-sm leading-6">
                  Фрагменты выбранного документа, доступные поиску.
                </p>
              </div>

              {activeDocumentId ? (
                <button
                  type="button"
                  onClick={() =>
                    archiveDocumentMutation.mutate(activeDocumentId)
                  }
                  disabled={archiveDocumentMutation.isPending}
                  className="wf-btn shrink-0"
                >
                  <Archive size={18} className="text-muted" />
                  {archiveDocumentMutation.isPending
                    ? "Архивируем..."
                    : "Архивировать документ"}
                </button>
              ) : null}
            </div>

            <div className="mt-4">
              {isDetailLoading ? (
                <LoadingRows label="Загружаем фрагменты" rows={3} />
              ) : detailError ? (
                <div role="alert" className="wf-fill p-4">
                  <p className="text-sm font-semibold">
                    Не удалось открыть документ
                  </p>
                  <p className="wf-muted mt-1 text-sm leading-6">
                    {getApiErrorMessage(
                      detailError,
                      "Выбери другой документ или обнови список.",
                    )}
                  </p>
                </div>
              ) : documentDetail ? (
                documentDetail.chunks.length > 0 ? (
                  <ul className="space-y-2">
                    {documentDetail.chunks.map((chunk) => (
                      <li key={chunk.id}>
                        <article className="wf-fill p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="wf-kicker">
                              #{chunk.position + 1}
                            </span>
                            <span className="wf-tag">
                              {chunk.token_count} токенов
                            </span>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
                            {chunk.text}
                          </p>
                        </article>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="wf-fill p-4">
                    <p className="text-sm font-semibold">Фрагментов нет</p>
                    <p className="wf-muted mt-1 text-sm leading-6">
                      Документ ещё обрабатывается или не содержит подходящего
                      текста.
                    </p>
                  </div>
                )
              ) : (
                <div className="wf-fill p-4">
                  <p className="text-sm font-semibold">Документ не выбран</p>
                  <p className="wf-muted mt-1 text-sm leading-6">
                    Выберите материал в таблице, чтобы проверить его фрагменты.
                  </p>
                </div>
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
          <form onSubmit={handleAsk} className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor="knowledge-question" className="sr-only">
              Вопрос клиента
            </label>
            <input
              id="knowledge-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              className="wf-field flex-1 text-sm"
              placeholder="Вопрос клиента"
              disabled={askMutation.isPending}
            />
            <button
              type="submit"
              disabled={askMutation.isPending}
              className="wf-btn wf-btn-primary shrink-0"
            >
              {askMutation.isPending ? "Проверяем..." : "Проверить ответ"}
            </button>
          </form>

          {answer ? (
            <div className="wf-fill mt-4 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold">Ответ AI</h3>
                <span className="wf-tag">
                  Уверенность {Math.round(answer.confidence * 100)}%
                </span>
                <span className="wf-tag">{answer.decision}</span>
              </div>

              <p className="mt-3 break-words text-sm leading-6">
                {answer.answer}
              </p>

              <div className="mt-4 space-y-2">
                {answer.sources.length > 0 ? (
                  answer.sources.map((source) => (
                    <article key={source.id} className="wf-box p-3">
                      <p className="text-sm font-semibold">{source.title}</p>
                      <p className="wf-muted mt-1 line-clamp-3 text-xs leading-5">
                        {source.text}
                      </p>
                    </article>
                  ))
                ) : (
                  <p className="wf-box wf-muted p-3 text-sm leading-6">
                    Источников не найдено. Добавьте документ или уточните
                    вопрос.
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </KnowledgeSection>

        {/* 03 — автообучение: кандидаты из ответов менеджеров. */}
        <KnowledgeSection
          number="03"
          title="Предложения для базы"
          description="Ответы менеджеров становятся кандидатами. Подтверждайте только точные и повторно используемые знания."
          action={
            isCandidatesFetching ? (
              <span className="wf-tag">Обновляем...</span>
            ) : undefined
          }
        >
          {isCandidatesLoading ? (
            <LoadingRows label="Загружаем кандидатов" rows={3} />
          ) : candidatesError ? (
            <div role="alert" className="wf-fill p-4">
              <p className="text-sm font-semibold">
                Не удалось загрузить кандидатов
              </p>
              <p className="wf-muted mt-1 text-sm leading-6">
                {getApiErrorMessage(
                  candidatesError,
                  "Проверь подключение к сервису.",
                )}
              </p>
            </div>
          ) : pendingCandidates.length > 0 ? (
            <ul className="space-y-2">
              {pendingCandidates.map((candidate) => (
                <li key={candidate.id}>
                  <article className="wf-box p-4">
                    <p className="wf-kicker">{candidate.suggested_by}</p>

                    <p className="mt-3 break-words text-sm font-semibold leading-6">
                      {candidate.question}
                    </p>
                    <p className="wf-muted mt-2 break-words text-sm leading-6">
                      {candidate.answer}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          approveCandidateMutation.mutate(candidate.id)
                        }
                        disabled={isCandidateActionPending}
                        className="wf-btn"
                      >
                        Принять
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          rejectCandidateMutation.mutate(candidate.id)
                        }
                        disabled={isCandidateActionPending}
                        className="wf-btn"
                      >
                        Отклонить
                      </button>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          ) : (
            <div className="wf-fill p-4">
              <p className="text-sm font-semibold">Очередь обработана</p>
              <p className="wf-muted mt-1 text-sm leading-6">
                Новые кандидаты появятся после ответов менеджера в диалогах.
              </p>
            </div>
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
    <div className="wf-fill p-3">
      <div className="flex items-baseline gap-2">
        <span className="wf-kicker">{number}</span>
        <span className="wf-kicker">{label}</span>
      </div>
      <p className="mt-1.5 text-sm font-semibold">{value}</p>
    </div>
  );
}

/** Состояние загрузки: скелетоны для глаз, текст — для скринридера. */
function LoadingRows({ label, rows }: { label: string; rows: number }) {
  return (
    <div role="status" aria-busy="true" className="space-y-2">
      <span className="sr-only">{label}</span>
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

function KnowledgeSection({
  number,
  title,
  description,
  action,
  children,
}: {
  number: string;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="wf-box p-4 sm:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="wf-kicker">{number}</p>
          <h2 className="wf-title text-balance mt-1">{title}</h2>
          <p className="wf-muted mt-1.5 max-w-3xl text-sm leading-6">
            {description}
          </p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className="wf-divider my-4" />

      {children}
    </section>
  );
}

function StatusTag({ status }: { status: string }) {
  return (
    <span className="wf-tag">
      <span className="wf-dot" />
      {statusLabel(status)}
    </span>
  );
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
