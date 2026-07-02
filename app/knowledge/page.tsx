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
      setNotice("Документ добавлен и разрезан на chunks.");
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
        getApiErrorMessage(error, "Не удалось получить ответ playground."),
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
      setNotice("Напиши вопрос для playground.");
      return;
    }

    askMutation.mutate(trimmedQuestion);
  }

  const isCandidateActionPending =
    approveCandidateMutation.isPending || rejectCandidateMutation.isPending;

  return (
    <AppShell
      title="База знаний"
      description="Документы, playground-ответы и очередь кандидатов автообучения уже работают через backend API."
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-5">
          <div className="glass-card rounded-lg p-5">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-xl font-black">Документы</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Ручные материалы сохраняются в БД, режутся на chunks и
                  доступны RAG-поиску.
                </p>
              </div>
              <button
                type="button"
                onClick={() => refetchDocuments()}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d9e1ec] bg-white px-5 py-3 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                {isDocumentsFetching ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <RefreshCw size={16} />
                )}
                Обновить
              </button>
            </div>

            <form
              onSubmit={handleCreateDocument}
              className="mt-5 rounded-lg border border-[rgba(36,99,235,0.22)] bg-[#eaf1ff] p-4"
            >
              <div className="flex items-center gap-2 text-sm font-black text-[#1546ad]">
                <Plus size={16} />
                Добавить manual-документ
              </div>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-3 w-full rounded-lg border border-[rgba(36,99,235,0.22)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2463eb]"
                placeholder="Название: FAQ по доставке"
                disabled={createDocumentMutation.isPending}
              />
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                className="mt-3 min-h-32 w-full resize-none rounded-lg border border-[rgba(36,99,235,0.22)] bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#2463eb]"
                placeholder="Текст документа: условия, ответы, инструкции..."
                disabled={createDocumentMutation.isPending}
              />
              <button
                type="submit"
                disabled={createDocumentMutation.isPending}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#2463eb] px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {createDocumentMutation.isPending ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Plus size={15} />
                )}
                Сохранить
              </button>
            </form>

            {notice ? (
              <p className="mt-4 rounded-lg bg-white p-3 text-sm font-semibold text-neutral-700 shadow-sm">
                {notice}
              </p>
            ) : null}

            <div className="mt-5 overflow-hidden rounded-lg border border-[#d9e1ec] bg-white">
              {isDocumentsLoading ? (
                <StateCard
                  icon={<Loader2 className="animate-spin" size={18} />}
                  title="Загружаем документы"
                  align="center"
                />
              ) : documentsError ? (
                <StateCard
                  icon={<AlertCircle size={18} />}
                  title="Не удалось загрузить документы"
                  description={getApiErrorMessage(
                    documentsError,
                    "Проверь авторизацию и backend.",
                  )}
                  tone="error"
                  align="center"
                />
              ) : documents.length > 0 ? (
                documents.map((document) => (
                  <button
                    key={document.id}
                    type="button"
                    onClick={() => setSelectedDocumentId(document.id)}
                    className={`grid w-full gap-3 border-b border-[#d9e1ec] p-4 text-left transition last:border-0 hover:bg-[#eaf1ff] md:grid-cols-[1fr_110px_120px_110px] md:items-center ${
                      document.id === activeDocumentId ? "bg-[#eaf1ff]" : ""
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#eaf1ff] text-[#2463eb]">
                        <FileText size={18} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-black">{document.title}</p>
                        <p className="text-sm text-neutral-500">
                          {formatDate(document.updated_at)}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-neutral-500">
                      {document.source_type}
                    </span>
                    <StatusPill status={document.status} />
                    <span className="text-sm font-semibold text-neutral-500">
                      {document.chunks_count} chunks
                    </span>
                  </button>
                ))
              ) : (
                <StateCard
                  icon={<FileText size={18} />}
                  title="Документов пока нет"
                  description="Добавь первый manual-документ выше, чтобы playground начал отвечать по базе."
                  align="center"
                />
              )}
            </div>
          </div>

          <div className="glass-card rounded-lg p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-lg bg-[#2463eb] text-white">
                  <FileText size={18} />
                </span>
                <div>
                  <h2 className="text-xl font-black">Просмотр chunks</h2>
                  <p className="text-sm text-neutral-500">
                    Проверяем, что именно попало в память ассистента.
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
                  className="inline-flex items-center gap-2 rounded-full border border-[#d9e1ec] bg-white px-4 py-2 text-sm font-bold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {archiveDocumentMutation.isPending ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Archive size={15} />
                  )}
                  Архивировать
                </button>
              ) : null}
            </div>

            <div className="mt-5 space-y-3">
              {isDetailLoading ? (
                <StateCard
                  icon={<Loader2 className="animate-spin" size={18} />}
                  title="Загружаем chunks"
                  align="center"
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
                  align="center"
                />
              ) : documentDetail ? (
                documentDetail.chunks.map((chunk) => (
                  <article
                    key={chunk.id}
                    className="rounded-lg border border-[#d9e1ec] bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2463eb]">
                        Chunk #{chunk.position + 1}
                      </p>
                      <span className="text-xs font-semibold text-neutral-500">
                        {chunk.token_count} tokens
                      </span>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-neutral-700">
                      {chunk.text}
                    </p>
                  </article>
                ))
              ) : (
                <StateCard
                  icon={<FileText size={18} />}
                  title="Документ не выбран"
                  description="Выбери документ в списке выше, чтобы увидеть его chunks."
                  align="center"
                />
              )}
            </div>
          </div>

          <div className="glass-card rounded-lg p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-lg bg-[#2463eb] text-white">
                <Search size={18} />
              </span>
              <div>
                <h2 className="text-xl font-black">Проверить ответ</h2>
                <p className="text-sm text-neutral-500">
                  Playground использует тот же ML/RAG endpoint, но в mock-mode.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleAsk}
              className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto]"
            >
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                className="rounded-lg border border-[#d9e1ec] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2463eb]"
                placeholder="Вопрос клиента"
                disabled={askMutation.isPending}
              />
              <button
                type="submit"
                disabled={askMutation.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2463eb] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {askMutation.isPending ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Sparkles size={15} />
                )}
                Спросить
              </button>
            </form>

            {answer ? (
              <div className="mt-5 rounded-lg border border-[rgba(36,99,235,0.22)] bg-[#eaf1ff] p-4">
                <div className="flex flex-wrap items-center gap-2 text-sm font-black text-[#1546ad]">
                  <Sparkles size={16} />
                  Ответ AI · confidence {Math.round(answer.confidence * 100)}% ·{" "}
                  {answer.decision}
                </div>
                <p className="mt-3 text-sm leading-6 text-neutral-700">
                  {answer.answer}
                </p>
                <div className="mt-4 space-y-2">
                  {answer.sources.length > 0 ? (
                    answer.sources.map((source) => (
                      <div
                        key={source.id}
                        className="rounded-lg bg-white p-3 text-xs text-neutral-600 shadow-sm"
                      >
                        <p className="font-black text-neutral-800">
                          {source.title}
                        </p>
                        <p className="mt-1 line-clamp-3">{source.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-lg bg-white p-3 text-xs font-semibold text-neutral-500 shadow-sm">
                      Источников не найдено. Добавь документ или уточни вопрос.
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="glass-card h-fit rounded-lg p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-lg bg-[#eaf1ff] text-[#1546ad]">
                <BrainCircuit size={20} />
              </span>
              <div>
                <h2 className="font-black">Кандидаты</h2>
                <p className="text-sm text-neutral-500">Очередь автообучения</p>
              </div>
            </div>
            {isCandidatesFetching ? (
              <Loader2 size={18} className="animate-spin text-neutral-400" />
            ) : null}
          </div>

          <div className="mt-5 space-y-3">
            {isCandidatesLoading ? (
              <StateCard
                icon={<Loader2 className="animate-spin" size={18} />}
                title="Загружаем кандидатов"
                align="center"
              />
            ) : candidatesError ? (
              <StateCard
                icon={<AlertCircle size={18} />}
                title="Не удалось загрузить кандидатов"
                description={getApiErrorMessage(
                  candidatesError,
                  "Проверь backend.",
                )}
                tone="error"
                align="center"
              />
            ) : pendingCandidates.length > 0 ? (
              pendingCandidates.map((candidate) => (
                <article
                  key={candidate.id}
                  className="rounded-lg border border-[#d9e1ec] bg-white p-4 shadow-sm"
                >
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2463eb]">
                    {candidate.suggested_by}
                  </p>
                  <p className="mt-2 text-sm font-black leading-6">
                    {candidate.question}
                  </p>
                  <p className="mt-2 line-clamp-4 text-sm leading-6 text-neutral-600">
                    {candidate.answer}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        approveCandidateMutation.mutate(candidate.id)
                      }
                      disabled={isCandidateActionPending}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#2463eb] px-3 py-1.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <CheckCircle2 size={13} />
                      Принять
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        rejectCandidateMutation.mutate(candidate.id)
                      }
                      disabled={isCandidateActionPending}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#d9e1ec] px-3 py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <XCircle size={13} />
                      Отклонить
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <StateCard
                icon={<BrainCircuit size={18} />}
                title="Кандидатов пока нет"
                description="Они появятся после ответов менеджера в inbox."
                align="center"
              />
            )}
          </div>
        </aside>
      </div>
    </AppShell>
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
