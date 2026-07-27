import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import KnowledgePage from "@/app/knowledge/page";

const api = vi.hoisted(() => ({
  listDocumentsApiV1KnowledgeDocumentsGet: vi.fn(),
  uploadDocumentApiV1KnowledgeDocumentsPost: vi.fn(),
  archiveDocumentApiV1KnowledgeDocumentsDocumentIdArchivePost: vi.fn(),
}));

vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/api/generated/knowledge/knowledge", () => ({
  getKnowledge: () => api,
}));

const documents = [
  {
    id: "document-1",
    title: "Сроки и оплата.pdf",
    source_type: "manual",
    storage_url: null,
    status: "ready",
    version: 1,
    chunks_count: 3,
    created_at: "2026-07-12T07:12:00Z",
    updated_at: "2026-07-12T07:12:00Z",
  },
  {
    id: "document-2",
    title: "Прайс 2026.xlsx",
    source_type: "manual",
    storage_url: null,
    status: "processing",
    version: 1,
    chunks_count: 0,
    created_at: "2026-07-27T08:20:00Z",
    updated_at: "2026-07-27T08:20:00Z",
  },
];

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><KnowledgePage /></QueryClientProvider>);
}

describe("KnowledgePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.listDocumentsApiV1KnowledgeDocumentsGet.mockResolvedValue(documents);
    api.uploadDocumentApiV1KnowledgeDocumentsPost.mockResolvedValue(documents[0]);
    api.archiveDocumentApiV1KnowledgeDocumentsDocumentIdArchivePost.mockResolvedValue({ document: { ...documents[0], status: "archived" } });
  });

  it("renders the file grid in the reference layout", async () => {
    renderPage();

    expect(await screen.findByText("Сроки и оплата.pdf")).toBeInTheDocument();
    expect(screen.getByText("Прайс 2026.xlsx")).toBeInTheDocument();
    expect(screen.getByText("PDF")).toBeInTheDocument();
    expect(screen.getByText("XLSX")).toBeInTheDocument();
    expect(screen.getByText("В базе")).toBeInTheDocument();
    expect(screen.getByText("Не в базе")).toBeInTheDocument();
    expect(screen.getByText("Перетащите файлы")).toBeInTheDocument();
    expect(screen.getByText("PDF, DOCX, XLSX, MD, TXT, PNG, JPG")).toBeInTheDocument();
    expect(screen.getByText("Обновить базу знаний")).toBeInTheDocument();
  });

  it("searches, sorts and refreshes live documents", async () => {
    renderPage();
    await screen.findByText("Сроки и оплата.pdf");

    fireEvent.change(screen.getByPlaceholderText("Поиск по файлам"), { target: { value: "Прайс" } });
    expect(screen.getByText("Прайс 2026.xlsx")).toBeInTheDocument();
    expect(screen.queryByText("Сроки и оплата.pdf")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Сначала новые" }));
    expect(screen.getByRole("button", { name: "Сначала старые" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Обновить базу знаний" }));
    await waitFor(() => expect(api.listDocumentsApiV1KnowledgeDocumentsGet).toHaveBeenCalledTimes(2));
  });

  it("uploads supported text files through the existing API", async () => {
    renderPage();
    await screen.findByText("Сроки и оплата.pdf");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["Условия доставки"], "delivery.md", { type: "text/markdown" });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(api.uploadDocumentApiV1KnowledgeDocumentsPost).toHaveBeenCalledWith({
      title: "delivery.md",
      text: "Условия доставки",
      source_type: "md",
      tags: { filename: "delivery.md", mime: "text/markdown", size_bytes: String(file.size), extension: "md" },
    }));
  });

  it("archives a file from its ellipsis action", async () => {
    renderPage();
    await screen.findByText("Сроки и оплата.pdf");

    fireEvent.click(screen.getByRole("button", { name: "Меню файла Сроки и оплата.pdf" }));

    await waitFor(() => expect(api.archiveDocumentApiV1KnowledgeDocumentsDocumentIdArchivePost).toHaveBeenCalledWith("document-1"));
  });

  it("shows the reference empty state", async () => {
    api.listDocumentsApiV1KnowledgeDocumentsGet.mockResolvedValueOnce([]);
    renderPage();

    expect(await screen.findByText("В базе знаний пока нет файлов")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Загрузить файл" })).toHaveLength(2);
  });
});
