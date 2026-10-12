export interface ChatIssue { code: string; message: string }
export interface DraftItem {
  id: number; ordinal: number; amount: string | null; categoryId: number | null;
  description: string; recordedAt: number | null; datePrecision: "DATE" | "DATETIME";
  defaultedToday: boolean; future: boolean; sourceMessageId: number;
  sourceAttachmentIds: number[]; evidence: string; issues: ChatIssue[];
  duplicateExpenseIds: number[]; duplicateAcknowledged: boolean;
  duplicateRecords?: SavedExpense[];
}
export interface SavedExpense { id: number; amount: string; categoryId: number; description: string; recordedAt: number }
export interface ChatDraft {
  id: number; version: number; status: "READY" | "NEEDS_INPUT" | "CONFIRMED" | "CANCELLED" | "REVOKED";
  items: DraftItem[]; total: string; count: number; canConfirm: boolean; savedExpenses: SavedExpense[];
}
export interface ChatMessage {
  id: number; role: "user" | "assistant"; text: string; attachmentIds: number[];
  createdAt: number; requestId: string | null; status: "PROCESSING" | "DONE" | "FAILED"; draftId: number | null;
}
export interface ChatHistory {
  messages: ChatMessage[]; drafts: ChatDraft[]; activeDraft: ChatDraft | null;
  nextBeforeId: number | null; processingRequestId: string | null;
  capabilities: { available: boolean; imageInput: boolean };
  guest?: LedgerGuestStatus;
}
export interface LedgerGuestStatus { isGuest: boolean; remaining: number | null; limit: number; identityKey?: string; adoptedGuestKey?: string | null }
export interface ChatTurn { userMessage: ChatMessage; assistantMessage: ChatMessage; draft: ChatDraft | null }
export interface SendMessageRequest { requestId: string; text: string; attachmentIds: number[]; expectedDraftVersion: number | null }
export interface EditDraftItemRequest {
  expectedVersion: number; amount: string | null; categoryId: number | null;
  description: string; recordedAt: number | null; datePrecision: "DATE" | "DATETIME";
  duplicateAcknowledged: boolean;
}
export interface SelectedImage { key: string; file: File; preview: string; attachmentId?: number }
