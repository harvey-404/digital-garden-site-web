import { useEffect, useRef, useState } from "react";
import { X } from "@phosphor-icons/react";
import type { DraftItem, EditDraftItemRequest } from "../../../types/ledgerChat";
import type { LedgerCategoryVO } from "../../../types/ledger";
function shanghaiDate(value: number): string {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(value * 1000));
  return ["year", "month", "day"].map(type => parts.find(p => p.type === type)?.value).join("-");
}

export default function ChatItemEditor({ item, categories, busy, onClose, onSave }: {
  item: DraftItem; categories: LedgerCategoryVO[]; busy: boolean; onClose: () => void;
  onSave: (fields: Omit<EditDraftItemRequest, "expectedVersion">) => Promise<boolean>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [amount, setAmount] = useState(item.amount ?? "");
  const [description, setDescription] = useState(item.description);
  const [category, setCategory] = useState(String(item.categoryId ?? ""));
  const [date, setDate] = useState(item.recordedAt ? shanghaiDate(item.recordedAt) : "");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { const el = dialog.current; el?.showModal(); return () => { el?.close(); }; }, []);
  async function save(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    if (!/^\d+(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0 || Number(amount) > 999999.99) { setError("请输入大于0的金额，最多两位小数"); return; }
    if (!category || !date) { setError("请选择日期和分类"); return; }
    const originalDate = item.recordedAt ? shanghaiDate(item.recordedAt) : "";
    const recordedAt = item.datePrecision === "DATETIME" && date === originalDate ? item.recordedAt : Math.floor(Date.parse(`${date}T12:00:00+08:00`) / 1000);
    if (await onSave({ amount, description: description.trim(), categoryId: Number(category), recordedAt, datePrecision: date === originalDate ? item.datePrecision : "DATE", duplicateAcknowledged: false })) onClose();
  }
  return <dialog className="chat-editor" ref={dialog} aria-labelledby="chat-edit-title" onCancel={e => { if (busy) e.preventDefault(); else onClose(); }}>
    <div className="chat-editor-header"><h2 id="chat-edit-title">编辑第{item.ordinal}笔</h2><button type="button" className="chat-icon-button" aria-label="关闭编辑" disabled={busy} onClick={onClose}><X size={22} /></button></div>
    <form onSubmit={e => void save(e)}>
      <label className="chat-field">金额<div className="chat-amount-input"><span>¥</span><input aria-label="金额" value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" autoFocus required /></div></label>
      <label className="chat-field">说明<input value={description} onChange={e => setDescription(e.target.value)} maxLength={500} /></label>
      <div className="chat-fields-grid"><label className="chat-field">消费日期<input type="date" value={date} onChange={e => setDate(e.target.value)} required /></label><label className="chat-field">分类<select value={category} onChange={e => setCategory(e.target.value)} required><option value="">请选择</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div>
      {error && <p className="chat-error" role="alert">{error}</p>}
      <button type="submit" className="chat-primary" disabled={busy}>{busy ? "保存中…" : "保存修改"}</button>
    </form>
  </dialog>;
}
