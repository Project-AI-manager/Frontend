import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { proxy } from "@/proxy";

describe("auth proxy", () => {
  it("redirects an authenticated visitor away from login and register", () => {
    for (const pathname of ["/login", "/register", "/password-reset", "/password-reset/confirm"]) {
      const request = new NextRequest(`https://example.test${pathname}`, {
        headers: { cookie: "refresh_token=session" },
      });
      const response = proxy(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("https://example.test/inbox");
    }
  });

  it("continues to protect cabinet routes from anonymous visitors", () => {
    const response = proxy(new NextRequest("https://example.test/inbox"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.test/login");
  });
});
