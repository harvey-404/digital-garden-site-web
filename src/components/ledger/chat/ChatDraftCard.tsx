import { useRef, useState } from "react";
import { Check, PencilSimple, Trash, ArrowCounterClockwise, WarningCircle } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import type { ChatDraft, DraftItem, EditDraftItemRequest } from "../../../types/ledgerChat";
import type { LedgerCategoryVO } from "../../../types/ledger";
import ChatItemEditor from "./ChatItemEditor";
function money(raw: string | null) { return raw === null ? "待补充" : /^\d+(\.\d{1,2})?$/.test(raw) ? `¥${Number(raw).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `¥${raw}`; }
const dateLabel = (value: number | null) => value ? new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value * 1000)) : "日期待确认";
interface Props {
  draft: ChatDraft; categories: LedgerCategoryVO[]; busy: boolean; guest?: boolean;
  onEdit: (draft: ChatDraft, id: number, fields: Omit<EditDraftItemRequest, "expectedVersion">) => Promise<boolean>;
  onRemove: (draft: ChatDraft, id: number) => Promise<void>;
  onAct: (draft: ChatDraft, action: "confirm" | "cancel" | "revoke") => Promise<void>;
}
export default function ChatDraftCard({ draft, categories, busy, guest, onEdit, onRemove, onAct }: Props) {
  const [editing, setEditing] = useState<DraftItem | null>(null);
  const [revoking, setRevoking] = useState(false); const [cancelling, setCancelling] = useState(false);
  const root = useRef<HTMLElement>(null);
  const editable = ["READY", "NEEDS_INPUT"].includes(draft.status);
  const needs = draft.items.filter(i => i.issues.length);
  const labels = { READY: "待确认", NEEDS_INPUT: "需要补充", CONFIRMED: "已记账", CANCELLED: "已取消", REVOKED: "已撤销" };
  const parts = draft.items[0]?.recordedAt ? new Intl.DateTimeFormat("en", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit" }).formatToParts(new Date(draft.items[0].recordedAt * 1000)) : [];
  const month = parts.length ? `${parts.find(p => p.type === "year")?.value}-${parts.find(p => p.type === "month")?.value}` : "";
  return <section className={`chat-draft ${editable ? "" : "chat-draft--finished"}`} id={`draft-${draft.id}`} ref={root} aria-label="记账确认列表">
    <div className="chat-draft-heading"><span className={`chat-status ${draft.status === "CONFIRMED" ? "chat-status--success" : ""}`}>{draft.status === "CONFIRMED" && <Check size={15} weight="bold" />}{labels[draft.status]}</span><span className="chat-draft-caption">{draft.count}笔消费</span></div>
    {editable && needs.length > 0 && <div className="chat-draft-warning" role="status"><WarningCircle size={18} /><span>{needs.length}笔需要核对。补齐或移除后即可确认。</span></div>}
    {editable && categories.length === 0 && <p className="chat-draft-warning">还没有分类。<Link to="/ledger/categories">先添加分类</Link>，草稿会保留。</p>}
    <ol className="chat-draft-list">{draft.items.map(item => <li key={item.id} className={item.issues.length && editable ? "chat-draft-row chat-draft-row--issue" : "chat-draft-row"}>
      <div className="chat-row-top"><span className="chat-row-number">{item.ordinal}</span><strong className="chat-row-description">{item.description || "消费"}</strong><strong className="chat-row-amount">{money(item.amount)}</strong></div>
      <div className="chat-row-meta"><span>{dateLabel(item.recordedAt)}</span><span>{categories.find(c => c.id === item.categoryId)?.name ?? "分类待选"}</span>{item.defaultedToday && <span className="chat-default-label">默认今天</span>}{item.future && <span>预录</span>}</div>
      {editable && <div className="chat-row-actions"><button type="button" className="chat-row-action" aria-label={`编辑第${item.ordinal}笔`} disabled={busy} onClick={() => setEditing(item)}><PencilSimple size={16} />编辑</button><button type="button" className="chat-row-action" aria-label={`移除第${item.ordinal}笔`} disabled={busy} onClick={() => void onRemove(draft, item.id)}><Trash size={16} />移除</button></div>}
      {editable && item.issues.length > 0 && <ul className="chat-row-issues">{item.issues.map((issue, i) => <li key={`${issue.code}-${i}`}>{issue.message}</li>)}</ul>}
      {editable && !!item.duplicateRecords?.length && <div className="chat-existing-records">{item.duplicateRecords.map(record => <p key={record.id}>已记：{dateLabel(record.recordedAt)} {record.description} {money(record.amount)}</p>)}</div>}
      {editable && item.duplicateExpenseIds.length > 0 && <div className="chat-duplicate-review"><Link to={`/ledger/expenses?month=${month}`}>查看已有明细</Link><label><input type="checkbox" disabled={busy} checked={item.duplicateAcknowledged} onChange={e => void onEdit(draft, item.id, { amount: item.amount, categoryId: item.categoryId, description: item.description, recordedAt: item.recordedAt, datePrecision: item.datePrecision, duplicateAcknowledged: e.target.checked })} />仍然记一笔</label></div>}
    </li>)}</ol>
    {!draft.count && <p className="chat-empty-list">已移除所有条目，可继续补充或取消本次草稿。</p>}
    <div className="chat-draft-total"><span>共{draft.count}笔 <span className="chat-total-label">合计</span></span><strong>{money(draft.total)}</strong></div>
    {editable ? <div className="chat-draft-footer">{guest ? <span>草稿已保留，<Link to="/login?next=%2Fledger%2Fchat">登录</Link>或<Link to="/register?next=%2Fledger%2Fchat">注册</Link>后确认记账。</span> : <button type="button" className="chat-primary" disabled={busy || !draft.canConfirm} onClick={() => void onAct(draft, "confirm")}>{busy ? "处理中…" : "确认全部记账"}</button>}<button type="button" className="chat-secondary" disabled={busy} onClick={() => setCancelling(true)}>取消</button></div> : draft.status === "CONFIRMED" ? <div className="chat-saved-actions"><Link to={`/ledger/expenses?month=${month}`}>查看明细</Link><button type="button" className="chat-row-action" disabled={busy} onClick={() => setRevoking(true)}><ArrowCounterClockwise size={16} />撤销本次记账</button></div> : null}
    {(revoking || cancelling) && <div className="chat-confirm-action" role="group" aria-label={revoking ? "确认撤销" : "确认取消"}><p>{revoking ? `撤销本次${draft.count}笔记录？` : "取消这份未入账的草稿？"}</p><div><button type="button" className="chat-danger" disabled={busy} onClick={async () => { await onAct(draft, revoking ? "revoke" : "cancel"); setRevoking(false); setCancelling(false); }}>{revoking ? "确定撤销" : "确定取消"}</button><button type="button" className="chat-secondary" disabled={busy} onClick={() => { setRevoking(false); setCancelling(false); }}>返回</button></div></div>}
    {editing && <ChatItemEditor key={editing.id} item={editing} categories={categories} busy={busy} onClose={() => setEditing(null)} onSave={fields => onEdit(draft, editing.id, fields)} />}
  </section>;
}
