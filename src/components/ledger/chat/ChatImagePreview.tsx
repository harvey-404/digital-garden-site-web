import { useEffect, useState } from "react";
import { getLedgerBlob } from "../../../api/ledgerClient";
export default function ChatImagePreview({ id }: { id: number }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController(); let objectUrl: string | null = null;
    getLedgerBlob(`/chat/attachments/${id}/content`, controller.signal).then(blob => {
      if (!controller.signal.aborted) { objectUrl = URL.createObjectURL(blob); setUrl(objectUrl); }
    }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [id]);
  return url ? <a className="chat-image" href={url} target="_blank" rel="noreferrer" aria-label="查看消费图片原图"><img src={url} alt="消费凭证" /></a> : <div className="chat-image chat-image--loading">{error ? "图片暂不可用" : "加载图片…"}</div>;
}
