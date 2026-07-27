"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, FileText, Loader2, MoreHorizontal, Plus, RefreshCw, Search, Upload } from "lucide-react";
import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { KnowledgeDocumentCreate, KnowledgeDocumentResponse } from "@/lib/api/generated/ai.schemas";
import { getKnowledge } from "@/lib/api/generated/knowledge/knowledge";

const api = getKnowledge();

export default function KnowledgePage() {
  const client = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"new" | "old">("new");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const documents = useQuery({ queryKey: ["knowledge", "documents"], queryFn: () => api.listDocumentsApiV1KnowledgeDocumentsGet(), retry: 1 });
  const candidates = useQuery({ queryKey: ["knowledge", "candidates"], queryFn: () => api.listCandidatesApiV1KnowledgeCandidatesGet(), retry: 1 });
  const upload = useMutation({
    mutationFn: (payload: KnowledgeDocumentCreate) => api.uploadDocumentApiV1KnowledgeDocumentsPost(payload),
    onSuccess: async () => { setUploadError(null); await client.invalidateQueries({ queryKey: ["knowledge", "documents"] }); },
    onError: (error) => setUploadError(getApiErrorMessage(error, "Не удалось загрузить файл.")),
  });
  const approve = useMutation({
    mutationFn: (id: string) => api.approveCandidateApiV1KnowledgeCandidatesCandidateIdApprovePost(id),
    onSuccess: async () => Promise.all([client.invalidateQueries({ queryKey: ["knowledge", "documents"] }), client.invalidateQueries({ queryKey: ["knowledge", "candidates"] })]),
  });

  const shown = useMemo(() => [...(documents.data ?? [])].filter((document) => document.title.toLowerCase().includes(search.toLowerCase())).sort((a, b) => (sort === "new" ? Date.parse(b.updated_at) - Date.parse(a.updated_at) : Date.parse(a.updated_at) - Date.parse(b.updated_at))), [documents.data, search, sort]);

  async function addFiles(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      const text = await file.text().catch(() => "");
      if (!text.trim()) { setUploadError(`Файл «${file.name}» не содержит доступного текста.`); continue; }
      const ext = file.name.split(".").pop()?.toLowerCase();
      upload.mutate({ title: file.name, text, source_type: ext === "md" ? "md" : ext === "txt" ? "txt" : "manual", tags: { filename: file.name, mime: file.type || "text/plain" } });
    }
  }

  return (
    <AppShell title="База знаний" description="Файлы и материалы, на которые опирается ассистент.">
      <div className="relative min-h-[720px] overflow-hidden rounded-lg border border-[#d9e1ec] bg-[#f4f7fb] p-5 shadow-[0_18px_42px_rgba(18,39,76,.09)] soft-grid sm:p-7">
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <label className="flex min-h-10 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-[#d9e1ec] bg-white px-4 focus-within:border-[#2463eb] focus-within:ring-3 focus-within:ring-[#eaf1ff]"><Search size={16} className="text-[#64717f]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск по файлам" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
          <select aria-label="Сортировка" value={sort} onChange={(event) => setSort(event.target.value as "new" | "old")} className="min-h-10 rounded-lg border border-[#d9e1ec] bg-white px-4 text-sm font-semibold outline-none"><option value="new">Сначала новые</option><option value="old">Сначала старые</option></select>
          <button type="button" onClick={() => input.current?.click()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#d9e1ec] bg-white px-4 text-sm font-semibold hover:bg-[#f4f7fb]"><Upload size={17} /> Загрузить файл</button>
          <input ref={input} type="file" multiple className="hidden" accept=".txt,.md,.csv,.json,.html" onChange={(event: ChangeEvent<HTMLInputElement>) => event.target.files && addFiles(event.target.files)} />
        </div>

        {uploadError && <p className="relative mt-4 rounded-lg border border-[#d84545]/30 bg-[#fdeded] p-3 text-sm text-[#a72f2f]">{uploadError}</p>}
        <div className="relative mt-5">
          {documents.isLoading ? <CardSkeleton /> : documents.error ? <State title="Файлы не загрузились" text={getApiErrorMessage(documents.error, "Ошибка запроса.")} action="Повторить" onAction={() => documents.refetch()} /> : shown.length === 0 ? <State title="В базе знаний пока нет файлов" action="Загрузить файл" onAction={() => input.current?.click()} /> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {shown.map((document) => <DocumentCard key={document.id} document={document} />)}
            <button type="button" onClick={() => input.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event: DragEvent<HTMLButtonElement>) => { event.preventDefault(); addFiles(event.dataTransfer.files); }} className="flex min-h-36 flex-col items-start justify-center gap-2 rounded-lg border border-dashed border-[#c9d6e8] bg-white/75 p-4 text-left transition hover:border-[#2463eb] hover:bg-white"><span className="flex size-9 items-center justify-center rounded-lg border border-[#2463eb] text-[#2463eb]"><Plus size={18} /></span><strong className="text-sm text-[#1546ad]">Перетащите файлы</strong><span className="text-[13px] leading-5 text-[#526071]">TXT, MD, CSV, JSON, HTML</span></button>
          </div>}
        </div>

        {candidates.data && candidates.data.length > 0 && <section className="relative mt-5 rounded-lg border border-[#d9e1ec] bg-white p-4 shadow-[0_10px_22px_rgba(18,39,76,.07)]"><div className="mb-3 flex items-center justify-between"><h2 className="font-extrabold">Кандидаты для базы знаний</h2><span className="rounded-full bg-[#eaf1ff] px-2.5 py-1 text-xs font-bold text-[#1546ad]">{candidates.data.length}</span></div><div className="grid gap-3 lg:grid-cols-2">{candidates.data.map((candidate) => <article key={candidate.id} className="rounded-lg border border-[#e5eaf1] p-3"><p className="text-sm font-semibold">{candidate.question}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-[#526071]">{candidate.answer}</p><button type="button" disabled={approve.isPending} onClick={() => approve.mutate(candidate.id)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#1546ad]"><Check size={14} /> Принять</button></article>)}</div></section>}

        <footer className="relative mt-5 flex flex-col gap-3 rounded-lg border border-[#d9e1ec] bg-white px-5 py-4 shadow-[0_10px_22px_rgba(18,39,76,.07)] sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-2 text-sm"><span className="size-2 rounded-full bg-[#13a66b]" />База знаний обновлена {latestUpdate(documents.data)} <span className="text-[#64717f]">· {documents.data?.length ?? 0} файлов</span></p><button type="button" onClick={() => { documents.refetch(); candidates.refetch(); }} disabled={documents.isFetching} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#2463eb] px-4 text-sm font-semibold text-white shadow-[0_11px_25px_rgba(36,99,235,.2)] hover:bg-[#1546ad] disabled:opacity-60">{documents.isFetching ? <Loader2 size={17} className="animate-spin" /> : <RefreshCw size={17} />} Обновить базу знаний</button></footer>
      </div>
    </AppShell>
  );
}

function DocumentCard({ document }: { document: KnowledgeDocumentResponse }) { return <article className="flex min-h-36 flex-col rounded-lg border border-[#d9e1ec] bg-white p-4 shadow-[0_10px_22px_rgba(18,39,76,.07)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(18,39,76,.09)]"><div className="flex items-start gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#d9e1ec] text-[#526071]"><FileText size={18} /></span><strong className="min-w-0 flex-1 break-words text-sm">{document.title}</strong><button aria-label="Меню файла" type="button" className="flex size-8 items-center justify-center rounded-lg hover:bg-[#f4f7fb]"><MoreHorizontal size={18} /></button></div><div className="mt-auto flex items-end justify-between gap-2 pt-4"><span className={`rounded-[5px] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${document.status === "ready" ? "bg-[#e8f7f0] text-[#08724b]" : "bg-[#fff2df] text-[#b86500]"}`}>{document.status}</span><span className="text-right text-xs text-[#64717f]">{document.chunks_count} фрагм. · {date(document.updated_at)}</span></div></article>; }
function CardSkeleton() { return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-lg bg-[#e5eaf1]" />)}</div>; }
function State({ title, text, action, onAction }: { title: string; text?: string; action?: string; onAction?: () => void }) { return <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-[#d9e1ec] bg-white p-6 text-center"><h3 className="font-extrabold">{title}</h3>{text && <p className="mt-2 text-sm text-[#526071]">{text}</p>}{action && <button type="button" onClick={onAction} className="mt-4 rounded-lg bg-[#2463eb] px-4 py-2 text-sm font-semibold text-white">{action}</button>}</div>; }
function date(value: string) { return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(new Date(value)); }
function latestUpdate(value?: KnowledgeDocumentResponse[]) { if (!value?.length) return "только что"; return date([...value].sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))[0].updated_at); }
