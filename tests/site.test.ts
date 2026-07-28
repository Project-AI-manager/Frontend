import { describe, expect, it } from "vitest";

import {
  getDisplaySiteUrl,
  getSiteUrl,
  SITE_HOST_DISPLAY,
  SITE_ORIGIN,
} from "@/lib/site";

describe("site URLs", () => {
  it("uses the DNS-compatible IDN form for technical URLs", () => {
    expect(SITE_ORIGIN).toBe("https://xn--80aesmncewf.space");
    expect(getSiteUrl("/legal/privacy?from=footer#data")).toBe(
      "https://xn--80aesmncewf.space/legal/privacy?from=footer#data",
    );
  });

  it("keeps the Cyrillic brand in URLs shown or copied to users", () => {
    expect(SITE_HOST_DISPLAY).toBe("автопилот.space");
    expect(getDisplaySiteUrl("/inbox/42")).toBe("https://автопилот.space/inbox/42");
  });
});
