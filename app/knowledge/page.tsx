"use client";

import {
  AlertCircle,
  Archive,
  BrainCircuit,
  CheckCircle2,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  XCircle,
} from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
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
    >
      <section className="glass-card overflow-hidden rounded-lg">
        <div className="grid divide-y divide-[#d9e1ec] md:grid-cols-3 md:divide-x md:divide-y-0">
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
            className="border-t border-[#d9e1ec] bg-[#eaf1ff] px-5 py-3 text-sm font-semibold text-[#1546ad] md:px-6"
          >
            {notice}
          </p>
        ) : null}

        <KnowledgeSection
          number="01"
          title="Материалы"
          description="Добавьте проверенную информацию — сервис сохранит её, разобьёт на фрагменты и включит в поиск."
          action={
            <button
              type="button"
              onClick={() => refetchDocuments()}
              className="secondary-button px-3 py-2 text-xs"
            >
              {isDocumentsFetching ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              Обновить
            </button>
          }
        >
          <div className="grid gap-6 xl:grid-cols-[minmax(280px,0.72fr)_minmax(0,1.28fr)]">
            <form
              onSubmit={handleCreateDocument}
              className="border-r-0 border-[#d9e1ec] xl:border-r xl:pr-6"
            >
              <h3 className="flex items-center gap-2 text-sm font-black">
                <Plus size={16} className="text-[#2463eb]" />
                Новый документ
              </h3>
              <label
                htmlFor="knowledge-title"
                className="mt-4 block text-xs font-bold text-neutral-500"
              >
                Название
              </label>
              <input
                id="knowledge-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="form-field mt-2 px-4 py-3 text-sm"
                placeholder="Например, FAQ по доставке"
                disabled={createDocumentMutation.isPending}
              />
              <label
                htmlFor="knowledge-text"
                className="mt-4 block text-xs font-bold text-neutral-500"
              >
                Содержание
              </label>
              <textarea
                id="knowledge-text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                className="form-field mt-2 min-h-36 resize-y px-4 py-3 text-sm leading-6"
                placeholder="Условия, ответы и инструкции для ассистента..."
                disabled={createDocumentMutation.isPending}
              />
              <button
                type="submit"
                disabled={createDocumentMutation.isPending}
                className="primary-button mt-4 px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createDocumentMutation.isPending ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Plus size={15} />
                )}
                Добавить в базу
              </button>
            </form>

            <div className="min-w-0">
              <div className="mb-3 grid grid-cols-[1fr_auto] gap-3 px-3 text-[11px] font-black uppercase tracking-[0.12em] text-neutral-400 sm:grid-cols-[1fr_100px_90px_auto]">
                <span>Документ</span>
                <span className="hidden sm:block">Источник</span>
                <span className="hidden sm:block">Статус</span>
                <span>Фрагменты</span>
              </div>
              <div className="overflow-hidden rounded-lg border border-[#d9e1ec] bg-white">
                {isDocumentsLoading ? (
                  <StateCard
                    icon={<Loader2 className="animate-spin" size={18} />}
                    title="Загружаем документы"
                  />
                ) : documentsError ? (
                  <StateCard
                    icon={<AlertCircle size={18} />}
                    title="Не удалось загрузить документы"
                    description={getApiErrorMessage(
                      documentsError,
                      "Проверь авторизацию и подключение к сервису.",
                    )}
                    tone="error"
                  />
                ) : documents.length > 0 ? (
                  documents.map((document) => {
                    const isActive = document.id === activeDocumentId;
                    return (
                      <button
                        key={document.id}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => setSelectedDocumentId(document.id)}
                        className={`grid w-full grid-cols-[1fr_auto] gap-3 border-b border-[#d9e1ec] px-4 py-3 text-left transition-colors last:border-0 hover:bg-[#f8fbff] sm:grid-cols-[1fr_100px_90px_auto] sm:items-center ${isActive ? "bg-[#eaf1ff]" : ""}`}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <FileText
                            size={17}
                            className="shrink-0 text-[#2463eb]"
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-black">
                              {document.title}
                            </span>
                            <span className="block font-mono text-[11px] text-neutral-400">
                              {formatDate(document.updated_at)}
                            </span>
                          </span>
                        </span>
                        <span className="hidden text-xs font-semibold text-neutral-500 sm:block">
                          {document.source_type}
                        </span>
                        <span className="hidden sm:block">
                          <StatusPill status={document.status} />
                        </span>
                        <span className="font-mono text-xs font-bold text-neutral-500">
                          {document.chunks_count}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <StateCard
                    icon={<FileText size={18} />}
                    title="Документов пока нет"
                    description="Добавьте первый материал, чтобы ассистент начал отвечать по вашей базе."
                  />
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-[#d9e1ec] pt-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-sm font-black">Что запомнил ассистент</h3>
                <p className="mt-1 text-sm text-neutral-500">
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
                  className="secondary-button self-start px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {archiveDocumentMutation.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Archive size={14} />
                  )}
                  Архивировать документ
                </button>
              ) : null}
            </div>
            <div className="mt-4">
              {isDetailLoading ? (
                <StateCard
                  icon={<Loader2 className="animate-spin" size={18} />}
                  title="Загружаем фрагменты"
                />
              ) : detailError ? (
                <StateCard
                  icon={<AlertCircle size={18} />}
                  title="Не удалось открыть документ"
                  description={getApiErrorMessage(
                    detailError,
                    "Выбери другой документ или обнови список.",
                  )}
                  tone="error"
                />
              ) : documentDetail ? (
                documentDetail.chunks.length > 0 ? (
                  <div className="divide-y divide-[#d9e1ec] rounded-lg border border-[#d9e1ec] bg-[#f8fbff]">
                    {documentDetail.chunks.map((chunk) => (
                      <article
                        key={chunk.id}
                        className="grid gap-2 px-4 py-4 md:grid-cols-[90px_minmax(0,1fr)_90px]"
                      >
                        <p className="font-mono text-xs font-black text-[#2463eb]">
                          #{chunk.position + 1}
                        </p>
                        <p className="whitespace-pre-wrap text-sm leading-6 text-neutral-700">
                          {chunk.text}
                        </p>
                        <span className="font-mono text-xs text-neutral-400 md:text-right">
                          {chunk.token_count} токенов
                        </span>
                      </article>
                    ))}
                  </div>
                ) : (
                  <StateCard
                    icon={<FileText size={18} />}
                    title="Фрагментов нет"
                    description="Документ ещё обрабатывается или не содержит подходящего текста."
                  />
                )
              ) : (
                <StateCard
                  icon={<FileText size={18} />}
                  title="Документ не выбран"
                  description="Выберите материал в таблице, чтобы проверить его фрагменты."
                />
              )}
            </div>
          </div>
        </KnowledgeSection>

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
              className="form-field flex-1 px-4 py-3 text-sm"
              placeholder="Вопрос клиента"
              disabled={askMutation.isPending}
            />
            <button
              type="submit"
              disabled={askMutation.isPending}
              className="primary-button px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {askMutation.isPending ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Search size={15} />
              )}
              Проверить ответ
            </button>
          </form>

          {answer ? (
            <div className="mt-5 border-l-2 border-[#2463eb] pl-4 md:pl-5">
              <div className="flex flex-wrap items-center gap-3 text-sm font-black text-[#1546ad]">
                <Sparkles size={16} />
                <span>Ответ AI</span>
                <span className="font-mono text-xs">
                  Уверенность {Math.round(answer.confidence * 100)}%
                </span>
                <span className="text-xs">{answer.decision}</span>
              </div>
              <p className="mt-3 text-sm leading-7 text-neutral-700">
                {answer.answer}
              </p>
              <div className="mt-4 divide-y divide-[#d9e1ec] rounded-lg border border-[#d9e1ec] bg-white">
                {answer.sources.length > 0 ? (
                  answer.sources.map((source) => (
                    <article
                      key={source.id}
                      className="px-4 py-3 text-xs text-neutral-600"
                    >
                      <p className="font-black text-neutral-800">
                        {source.title}
                      </p>
                      <p className="mt-1 line-clamp-3 leading-5">
                        {source.text}
                      </p>
                    </article>
                  ))
                ) : (
                  <p className="px-4 py-3 text-xs font-semibold text-neutral-500">
                    Источников не найдено. Добавьте документ или уточните
                    вопрос.
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </KnowledgeSection>

        <KnowledgeSection
          number="03"
          title="Предложения для базы"
          description="Ответы менеджеров становятся кандидатами. Подтверждайте только точные и повторно используемые знания."
          action={
            isCandidatesFetching ? (
              <Loader2 size={17} className="animate-spin text-neutral-400" />
            ) : undefined
          }
        >
          {isCandidatesLoading ? (
            <StateCard
              icon={<Loader2 className="animate-spin" size={18} />}
              title="Загружаем кандидатов"
            />
          ) : candidatesError ? (
            <StateCard
              icon={<AlertCircle size={18} />}
              title="Не удалось загрузить кандидатов"
              description={getApiErrorMessage(
                candidatesError,
                "Проверь подключение к сервису.",
              )}
              tone="error"
            />
          ) : pendingCandidates.length > 0 ? (
            <div className="divide-y divide-[#d9e1ec] rounded-lg border border-[#d9e1ec] bg-white">
              {pendingCandidates.map((candidate) => (
                <article
                  key={candidate.id}
                  className="grid gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] lg:items-center"
                >
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#2463eb]">
                      {candidate.suggested_by}
                    </p>
                    <p className="mt-1 text-sm font-black leading-6">
                      {candidate.question}
                    </p>
                  </div>
                  <p className="text-sm leading-6 text-neutral-600">
                    {candidate.answer}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        approveCandidateMutation.mutate(candidate.id)
                      }
                      disabled={isCandidateActionPending}
                      className="primary-button px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <CheckCircle2 size={13} /> Принять
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        rejectCandidateMutation.mutate(candidate.id)
                      }
                      disabled={isCandidateActionPending}
                      className="secondary-button px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <XCircle size={13} /> Отклонить
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <StateCard
              icon={<BrainCircuit size={18} />}
              title="Очередь обработана"
              description="Новые кандидаты появятся после ответов менеджера в диалогах."
            />
          )}
        </KnowledgeSection>
      </section>
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
    <div className="flex items-center gap-4 px-5 py-4 md:px-6">
      <span className="font-mono text-xs font-black text-[#2463eb]">
        {number}
      </span>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.12em] text-neutral-400">
          {label}
        </p>
        <p className="mt-1 text-sm font-bold">{value}</p>
      </div>
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
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-[#d9e1ec] bg-white/75 px-5 py-7 md:px-6 md:py-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="flex gap-4">
          <span className="pt-1 font-mono text-xs font-black text-[#2463eb]">
            {number}
          </span>
          <div>
            <h2 className="text-xl font-black">{title}</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-500">
              {description}
            </p>
          </div>
        </div>
        {action}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function StatusPill({ status }: { status: string }) {
  const className =
    status === "ready"
      ? "bg-emerald-100 text-emerald-700"
      : status === "archived"
        ? "bg-neutral-200 text-neutral-700"
        : status === "failed"
          ? "bg-red-100 text-red-700"
          : "bg-[#eaf1ff] text-[#1546ad]";

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-center text-xs font-black ${className}`}
    >
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
