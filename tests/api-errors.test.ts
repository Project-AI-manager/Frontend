import axios from "axios";
import { describe, expect, it } from "vitest";

import { getApiErrorMessage } from "@/lib/api/errors";

function axiosError(detail: unknown) {
  return new axios.AxiosError("Request failed", "ERR_BAD_RESPONSE", undefined, {}, {
    data: { detail },
    status: 400,
    statusText: "Bad Request",
    headers: {},
    config: { headers: new axios.AxiosHeaders() },
  });
}

describe("getApiErrorMessage", () => {
  it("reads legacy string details", () => {
    expect(getApiErrorMessage(axiosError("Plain error"), "Fallback")).toBe("Plain error");
  });

  it("reads unified msg and message details", () => {
    expect(getApiErrorMessage(axiosError({ msg: "Short message" }), "Fallback")).toBe(
      "Short message",
    );
    expect(getApiErrorMessage(axiosError({ message: "Long message" }), "Fallback")).toBe(
      "Long message",
    );
  });

  it("reads nested validation errors and legacy validation arrays", () => {
    expect(
      getApiErrorMessage(
        axiosError({ code: "validation_error", errors: [{ msg: "Email is invalid" }] }),
        "Fallback",
      ),
    ).toBe("Email is invalid");
    expect(getApiErrorMessage(axiosError([{ msg: "Password is required" }]), "Fallback")).toBe(
      "Password is required",
    );
  });

  it("uses network messages only when there is no response", () => {
    expect(getApiErrorMessage(new axios.AxiosError("Network Error"), "Fallback")).toBe(
      "Network Error",
    );
    expect(getApiErrorMessage(axiosError({ code: "unknown" }), "Fallback")).toBe("Fallback");
  });

  it("uses fallback for non-Axios errors", () => {
    expect(getApiErrorMessage(new Error("Boom"), "Fallback")).toBe("Fallback");
  });
});
