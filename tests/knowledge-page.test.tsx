import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import KnowledgePage from "@/app/knowledge/page";

const api = vi.hoisted(() => ({
  listDocumentsApiV1KnowledgeDocumentsGet: vi.fn(),
  getDocumentApiV1KnowledgeDocumentsDocumentIdGet: vi.fn(),
  listCandidatesApiV1KnowledgeCandidatesGet: vi.fn(),
  uploadDocumentApiV1KnowledgeDocumentsPost: vi.fn(),
  archiveDocumentApiV1KnowledgeDocumentsDocumentIdArchivePost: vi.fn(),
  askApiV1KnowledgeAskPost: vi.fn(),
  approveCandidateApiV1KnowledgeCandidatesCandidateIdApprovePost: vi.fn(),
  rejectCandidateApiV1KnowledgeCandidatesCandidateIdRejectPost: vi.fn(),
}));

vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/api/generated/knowledge/knowledge", () => ({
  getKnowledge: () => api,
}));

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
      <KnowledgePage />
    </QueryClientProvider>,
  );
}

describe("KnowledgePage live actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.listDocumentsApiV1KnowledgeDocumentsGet.mockResolvedValue([]);
    api.listCandidatesApiV1KnowledgeCandidatesGet.mockResolvedValue([
      {
        id: "candidate-1",
        conversation_id: "conversation-1",
        question: "Есть доставка?",
        answer: "Да, по всей России.",
        suggested_by: "Менеджер",
        status: "pending",
        resulting_document_id: null,
        created_at: "2026-07-21T10:00:00Z",
        updated_at: "2026-07-21T10:00:00Z",
      },
    ]);
    api.uploadDocumentApiV1KnowledgeDocumentsPost.mockResolvedValue({
      id: "document-1",
    });
    api.askApiV1KnowledgeAskPost.mockResolvedValue({
      answer: "Подключение занимает один день.",
      confidence: 0.92,
      decision: "auto_reply",
      sources: [],
    });
    api.approveCandidateApiV1KnowledgeCandidatesCandidateIdApprovePost.mockResolvedValue(
      {},
    );
    api.rejectCandidateApiV1KnowledgeCandidatesCandidateIdRejectPost.mockResolvedValue(
      {},
    );
  });

  it("creates a document and sends a real verification question", async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText("Название"), {
      target: { value: "Доставка" },
    });
    fireEvent.change(screen.getByLabelText("Содержание"), {
      target: { value: "Доставляем по всей России." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Добавить в базу" }));

    await waitFor(() =>
      expect(
        api.uploadDocumentApiV1KnowledgeDocumentsPost,
      ).toHaveBeenCalledWith({
        title: "Доставка",
        text: "Доставляем по всей России.",
        source_type: "manual",
        tags: { source: "manual-ui" },
      }),
    );

    fireEvent.change(screen.getByLabelText("Вопрос клиента"), {
      target: { value: "Сколько занимает подключение?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Проверить ответ" }));

    expect(
      await screen.findByText("Подключение занимает один день."),
    ).toBeInTheDocument();
    expect(api.askApiV1KnowledgeAskPost).toHaveBeenCalledWith({
      message: "Сколько занимает подключение?",
    });
  });

  it("approves a pending knowledge candidate", async () => {
    renderPage();

    expect(await screen.findByText("Есть доставка?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Принять" }));

    await waitFor(() =>
      expect(
        api.approveCandidateApiV1KnowledgeCandidatesCandidateIdApprovePost,
      ).toHaveBeenCalledWith("candidate-1"),
    );
  });
});
