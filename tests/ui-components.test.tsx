import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InfoRow } from "@/components/ui/info-row";
import { StateCard } from "@/components/ui/state-card";

describe("StateCard", () => {
  it("renders a neutral start-aligned state with optional description", () => {
    render(
      <StateCard
        icon={<span data-testid="icon" />}
        title="Loading"
        description="Please wait"
      />,
    );

    expect(screen.getByText("Loading")).toBeInTheDocument();
    expect(screen.getByText("Please wait")).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("renders centered error states", () => {
    render(
      <StateCard icon={<span />} title="Error" tone="error" align="center" />,
    );

    const card = screen.getByText("Error").closest(".rounded-lg");
    expect(card).toHaveClass("text-center");
    expect(card).toHaveClass("text-red-700");
  });
});

describe("InfoRow", () => {
  it("renders labels and values", () => {
    render(<InfoRow label="Tenant" value="alpha" />);

    expect(screen.getByText("Tenant")).toBeInTheDocument();
    expect(screen.getByText("alpha")).toBeInTheDocument();
  });

  it("supports inverted and truncated variants", () => {
    render(
      <InfoRow label="Tenant ID" value="very-long-id" inverted truncate />,
    );

    expect(screen.getByText("Tenant ID")).toHaveClass("text-white/45");
    expect(screen.getByText("very-long-id")).toHaveClass("truncate");
  });
});
