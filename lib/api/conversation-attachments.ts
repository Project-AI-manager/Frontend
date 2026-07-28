import type { ConversationActionResponse } from "@/lib/api/generated/ai.schemas";

import { axiosInstance } from "./client";

export type ConversationAttachment = {
  id?: string;
  name?: string;
  filename?: string;
  content_type?: string;
  mime_type?: string;
  size_bytes?: number;
  download_url?: string;
  url?: string;
};

export async function replyToConversationWithFile({
  conversationId,
  text,
  file,
}: {
  conversationId: string;
  text?: string;
  file: File;
}) {
  const data = new FormData();
  const normalizedText = text?.trim();

  if (normalizedText) data.append("text", normalizedText);
  data.append("file", file);

  const response = await axiosInstance.request<ConversationActionResponse>({
    url: `/api/v1/conversations/${conversationId}/reply-with-file`,
    method: "POST",
    data,
    headers: { "Content-Type": undefined },
  });

  return response.data;
}

export async function getAuthenticatedAttachment(url: string) {
  const response = await axiosInstance.get<Blob>(url, { responseType: "blob" });
  return response.data;
}
