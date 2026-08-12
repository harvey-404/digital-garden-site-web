import apiClient from "./client";
import type {
  SemanticRoundAdminVO,
  SemanticStatusVO,
  SemanticWordVO,
} from "../types/game";

/** Public coarse status — never includes target word. */
export function getSemanticStatus() {
  return apiClient.get("/games/semantic/status") as unknown as Promise<SemanticStatusVO>;
}

/** Last nickname bound to this browser fp (may be empty). */
export function getSemanticIdentity(fp: string) {
  return apiClient.get(`/games/semantic/identity?fp=${encodeURIComponent(fp)}`) as unknown as Promise<{
    username: string;
  }>;
}

export function adminGetSemanticStatus() {
  return apiClient.get("/admin/games/semantic/status") as unknown as Promise<SemanticRoundAdminVO>;
}

export function adminListSemanticWords() {
  return apiClient.get("/admin/games/semantic/words") as unknown as Promise<SemanticWordVO[]>;
}

export function adminAddSemanticWords(words: string[]) {
  return apiClient.post("/admin/games/semantic/words", { words }) as unknown as Promise<
    SemanticWordVO[]
  >;
}

export function adminSkipSemanticWord(id: number) {
  return apiClient.patch(`/admin/games/semantic/words/${id}/skip`) as unknown as Promise<void>;
}

export function adminReorderSemanticWord(id: number, queueOrder: number) {
  return apiClient.patch(`/admin/games/semantic/words/${id}/order`, {
    queueOrder,
  }) as unknown as Promise<void>;
}

export function adminUpdateSemanticWordHints(
  id: number,
  hints: { hint1: string; hint2: string; hint3: string }
) {
  return apiClient.patch(`/admin/games/semantic/words/${id}/hints`, hints) as unknown as Promise<SemanticWordVO>;
}

export function adminStartSemanticRound() {
  return apiClient.post("/admin/games/semantic/rounds/start") as unknown as Promise<SemanticRoundAdminVO>;
}

export function adminStopSemanticRound() {
  return apiClient.post("/admin/games/semantic/rounds/stop") as unknown as Promise<SemanticRoundAdminVO>;
}
