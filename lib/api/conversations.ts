import { apiClient } from "@/lib/api/client";
import type { ConversationThreadResponse } from "@/lib/api/generated/ai.schemas";

export function markConversationRead(conversationId: string) {
  return apiClient<ConversationThreadResponse>({
    url: `/api/v1/conversations/${conversationId}/read`,
    method: "POST",
  });
}
