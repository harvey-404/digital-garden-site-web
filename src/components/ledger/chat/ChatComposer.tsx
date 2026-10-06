import { useEffect, useRef, useState } from "react";
import { ArrowUp, ImageSquare, X, SpinnerGap } from "@phosphor-icons/react";
import type { SelectedImage } from "../../../types/ledgerChat";
import { requestId } from "../../../hooks/useLedgerChat";

interface Props { busy: string | null; available: boolean; suggestion: string; onSend: (text: string, images: SelectedImage[]) => Promise<boolean>; onError: (message: string) => void }
export default function ChatComposer({ busy, available, suggestion, onSend, onError }: Props) {
  const [text, setText] = useState(""); const [images, setImages] = useState<SelectedImage[]>([]);
  const input = useRef<HTMLInputElement>(null); const area = useRef<HTMLTextAreaElement>(null);
  const currentImages = useRef(images); currentImages.current = images;
  useEffect(() => () => { currentImages.current.forEach(i => URL.revokeObjectURL(i.preview)); }, []);
  useEffect(() => { if (suggestion) { setText(suggestion); area.current?.focus(); } }, [suggestion]);
  useEffect(() => { if (area.current) { area.current.style.height = "auto"; area.current.style.height = `${Math.min(116, area.current.scrollHeight)}px`; } }, [text]);
  function choose(files: FileList | null) {
    if (!files) return;
    if (images.length + files.length > 3) { onError("一次最多3张图片，请分批发送"); return; }
    const chosen = Array.from(files);
    if (chosen.some(f => f.size > 10 * 1024 * 1024)) { onError("每张图片最多10MB"); return; }
    if (chosen.some(f => !["image/jpeg", "image/png", "image/webp"].includes(f.type))) { onError("请选择JPEG、PNG或WebP图片；HEIC请先转为JPEG"); return; }
    setImages(old => [...old, ...chosen.map(file => ({ key: requestId(), file, preview: URL.createObjectURL(file) }))]);
    if (input.current) input.current.value = "";
  }
  async function submit() {
    if (busy || !available || (!text.trim() && images.length === 0)) return;
    if (await onSend(text.trim(), images)) { images.forEach(i => URL.revokeObjectURL(i.preview)); setImages([]); setText(""); area.current?.focus(); }
  }
  return <div className="chat-composer-wrap">
    {images.length > 0 && <div className="chat-composer-images">{images.map(image => <div className="chat-upload-preview" key={image.key}>
      <img src={image.preview} alt="待发送的消费图片" /><button type="button" disabled={!!busy} aria-label="移除待发送图片" onClick={() => { URL.revokeObjectURL(image.preview); setImages(old => old.filter(i => i.key !== image.key)); }}><X size={16} /></button>
    </div>)}</div>}
    <div className="chat-composer">
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={e => choose(e.target.files)} />
      <button className="chat-icon-button" type="button" aria-label="添加消费图片" title="添加付款截图或小票" disabled={!!busy || !available} onClick={() => input.current?.click()}><ImageSquare size={24} /></button>
      <textarea ref={area} aria-label="消费描述" placeholder="说说这笔消费，或发张截图…" value={text} maxLength={4000} disabled={!!busy || !available} rows={1} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !e.nativeEvent.isComposing) { e.preventDefault(); void submit(); } }} />
      <button className="chat-send" type="button" aria-label="发送消息" disabled={!!busy || !available || (!text.trim() && !images.length)} onClick={() => void submit()}>{busy ? <SpinnerGap size={21} /> : <ArrowUp size={22} weight="bold" />}</button>
    </div>
    <p className="chat-composer-hint" role="status">{busy ?? "支持文字和图片，确认后才会记入账本"}</p>
  </div>;
}
