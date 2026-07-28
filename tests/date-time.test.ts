import { describe, expect, it } from "vitest";

import { formatRelativeServerTime, parseServerDateTime } from "@/lib/date-time";

describe("server date-time formatting", () => {
  it("treats an ISO server timestamp without an offset as UTC", () => {
    expect(parseServerDateTime("2026-07-27T08:20:00")).toBe(Date.parse("2026-07-27T08:20:00Z"));
    expect(formatRelativeServerTime("2026-07-27T08:20:00", Date.parse("2026-07-27T08:20:30Z"))).toBe("только что");
  });

  it.each([
    ["2026-07-27T08:18:00Z", "2 минуты назад"],
    ["2026-07-27T06:20:00Z", "2 часа назад"],
    ["2026-07-25T08:20:00Z", "2 дня назад"],
    ["2026-07-06T08:20:00Z", "21 день назад"],
  ])("formats %s as %s", (timestamp, expected) => {
    expect(formatRelativeServerTime(timestamp, Date.parse("2026-07-27T08:20:00Z"))).toBe(expected);
  });

  it("preserves timestamps that cannot be parsed", () => {
    expect(formatRelativeServerTime("неизвестно")).toBe("неизвестно");
  });
});
