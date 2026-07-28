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

/** Convert document-parser errors into actionable Russian upload messages. */
export function getKnowledgeUploadErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return "Не удалось загрузить файл. Попробуйте ещё раз.";
  }

  const backendMessage = getApiErrorMessage(error, "").trim();
  const message = backendMessage.toLowerCase();

  if (message.includes("xlsx") && message.includes("could not be read")) {
    return "Не удалось прочитать таблицу XLSX. Проверьте, что файл открывается в Excel, не защищён паролем и сохранён в формате .xlsx, затем попробуйте снова.";
  }
  if (message.includes("docx") && message.includes("could not be read")) {
    return "Не удалось прочитать документ DOCX. Проверьте, что файл открывается, не защищён паролем и сохранён в формате .docx, затем попробуйте снова.";
  }
  if (message.includes("pdf") && message.includes("could not be read")) {
    return "Не удалось прочитать PDF. Проверьте, что файл не повреждён и не защищён паролем, затем попробуйте снова.";
  }
  if (message.includes("uploaded file is not a valid")) {
    return "Содержимое файла не соответствует его формату. Проверьте, что файл не повреждён и имеет правильное расширение, затем попробуйте снова.";
  }
  if (message.includes("unsupported file type")) {
    return "Этот формат не поддерживается. Загрузите файл PDF, DOCX, XLSX, MD или TXT.";
  }
  if (message.includes("content type") && message.includes("does not match")) {
    return "Тип файла не соответствует его расширению. Пересохраните документ в поддерживаемом формате и попробуйте снова.";
  }
  if (message.includes("uploaded file is empty")) {
    return "Файл пустой. Выберите файл с содержимым и попробуйте снова.";
  }
  if (message.includes("uploaded file exceeds")) {
    return "Файл слишком большой. Максимальный размер — 10 МБ.";
  }
  if (message.includes("encrypted pdf")) {
    return "PDF защищён паролем. Снимите защиту и загрузите файл снова.";
  }
  if (message.includes("pdf exceeds") && message.includes("page limit")) {
    return "В PDF слишком много страниц. Разделите документ на несколько файлов и загрузите их отдельно.";
  }
  if (message.includes("xlsx exceeds") && message.includes("sheet limit")) {
    return "В таблице слишком много листов. Разделите её на несколько файлов и загрузите их отдельно.";
  }
  if (message.includes("xlsx contains too many rows or cells")) {
    return "Таблица слишком большая для обработки. Разделите её на несколько файлов или удалите лишние строки и столбцы.";
  }
  if (message.includes("contains too many archive entries") || message.includes("expands beyond")) {
    return "Документ слишком сложный или большой после распаковки. Упростите его или разделите на несколько файлов.";
  }
  if (message.includes("no extractable text was found")) {
    return message.includes("ocr")
      ? "В файле не найден текст. Похоже, PDF состоит из изображений: распознайте текст (OCR) и загрузите документ снова."
      : "В файле не найден текст для базы знаний. Проверьте содержимое документа и попробуйте снова.";
  }
  if (message.includes("extracted text exceeds")) {
    return "В документе слишком много текста. Разделите его на несколько файлов и загрузите их отдельно.";
  }
  if (message.includes("txt and md files must use utf-8")) {
    return "Не удалось прочитать текстовый файл. Сохраните его в кодировке UTF-8 и попробуйте снова.";
  }
  if (message.includes("text files cannot contain nul bytes")) {
    return "Текстовый файл имеет неподдерживаемое содержимое. Пересохраните его как обычный TXT или MD в кодировке UTF-8.";
  }

  if (/[а-яё]/i.test(backendMessage)) return backendMessage;
  if (error.response?.status === 413) {
    return "Файл слишком большой или сложный для обработки. Уменьшите его или разделите на несколько файлов.";
  }
  if (error.response?.status === 415) {
    return "Не удалось распознать формат файла. Загрузите исправный PDF, DOCX, XLSX, MD или TXT.";
  }
  if (!error.response) {
    return "Не удалось связаться с сервером. Проверьте подключение к интернету и попробуйте снова.";
  }
  return "Не удалось обработать файл. Проверьте, что он не повреждён, и попробуйте снова.";
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
