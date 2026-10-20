import { describe, it, expect } from "vitest";
import {
  assignRoles,
  maxImposters,
  createGame,
  transition,
  winner,
  secret,
  choosePair,
  filterPairs,
  validateNames,
  timeLeft,
  validTargets,
  type Action,
} from "./engine";
import { defaults, type Game, type Pair } from "./types";
import { builtin } from "./data";
import { loadStore, saveStore, fresh, KEY, previewImport } from "./storage";
const pair: Pair = {
  id: "test",
  a: "Cà phê",
  b: "Trà sữa",
  topic: "Đồ uống",
  difficulty: "easy",
  source: "builtin",
  aliasesA: ["cafe"],
};
const names = Array.from({ length: 8 }, (_, i) => `Bạn ${i + 1}`);
function step(g: Game, type: Action["type"], extra: Partial<Action> = {}) {
  return transition(g, { type, rev: g.rev, ...extra });
}
function start(count = 1) {
  let g = createGame(
    names,
    { ...defaults, imposters: count, lastGuess: false },
    pair,
    {},
  );
  while (g.stage === "reveal") g = step(g, "seen");
  return g;
}
function voteOut(g: Game, id: string) {
  while (g.stage === "describe") g = step(g, "next");
  g = step(g, "vote");
  while (g.stage === "vote") {
    const who = g.order[g.cursor];
    g = step(g, "ballot", {
      target: who === id ? validTargets(g, who)[0].id : id,
    });
  }
  expect(g.candidates).toEqual([id]);
  return step(g, "resolve");
}
describe("Phân vai và bộ lọc", () => {
  it.each([1, 2])("8 người, %i imposter và cùng từ B", (count) => {
    const g = createGame(
      names,
      { ...defaults, imposters: count },
      pair,
      {},
      () => 0.6,
    );
    expect(g.players.filter((p) => p.imposter)).toHaveLength(count);
    expect(new Set(g.players.map((p) => p.id)).size).toBe(8);
    expect(g.players.filter((p) => secret(g, p.id) === pair.b)).toHaveLength(
      count,
    );
  });
  it("mọi cấu hình 3–20 người không trùng/thiếu vai kể cả lịch sử dày", () => {
    for (let n = 3; n <= 20; n++)
      for (let k = 1; k <= maxImposters(n); k++) {
        const ns = Array.from({ length: n }, (_, i) => `Người ${i}`);
        const ps = assignRoles(
          ns,
          k,
          Object.fromEntries(
            ns.map((x) => [x.toLocaleLowerCase("vi"), 100000]),
          ),
          true,
        );
        expect(ps).toHaveLength(n);
        expect(ps.filter((p) => p.imposter)).toHaveLength(k);
      }
  });
  it("tên chuẩn hóa và cấu hình bất hợp lệ bị chặn", () => {
    expect(validateNames([" An ", "an", "Bình"])).toContain("trùng");
    expect(validateNames(["", "B", "C"])).toBeTruthy();
    expect(() => assignRoles(names, 4)).toThrow();
  });
  it("không có từ phù hợp không tạo ván; chống lặp đến khi hết", () => {
    expect(
      filterPairs(builtin, { ...defaults, topics: ["Không tồn tại"] }),
    ).toHaveLength(0);
    expect(() => choosePair([], [])).toThrow();
    const p2 = { ...pair, id: "second" };
    expect(choosePair([pair, p2], ["test"]).pair.id).toBe("second");
    expect(choosePair([pair, p2], ["test", "second"]).used).toHaveLength(0);
  });
  it("kho từ đạt số lượng và không trùng đảo chiều", () => {
    expect(builtin.length).toBeGreaterThanOrEqual(600);
    expect(
      new Set(
        builtin.flatMap((p) => [
          p.a.toLowerCase().trim(),
          p.b.toLowerCase().trim(),
        ]),
      ).size,
    ).toBeGreaterThanOrEqual(1000);
    expect(
      new Set(
        builtin.map((p) =>
          [p.a.toLowerCase(), p.b.toLowerCase()].sort().join("|"),
        ),
      ).size,
    ).toBe(builtin.length);
  });
});
describe("Máy trạng thái và luật nhiều imposter", () => {
  it.each([1, 2])(
    "chơi hoàn chỉnh 8 người / %i imposter: dân thường thắng",
    (count) => {
      let g = start(count);
      for (const id of g.players.filter((p) => p.imposter).map((p) => p.id)) {
        g = voteOut(g, id);
        if (g.stage === "eliminated") g = step(g, "continue");
      }
      expect(g.stage).toBe("ended");
      expect(g.winner).toBe("civilian");
      expect(g.events).toHaveLength(count);
    },
  );
  it("2 imposter thắng khi cân bằng 2 dân thường", () => {
    let g = start(2);
    for (const id of g.players
      .filter((p) => !p.imposter)
      .slice(0, 4)
      .map((p) => p.id)) {
      g = voteOut(g, id);
      if (g.stage === "eliminated") g = step(g, "continue");
    }
    expect(g.winner).toBe("imposter");
  });
  it("ưu tiên thắng dân thường khi không còn imposter", () => {
    expect(winner([])).toBe("civilian");
  });
  it("chỉ imposter cuối vừa bị loại mới được đoán, giữ kín đáp án", () => {
    let g = start(2);
    g.settings.lastGuess = true;
    const ids = g.players.filter((p) => p.imposter).map((p) => p.id);
    g = voteOut(g, ids[0]);
    expect(g.stage).toBe("eliminated");
    g = step(g, "continue");
    g = voteOut(g, ids[1]);
    expect(g.stage).toBe("guess");
    const answer = g.swapped ? pair.b : "  CAFE  ";
    g = step(g, "guess", { answer });
    expect(g.winner).toBe("imposter");
    expect(step(g, "guess", { answer: "sai" })).toEqual(g);
  });
  it("đoán sai chỉ một lần, cho nhóm xác nhận tương đương", () => {
    let g = start();
    g.settings.lastGuess = true;
    g = voteOut(g, g.players.find((p) => p.imposter)!.id);
    g = step(g, "guess", { answer: "khác hẳn" });
    expect(g.stage).toBe("guessReview");
    expect(step(g, "guess", { answer: "lần hai" })).toEqual(g);
    expect(step(g, "acceptGuess").winner).toBe("imposter");
    expect(step(g, "rejectGuess").winner).toBe("civilian");
  });
  it("khóa trạng thái, phiên bản cũ, tự bầu và phiếu người bị loại", () => {
    let g = start();
    expect(step(g, "resolve")).toEqual(g);
    while (g.stage === "describe") g = step(g, "next");
    g = step(g, "vote");
    const id = g.order[g.cursor];
    expect(step(g, "ballot", { target: id })).toEqual(g);
    const old = g;
    g = step(g, "ballot", { target: validTargets(g, id)[0].id });
    expect(
      transition(g, {
        type: "ballot",
        rev: old.rev,
        target: validTargets(old, id)[0].id,
      }),
    ).toEqual(g);
  });
  it("hòa → bầu lại → hòa: không loại ai, vòng mới; không tự bầu", () => {
    let g = start();
    while (g.stage === "describe") g = step(g, "next");
    g = step(g, "vote");
    const ids = g.order;
    while (g.stage === "vote") {
      const i = g.cursor;
      g = step(g, "ballot", { target: ids[(i + 1) % 8] });
    }
    expect(g.candidates).toHaveLength(8);
    g = step(g, "runoff");
    expect(g.runoff).toBe(true);
    while (g.stage === "vote") {
      const i = g.cursor;
      g = step(g, "ballot", { target: ids[(i + 1) % 8] });
    }
    g = step(g, "runoff");
    expect(g.stage).toBe("describe");
    expect(g.round).toBe(2);
    expect(g.players.every((p) => p.alive)).toBe(true);
  });
  it("người bị loại không còn mô tả hoặc bỏ phiếu", () => {
    let g = start(2);
    const id = g.players.find((p) => p.imposter)!.id;
    g = voteOut(g, id);
    g = step(g, "continue");
    expect(g.order).not.toContain(id);
    while (g.stage === "describe") g = step(g, "next");
    g = step(g, "vote");
    expect(g.order).not.toContain(id);
  });
  it("bầu lại chỉ giữa hai người hòa và mọi người sống đều có lượt", () => {
    let g = start();
    while (g.stage === "describe") g = step(g, "next");
    g = step(g, "vote");
    const ids = g.order;
    const choices = [
      ids[1],
      ids[0],
      ids[0],
      ids[0],
      ids[0],
      ids[1],
      ids[1],
      ids[1],
    ];
    while (g.stage === "vote")
      g = step(g, "ballot", { target: choices[g.cursor] });
    expect(g.candidates.sort()).toEqual([ids[0], ids[1]].sort());
    g = step(g, "runoff");
    expect(g.order).toHaveLength(8);
    expect(validTargets(g, ids[0]).map((p) => p.id)).toEqual([ids[1]]);
    expect(step(g, "ballot", { target: ids[2] })).toEqual(g);
  });
  it("đồng hồ dùng mốc thời gian và tạm dừng", () => {
    let g = start();
    g.timer = { deadline: 50000, remaining: 20000, paused: false };
    expect(timeLeft(g.timer, 45000)).toBe(5000);
    g = step(g, "pause", { now: 45000 });
    expect(g.timer.remaining).toBe(5000);
    expect(timeLeft(g.timer, 100000)).toBe(5000);
    g = step(g, "pause", { now: 100000 });
    expect(g.timer.deadline).toBe(105000);
  });
});
describe("Lưu và nhập", () => {
  it("tải lại giữ người xem hiện tại và bản chụp cặp từ", () => {
    const s = fresh();
    s.game = createGame(names, defaults, pair, {});
    s.game = step(s.game, "seen");
    saveStore(s);
    const restored = loadStore();
    expect(restored.game!.stage).toBe("reveal");
    expect(restored.game!.cursor).toBe(1);
    expect(restored.game!.pair).toEqual(pair);
  });
  it("phiếu đã khóa được giữ qua tải lại và không ghi trùng", () => {
    let g = start();
    while (g.stage === "describe") g = step(g, "next");
    g = step(g, "vote");
    g = step(g, "ballot", { target: validTargets(g, g.order[0])[0].id });
    saveStore({ ...fresh(), game: g });
    const restored = loadStore().game!;
    expect(restored.cursor).toBe(1);
    expect(Object.keys(restored.ballots)).toHaveLength(1);
    expect(restored.ballots).toEqual(g.ballots);
  });
  it("dữ liệu JSON lỗi hoặc game hỏng khôi phục an toàn", () => {
    localStorage.setItem(KEY, "{bad");
    expect(loadStore().game).toBe(null);
    localStorage.setItem(
      KEY,
      JSON.stringify({ ...fresh(), game: { stage: "vote" } }),
    );
    expect(loadStore().notice).toBeTruthy();
  });
  it("nhập xem trước, ID trùng được đổi, cặp đảo chiều bỏ qua", () => {
    const p = { ...pair, source: "custom" as const };
    const r = previewImport(
      JSON.stringify([
        { ...p, a: "Nước cam", b: "Nước táo" },
        { ...p, id: "reversed", a: p.b, b: p.a },
      ]),
      [p],
    );
    expect(r.conflicts).toBe(1);
    expect(r.duplicates).toBe(1);
    expect(r.pairs[0].id).not.toBe(p.id);
    expect(() => previewImport("[{}]", [])).toThrow("Dòng 1");
    expect(() => previewImport("{", [])).toThrow();
  });
});
