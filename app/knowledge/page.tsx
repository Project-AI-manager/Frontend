"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, FileText, Loader2, MoreHorizontal, Plus, RefreshCw, Search } from "lucide-react";
import { type ChangeEvent, type DragEvent, useEffect, useMemo, useRef, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { apiClient } from "@/lib/api/client";
import { getApiErrorMessage, getKnowledgeUploadErrorMessage } from "@/lib/api/errors";
import type { KnowledgeDocumentResponse } from "@/lib/api/generated/ai.schemas";
import { getKnowledge } from "@/lib/api/generated/knowledge/knowledge";
import { formatRelativeServerTime, parseServerDateTime } from "@/lib/date-time";

const api = getKnowledge();
const supportedFormats = ".pdf,.docx,.xlsx,.md,.txt";
const feedbackDismissDelayMs = 3_000;

type KnowledgeReindexResponse = {
  documents_count: number;
  chunks_count: number;
  updated_at: string | null;
};

export default function KnowledgePage() {
  const client = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"new" | "old">("new");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastIndexedAt, setLastIndexedAt] = useState<string | null>(null);
  const [openDocumentMenuId, setOpenDocumentMenuId] = useState<string | null>(null);
  const now = useRelativeTimeClock();

  useEffect(() => {
    if (!notice && !error) return;

    const timer = window.setTimeout(() => {
      setNotice(null);
      setError(null);
    }, feedbackDismissDelayMs);

    return () => window.clearTimeout(timer);
  }, [notice, error]);

  const documents = useQuery({
    queryKey: ["knowledge", "documents"],
    queryFn: () => api.listDocumentsApiV1KnowledgeDocumentsGet(),
    retry: 1,
  });

  const activeDocuments = useMemo(
    () => normalizeDocuments(documents.data)
      .filter((document) => document.status !== "archived"),
    [documents.data],
  );

  const shown = useMemo(
    () => activeDocuments
      .filter((document) => document.title.toLowerCase().includes(search.trim().toLowerCase()))
      .sort((a, b) => sort === "new"
        ? parseServerDateTime(b.updated_at) - parseServerDateTime(a.updated_at)
        : parseServerDateTime(a.updated_at) - parseServerDateTime(b.updated_at)),
    [activeDocuments, search, sort],
  );

  const upload = useMutation({
    mutationFn: (file: File) => {
      const data = new FormData();
      data.append("file", file);
      data.append("tags", JSON.stringify({
        filename: file.name,
        mime: file.type || "application/octet-stream",
        size_bytes: String(file.size),
      }));
      return apiClient<KnowledgeDocumentResponse>({
        url: "/api/v1/knowledge/documents/upload",
        method: "POST",
        data,
      });
    },
    onSuccess: async (document) => {
      setError(null);
      setLastIndexedAt(document.updated_at);
      setNotice(`Файл добавлен: ${document.chunks_count} ${chunkWord(document.chunks_count)} проиндексировано.`);
      await client.invalidateQueries({ queryKey: ["knowledge", "documents"] });
    },
    onError: (mutationError) => {
      setNotice(null);
      setError(getKnowledgeUploadErrorMessage(mutationError));
    },
  });

  const archive = useMutation({
    mutationFn: (id: string) => api.archiveDocumentApiV1KnowledgeDocumentsDocumentIdArchivePost(id),
    onMutate: async (id) => {
      await client.cancelQueries({ queryKey: ["knowledge", "documents"] });
      const previous = client.getQueryData<KnowledgeDocumentResponse[]>(["knowledge", "documents"]);
      client.setQueryData<KnowledgeDocumentResponse[]>(
        ["knowledge", "documents"],
        (current) => current?.filter((document) => document.id !== id),
      );
      setOpenDocumentMenuId(null);
      return { previous };
    },
    onSuccess: () => {
      setError(null);
      setNotice("Файл убран из базы знаний.");
    },
    onError: (mutationError, _id, context) => {
      if (context?.previous) {
        client.setQueryData(["knowledge", "documents"], context.previous);
      }
      setNotice(null);
      setError(getApiErrorMessage(mutationError, "Не удалось убрать файл."));
    },
    onSettled: () => client.invalidateQueries({ queryKey: ["knowledge", "documents"] }),
  });

  const reindex = useMutation({
    mutationFn: () => apiClient<KnowledgeReindexResponse>({
      url: "/api/v1/knowledge/reindex",
      method: "POST",
    }),
    onSuccess: async (result) => {
      setError(null);
      setLastIndexedAt(result.updated_at);
      setNotice(`База знаний обновлена: ${result.documents_count} ${fileWord(result.documents_count)}, ${result.chunks_count} ${chunkWord(result.chunks_count)}.`);
      await client.invalidateQueries({ queryKey: ["knowledge", "documents"] });
    },
    onError: (mutationError) => {
      setNotice(null);
      setError(getApiErrorMessage(mutationError, "Не удалось обновить базу знаний. Повторите попытку через несколько секунд."));
    },
  });

  async function addFiles(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      const extension = fileExtension(file.name);
      if (!supportedFormats.split(",").includes(`.${extension}`)) {
        setNotice(null);
        setError(`Формат файла «${file.name}» не поддерживается. Загрузите TXT, MD, PDF, DOCX или XLSX.`);
        continue;
      }
      await upload.mutateAsync(file).catch(() => undefined);
    }
  }

  return (
    <AppShell title="База знаний" description="Файлы и материалы, на которые опирается ассистент." immersive>
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
        <header className="relative flex min-h-[65px] shrink-0 items-center gap-2.5 border-b border-[#d9e1ec] bg-white px-5">
          <label className="flex min-h-10 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-[#d9e1ec] bg-[#f8fbff] px-4 focus-within:border-[#2463eb] focus-within:ring-3 focus-within:ring-[#eaf1ff]">
            <Search size={16} strokeWidth={1.75} className="shrink-0 text-[#64717f]" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск по файлам" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
          </label>
          <button type="button" onClick={() => setSort((value) => value === "new" ? "old" : "new")} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-[#d9e1ec] bg-white px-[13px] text-sm font-semibold hover:bg-[#f4f7fb]">
            <ArrowDown size={16} strokeWidth={1.85} className={sort === "old" ? "rotate-180" : ""} />
            {sort === "new" ? "Сначала новые" : "Сначала старые"}
          </button>
          <input ref={fileInput} type="file" multiple className="hidden" accept={supportedFormats} onChange={(event: ChangeEvent<HTMLInputElement>) => { if (event.target.files) void addFiles(event.target.files); event.target.value = ""; }} />
        </header>

        <main className="relative flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto px-8 pb-7 pt-6">
          {documents.isLoading ? <CardSkeleton /> : documents.error ? (
            <State title="Файлы не загрузились" text={getApiErrorMessage(documents.error, "Ошибка запроса к серверу.")} action="Повторить" onAction={() => documents.refetch()} />
          ) : shown.length === 0 ? (
            search.trim() ? (
              <State title="По запросу ничего не найдено" text="Попробуйте изменить поисковый запрос." />
            ) : (
              <EmptyKnowledgeDropzone
                isUploading={upload.isPending}
                onClick={() => fileInput.current?.click()}
                onFiles={addFiles}
              />
            )
          ) : (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
              {shown.map((document) => (
                <DocumentCard
                  key={document.id}
                  document={document}
                  menuOpen={openDocumentMenuId === document.id}
                  onToggleMenu={() => setOpenDocumentMenuId((current) => current === document.id ? null : document.id)}
                  onArchive={() => archive.mutate(document.id)}
                  disabled={archive.isPending}
                />
              ))}
              <UploadCard onClick={() => fileInput.current?.click()} onFiles={addFiles} />
            </div>
          )}

          <footer className="mt-auto flex min-h-[68px] shrink-0 flex-col gap-3 rounded-lg border border-[#d9e1ec] bg-white px-5 py-3 shadow-[0_10px_22px_rgba(18,39,76,.07)] sm:flex-row sm:items-center sm:justify-between">
            <p className="flex min-w-0 flex-wrap items-center gap-2.5 text-sm text-[#101828]">
              <span className={`size-2 shrink-0 rounded-full ${activeDocuments.length ? "bg-[#13a66b]" : "bg-[#e9a52a]"}`} />
              {activeDocuments.length ? (
                <>
                  <span>База знаний обновлена {lastIndexedAt ? formatRelativeServerTime(lastIndexedAt, now) : latestUpdate(activeDocuments, now)}</span>
                  <span className="tabular-nums text-[#64717f]">· {activeDocuments.length} {fileWord(activeDocuments.length)}</span>
                </>
              ) : (
                <span className="font-medium text-[#94600b]">У вас ещё нет базы знаний</span>
              )}
            </p>
            <div className="relative w-full shrink-0 sm:w-auto">
              {error ? (
                <p role="alert" data-testid="knowledge-feedback" className="absolute right-0 bottom-[calc(100%+8px)] z-20 w-full rounded-lg border border-[#d84545]/30 bg-[#fdeded] px-4 py-3 text-sm text-[#a72f2f] shadow-[0_12px_30px_rgba(18,39,76,.13)] sm:w-[380px]">
                  {error}
                </p>
              ) : notice ? (
                <p role="status" data-testid="knowledge-feedback" className="absolute right-0 bottom-[calc(100%+8px)] z-20 w-full rounded-lg border border-[#13a66b]/25 bg-[#e8f7f0] px-4 py-3 text-sm text-[#08724b] shadow-[0_12px_30px_rgba(18,39,76,.13)] sm:w-[380px]">
                  {notice}
                </p>
              ) : null}
              <button type="button" onClick={() => reindex.mutate()} disabled={reindex.isPending || !activeDocuments.length} className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-[#2463eb] bg-[#2463eb] px-[18px] text-sm font-semibold text-white shadow-[0_11px_25px_rgba(36,99,235,.2)] hover:bg-[#1546ad] disabled:opacity-60 sm:w-auto">
                {reindex.isPending ? <Loader2 size={17} className="animate-spin" /> : <RefreshCw size={17} strokeWidth={1.85} />}
                {reindex.isPending ? "Создаём векторную базу…" : "Обновить базу знаний"}
              </button>
            </div>
          </footer>
        </main>
      </div>
    </AppShell>
  );
}

function DocumentCard({ document, menuOpen, onToggleMenu, onArchive, disabled }: { document: KnowledgeDocumentResponse; menuOpen: boolean; onToggleMenu: () => void; onArchive: () => void; disabled: boolean }) {
  const extension = displayExtension(document);
  const isReady = document.status === "ready";
  return (
    <article className="relative flex min-h-[168px] flex-col gap-3 rounded-lg border border-[#d9e1ec] bg-white p-4 shadow-[0_10px_22px_rgba(18,39,76,.07)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(18,39,76,.09)]">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#d9e1ec] font-heading text-[10px] font-extrabold tracking-[.04em] text-[#526071]">{extension}</span>
        <button type="button" aria-label={`Меню файла ${document.title}`} aria-expanded={menuOpen} onClick={onToggleMenu} disabled={disabled} className="ml-auto flex size-10 items-center justify-center rounded-lg text-[#64717f] hover:bg-[#f4f7fb] disabled:opacity-50"><MoreHorizontal size={18} strokeWidth={1.75} /></button>
      </div>
      {menuOpen ? (
        <div role="menu" aria-label={`Действия с файлом ${document.title}`} className="absolute right-4 top-[54px] z-20 min-w-[156px] rounded-lg border border-[#d9e1ec] bg-white p-1.5 shadow-[0_14px_34px_rgba(18,39,76,.16)]">
          <button type="button" role="menuitem" onClick={onArchive} disabled={disabled} className="flex min-h-9 w-full items-center rounded-md px-3 text-left text-sm font-semibold text-[#b93838] hover:bg-[#fdeded] disabled:opacity-50">
            {disabled ? "Удаляем…" : "Удалить"}
          </button>
        </div>
      ) : null}
      <h2 className="truncate text-sm font-semibold leading-[1.4]" title={document.title}>{document.title}</h2>
      <span className={`w-fit rounded-[5px] px-[9px] py-[3px] text-[11px] font-extrabold uppercase tracking-[.08em] ${isReady ? "bg-[#e6f7f0] text-[#0c7a4e]" : "bg-[#fff5df] text-[#94600b]"}`}>{isReady ? "В базе" : "Не в базе"}</span>
      <div className="mt-auto h-px bg-[#e5eaf1]" />
      <p className="text-[13px] tabular-nums text-[#64717f]">{fileSize(document)} · {updatedLabel(document.updated_at)}</p>
    </article>
  );
}

function UploadCard({ onClick, onFiles }: { onClick: () => void; onFiles: (files: FileList | File[]) => Promise<void> }) {
  return <button type="button" onClick={onClick} onDragOver={(event) => event.preventDefault()} onDrop={(event: DragEvent<HTMLButtonElement>) => { event.preventDefault(); void onFiles(event.dataTransfer.files); }} className="flex min-h-[168px] flex-col items-start justify-center gap-2 rounded-lg border border-dashed border-[#c9d6e8] bg-white/75 p-4 text-left transition hover:border-[#2463eb] hover:bg-white">
    <span className="flex size-9 items-center justify-center rounded-lg border border-[#2463eb] text-[#2463eb]"><Plus size={18} strokeWidth={1.85} /></span>
    <strong className="font-heading text-sm font-extrabold tracking-[-0.02em] text-[#1546ad]">Перетащите файлы</strong>
    <span className="text-[13px] leading-[1.5] text-[#526071]">PDF, DOCX, XLSX, MD, TXT</span>
  </button>;
}

function EmptyKnowledgeDropzone({ isUploading, onClick, onFiles }: { isUploading: boolean; onClick: () => void; onFiles: (files: FileList | File[]) => Promise<void> }) {
  const [isDragging, setIsDragging] = useState(false);
  const dragDepth = useRef(0);

  function handleDragEnter(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current += 1;
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current = 0;
    setIsDragging(false);
    if (event.dataTransfer.files.length) void onFiles(event.dataTransfer.files);
  }

  return (
    <button
      type="button"
      aria-busy={isUploading}
      aria-describedby="knowledge-supported-formats"
      onClick={onClick}
      onDragEnter={handleDragEnter}
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex min-h-[300px] w-full flex-col items-center justify-center rounded-lg border p-8 text-center transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b9ceff] ${isDragging ? "border-[#2463eb] bg-[#eef4ff] shadow-[0_0_0_4px_rgba(36,99,235,.1)]" : "border-dashed border-[#c9d6e8] bg-white hover:border-[#2463eb] hover:bg-[#f8fbff]"}`}
    >
      <span className={`flex size-12 items-center justify-center rounded-xl border transition ${isDragging ? "border-[#2463eb] bg-[#2463eb] text-white" : "border-[#b9ceff] bg-[#eef4ff] text-[#2463eb]"}`}>
        {isUploading ? <Loader2 size={22} className="animate-spin" /> : <Plus size={22} strokeWidth={1.85} />}
      </span>
      <h2 className="mt-4 font-heading font-extrabold">{isDragging ? "Отпустите файлы, чтобы загрузить" : "В базе знаний пока нет файлов"}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-[#526071]">Перетащите файлы сюда из Проводника или нажмите на эту область, чтобы выбрать их.</p>
      <span className="mt-4 rounded-lg bg-[#2463eb] px-4 py-2.5 text-sm font-semibold text-white">{isUploading ? "Загружаем…" : "Выбрать файлы"}</span>
      <p id="knowledge-supported-formats" className="mt-3 text-[13px] leading-5 text-[#64717f]">Поддерживаемые форматы: PDF, DOCX, XLSX, MD и TXT</p>
    </button>
  );
}

function CardSkeleton() { return <div role="status" aria-label="Загружаем документы" className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-[168px] animate-pulse rounded-lg bg-[#e5eaf1]" />)}</div>; }

function State({ title, text, action, onAction }: { title: string; text?: string; action?: string; onAction?: () => void }) { return <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-[#d9e1ec] bg-white p-8 text-center"><FileText size={28} className="text-[#2463eb]" /><h2 className="mt-4 font-heading font-extrabold">{title}</h2>{text ? <p className="mt-2 text-sm text-[#526071]">{text}</p> : null}{action ? <button type="button" onClick={onAction} className="mt-4 min-h-10 rounded-lg bg-[#2463eb] px-4 text-sm font-semibold text-white">{action}</button> : null}</div>; }
function normalizeDocuments(value?: KnowledgeDocumentResponse[]) { return Array.isArray(value) ? value : []; }
function fileExtension(name: string) { return name.split(".").pop()?.toLowerCase() || "txt"; }
function displayExtension(document: KnowledgeDocumentResponse) { const value = fileExtension(document.title); if (value !== document.title.toLowerCase()) return value.slice(0, 4).toUpperCase(); return document.source_type === "manual" ? "TXT" : document.source_type.slice(0, 4).toUpperCase(); }
function fileSize(document: KnowledgeDocumentResponse) { return document.chunks_count ? `${document.chunks_count} ${document.chunks_count === 1 ? "фрагмент" : "фрагм."}` : "0 фрагм."; }
function updatedLabel(value: string) { const date = new Date(parseServerDateTime(value)); if (Number.isNaN(date.getTime())) return value; const today = new Date(); const sameDay = date.toDateString() === today.toDateString(); const time = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(date); if (sameDay) return `сегодня, ${time}`; return `${new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(date)}, ${time}`; }
function latestUpdate(documents: KnowledgeDocumentResponse[], now: number) { if (!documents.length) return "только что"; const latest = [...documents].sort((a, b) => parseServerDateTime(b.updated_at) - parseServerDateTime(a.updated_at))[0]; return formatRelativeServerTime(latest.updated_at, now); }
function fileWord(count: number) { const mod10 = count % 10; const mod100 = count % 100; if (mod10 === 1 && mod100 !== 11) return "файл"; if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "файла"; return "файлов"; }
function chunkWord(count: number) { const mod10 = count % 10; const mod100 = count % 100; if (mod10 === 1 && mod100 !== 11) return "фрагмент"; if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "фрагмента"; return "фрагментов"; }

function useRelativeTimeClock() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  return now;
}
