import { ledgerFetch } from "./ledgerClient";
import type { ChatHistory, ChatDraft, ChatTurn, SendMessageRequest, EditDraftItemRequest } from "../types/ledgerChat";
export const getChatHistory = (beforeId?: number) => ledgerFetch<ChatHistory>(`/chat/history${beforeId ? `?beforeId=${beforeId}` : ""}`);
export const sendChatMessage = (body: SendMessageRequest) => ledgerFetch<ChatTurn>("/chat/messages", { method: "POST", body: JSON.stringify(body), signal: AbortSignal.timeout(70000) });
export const getChatRequest = (id: string) => ledgerFetch<{ status: string; turn: ChatTurn | null }>(`/chat/messages/by-request/${encodeURIComponent(id)}`);
export async function uploadChatImage(file: File): Promise<number> {
  const body = new FormData(); body.append("file", file);
  return (await ledgerFetch<{ id: number }>("/chat/attachments", { method: "POST", body })).id;
}
export const editChatItem = (draftId: number, itemId: number, body: EditDraftItemRequest) => ledgerFetch<ChatDraft>(`/chat/drafts/${draftId}/items/${itemId}`, { method: "PUT", body: JSON.stringify(body) });
export const removeChatItem = (draftId: number, itemId: number, version: number) => ledgerFetch<ChatDraft>(`/chat/drafts/${draftId}/items/${itemId}?expectedVersion=${version}`, { method: "DELETE" });
export const actOnDraft = (draftId: number, action: "confirm" | "cancel" | "revoke", version: number) => ledgerFetch<ChatDraft>(`/chat/drafts/${draftId}/${action}`, { method: "POST", body: JSON.stringify({ expectedVersion: version }) });
