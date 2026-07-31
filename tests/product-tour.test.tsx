import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProductTour } from "@/components/onboarding/product-tour";

const users = vi.hoisted(() => ({
  me: vi.fn(),
  markSeen: vi.fn(),
}));

const navigation = vi.hoisted(() => ({
  pathname: "/inbox",
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ push: navigation.push, replace: navigation.replace }),
}));

vi.mock("@/lib/api/generated/users/users", () => ({
  getUsers: () => ({
    meApiV1UsersMeGet: users.me,
    markOnboardingSeenApiV1UsersMeOnboardingSeenPost: users.markSeen,
  }),
}));

function addTarget(
  name: string,
  bounds: Partial<DOMRect> = {},
  borderRadius = "8px",
) {
  const target = document.createElement("div");
  target.dataset.tour = name;
  target.style.borderRadius = borderRadius;
  const left = bounds.left ?? 240;
  const top = bounds.top ?? 120;
  const width = bounds.width ?? 400;
  const height = bounds.height ?? 300;
  target.getBoundingClientRect = () => ({
    x: left,
    y: top,
    top,
    left,
    right: bounds.right ?? left + width,
    bottom: bounds.bottom ?? top + height,
    width,
    height,
    toJSON: () => ({}),
  });
  document.body.append(target);
  return target;
}

describe("ProductTour", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    navigation.pathname = "/inbox";
    navigation.push.mockReset();
    navigation.replace.mockReset();
    users.me.mockReset().mockResolvedValue({ onboarding_seen: false });
    users.markSeen.mockReset().mockResolvedValue({ onboarding_seen: true });
    localStorage.setItem("ai_manager_access_token", "access-token");
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.querySelectorAll("[data-tour]").forEach((item) => item.remove());
    document.body.style.overflow = "";
  });

  it("starts at Dialogues and explains several targets on the same page", async () => {
    addTarget("tour-nav-inbox");
    addTarget("tour-inbox-actions");

    render(<ProductTour />);

    expect(
      await screen.findByRole("dialog", {
        name: /Здесь находятся диалоги/,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("1 из 13")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Далее/ }));

    expect(
      await screen.findByRole("dialog", {
        name: /Завершённый диалог можно закрыть/,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 из 13")).toBeInTheDocument();
    expect(navigation.push).not.toHaveBeenCalled();
    expect(users.markSeen).toHaveBeenCalledTimes(1);
  });

  it("does not start again after the user has already seen it", async () => {
    users.me.mockResolvedValue({ onboarding_seen: true });
    addTarget("tour-nav-inbox");

    render(<ProductTour />);

    await waitFor(() => expect(users.me).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId("product-tour")).not.toBeInTheDocument();
    expect(users.markSeen).not.toHaveBeenCalled();
  });

  it("does not show the tour when saving the first view fails", async () => {
    users.markSeen.mockRejectedValue(new Error("network"));
    addTarget("tour-nav-inbox");

    render(<ProductTour />);

    await waitFor(() => expect(users.markSeen).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId("product-tour")).not.toBeInTheDocument();
  });

  it("navigates to Knowledge after the last Dialogues step", async () => {
    addTarget("tour-nav-inbox");
    addTarget("tour-inbox-actions");
    addTarget("tour-inbox-composer");
    render(<ProductTour />);
    await screen.findByRole("dialog");

    for (let step = 0; step < 3; step += 1) {
      fireEvent.click(screen.getByRole("button", { name: /Далее/ }));
      await act(async () => {
        vi.advanceTimersByTime(120);
      });
    }

    expect(navigation.push).toHaveBeenCalledWith("/knowledge");
    expect(screen.queryByTestId("product-tour-loading")).not.toBeInTheDocument();
  });

  it("waits for a delayed target instead of placing an empty spotlight", async () => {
    render(<ProductTour />);
    expect(screen.queryByTestId("product-tour-loading")).not.toBeInTheDocument();

    addTarget("tour-nav-inbox");
    await act(async () => {
      vi.advanceTimersByTime(150);
    });

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByTestId("product-tour-spotlight")).toBeInTheDocument();
  });

  it("uses the exact target bounds and its existing corner radius", async () => {
    addTarget(
      "tour-nav-inbox",
      { left: 28, top: 72, width: 188, height: 40 },
      "8px",
    );

    render(<ProductTour />);

    const spotlight = await screen.findByTestId("product-tour-spotlight");
    expect(spotlight).toHaveStyle({
      left: "28px",
      top: "72px",
      width: "188px",
      height: "40px",
    });
    expect(spotlight.style.borderRadius).toBe("8px");
  });

  it("can be skipped and restores page scrolling", async () => {
    addTarget("tour-nav-inbox");
    render(<ProductTour />);
    await screen.findByRole("dialog");
    await waitFor(() => expect(document.body.style.overflow).toBe("hidden"));

    fireEvent.click(screen.getByRole("button", { name: "Пропустить" }));

    expect(screen.queryByTestId("product-tour")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });

  it("restarts from Dialogues when mounted after a full reload on another tour page", async () => {
    navigation.pathname = "/profile";

    render(<ProductTour />);

    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith("/inbox"),
    );
    expect(screen.queryByTestId("product-tour-loading")).not.toBeInTheDocument();
  });
});
