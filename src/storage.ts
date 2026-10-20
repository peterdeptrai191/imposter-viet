import { defaults, norm, type Store, type Pair, type Game } from "./types";
export const KEY = "imposter-viet-v1";
export const fresh = (): Store => ({
  version: 1,
  names: Array.from({ length: 8 }, () => ""),
  groups: [],
  settings: { ...defaults },
  custom: [],
  game: null,
  history: [],
  used: [],
  roles: {},
  ratings: {},
});
export function validatePair(x: unknown): x is Pair {
  if (!x || typeof x !== "object") return false;
  const p = x as Pair;
  return (
    typeof p.id === "string" &&
    !!p.id.trim() &&
    typeof p.a === "string" &&
    !!norm(p.a) &&
    typeof p.b === "string" &&
    !!norm(p.b) &&
    norm(p.a) !== norm(p.b) &&
    typeof p.topic === "string" &&
    !!p.topic.trim() &&
    ["easy", "medium", "hard"].includes(p.difficulty) &&
    [p.aliasesA, p.aliasesB].every(
      (v) =>
        v === undefined ||
        (Array.isArray(v) && v.every((s) => typeof s === "string")),
    )
  );
}
export function validGame(x: unknown): x is Game {
  try {
    if (!x || typeof x !== "object") return false;
    const g = x as Game;
    if (
      typeof g.id !== "string" ||
      !Number.isInteger(g.rev) ||
      g.rev < 0 ||
      ![
        "reveal",
        "describe",
        "discuss",
        "vote",
        "voteResult",
        "eliminated",
        "guess",
        "guessReview",
        "ended",
      ].includes(g.stage)
    )
      return false;
    if (
      !Array.isArray(g.players) ||
      g.players.length < 3 ||
      g.players.length > 20 ||
      !g.players.every(
        (p) =>
          p &&
          typeof p.name === "string" &&
          !!norm(p.name) &&
          typeof p.id === "string" &&
          typeof p.imposter === "boolean" &&
          typeof p.alive === "boolean",
      )
    )
      return false;
    const ids = new Set(g.players.map((p) => p.id));
    if (
      ids.size !== g.players.length ||
      !validatePair(g.pair) ||
      typeof g.swapped !== "boolean" ||
      !Number.isFinite(g.createdAt) ||
      !Number.isInteger(g.round) ||
      g.round < 1 ||
      !Number.isInteger(g.starter) ||
      g.starter < 0 ||
      g.starter >= g.players.length
    )
      return false;
    if (
      !Array.isArray(g.order) ||
      !g.order.length ||
      new Set(g.order).size !== g.order.length ||
      !g.order.every((id) => ids.has(id)) ||
      !Number.isInteger(g.cursor) ||
      g.cursor < 0 ||
      g.cursor > g.order.length
    )
      return false;
    if (
      (g.stage === "reveal" && g.cursor >= g.players.length) ||
      (["describe", "vote"].includes(g.stage) && g.cursor >= g.order.length)
    )
      return false;
    if (
      !g.ballots ||
      typeof g.ballots !== "object" ||
      Array.isArray(g.ballots) ||
      !Object.entries(g.ballots).every(
        ([id, target]) => id !== target && ids.has(id) && ids.has(target),
      )
    )
      return false;
    if (
      !Array.isArray(g.candidates) ||
      !g.candidates.every((id) => ids.has(id)) ||
      !Array.isArray(g.events) ||
      !g.events.every(
        (e) =>
          e &&
          Number.isInteger(e.round) &&
          typeof e.runoff === "boolean" &&
          e.counts &&
          typeof e.counts === "object" &&
          Object.entries(e.counts).every(
            ([id, v]) => ids.has(id) && Number.isInteger(v) && v >= 0,
          ) &&
          Array.isArray(e.tied) &&
          e.tied.every((id) => ids.has(id)) &&
          (!e.eliminated || ids.has(e.eliminated)),
      )
    )
      return false;
    if (
      (g.stage === "voteResult" && !g.candidates.length) ||
      (["eliminated", "guess", "guessReview"].includes(g.stage) &&
        !ids.has(g.eliminated || "")) ||
      (g.stage === "ended" &&
        !["civilian", "imposter"].includes(g.winner || ""))
    )
      return false;
    if (
      !g.timer ||
      !Number.isFinite(g.timer.remaining) ||
      g.timer.remaining < 0 ||
      typeof g.timer.paused !== "boolean" ||
      (g.timer.deadline !== null && !Number.isFinite(g.timer.deadline))
    )
      return false;
    const s = g.settings;
    if (
      !s ||
      !Number.isInteger(s.imposters) ||
      s.imposters < 1 ||
      s.imposters > Math.floor((g.players.length - 1) / 2) ||
      !Array.isArray(s.topics) ||
      !s.topics.every((t) => typeof t === "string") ||
      !["easy", "medium", "hard", "mixed"].includes(s.difficulty) ||
      !["builtin", "custom", "both"].includes(s.source) ||
      !Number.isFinite(s.describeSeconds) ||
      !Number.isFinite(s.discussSeconds) ||
      !["timers", "lastGuess", "reduceRepeat", "sound"].every(
        (k) => typeof s[k as keyof typeof s] === "boolean",
      )
    )
      return false;
    return true;
  } catch {
    return false;
  }
}
export function loadStore(): Store {
  const base = fresh();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const s = JSON.parse(raw);
    if (s.version !== 1)
      return {
        ...base,
        notice:
          "Dữ liệu thuộc phiên bản chưa hỗ trợ. App đã mở dữ liệu mặc định.",
      };
    const names =
      Array.isArray(s.names) &&
      s.names.length >= 3 &&
      s.names.length <= 20 &&
      s.names.every((n: unknown) => typeof n === "string")
        ? s.names
        : base.names;
    const groups = Array.isArray(s.groups)
      ? s.groups.filter(
          (g: any) =>
            g &&
            typeof g.id === "string" &&
            typeof g.name === "string" &&
            Array.isArray(g.names) &&
            g.names.length >= 3 &&
            g.names.length <= 20 &&
            g.names.every((n: unknown) => typeof n === "string"),
        )
      : [];
    const settings = { ...defaults, ...s.settings };
    settings.imposters = Math.max(
      1,
      Math.min(
        Math.floor((names.length - 1) / 2),
        Math.floor(Number(settings.imposters)) || 1,
      ),
    );
    settings.topics = Array.isArray(settings.topics)
      ? settings.topics.filter((v: unknown) => typeof v === "string")
      : [];
    settings.describeSeconds = Math.min(
      180,
      Math.max(5, Number(settings.describeSeconds) || 20),
    );
    settings.discussSeconds = Math.min(
      600,
      Math.max(15, Number(settings.discussSeconds) || 90),
    );
    if (!["easy", "medium", "hard", "mixed"].includes(settings.difficulty))
      settings.difficulty = defaults.difficulty;
    if (!["builtin", "custom", "both"].includes(settings.source))
      settings.source = "builtin";
    for (const key of [
      "timers",
      "lastGuess",
      "reduceRepeat",
      "sound",
    ] as const) {
      if (typeof settings[key] !== "boolean") settings[key] = defaults[key];
    }
    const game = validGame(s.game) ? s.game : null;
    return {
      ...base,
      names,
      groups,
      settings,
      custom: Array.isArray(s.custom)
        ? s.custom
            .filter(validatePair)
            .map((p: Pair) => ({ ...p, source: "custom" }))
        : [],
      game,
      history: Array.isArray(s.history)
        ? s.history
            .filter(validGame)
            .filter((g: Game) => g.stage === "ended")
            .slice(0, 50)
        : [],
      used: Array.isArray(s.used)
        ? s.used.filter((x: unknown) => typeof x === "string")
        : [],
      roles:
        s.roles && typeof s.roles === "object"
          ? (Object.fromEntries(
              Object.entries(s.roles).filter(
                ([, v]) =>
                  typeof v === "number" && Number.isFinite(v) && v >= 0,
              ),
            ) as Record<string, number>)
          : {},
      ratings:
        s.ratings && typeof s.ratings === "object"
          ? (Object.fromEntries(
              Object.entries(s.ratings).filter(([, v]) =>
                ["Quá dễ", "Vừa hay", "Quá khó"].includes(v as string),
              ),
            ) as Record<string, string>)
          : {},
      notice:
        s.game && !game
          ? "Tiến trình cũ bị lỗi nên không thể tiếp tục. Các dữ liệu hợp lệ khác đã được giữ."
          : undefined,
    };
  } catch {
    return {
      ...base,
      notice: "Dữ liệu lưu bị lỗi. App đã mở an toàn với thiết lập mặc định.",
    };
  }
}
export function saveStore(s: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}
export function previewImport(text: string, existing: Pair[]) {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw Error("Tệp không phải JSON hợp lệ.");
  }
  const rows = Array.isArray(raw) ? raw : (raw as any)?.pairs;
  if (!Array.isArray(rows))
    throw Error("JSON cần là một mảng cặp từ hoặc có trường pairs là mảng.");
  if (rows.length > 5000) throw Error("Mỗi lần chỉ nhập tối đa 5.000 cặp.");
  const keys = new Set(
    existing.map((p) => [norm(p.a), norm(p.b)].sort().join("|")),
  );
  const ids = new Set(existing.map((p) => p.id));
  let conflicts = 0,
    duplicates = 0;
  const pairs: Pair[] = [];
  rows.forEach((p, i) => {
    if (!validatePair(p))
      throw Error(
        `Dòng ${i + 1}: thiếu ID, từ, chủ đề hoặc độ khó hợp lệ; hai từ phải khác nhau.`,
      );
    const key = [norm(p.a), norm(p.b)].sort().join("|");
    if (keys.has(key)) {
      duplicates++;
      return;
    }
    keys.add(key);
    let id = p.id;
    if (ids.has(id)) {
      conflicts++;
      id = crypto.randomUUID();
    }
    ids.add(id);
    pairs.push({ ...p, id, source: "custom" });
  });
  return { pairs, conflicts, duplicates };
}
