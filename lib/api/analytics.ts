import { apiClient } from "./client";

export type AnalyticsStatusBreakdownItem = {
  status: string;
  count: number;
};

export type AnalyticsOverviewResponse = {
  dialogs_total: number;
  dialogs_open: number;
  dialogs_auto: number;
  dialogs_escalated: number;
  dialogs_closed: number;
  auto_reply_rate: number;
  escalation_rate: number;
  avg_response_sec: number;
  avg_ai_confidence: number;
  ai_replies_count: number;
  manager_replies_count: number;
  inbound_messages_count: number;
  dialogs_used: number;
  dialogs_limit: number;
  knowledge_documents_ready: number;
  knowledge_chunks_count: number;
  pending_candidates_count: number;
  status_breakdown: AnalyticsStatusBreakdownItem[];
};

export const analyticsApi = {
  getOverview: () =>
    apiClient<AnalyticsOverviewResponse>({
      url: "/api/v1/analytics/overview",
      method: "GET",
    }),
};
