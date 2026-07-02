import axios from "axios";

type ApiErrorMessage = {
  msg?: string;
  message?: string;
};

type ApiErrorDetail =
  | string
  | ApiErrorMessage[]
  | (ApiErrorMessage & { errors?: ApiErrorMessage[] })
  | undefined;

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const detail = error.response?.data?.detail as ApiErrorDetail;
  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    const firstMessage = detail.map(readMessage).find(Boolean);
    if (firstMessage) {
      return firstMessage;
    }
  }

  if (isMessageDetail(detail)) {
    const message = readMessage(detail);
    if (message) {
      return message;
    }

    const validationMessage = detail.errors?.map(readMessage).find(Boolean);
    if (validationMessage) {
      return validationMessage;
    }
  }

  if (!error.response && error.message) {
    return error.message;
  }

  return fallback;
}

function isMessageDetail(
  detail: ApiErrorDetail,
): detail is ApiErrorMessage & { errors?: ApiErrorMessage[] } {
  return (
    typeof detail === "object" &&
    detail !== null &&
    !Array.isArray(detail)
  );
}

function readMessage(detail: ApiErrorMessage): string | undefined {
  return typeof detail.msg === "string"
    ? detail.msg
    : typeof detail.message === "string"
      ? detail.message
      : undefined;
}
