"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Check,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Upload,
  X,
} from "lucide-react";
import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  useMemo,
  useRef,
  useState,
} from "react";

import { AppShell } from "@/components/layout/app-shell";
import { getApiErrorMessage } from "@/lib/api/errors";
import type {
  KnowledgeCandidateResponse,
  KnowledgeDocumentCreate,
  KnowledgeDocumentResponse,
  MLAnswerResponse,
} from "@/lib/api/generated/ai.schemas";
import { getKnowledge } from "@/lib/api/generated/knowledge/knowledge";

const api = getKnowledge();

export default function KnowledgePage() {
  const client = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"new" | "old">("new");
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
  const [error, setError] = useState<string | null>(null);

  const documents = useQuery({
    queryKey: ["knowledge", "documents"],
    queryFn: () => api.listDocumentsApiV1KnowledgeDocumentsGet(),
    retry: 1,
  });
  const candidates = useQuery({
    queryKey: ["knowledge", "candidates"],
    queryFn: () => api.listCandidatesApiV1KnowledgeCandidatesGet(),
    retry: 1,
  });

  const shown = useMemo(
    () =>
      [...normalizeDocuments(documents.data)]
        .filter((document) =>
          document.title.toLowerCase().includes(search.trim().toLowerCase()),
        )
        .sort((a, b) =>
          sort === "new"
            ? Date.parse(b.updated_at) - Date.parse(a.updated_at)
            : Date.parse(a.updated_at) - Date.parse(b.updated_at),
        ),
    [documents.data, search, sort],
  );
  const pendingCandidates = useMemo(
    () =>
      normalizeCandidates(candidates.data).filter(
        (candidate) => candidate.status === "pending",
      ),
    [candidates.data],
  );
  const activeDocumentId =
    selectedDocumentId ?? normalizeDocuments(documents.data)[0]?.id ?? null;
  const activeDocument = normalizeDocuments(documents.data).find(
    (document) => document.id === activeDocumentId,
  );

  const documentDetail = useQuery({
    queryKey: ["knowledge", "documents", activeDocumentId],
    queryFn: () =>
      api.getDocumentApiV1KnowledgeDocumentsDocumentIdGet(
        activeDocumentId ?? "",
      ),
    enabled: Boolean(activeDocumentId),
    retry: 1,
  });

  const upload = useMutation({
    mutationFn: (payload: KnowledgeDocumentCreate) =>
      api.uploadDocumentApiV1KnowledgeDocumentsPost(payload),
    onSuccess: async (created) => {
      setTitle("");
      setText("");
      setSelectedDocumentId(created.id);
      setError(null);
      setNotice("Документ добавлен и отправлен на обработку.");
      await client.invalidateQueries({ queryKey: ["knowledge", "documents"] });
    },
    onError: (mutationError) => {
      setNotice(null);
      setError(
        getApiErrorMessage(mutationError, "Не удалось добавить документ."),
      );
    },
  });

  const archive = useMutation({
    mutationFn: (id: string) =>
      api.archiveDocumentApiV1KnowledgeDocumentsDocumentIdArchivePost(id),
    onSuccess: async () => {
      setSelectedDocumentId(null);
      setError(null);
      setNotice("Документ архивирован.");
      await client.invalidateQueries({ queryKey: ["knowledge", "documents"] });
    },
    onError: (mutationError) => {
      setNotice(null);
      setError(
        getApiErrorMessage(
          mutationError,
          "Не удалось архивировать документ.",
        ),
      );
    },
  });

  const ask = useMutation({
    mutationFn: (message: string) =>
      api.askApiV1KnowledgeAskPost({ message }),
    onSuccess: (result) => {
      setAnswer(result);
      setError(null);
      setNotice(null);
    },
    onError: (mutationError) => {
      setAnswer(null);
      setNotice(null);
      setError(
        getApiErrorMessage(
          mutationError,
          "Не удалось получить проверочный ответ.",
        ),
      );
    },
  });

  const approve = useMutation({
    mutationFn: (id: string) =>
      api.approveCandidateApiV1KnowledgeCandidatesCandidateIdApprovePost(id),
    onSuccess: async () => {
      setError(null);
      setNotice("Кандидат принят и добавлен в базу знаний.");
      await Promise.all([
        client.invalidateQueries({ queryKey: ["knowledge", "documents"] }),
        client.invalidateQueries({ queryKey: ["knowledge", "candidates"] }),
      ]);
    },
    onError: (mutationError) => {
      setNotice(null);
      setError(
        getApiErrorMessage(mutationError, "Не удалось принять кандидата."),
      );
    },
  });

  const reject = useMutation({
    mutationFn: (id: string) =>
      api.rejectCandidateApiV1KnowledgeCandidatesCandidateIdRejectPost(id),
    onSuccess: async () => {
      setError(null);
      setNotice("Кандидат отклонён.");
      await client.invalidateQueries({ queryKey: ["knowledge", "candidates"] });
    },
    onError: (mutationError) => {
      setNotice(null);
      setError(
        getApiErrorMessage(mutationError, "Не удалось отклонить кандидата."),
      );
    },
  });

  async function addFiles(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      const fileText = await file.text().catch(() => "");
      if (!fileText.trim()) {
        setNotice(null);
        setError(`Файл «${file.name}» не содержит доступного текста.`);
        continue;
      }

      const extension = file.name.split(".").pop()?.toLowerCase();
      upload.mutate({
        title: file.name,
        text: fileText,
        source_type:
          extension === "md" ? "md" : extension === "txt" ? "txt" : "manual",
        tags: {
          filename: file.name,
          mime: file.type || "text/plain",
        },
      });
    }
  }

  function handleCreateDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedText = text.trim();

    if (!trimmedTitle || !trimmedText) {
      setNotice(null);
      setError("Заполни название и текст документа.");
      return;
    }

    upload.mutate({
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
      setNotice(null);
      setError("Напиши вопрос для проверки ответа.");
      return;
    }

    ask.mutate(trimmedQuestion);
  }

  const candidateActionPending = approve.isPending || reject.isPending;

  return (
    <AppShell
      title="База знаний"
      description="Файлы и материалы, на которые опирается ассистент."
    >
      <div className="soft-grid relative min-h-[720px] overflow-hidden rounded-lg border border-[#d9e1ec] bg-[#f4f7fb] p-5 shadow-[0_18px_42px_rgba(18,39,76,.09)] sm:p-7">
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <label className="flex min-h-10 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-[#d9e1ec] bg-white px-4 focus-within:border-[#2463eb] focus-within:ring-3 focus-within:ring-[#eaf1ff]">
            <Search size={16} className="text-[#64717f]" />
            <span className="sr-only">Поиск по файлам</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по файлам"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </label>
          <select
            aria-label="Сортировка"
            value={sort}
            onChange={(event) => setSort(event.target.value as "new" | "old")}
            className="min-h-10 rounded-lg border border-[#d9e1ec] bg-white px-4 text-sm font-semibold outline-none"
          >
            <option value="new">Сначала новые</option>
            <option value="old">Сначала старые</option>
          </select>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#d9e1ec] bg-white px-4 text-sm font-semibold hover:bg-[#f4f7fb]"
          >
            <Upload size={17} /> Загрузить файл
          </button>
          <input
            ref={fileInput}
            type="file"
            multiple
            className="hidden"
            accept=".txt,.md,.csv,.json,.html"
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              if (event.target.files) void addFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </div>

        {error ? (
          <p
            role="alert"
            className="relative mt-4 rounded-lg border border-[#d84545]/30 bg-[#fdeded] p-3 text-sm text-[#a72f2f]"
          >
            {error}
          </p>
        ) : null}
        {notice ? (
          <p
            role="status"
            className="relative mt-4 rounded-lg border border-[#13a66b]/25 bg-[#e8f7f0] p-3 text-sm text-[#08724b]"
          >
            {notice}
          </p>
        ) : null}

        <section className="relative mt-5" aria-labelledby="knowledge-files">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="knowledge-files" className="font-extrabold">
                Материалы
              </h2>
              <p className="mt-1 text-xs text-[#64717f]">
                {normalizeDocuments(documents.data).length} документов в базе
              </p>
            </div>
            {documents.isFetching && !documents.isLoading ? (
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#526071]">
                <Loader2 size={14} className="animate-spin" /> Обновляем
              </span>
            ) : null}
          </div>

          {documents.isLoading ? (
            <CardSkeleton />
          ) : documents.error ? (
            <State
              title="Файлы не загрузились"
              text={getApiErrorMessage(documents.error, "Ошибка запроса.")}
              action="Повторить"
              onAction={() => documents.refetch()}
            />
          ) : shown.length === 0 ? (
            <State
              title={
                search.trim()
                  ? "По запросу ничего не найдено"
                  : "В базе знаний пока нет файлов"
              }
              action={search.trim() ? undefined : "Загрузить файл"}
              onAction={() => fileInput.current?.click()}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {shown.map((document) => (
                <DocumentCard
                  key={document.id}
                  document={document}
                  active={document.id === activeDocumentId}
                  onOpen={() => setSelectedDocumentId(document.id)}
                />
              ))}
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event: DragEvent<HTMLButtonElement>) => {
                  event.preventDefault();
                  void addFiles(event.dataTransfer.files);
                }}
                className="flex min-h-36 flex-col items-start justify-center gap-2 rounded-lg border border-dashed border-[#c9d6e8] bg-white/75 p-4 text-left transition hover:border-[#2463eb] hover:bg-white"
              >
                <span className="flex size-9 items-center justify-center rounded-lg border border-[#2463eb] text-[#2463eb]">
                  <Plus size={18} />
                </span>
                <strong className="text-sm text-[#1546ad]">
                  Перетащите файлы
                </strong>
                <span className="text-[13px] leading-5 text-[#526071]">
                  TXT, MD, CSV, JSON, HTML
                </span>
              </button>
            </div>
          )}
        </section>

        {activeDocumentId ? (
          <section className="relative mt-5 rounded-lg border border-[#d9e1ec] bg-white p-4 shadow-[0_10px_22px_rgba(18,39,76,.07)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[.12em] text-[#64717f]">
                  Что запомнил ассистент
                </p>
                <h2 className="mt-1 truncate font-extrabold">
                  {activeDocument?.title ?? "Документ"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => archive.mutate(activeDocumentId)}
                disabled={archive.isPending}
                className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#d9e1ec] px-4 text-sm font-semibold hover:bg-[#f4f7fb] disabled:opacity-60"
              >
                {archive.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Archive size={16} />
                )}
                {archive.isPending
                  ? "Архивируем..."
                  : "Архивировать документ"}
              </button>
            </div>

            <div className="mt-4">
              {documentDetail.isLoading ? (
                <LoadingRows label="Загружаем фрагменты" rows={3} />
              ) : documentDetail.error ? (
                <State
                  compact
                  title="Не удалось открыть документ"
                  text={getApiErrorMessage(
                    documentDetail.error,
                    "Выберите другой документ или обновите список.",
                  )}
                  action="Повторить"
                  onAction={() => documentDetail.refetch()}
                />
              ) : documentDetail.data?.chunks.length ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  {documentDetail.data.chunks.map((chunk) => (
                    <article
                      key={chunk.id}
                      className="rounded-lg border border-[#e5eaf1] bg-[#f8fafc] p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#64717f]">
                          Фрагмент #{chunk.position + 1}
                        </span>
                        <span className="rounded-full bg-[#eaf1ff] px-2 py-0.5 text-[10px] font-bold text-[#1546ad]">
                          {chunk.token_count} токенов
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#283646]">
                        {chunk.text}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-[#e5eaf1] bg-[#f8fafc] p-4 text-sm text-[#526071]">
                  Фрагментов пока нет. Документ может ещё обрабатываться.
                </p>
              )}
            </div>
          </section>
        ) : null}

        <div className="relative mt-5 grid gap-5 xl:grid-cols-2">
          <section className="rounded-lg border border-[#d9e1ec] bg-white p-4 shadow-[0_10px_22px_rgba(18,39,76,.07)] sm:p-5">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[.12em] text-[#64717f]">
                Новый материал
              </p>
              <h2 className="mt-1 font-extrabold">Добавить вручную</h2>
              <p className="mt-1 text-sm leading-5 text-[#526071]">
                Вставьте точный ответ, регламент или инструкцию.
              </p>
            </div>
            <form onSubmit={handleCreateDocument} className="space-y-3">
              <div>
                <label
                  htmlFor="knowledge-title"
                  className="mb-1.5 block text-xs font-bold text-[#526071]"
                >
                  Название
                </label>
                <input
                  id="knowledge-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Например, FAQ по доставке"
                  disabled={upload.isPending}
                  className="min-h-11 w-full rounded-lg border border-[#d9e1ec] bg-white px-3 text-sm outline-none focus:border-[#2463eb] focus:ring-3 focus:ring-[#eaf1ff]"
                />
              </div>
              <div>
                <label
                  htmlFor="knowledge-text"
                  className="mb-1.5 block text-xs font-bold text-[#526071]"
                >
                  Содержание
                </label>
                <textarea
                  id="knowledge-text"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Условия, ответы и инструкции для ассистента..."
                  disabled={upload.isPending}
                  rows={5}
                  className="w-full resize-y rounded-lg border border-[#d9e1ec] bg-white px-3 py-2.5 text-sm leading-6 outline-none focus:border-[#2463eb] focus:ring-3 focus:ring-[#eaf1ff]"
                />
              </div>
              <button
                type="submit"
                disabled={upload.isPending}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#2463eb] px-4 text-sm font-semibold text-white shadow-[0_11px_25px_rgba(36,99,235,.2)] hover:bg-[#1546ad] disabled:opacity-60"
              >
                {upload.isPending ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Plus size={17} />
                )}
                {upload.isPending ? "Добавляем..." : "Добавить в базу"}
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-[#d9e1ec] bg-white p-4 shadow-[0_10px_22px_rgba(18,39,76,.07)] sm:p-5">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[.12em] text-[#64717f]">
                Проверка поиска
              </p>
              <h2 className="mt-1 font-extrabold">Ответ по базе знаний</h2>
              <p className="mt-1 text-sm leading-5 text-[#526071]">
                Задайте вопрос так, как его написал бы клиент.
              </p>
            </div>
            <form onSubmit={handleAsk} className="flex flex-col gap-3 sm:flex-row">
              <label htmlFor="knowledge-question" className="sr-only">
                Вопрос клиента
              </label>
              <input
                id="knowledge-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Вопрос клиента"
                disabled={ask.isPending}
                className="min-h-11 min-w-0 flex-1 rounded-lg border border-[#d9e1ec] bg-white px-3 text-sm outline-none focus:border-[#2463eb] focus:ring-3 focus:ring-[#eaf1ff]"
              />
              <button
                type="submit"
                disabled={ask.isPending}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#2463eb] px-4 text-sm font-semibold text-white hover:bg-[#1546ad] disabled:opacity-60"
              >
                {ask.isPending ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : null}
                {ask.isPending ? "Проверяем..." : "Проверить ответ"}
              </button>
            </form>

            {answer ? (
              <div className="mt-4 rounded-lg border border-[#d9e1ec] bg-[#f8fafc] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-sm">Ответ AI</strong>
                  <span className="rounded-full bg-[#eaf1ff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#1546ad]">
                    Уверенность {Math.round(answer.confidence * 100)}%
                  </span>
                  <span className="rounded-full bg-[#e8f7f0] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#08724b]">
                    {answer.decision}
                  </span>
                </div>
                <p className="mt-3 break-words text-sm leading-6 text-[#283646]">
                  {answer.answer}
                </p>
                <div className="mt-3 space-y-2">
                  {answer.sources.length > 0 ? (
                    answer.sources.map((source) => (
                      <article
                        key={source.id}
                        className="rounded-lg border border-[#e5eaf1] bg-white p-3"
                      >
                        <p className="text-xs font-bold">{source.title}</p>
                        <p className="mt-1 line-clamp-3 text-xs leading-5 text-[#526071]">
                          {source.text}
                        </p>
                      </article>
                    ))
                  ) : (
                    <p className="text-xs leading-5 text-[#64717f]">
                      Источников не найдено. Добавьте материал или уточните
                      вопрос.
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <section className="relative mt-5 rounded-lg border border-[#d9e1ec] bg-white p-4 shadow-[0_10px_22px_rgba(18,39,76,.07)]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-extrabold">Кандидаты для базы знаний</h2>
              <p className="mt-1 text-xs text-[#64717f]">
                Ответы менеджеров, ожидающие проверки
              </p>
            </div>
            <span className="rounded-full bg-[#eaf1ff] px-2.5 py-1 text-xs font-bold text-[#1546ad]">
              {pendingCandidates.length}
            </span>
          </div>

          {candidates.isLoading ? (
            <LoadingRows label="Загружаем кандидатов" rows={2} />
          ) : candidates.error ? (
            <State
              compact
              title="Кандидаты не загрузились"
              text={getApiErrorMessage(candidates.error, "Ошибка запроса.")}
              action="Повторить"
              onAction={() => candidates.refetch()}
            />
          ) : pendingCandidates.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {pendingCandidates.map((candidate) => (
                <article
                  key={candidate.id}
                  className="rounded-lg border border-[#e5eaf1] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#64717f]">
                      {candidate.suggested_by}
                    </span>
                    <span className="text-[10px] text-[#64717f]">
                      {date(candidate.updated_at)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold">
                    {candidate.question}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#526071]">
                    {candidate.answer}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={candidateActionPending}
                      onClick={() => approve.mutate(candidate.id)}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#2463eb] px-3 text-xs font-bold text-white hover:bg-[#1546ad] disabled:opacity-60"
                    >
                      <Check size={14} /> Принять
                    </button>
                    <button
                      type="button"
                      disabled={candidateActionPending}
                      onClick={() => reject.mutate(candidate.id)}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#d9e1ec] px-3 text-xs font-bold text-[#526071] hover:bg-[#f4f7fb] disabled:opacity-60"
                    >
                      <X size={14} /> Отклонить
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-[#e5eaf1] bg-[#f8fafc] p-4 text-sm text-[#526071]">
              Очередь обработана. Новые кандидаты появятся после ответов
              менеджера в диалогах.
            </p>
          )}
        </section>

        <footer className="relative mt-5 flex flex-col gap-3 rounded-lg border border-[#d9e1ec] bg-white px-5 py-4 shadow-[0_10px_22px_rgba(18,39,76,.07)] sm:flex-row sm:items-center sm:justify-between">
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <span className="size-2 rounded-full bg-[#13a66b]" />
            База знаний обновлена {latestUpdate(documents.data)}
            <span className="text-[#64717f]">
              · {normalizeDocuments(documents.data).length} файлов
            </span>
          </p>
          <button
            type="button"
            onClick={() => {
              void documents.refetch();
              void candidates.refetch();
              if (activeDocumentId) void documentDetail.refetch();
            }}
            disabled={documents.isFetching || candidates.isFetching}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#2463eb] px-4 text-sm font-semibold text-white shadow-[0_11px_25px_rgba(36,99,235,.2)] hover:bg-[#1546ad] disabled:opacity-60"
          >
            {documents.isFetching || candidates.isFetching ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <RefreshCw size={17} />
            )}
            Обновить базу знаний
          </button>
        </footer>
      </div>
    </AppShell>
  );
}

function DocumentCard({
  document,
  active,
  onOpen,
}: {
  document: KnowledgeDocumentResponse;
  active: boolean;
  onOpen: () => void;
}) {
  return (
    <article
      className={`flex min-h-36 flex-col rounded-lg border bg-white p-4 shadow-[0_10px_22px_rgba(18,39,76,.07)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(18,39,76,.09)] ${
        active ? "border-[#2463eb] ring-3 ring-[#eaf1ff]" : "border-[#d9e1ec]"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#d9e1ec] text-[#526071]">
          <FileText size={18} />
        </span>
        <button
          type="button"
          onClick={onOpen}
          aria-pressed={active}
          className="min-w-0 flex-1 break-words text-left text-sm font-bold hover:text-[#1546ad]"
        >
          {document.title}
        </button>
      </div>
      <div className="mt-auto flex items-end justify-between gap-2 pt-4">
        <span
          className={`rounded-[5px] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            document.status === "ready"
              ? "bg-[#e8f7f0] text-[#08724b]"
              : document.status === "archived"
                ? "bg-[#eef1f5] text-[#526071]"
                : "bg-[#fff2df] text-[#b86500]"
          }`}
        >
          {statusLabel(document.status)}
        </span>
        <span className="text-right text-xs text-[#64717f]">
          {document.chunks_count} фрагм. · {date(document.updated_at)}
        </span>
      </div>
    </article>
  );
}

function CardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Загружаем документы"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="h-36 animate-pulse rounded-lg bg-[#e5eaf1]"
        />
      ))}
    </div>
  );
}

function LoadingRows({ label, rows }: { label: string; rows: number }) {
  return (
    <div role="status" aria-label={label} className="space-y-2">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="h-12 animate-pulse rounded-lg bg-[#e5eaf1]"
        />
      ))}
    </div>
  );
}

function State({
  title,
  text,
  action,
  onAction,
  compact = false,
}: {
  title: string;
  text?: string;
  action?: string;
  onAction?: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-[#d9e1ec] bg-white p-6 text-center ${
        compact ? "min-h-36" : "min-h-72"
      }`}
    >
      <h3 className="font-extrabold">{title}</h3>
      {text ? <p className="mt-2 text-sm text-[#526071]">{text}</p> : null}
      {action ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 rounded-lg bg-[#2463eb] px-4 py-2 text-sm font-semibold text-white"
        >
          {action}
        </button>
      ) : null}
    </div>
  );
}

function normalizeDocuments(value?: KnowledgeDocumentResponse[]) {
  return Array.isArray(value) ? value : [];
}

function normalizeCandidates(value?: KnowledgeCandidateResponse[]) {
  return Array.isArray(value) ? value : [];
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

function date(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
  }).format(parsed);
}

function latestUpdate(value?: KnowledgeDocumentResponse[]) {
  const documents = normalizeDocuments(value);
  if (!documents.length) return "только что";

  return date(
    [...documents].sort(
      (a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at),
    )[0].updated_at,
  );
}
