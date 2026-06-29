import axios from "axios";

type ApiErrorDetail = string | { msg?: string }[] | { msg?: string } | undefined;

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const detail = error.response?.data?.detail as ApiErrorDetail;
  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    const firstMessage = detail.find((item) => item?.msg)?.msg;
    if (firstMessage) {
      return firstMessage;
    }
  }

  if (isMessageDetail(detail)) {
    return detail.msg;
  }

  if (error.message) {
    return error.message;
  }

  return fallback;
}

function isMessageDetail(detail: ApiErrorDetail): detail is { msg: string } {
  return (
    typeof detail === "object" &&
    detail !== null &&
    !Array.isArray(detail) &&
    typeof detail.msg === "string"
  );
}
