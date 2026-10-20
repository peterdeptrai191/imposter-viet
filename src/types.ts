export type Difficulty = "easy" | "medium" | "hard";
export type Pair = {
  id: string;
  a: string;
  b: string;
  topic: string;
  difficulty: Difficulty;
  source: "builtin" | "custom";
  aliasesA?: string[];
  aliasesB?: string[];
};
export type Settings = {
  imposters: number;
  topics: string[];
  difficulty: Difficulty | "mixed";
  source: "builtin" | "custom" | "both";
  describeSeconds: number;
  discussSeconds: number;
  timers: boolean;
  lastGuess: boolean;
  reduceRepeat: boolean;
  sound: boolean;
};
export type Player = {
  id: string;
  name: string;
  imposter: boolean;
  alive: boolean;
};
export type VoteEvent = {
  round: number;
  runoff: boolean;
  counts: Record<string, number>;
  tied: string[];
  eliminated?: string;
  role?: boolean;
};
export type Stage =
  | "reveal"
  | "describe"
  | "discuss"
  | "vote"
  | "voteResult"
  | "eliminated"
  | "guess"
  | "guessReview"
  | "ended";
export type Timer = {
  deadline: number | null;
  remaining: number;
  paused: boolean;
};
export type Game = {
  id: string;
  rev: number;
  stage: Stage;
  players: Player[];
  pair: Pair;
  swapped: boolean;
  settings: Settings;
  cursor: number;
  round: number;
  starter: number;
  order: string[];
  ballots: Record<string, string>;
  candidates: string[];
  runoff: boolean;
  events: VoteEvent[];
  eliminated?: string;
  guess?: string;
  winner?: "civilian" | "imposter";
  reason?: string;
  timer: Timer;
  createdAt: number;
};
export type Store = {
  version: 1;
  names: string[];
  groups: { id: string; name: string; names: string[] }[];
  settings: Settings;
  custom: Pair[];
  game: Game | null;
  history: Game[];
  used: string[];
  roles: Record<string, number>;
  ratings: Record<string, string>;
  notice?: string;
};
export const defaults: Settings = {
  imposters: 1,
  topics: [],
  difficulty: "easy",
  source: "builtin",
  describeSeconds: 20,
  discussSeconds: 90,
  timers: true,
  lastGuess: true,
  reduceRepeat: true,
  sound: true,
};
export const norm = (s: string) =>
  s.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("vi");
export const clean = (s: string) => s.trim().replace(/\s+/g, " ");
