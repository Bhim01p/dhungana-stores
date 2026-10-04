import { adminClient } from "./adminClient";
import type { PaginatedResponse } from "../types";
import { readApiResponse } from "./readResponse";

export type SupportType = "HELP" | "COMPLAINT" | "REVIEW" | "OTHER";
export type SupportStatus = "NEW" | "IN_PROGRESS" | "RESOLVED";

export interface SupportReply {
  id: string; supportMessageId?: string; body: string; responderName: string;
  createdAt: string; emailSentAt: string | null;
}

export interface SupportMessage {
  id: string; type: SupportType; status: SupportStatus; name: string;
  email: string | null; phone: string | null; subject: string; message: string;
  rating: number | null; createdAt: string; replies?: SupportReply[];
}

export const supportApi = {
  submit: async (data: { type: SupportType; name: string; email?: string; phone?: string; subject: string; message: string; rating?: number }, token?: string | null) => {
    const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(data) });
    return readApiResponse<{ message: string }>(response, "/contact");
  },
  getMine: async (token: string) => {
    const response = await fetch("/api/customers/support-messages", { headers: { Authorization: `Bearer ${token}` } });
    return readApiResponse<SupportMessage[]>(response, "/customers/support-messages");
  },
  getAll: (token: string, page: number, status?: SupportStatus) => {
    const query = new URLSearchParams({ page: String(page), limit: "20" });
    if (status) query.set("status", status);
    return adminClient.get<PaginatedResponse<SupportMessage>>(`/admin/messages?${query}`, token);
  },
  updateStatus: (token: string, id: string, status: SupportStatus) =>
    adminClient.patch<SupportMessage>(`/admin/messages/${id}/status`, { status }, token),
  reply: (token: string, id: string, body: string) =>
    adminClient.post<{ reply: SupportReply; emailSent: boolean }>(`/admin/messages/${id}/replies`, { body }, token),
  resendReply: (token: string, messageId: string, replyId: string) =>
    adminClient.post<{ reply: SupportReply; emailSent: boolean }>(`/admin/messages/${messageId}/replies/${replyId}/resend`, {}, token),
};
