"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, FileText, Loader2, MoreHorizontal, Plus, RefreshCw, Search, Upload } from "lucide-react";
import { type ChangeEvent, type DragEvent, useMemo, useRef, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { apiClient } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { KnowledgeDocumentResponse } from "@/lib/api/generated/ai.schemas";
import { getKnowledge } from "@/lib/api/generated/knowledge/knowledge";

const api = getKnowledge();
const supportedFormats = ".pdf,.docx,.xlsx,.md,.txt";

export default function KnowledgePage() {
  const client = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"new" | "old">("new");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const documents = useQuery({
    queryKey: ["knowledge", "documents"],
    queryFn: () => api.listDocumentsApiV1KnowledgeDocumentsGet(),
    retry: 1,
  });

  const shown = useMemo(
    () => normalizeDocuments(documents.data)
      .filter((document) => document.status !== "archived")
      .filter((document) => document.title.toLowerCase().includes(search.trim().toLowerCase()))
      .sort((a, b) => sort === "new"
        ? Date.parse(b.updated_at) - Date.parse(a.updated_at)
        : Date.parse(a.updated_at) - Date.parse(b.updated_at)),
    [documents.data, search, sort],
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
    onSuccess: async () => {
      setError(null);
      setNotice("Файл добавлен в базу знаний.");
      await client.invalidateQueries({ queryKey: ["knowledge", "documents"] });
    },
    onError: (mutationError) => {
      setNotice(null);
      setError(getApiErrorMessage(mutationError, "Не удалось загрузить файл."));
    },
  });

  const archive = useMutation({
    mutationFn: (id: string) => api.archiveDocumentApiV1KnowledgeDocumentsDocumentIdArchivePost(id),
    onSuccess: async () => {
      setError(null);
      setNotice("Файл убран из базы знаний.");
      await client.invalidateQueries({ queryKey: ["knowledge", "documents"] });
    },
    onError: (mutationError) => {
      setNotice(null);
      setError(getApiErrorMessage(mutationError, "Не удалось убрать файл."));
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

  async function refreshKnowledge() {
    setNotice(null);
    setError(null);
    try {
      await documents.refetch();
      setNotice("База знаний обновлена.");
    } catch (refreshError) {
      setError(getApiErrorMessage(refreshError, "Не удалось обновить базу знаний."));
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
          <button type="button" onClick={() => fileInput.current?.click()} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-[#d9e1ec] bg-white px-4 text-sm font-semibold hover:border-[#c9d6e8] hover:bg-[#f4f7fb]">
            <Upload size={17} strokeWidth={1.85} /> Загрузить файл
          </button>
          <input ref={fileInput} type="file" multiple className="hidden" accept={supportedFormats} onChange={(event: ChangeEvent<HTMLInputElement>) => { if (event.target.files) void addFiles(event.target.files); event.target.value = ""; }} />
        </header>

        <main className="relative flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto px-8 pb-7 pt-6">
          {error ? <p role="alert" className="rounded-lg border border-[#d84545]/30 bg-[#fdeded] px-4 py-3 text-sm text-[#a72f2f]">{error}</p> : null}
          {notice ? <p role="status" className="rounded-lg border border-[#13a66b]/25 bg-[#e8f7f0] px-4 py-3 text-sm text-[#08724b]">{notice}</p> : null}

          {documents.isLoading ? <CardSkeleton /> : documents.error ? (
            <State title="Файлы не загрузились" text={getApiErrorMessage(documents.error, "Ошибка запроса к серверу.")} action="Повторить" onAction={() => documents.refetch()} />
          ) : shown.length === 0 ? (
            <State title={search.trim() ? "По запросу ничего не найдено" : "В базе знаний пока нет файлов"} text={search.trim() ? "Попробуйте изменить поисковый запрос." : undefined} action={search.trim() ? undefined : "Загрузить файл"} onAction={() => fileInput.current?.click()} />
          ) : (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
              {shown.map((document) => <DocumentCard key={document.id} document={document} onArchive={() => archive.mutate(document.id)} disabled={archive.isPending} />)}
              <UploadCard onClick={() => fileInput.current?.click()} onFiles={addFiles} />
            </div>
          )}

          <footer className="mt-auto flex min-h-[68px] shrink-0 flex-col gap-3 rounded-lg border border-[#d9e1ec] bg-white px-5 py-3 shadow-[0_10px_22px_rgba(18,39,76,.07)] sm:flex-row sm:items-center sm:justify-between">
            <p className="flex min-w-0 flex-wrap items-center gap-2.5 text-sm text-[#101828]">
              <span className="size-2 shrink-0 rounded-full bg-[#13a66b]" />
              <span>База знаний обновлена {latestUpdate(shown)}</span>
              <span className="tabular-nums text-[#64717f]">· {shown.length} {fileWord(shown.length)}</span>
            </p>
            <button type="button" onClick={() => void refreshKnowledge()} disabled={documents.isFetching} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#2463eb] bg-[#2463eb] px-[18px] text-sm font-semibold text-white shadow-[0_11px_25px_rgba(36,99,235,.2)] hover:bg-[#1546ad] disabled:opacity-60">
              {documents.isFetching ? <Loader2 size={17} className="animate-spin" /> : <RefreshCw size={17} strokeWidth={1.85} />}
              Обновить базу знаний
            </button>
          </footer>
        </main>
      </div>
    </AppShell>
  );
}

function DocumentCard({ document, onArchive, disabled }: { document: KnowledgeDocumentResponse; onArchive: () => void; disabled: boolean }) {
  const extension = displayExtension(document);
  const isReady = document.status === "ready";
  return (
    <article className="flex min-h-[168px] flex-col gap-3 rounded-lg border border-[#d9e1ec] bg-white p-4 shadow-[0_10px_22px_rgba(18,39,76,.07)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(18,39,76,.09)]">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#d9e1ec] font-heading text-[10px] font-extrabold tracking-[.04em] text-[#526071]">{extension}</span>
        <button type="button" aria-label={`Меню файла ${document.title}`} title="Убрать из базы знаний" onClick={onArchive} disabled={disabled} className="ml-auto flex size-10 items-center justify-center rounded-lg text-[#64717f] hover:bg-[#f4f7fb] disabled:opacity-50"><MoreHorizontal size={18} strokeWidth={1.75} /></button>
      </div>
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

function CardSkeleton() { return <div role="status" aria-label="Загружаем документы" className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-[168px] animate-pulse rounded-lg bg-[#e5eaf1]" />)}</div>; }

function State({ title, text, action, onAction }: { title: string; text?: string; action?: string; onAction?: () => void }) { return <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-[#d9e1ec] bg-white p-8 text-center"><FileText size={28} className="text-[#2463eb]" /><h2 className="mt-4 font-heading font-extrabold">{title}</h2>{text ? <p className="mt-2 text-sm text-[#526071]">{text}</p> : null}{action ? <button type="button" onClick={onAction} className="mt-4 min-h-10 rounded-lg bg-[#2463eb] px-4 text-sm font-semibold text-white">{action}</button> : null}</div>; }
function normalizeDocuments(value?: KnowledgeDocumentResponse[]) { return Array.isArray(value) ? value : []; }
function fileExtension(name: string) { return name.split(".").pop()?.toLowerCase() || "txt"; }
function displayExtension(document: KnowledgeDocumentResponse) { const value = fileExtension(document.title); if (value !== document.title.toLowerCase()) return value.slice(0, 4).toUpperCase(); return document.source_type === "manual" ? "TXT" : document.source_type.slice(0, 4).toUpperCase(); }
function fileSize(document: KnowledgeDocumentResponse) { return document.chunks_count ? `${document.chunks_count} ${document.chunks_count === 1 ? "фрагмент" : "фрагм."}` : "0 фрагм."; }
function updatedLabel(value: string) { const date = new Date(value); if (Number.isNaN(date.getTime())) return value; const today = new Date(); const sameDay = date.toDateString() === today.toDateString(); const time = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(date); if (sameDay) return `сегодня, ${time}`; return `${new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(date)}, ${time}`; }
function latestUpdate(documents: KnowledgeDocumentResponse[]) { if (!documents.length) return "только что"; const latest = [...documents].sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))[0]; const diff = Date.now() - Date.parse(latest.updated_at); if (diff >= 0 && diff < 60 * 60 * 1000) return `${Math.max(1, Math.floor(diff / 60000))} мин назад`; if (diff >= 0 && diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)} ч назад`; return updatedLabel(latest.updated_at); }
function fileWord(count: number) { const mod10 = count % 10; const mod100 = count % 100; if (mod10 === 1 && mod100 !== 11) return "файл"; if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "файла"; return "файлов"; }
