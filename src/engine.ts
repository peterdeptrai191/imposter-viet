import { type Game, type Settings, type Pair, type Timer, norm } from "./types";
export const maxImposters = (n: number) => Math.max(1, Math.floor((n - 1) / 2));
export function validateNames(names: string[]) {
  if (names.length < 3 || names.length > 20)
    return "Cần từ 3 đến 20 người chơi.";
  if (names.some((n) => !norm(n)))
    return "Hãy nhập đủ tên hoặc dùng tên nhanh.";
  if (new Set(names.map(norm)).size !== names.length)
    return "Tên người chơi bị trùng. Hãy đổi tên để dễ phân biệt.";
  return "";
}
export function filterPairs(pairs: Pair[], s: Settings) {
  return pairs.filter(
    (p) =>
      (!s.topics.length || s.topics.includes(p.topic)) &&
      (s.difficulty === "mixed" || s.difficulty === p.difficulty) &&
      (s.source === "both" || s.source === p.source),
  );
}
export function choosePair(pool: Pair[], used: string[], random = Math.random) {
  if (!pool.length)
    throw Error(
      "Không có cặp từ phù hợp. Hãy mở rộng bộ lọc hoặc thêm cặp tự tạo.",
    );
  let available = pool.filter((p) => !used.includes(p.id));
  const reset = !available.length;
  if (reset) available = pool;
  return {
    pair: structuredClone(available[Math.floor(random() * available.length)]),
    used: reset ? used.filter((id) => !pool.some((p) => p.id === id)) : used,
  };
}
export function assignRoles(
  names: string[],
  count: number,
  history: Record<string, number> = {},
  reduce = true,
  random = Math.random,
) {
  if (validateNames(names) || count < 1 || count > maxImposters(names.length))
    throw Error("Cấu hình người chơi không hợp lệ.");
  const bag = names.map((name, i) => ({
    i,
    weight: reduce ? 1 / (1 + (history[norm(name)] || 0) * 2) : 1,
  }));
  const chosen = new Set<number>();
  while (chosen.size < count) {
    let target = random() * bag.reduce((sum, p) => sum + p.weight, 0);
    let at = bag.findIndex((p) => (target -= p.weight) < 0);
    if (at < 0) at = bag.length - 1;
    chosen.add(bag[at].i);
    bag.splice(at, 1);
  }
  return names.map((name, i) => ({
    id: `p${i}`,
    name: name.trim().replace(/\s+/g, " "),
    imposter: chosen.has(i),
    alive: true,
  }));
}
export function winner(players: Game["players"]) {
  const alive = players.filter((p) => p.alive),
    im = alive.filter((p) => p.imposter).length;
  if (im === 0) return "civilian";
  if (im >= alive.length - im) return "imposter";
  return undefined;
}
export const timer = (
  seconds: number,
  on: boolean,
  now = Date.now(),
): Timer => ({
  deadline: on ? now + seconds * 1000 : null,
  remaining: seconds * 1000,
  paused: !on,
});
export const timeLeft = (t: Timer, now = Date.now()) =>
  Math.max(0, t.paused ? t.remaining : (t.deadline ?? now) - now);
