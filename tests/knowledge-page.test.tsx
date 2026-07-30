import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import KnowledgePage from "@/app/knowledge/page";

const api = vi.hoisted(() => ({
  listDocumentsApiV1KnowledgeDocumentsGet: vi.fn(),
  uploadDocumentApiV1KnowledgeDocumentsPost: vi.fn(),
  archiveDocumentApiV1KnowledgeDocumentsDocumentIdArchivePost: vi.fn(),
}));
const apiClient = vi.hoisted(() => vi.fn());

vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/api/generated/knowledge/knowledge", () => ({
  getKnowledge: () => api,
}));
vi.mock("@/lib/api/client", () => ({ apiClient }));

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
    apiClient.mockImplementation(({ url }: { url: string }) => Promise.resolve(
      url === "/api/v1/knowledge/reindex"
        ? { documents_count: 2, chunks_count: 7, updated_at: "2026-07-27T08:20:30Z" }
        : documents[0],
    ));
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
    expect(screen.getByText("PDF, DOCX, XLSX, MD, TXT")).toBeInTheDocument();
    expect(screen.getByText("Обновить базу знаний")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Загрузить файл" })).not.toBeInTheDocument();
  });

  it("shows a just-updated UTC server timestamp without a local timezone shift", async () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-07-27T08:20:30Z"));
    api.listDocumentsApiV1KnowledgeDocumentsGet.mockResolvedValueOnce([
      { ...documents[1], status: "ready", updated_at: "2026-07-27T08:20:00" },
    ]);

    renderPage();

    expect(await screen.findByText("База знаний обновлена только что")).toBeInTheDocument();
    now.mockRestore();
  });

  it("searches, sorts and rebuilds the vector knowledge base", async () => {
    renderPage();
    await screen.findByText("Сроки и оплата.pdf");

    fireEvent.change(screen.getByPlaceholderText("Поиск по файлам"), { target: { value: "Прайс" } });
    expect(screen.getByText("Прайс 2026.xlsx")).toBeInTheDocument();
    expect(screen.queryByText("Сроки и оплата.pdf")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Сначала новые" }));
    expect(screen.getByRole("button", { name: "Сначала старые" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Обновить базу знаний" }));
    await waitFor(() => expect(apiClient).toHaveBeenCalledWith({
      url: "/api/v1/knowledge/reindex",
      method: "POST",
    }));
    await waitFor(() => expect(api.listDocumentsApiV1KnowledgeDocumentsGet).toHaveBeenCalledTimes(2));
    expect(screen.getByRole("status")).toHaveTextContent("База знаний обновлена: 2 файла, 7 фрагментов.");
    expect(screen.getByTestId("knowledge-feedback").parentElement).toContainElement(
      screen.getByRole("button", { name: "Обновить базу знаний" }),
    );
  });

  it("hides transient knowledge feedback after three seconds", async () => {
    renderPage();
    await screen.findByText("Сроки и оплата.pdf");

    vi.useFakeTimers();
    try {
      fireEvent.click(screen.getByRole("button", { name: "Обновить базу знаний" }));
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(screen.getByRole("status")).toHaveTextContent("База знаний обновлена");

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2_999);
      });
      expect(screen.getByRole("status")).toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1);
      });
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("shows an actionable Russian error instead of a raw Network Error during reindex", async () => {
    apiClient.mockRejectedValueOnce(new Error("Network Error"));
    renderPage();
    await screen.findByText("Сроки и оплата.pdf");

    fireEvent.click(screen.getByRole("button", { name: "Обновить базу знаний" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Не удалось обновить базу знаний. Повторите попытку через несколько секунд.",
    );
    expect(screen.getByRole("alert")).not.toHaveTextContent("Network Error");
  });

  it("uploads files as multipart data through the extraction endpoint", async () => {
    renderPage();
    await screen.findByText("Сроки и оплата.pdf");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["Условия доставки"], "delivery.md", { type: "text/markdown" });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(apiClient).toHaveBeenCalledTimes(1));
    const request = apiClient.mock.calls[0][0];
    expect(request.url).toBe("/api/v1/knowledge/documents/upload");
    expect(request.method).toBe("POST");
    expect(request.data).toBeInstanceOf(FormData);
    expect(request.data.get("file")).toBe(file);
    expect(screen.getByRole("status")).toHaveTextContent("3 фрагмента проиндексировано");
  });

  it("shows an actionable Russian error when an XLSX cannot be read", async () => {
    apiClient.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 422,
        data: { detail: { message: "The XLSX file could not be read" } },
      },
    });
    renderPage();
    await waitFor(() => expect(api.listDocumentsApiV1KnowledgeDocumentsGet).toHaveBeenCalled());
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, {
      target: {
        files: [new File(["broken"], "price.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })],
      },
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("Не удалось прочитать таблицу XLSX");
    expect(screen.getByRole("alert")).toHaveTextContent("открывается в Excel");
    expect(screen.getByRole("alert")).not.toHaveTextContent("could not be read");
  });

  it("opens a file menu and removes the file immediately after confirmation", async () => {
    let resolveArchive: ((value: unknown) => void) | undefined;
    api.archiveDocumentApiV1KnowledgeDocumentsDocumentIdArchivePost.mockImplementationOnce(
      () => new Promise((resolve) => { resolveArchive = resolve; }),
    );
    renderPage();
    await screen.findByText("Сроки и оплата.pdf");

    fireEvent.click(screen.getByRole("button", { name: "Меню файла Сроки и оплата.pdf" }));
    expect(api.archiveDocumentApiV1KnowledgeDocumentsDocumentIdArchivePost).not.toHaveBeenCalled();
    expect(screen.getByRole("menu", { name: "Действия с файлом Сроки и оплата.pdf" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("menuitem", { name: "Удалить" }));

    await waitFor(() => expect(api.archiveDocumentApiV1KnowledgeDocumentsDocumentIdArchivePost).toHaveBeenCalledWith("document-1"));
    expect(screen.queryByText("Сроки и оплата.pdf")).not.toBeInTheDocument();
    await act(async () => {
      resolveArchive?.({ document: { ...documents[0], status: "archived" } });
      await Promise.resolve();
    });
  });

  it("shows the reference empty state", async () => {
    api.listDocumentsApiV1KnowledgeDocumentsGet.mockResolvedValueOnce([]);
    renderPage();

    expect(await screen.findByText("В базе знаний пока нет файлов")).toBeInTheDocument();
    expect(screen.getByText("У вас ещё нет базы знаний")).toBeInTheDocument();
    expect(screen.queryByText(/База знаний обновлена/)).not.toBeInTheDocument();
    expect(screen.queryByText(/0 файлов/)).not.toBeInTheDocument();
    expect(screen.getByText("Поддерживаемые форматы: PDF, DOCX, XLSX, MD и TXT")).toBeInTheDocument();
    expect(screen.getByText(/Перетащите файлы сюда из Проводника/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Загрузить файл" })).not.toBeInTheDocument();
  });

  it("uploads a file dropped onto the empty state and shows the drag state", async () => {
    api.listDocumentsApiV1KnowledgeDocumentsGet.mockResolvedValueOnce([]);
    renderPage();

    const dropzone = await screen.findByRole("button", { name: /В базе знаний пока нет файлов/ });
    const file = new File(["Условия доставки"], "delivery.md", { type: "text/markdown" });

    fireEvent.dragEnter(dropzone, { dataTransfer: { files: [file], dropEffect: "none" } });
    expect(screen.getByText("Отпустите файлы, чтобы загрузить")).toBeInTheDocument();

    fireEvent.drop(dropzone, { dataTransfer: { files: [file], dropEffect: "copy" } });

    await waitFor(() => expect(apiClient).toHaveBeenCalledTimes(1));
    expect(apiClient.mock.calls[0][0].data.get("file")).toBe(file);
    expect(screen.queryByText("Отпустите файлы, чтобы загрузить")).not.toBeInTheDocument();
  });

  it("opens the file picker when the empty dropzone is activated", async () => {
    api.listDocumentsApiV1KnowledgeDocumentsGet.mockResolvedValueOnce([]);
    renderPage();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const click = vi.spyOn(input, "click");

    fireEvent.click(await screen.findByRole("button", { name: /В базе знаний пока нет файлов/ }));

    expect(click).toHaveBeenCalledOnce();
  });
});
