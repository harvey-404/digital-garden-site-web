import { useCallback, useEffect, useRef, useState } from "react";
import * as api from "../api/ledgerChat";
import { listLedgerCategories } from "../api/ledger";
import { useLedgerAuth } from "../context/LedgerAuthContext";
import type { ChatDraft, ChatHistory, ChatMessage, ChatTurn, EditDraftItemRequest, SelectedImage, SendMessageRequest } from "../types/ledgerChat";
import type { LedgerCategoryVO } from "../types/ledger";

export function requestId(): string {
  return typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, "0")).join("");
}
const message = (error: unknown) => error instanceof Error ? error.message : "操作失败，请重试";
export function useLedgerChat() {
  const { token } = useLedgerAuth();
  const [history, setHistory] = useState<ChatHistory | null>(null);
  const [categories, setCategories] = useState<LedgerCategoryVO[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const guard = useRef(false);
  const pending = useRef<SendMessageRequest | null>(null);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const g = generation.current;
    const [next, cats] = await Promise.all([api.getChatHistory(), listLedgerCategories()]);
    if (g === generation.current) { setHistory(next); setCategories(cats); }
    return next;
  }, []);
  useEffect(() => {
    generation.current++; let cancelled = false;
    setHistory(null); setCategories([]); pending.current = null; guard.current = false; setBusy(null);
    refresh().catch(e => { if (!cancelled) setError(message(e)); });
    const ref = generation;
    return () => { cancelled = true; ref.current++; };
  }, [token, refresh]);
  useEffect(() => {
    if (!history?.processingRequestId) return;
    const interval = setInterval(() => { refresh().catch(() => {}); }, 2500);
    return () => clearInterval(interval);
  }, [history?.processingRequestId, refresh]);
  const updateDraft = useCallback((draft: ChatDraft) => {
    setHistory(old => old ? { ...old, drafts: [...old.drafts.filter(d => d.id !== draft.id), draft], activeDraft: ["READY", "NEEDS_INPUT"].includes(draft.status) ? draft : old.activeDraft?.id === draft.id ? null : old.activeDraft } : old);
  }, []);
  const applyTurn = useCallback((turn: ChatTurn) => {
    setHistory(old => old ? { ...old, messages: [...old.messages.filter(m => m.id !== turn.userMessage.id && m.id !== turn.assistantMessage.id), turn.userMessage, turn.assistantMessage].sort((a, b) => a.id - b.id), processingRequestId: null } : old);
    if (turn.draft) updateDraft(turn.draft);
  }, [updateDraft]);
  async function run<T>(label: string, action: () => Promise<T>): Promise<T | null> {
    if (guard.current || history?.processingRequestId) return null;
    guard.current = true; setBusy(label); setError(null);
    const g = generation.current;
    try { const result = await action(); return g === generation.current ? result : null; }
    catch (e) { if (g === generation.current) { setError(message(e)); await refresh().catch(() => {}); } return null; }
    finally { guard.current = false; if (g === generation.current) setBusy(null); }
  }
  async function send(text: string, images: SelectedImage[]): Promise<boolean> {
    const result = await run("正在识别消费…", async () => {
      for (const image of images) {
        if (!image.attachmentId) { setBusy("正在上传图片…"); image.attachmentId = await api.uploadChatImage(image.file); }
      }
      setBusy("正在识别消费…");
      const ids = images.map(i => i.attachmentId!);
      const old = pending.current;
      const req = old && old.text === text && JSON.stringify(old.attachmentIds) === JSON.stringify(ids) ? old : { requestId: requestId(), text, attachmentIds: ids, expectedDraftVersion: history?.activeDraft?.version ?? null };
      pending.current = req;
      try { const turn = await api.sendChatMessage(req); applyTurn(turn); pending.current = null; return true; }
      catch (e) {
        const state = await api.getChatRequest(req.requestId).catch(() => null);
        if (state?.status === "DONE" && state.turn) { applyTurn(state.turn); pending.current = null; return true; }
        throw e;
      }
    });
    return result === true;
  }
  async function retry(m: ChatMessage) {
    await run("重新识别中…", async () => { const turn = await api.sendChatMessage({ requestId: m.requestId!, text: m.text, attachmentIds: m.attachmentIds, expectedDraftVersion: history?.activeDraft?.version ?? null }); applyTurn(turn); });
  }
  async function edit(d: ChatDraft, itemId: number, fields: Omit<EditDraftItemRequest, "expectedVersion">) {
    const updated = await run("正在更新草稿…", () => api.editChatItem(d.id, itemId, { ...fields, expectedVersion: d.version }));
    if (updated) updateDraft(updated); return !!updated;
  }
  async function remove(d: ChatDraft, itemId: number) { const updated = await run("正在更新草稿…", () => api.removeChatItem(d.id, itemId, d.version)); if (updated) updateDraft(updated); }
  async function act(d: ChatDraft, action: "confirm" | "cancel" | "revoke") {
    const updated = await run(action === "confirm" ? "正在记账…" : action === "revoke" ? "正在撤销…" : "正在取消…", async () => {
      try { return await api.actOnDraft(d.id, action, d.version); }
      catch (e) {
        const state = await api.getChatHistory().catch(() => null);
        const found = state?.drafts.find(x => x.id === d.id);
        if (found?.status === (action === "confirm" ? "CONFIRMED" : action === "revoke" ? "REVOKED" : "CANCELLED")) return found;
        throw e;
      }
    });
    if (updated) updateDraft(updated);
  }
  async function loadOlder() {
    if (!history?.nextBeforeId) return;
    const older = await run("加载更早记录…", () => api.getChatHistory(history.nextBeforeId!));
    if (older) setHistory(old => old ? { ...old, messages: [...older.messages, ...old.messages].filter((m, i, all) => all.findIndex(x => x.id === m.id) === i), drafts: [...older.drafts, ...old.drafts].filter((d, i, all) => all.findIndex(x => x.id === d.id) === i), nextBeforeId: older.nextBeforeId } : older);
  }
  return { history, categories, busy: busy ?? (history?.processingRequestId ? "正在恢复识别结果…" : null), error, setError, refresh, send, retry, edit, remove, act, loadOlder };
}
