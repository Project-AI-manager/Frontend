import axios from "axios";
import { describe, expect, it } from "vitest";

import { getApiErrorMessage, getKnowledgeUploadErrorMessage } from "@/lib/api/errors";

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

  it("does not expose a raw Axios network error to the user", () => {
    expect(getApiErrorMessage(new axios.AxiosError("Network Error"), "Fallback")).toBe(
      "Fallback",
    );
    expect(getApiErrorMessage(axiosError({ code: "unknown" }), "Fallback")).toBe("Fallback");
  });

  it("uses a localized connection message when no fallback was provided", () => {
    expect(getApiErrorMessage(new axios.AxiosError("Network Error"), "")).toBe(
      "Не удалось связаться с сервером. Проверьте, что сервер запущен, и попробуйте ещё раз.",
    );
  });

  it("uses fallback for non-Axios errors", () => {
    expect(getApiErrorMessage(new Error("Boom"), "Fallback")).toBe("Fallback");
  });
});

describe("getKnowledgeUploadErrorMessage", () => {
  it("explains an unreadable XLSX in Russian without exposing the backend message", () => {
    const message = getKnowledgeUploadErrorMessage(
      axiosError("The XLSX file could not be read"),
    );

    expect(message).toContain("Не удалось прочитать таблицу XLSX");
    expect(message).toContain("открывается в Excel");
    expect(message).not.toContain("could not be read");
  });

  it("localizes generic upload limits and unsupported media errors", () => {
    const oversized = axiosError("Unexpected parser error");
    oversized.response!.status = 413;
    const unsupported = axiosError("Unexpected parser error");
    unsupported.response!.status = 415;

    expect(getKnowledgeUploadErrorMessage(oversized)).toContain("слишком большой");
    expect(getKnowledgeUploadErrorMessage(unsupported)).toContain("PDF, DOCX, XLSX, MD или TXT");
  });

  it("does not expose an unknown English parser error", () => {
    expect(getKnowledgeUploadErrorMessage(axiosError("Workbook parser exploded"))).toBe(
      "Не удалось обработать файл. Проверьте, что он не повреждён, и попробуйте снова.",
    );
  });
});
