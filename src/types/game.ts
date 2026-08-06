/** Hub card entry for `/games` */
export interface GameHubEntry {
  id: string;
  title: string;
  description: string;
  to?: string;
  available: boolean;
}

/** Public status from GET /api/games/semantic/status */
export interface SemanticStatusVO {
  status: string;
  roundId: number | null;
  guessable: boolean;
}

/** Admin status from GET /api/admin/games/semantic/status (includes targetWord) */
export interface SemanticRoundAdminVO {
  status: string;
  roundId: number | null;
  targetWord: string;
  guessCount: number;
  pendingCount: number;
  guessable: boolean;
}

/** Admin word queue row from GET /api/admin/games/semantic/words */
export interface SemanticWordVO {
  id: number;
  word: string;
  queueOrder: number;
  status: string;
}

export type RoundStatus = "active" | "waiting_words" | "idle";

export interface Top10Entry {
  word: string;
  score: number;
  firstUser: string;
}

export interface GuessHistoryEntry {
  word: string;
  score: number;
  isFirstDiscoverer: boolean;
  firstUser: string;
  alreadyGuessed: boolean;
}

export interface GameOverState {
  winner: string;
  word: string;
  next: "new_round" | "waiting_words";
}

export type GameWsMessage =
  | { type: "round_state"; status: string; roundId: number | null; guessable: boolean }
  | {
      type: "guess_result";
      word: string;
      score: number;
      isFirstDiscoverer: boolean;
      firstUser: string;
      alreadyGuessed: boolean;
    }
  | { type: "top10_update"; data: Top10Entry[] }
  | { type: "game_over"; winner: string; word: string; next: "new_round" | "waiting_words" }
  | { type: "error"; code: string; message: string }
  | { type: "pong" };