export function createGame(
  names: string[],
  settings: Settings,
  pair: Pair,
  roles: Record<string, number>,
  random = Math.random,
): Game {
  const players = assignRoles(
      names,
      settings.imposters,
      roles,
      settings.reduceRepeat,
      random,
    ),
    starter = Math.floor(random() * players.length);
  return {
    id: crypto.randomUUID(),
    rev: 0,
    stage: "reveal",
    players,
    pair: structuredClone(pair),
    swapped: random() < 0.5,
    settings: structuredClone(settings),
    cursor: 0,
    round: 1,
    starter,
    order: players.map((p) => p.id),
    ballots: {},
    candidates: [],
    runoff: false,
    events: [],
    timer: timer(settings.describeSeconds, false),
    createdAt: Date.now(),
  };
}
export const secret = (g: Game, id: string) => {
  const p = g.players.find((p) => p.id === id)!;
  return p.imposter !== g.swapped ? g.pair.b : g.pair.a;
};
export const civilianWord = (g: Game) => (g.swapped ? g.pair.b : g.pair.a);
export function validTargets(g: Game, id: string) {
  return g.players.filter(
    (p) => p.alive && p.id !== id && (!g.runoff || g.candidates.includes(p.id)),
  );
}
function descriptionOrder(g: Game) {
  return [...g.players.slice(g.starter), ...g.players.slice(0, g.starter)]
    .filter((p) => p.alive)
    .map((p) => p.id);
}
function nextRound(g: Game) {
  g.stage = "describe";
  g.round++;
  do {
    g.starter = (g.starter + 1) % g.players.length;
  } while (!g.players[g.starter].alive);
  g.order = descriptionOrder(g);
  g.cursor = 0;
  g.ballots = {};
  g.runoff = false;
  g.candidates = [];
  g.timer = timer(g.settings.describeSeconds, g.settings.timers);
}
function end(g: Game, win: "civilian" | "imposter", reason: string) {
  g.stage = "ended";
  g.winner = win;
  g.reason = reason;
}
export type Action = {
  type:
    | "seen"
    | "next"
    | "discuss"
    | "vote"
    | "ballot"
    | "resolve"
    | "runoff"
    | "continue"
    | "guess"
    | "acceptGuess"
    | "rejectGuess"
    | "pause";
  rev: number;
  target?: string;
  answer?: string;
  now?: number;
};
export function transition(current: Game, a: Action): Game {
  if (a.rev !== current.rev) return current;
  const g = structuredClone(current);
  const now = a.now ?? Date.now();
  let changed = true;
  switch (a.type) {
    case "seen":
      if (g.stage !== "reveal") return current;
      if (g.cursor < g.players.length - 1) g.cursor++;
      else {
        g.stage = "describe";
        g.cursor = 0;
        g.order = descriptionOrder(g);
        g.timer = timer(g.settings.describeSeconds, g.settings.timers, now);
      }
      break;
    case "next":
      if (g.stage !== "describe") return current;
      if (g.cursor < g.order.length - 1) {
        g.cursor++;
        g.timer = timer(g.settings.describeSeconds, g.settings.timers, now);
      } else {
        g.stage = "discuss";
        g.timer = timer(g.settings.discussSeconds, g.settings.timers, now);
      }
      break;
    case "vote":
      if (g.stage !== "discuss") return current;
      g.stage = "vote";
      g.cursor = 0;
      g.order = g.players.filter((p) => p.alive).map((p) => p.id);
      g.ballots = {};
      g.candidates = [];
      g.runoff = false;
      break;
    case "ballot": {
      if (g.stage !== "vote") return current;
      const voter = g.order[g.cursor];
      if (
        g.ballots[voter] ||
        !validTargets(g, voter).some((p) => p.id === a.target)
      )
        return current;
      g.ballots[voter] = a.target!;
      g.cursor++;
      if (g.cursor === g.order.length) {
        const counts: Record<string, number> = {};
        g.players
          .filter((p) => p.alive && (!g.runoff || g.candidates.includes(p.id)))
          .forEach((p) => (counts[p.id] = 0));
        Object.values(g.ballots).forEach((id) => counts[id]++);
        const max = Math.max(...Object.values(counts));
        const tied = Object.keys(counts).filter((id) => counts[id] === max);
        g.events.push({ round: g.round, runoff: g.runoff, counts, tied });
        g.candidates = tied;
        g.stage = "voteResult";
      }
      break;
    }
    case "resolve": {
      if (g.stage !== "voteResult" || g.candidates.length !== 1) return current;
      const p = g.players.find((p) => p.id === g.candidates[0])!;
      p.alive = false;
      g.eliminated = p.id;
      g.events.at(-1)!.eliminated = p.id;
      g.events.at(-1)!.role = p.imposter;
      const win = winner(g.players);
      if (win === "civilian" && p.imposter && g.settings.lastGuess)
        g.stage = "guess";
      else if (win)
        end(
          g,
          win,
          win === "civilian"
            ? "Tất cả imposter đã bị loại."
            : "Số imposter còn lại đã bằng hoặc vượt số dân thường.",
        );
      else g.stage = "eliminated";
      break;
    }
    case "runoff":
      if (g.stage !== "voteResult" || g.candidates.length < 2) return current;
      if (g.runoff) {
        nextRound(g);
        break;
      }
      g.runoff = true;
      g.stage = "vote";
      g.ballots = {};
      g.order = g.players
        .filter((p) => p.alive && validTargets(g, p.id).length > 0)
        .map((p) => p.id);
      g.cursor = 0;
      break;
    case "continue":
      if (g.stage !== "eliminated") return current;
      nextRound(g);
      break;
    case "guess": {
      if (g.stage !== "guess" || !norm(a.answer || "")) return current;
      g.guess = a.answer!.trim();
      const aliases = g.swapped ? g.pair.aliasesB : g.pair.aliasesA;
      const correct = [civilianWord(g), ...(aliases || [])].some(
        (s) => norm(s) === norm(g.guess!),
      );
      if (correct)
        end(g, "imposter", "Imposter cuối cùng đoán đúng từ của dân thường.");
      else g.stage = "guessReview";
      break;
    }
    case "acceptGuess":
      if (g.stage !== "guessReview") return current;
      end(g, "imposter", "Nhóm xác nhận đáp án đoán cuối tương đương.");
      break;
    case "rejectGuess":
      if (g.stage !== "guessReview") return current;
      end(
        g,
        "civilian",
        "Tất cả imposter đã bị loại và lượt đoán cuối không đúng.",
      );
      break;
    case "pause":
      if (!["describe", "discuss"].includes(g.stage) || !g.settings.timers)
        return current;
      g.timer = g.timer.paused
        ? {
            deadline: now + g.timer.remaining,
            remaining: g.timer.remaining,
            paused: false,
          }
        : { deadline: null, remaining: timeLeft(g.timer, now), paused: true };
      break;
    default:
      changed = false;
  }
  if (!changed) return current;
  g.rev++;
  return g;
}
