import { useEffect, useRef, useState } from "react";
import { Receipt, ArrowDown, ArrowRight, ChatCircleText } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useLedgerChat } from "../../hooks/useLedgerChat";
import ChatComposer from "../../components/ledger/chat/ChatComposer";
import ChatDraftCard from "../../components/ledger/chat/ChatDraftCard";
import ChatImagePreview from "../../components/ledger/chat/ChatImagePreview";

const examples = ["昨天午饭32，打车18", "今天买咖啡16元", "第二笔金额改成20"];
export default function LedgerChatPage() {
  const chat = useLedgerChat(); const scroll = useRef<HTMLDivElement>(null); const root = useRef<HTMLElement>(null);
  const nearBottom = useRef(true); const [newMessages, setNewMessages] = useState(false); const [suggestion, setSuggestion] = useState("");
  useEffect(() => {
    function size() { const el = root.current; if (!el) return; const viewport = window.visualViewport; const bottom = (viewport?.height ?? window.innerHeight) + (viewport?.offsetTop ?? 0); el.style.height = `${Math.max(280, bottom - el.getBoundingClientRect().top - 8)}px`; }
    size(); window.addEventListener("resize", size); window.visualViewport?.addEventListener("resize", size);
    return () => { window.removeEventListener("resize", size); window.visualViewport?.removeEventListener("resize", size); };
  }, []);
  useEffect(() => {
    if (nearBottom.current) { const el = scroll.current; if (el) el.scrollTop = el.scrollHeight; } else setNewMessages(true);
  }, [chat.history?.messages.length, chat.history?.activeDraft?.version, chat.busy]);
  const history = chat.history;
  const guest = history?.guest?.isGuest ? history.guest : null;
  const exhausted = !!guest && guest.remaining === 0;
  const latest = new Map<number, number>(); history?.messages.forEach(m => { if (m.role === "assistant" && m.draftId !== null) latest.set(m.draftId, m.id); });
  return <section className="ledger-chat" ref={root}>
    <header className="chat-page-heading"><div><h1>对话记账</h1><p>发文字或图片，核对后记入账本。</p></div><Link className="chat-manual-link" to="/ledger">手动记账<ArrowRight size={15} /></Link></header>
    {guest && <div className="chat-guest-banner" role="status"><span>游客体验 · 剩余 {guest.remaining}/3 轮</span><span><Link to="/login?next=%2Fledger%2Fchat">登录</Link> · <Link to="/register?next=%2Fledger%2Fchat">注册</Link></span></div>}
    <div className="chat-messages" ref={scroll} onScroll={e => { const el = e.currentTarget; nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100; if (nearBottom.current) setNewMessages(false); }} aria-label="记账对话历史">
      {!history ? <div className="chat-loading" role="status">正在加载账本对话…</div> : history.messages.length === 0 ? <div className="chat-welcome">
        <div className="chat-welcome-icon"><Receipt size={30} weight="duotone" /></div><h2>把消费说出来，账就理清了。</h2><p>一顿饭、一张小票，或几笔零散消费。<br />我会先整理成清单，等你核对。</p>
        <div className="chat-examples">{examples.slice(0, 2).map(text => <button key={text} type="button" disabled={!!chat.busy} onClick={() => setSuggestion(text)}><ChatCircleText size={18} /><span>{text}</span><ArrowRight size={16} /></button>)}</div>
        <span className="chat-welcome-note">也可以上传付款截图或购物小票</span>
      </div> : <>
        {history.nextBeforeId && <button type="button" className="chat-history-more" disabled={!!chat.busy} onClick={async () => { const el = scroll.current; const previous = el?.scrollHeight ?? 0; await chat.loadOlder(); requestAnimationFrame(() => { if (el) el.scrollTop = el.scrollHeight - previous; }); }}>加载更早记录</button>}
        {history.messages.map(m => <div key={m.id} className={`chat-message chat-message--${m.role}`}>
          {m.role === "assistant" && <span className="chat-assistant-label">记账助手</span>}
          {m.attachmentIds.length > 0 && <div className="chat-message-images">{m.attachmentIds.map(id => <ChatImagePreview key={id} id={id} />)}</div>}
          {m.text && <p className="chat-message-text">{m.text}</p>}
          {m.status === "FAILED" && <div className="chat-message-failed"><span>这条消息未完成识别</span><button type="button" disabled={!!chat.busy} onClick={() => void chat.retry(m)}>重试</button></div>}
          {m.role === "assistant" && m.draftId !== null && (latest.get(m.draftId) === m.id ? (() => { const d = history.drafts.find(d => d.id === m.draftId); return d ? <ChatDraftCard draft={d} categories={chat.categories} busy={!!chat.busy} guest={!!guest} onEdit={chat.edit} onRemove={chat.remove} onAct={chat.act} /> : null; })() : <a className="chat-updated-link" href={`#draft-${m.draftId}`}>草稿已更新，查看最新列表</a>)}
        </div>)}
      </>}
      {chat.busy && <p className="chat-thinking" role="status">{chat.busy}</p>}
    </div>
    {newMessages && <button type="button" className="chat-new-messages" onClick={() => { if (scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight; nearBottom.current = true; setNewMessages(false); }}><ArrowDown size={16} />查看新消息</button>}
    {chat.error && <div className="chat-error-banner" role="alert"><span>{chat.error}</span><button type="button" onClick={() => { chat.setError(null); if (!history) void chat.refresh().catch(e => chat.setError(e.message)); }}>{history ? "关闭" : "重试"}</button></div>}
    {history && !history.capabilities.available && <p className="chat-error-banner">记账助手暂不可用，请先使用手动记账。</p>}
    {exhausted && <div className="chat-guest-exhausted"><p>三轮体验已完成，对话与草稿已保留。</p><Link to="/login?next=%2Fledger%2Fchat">登录后继续</Link> <Link to="/register?next=%2Fledger%2Fchat">注册后继续</Link></div>}
    <ChatComposer key={chat.identityKey ?? "loading"} identityKey={chat.identityKey} adoptedGuestKey={chat.adoptedGuestKey} busy={chat.busy} available={!!history?.capabilities.available && !exhausted} suggestion={suggestion} onSend={async (text, images) => { nearBottom.current = true; return chat.send(text, images); }} onError={chat.setError} />
  </section>;
}
