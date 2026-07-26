import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import KnowledgePage from "@/app/knowledge/page";

describe("Knowledge page", () => {
  it("shows documents, search and answer testing", () => {
    render(<KnowledgePage />);

    expect(screen.getByRole("heading", { name: "База знаний" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Документы" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Проверить ответ" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Найти документ или ответ")).toBeInTheDocument();
  });
});
