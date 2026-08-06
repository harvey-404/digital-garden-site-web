import { useCallback, useEffect, useRef, useState } from "react";
import type {
  GameOverState,
  GameWsMessage,
  GuessHistoryEntry,
  Top10Entry,
} from "../types/game";

export interface UseGameSocketOptions {
  username: string;
  fp: string;
  enabled: boolean;
}

export interface UseGameSocketResult {
  status: string;
  top10: Top10Entry[];
  myHistory: GuessHistoryEntry[];
  gameOver: GameOverState | null;
  error: string | null;
  sendGuess: (word: string) => void;
  connected: boolean;
}

const BACKOFF_MS = [1000, 2000, 5000] as const;
const PING_INTERVAL_MS = 25_000;

function buildWsUrl(username: string, fp: string): string {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  const params = new URLSearchParams({ username, fp });
  // Same-origin path; Vite proxies /ws → :8080 in dev
  return `${proto}://${location.host}/ws/game?${params.toString()}`;
}

function parseMessage(raw: unknown): GameWsMessage | null {
  if (typeof raw !== "object" || raw === null || !("type" in raw)) {
    return null;
  }
  return raw as GameWsMessage;
}

export function useGameSocket({
  username,
  fp,
  enabled,
}: UseGameSocketOptions): UseGameSocketResult {
  const [status, setStatus] = useState("");
  const [top10, setTop10] = useState<Top10Entry[]>([]);
  const [myHistory, setMyHistory] = useState<GuessHistoryEntry[]>([]);
  const [gameOver, setGameOver] = useState<GameOverState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const disposedRef = useRef(false);

  const clearPing = () => {
    if (pingTimer.current) {
      clearInterval(pingTimer.current);
      pingTimer.current = null;
    }
  };

  const clearReconnect = () => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
  };

  useEffect(() => {
    disposedRef.current = false;

    if (!enabled || !username.trim() || !fp) {
      return;
    }

    const connect = () => {
      if (disposedRef.current) return;

      clearPing();
      const ws = new WebSocket(buildWsUrl(username.trim(), fp));
      wsRef.current = ws;

      ws.onopen = () => {
        if (disposedRef.current) {
          ws.close();
          return;
        }
        setConnected(true);
        setError(null);
        reconnectAttempt.current = 0;
        pingTimer.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, PING_INTERVAL_MS);
      };

      ws.onmessage = (ev) => {
        let parsed: unknown;
        try {
          parsed = JSON.parse(String(ev.data));
        } catch {
          return;
        }
        const msg = parseMessage(parsed);
        if (!msg) return;

        switch (msg.type) {
          case "round_state":
            setStatus(msg.status ?? "");
            // New active round after win → dismiss new_round banner
            if (msg.status === "active") {
              setGameOver((prev) => (prev?.next === "new_round" ? null : prev));
            }
            break;
          case "top10_update":
            setTop10(Array.isArray(msg.data) ? msg.data : []);
            break;
          case "guess_result": {
            const entry: GuessHistoryEntry = {
              word: msg.word,
              score: msg.score,
              isFirstDiscoverer: msg.isFirstDiscoverer,
              firstUser: msg.firstUser,
              alreadyGuessed: msg.alreadyGuessed,
            };
            setMyHistory((prev) => {
              const rest = prev.filter((h) => h.word !== entry.word);
              return [...rest, entry].sort((a, b) => b.score - a.score);
            });
            break;
          }
          case "game_over":
            setGameOver({
              winner: msg.winner,
              word: msg.word,
              next: msg.next,
            });
            if (msg.next === "new_round") {
              setMyHistory([]);
            }
            break;
          case "error":
            setError(msg.message || msg.code || "出错了");
            break;
          case "pong":
            break;
        }
      };

      ws.onclose = () => {
        setConnected(false);
        clearPing();
        wsRef.current = null;
        if (disposedRef.current) return;
        const idx = Math.min(reconnectAttempt.current, BACKOFF_MS.length - 1);
        const delay = BACKOFF_MS[idx];
        reconnectAttempt.current += 1;
        reconnectTimer.current = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      disposedRef.current = true;
      clearReconnect();
      clearPing();
      const ws = wsRef.current;
      if (ws) {
        ws.onclose = null;
        ws.close();
        wsRef.current = null;
      }
      setConnected(false);
    };
  }, [username, fp, enabled]);

  const sendGuess = useCallback((word: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const trimmed = word.trim();
    if (!trimmed) return;
    ws.send(JSON.stringify({ type: "guess", word: trimmed }));
  }, []);

  return { status, top10, myHistory, gameOver, error, sendGuess, connected };
}
