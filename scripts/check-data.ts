import { readdirSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { norm, type Pair } from "../src/types";
import { validatePair } from "../src/storage";
const rows = readdirSync("src/data")
  .filter((f) => f.endsWith(".json"))
  .flatMap((f) => JSON.parse(readFileSync(`src/data/${f}`, "utf8")) as Pair[]);
const errors: string[] = [],
  ids = new Set<string>(),
  pairs = new Set<string>(),
  words = new Set<string>(),
  byTopic: Record<string, Record<string, number>> = {};
for (const p of rows) {
  if (!validatePair(p)) errors.push(`Cấu trúc không hợp lệ`);
  if (ids.has(p.id)) errors.push(`ID trùng: ${p.id}`);
  ids.add(p.id);
  const key = [norm(p.a), norm(p.b)].sort().join("|");
  if (pairs.has(key)) errors.push(`Cặp trùng/đảo chiều: ${p.id}`);
  pairs.add(key);
  words.add(norm(p.a));
  words.add(norm(p.b));
  byTopic[p.topic] ??= { easy: 0, medium: 0, hard: 0, total: 0 };
  byTopic[p.topic][p.difficulty]++;
  byTopic[p.topic].total++;
}
if (words.size < 1000) errors.push("Chưa đạt 1.000 từ riêng biệt");
if (pairs.size < 600) errors.push("Chưa đạt 600 cặp");
if (Object.keys(byTopic).length < 15) errors.push("Chưa đạt 15 chủ đề");
const report = {
  uniqueWords: words.size,
  validPairs: pairs.size,
  topics: Object.keys(byTopic).length,
  byTopic,
  errors,
  semanticReview:
    "Các cặp được chọn thủ công theo nhóm nghĩa và rà soát bằng đọc nội dung. Chưa có đánh giá độc lập hoặc thử nghiệm cân bằng độ khó với nhóm người chơi thực tế. Kiểm tra tự động chỉ xác nhận cấu trúc và số lượng.",
};
mkdirSync("reports", { recursive: true });
writeFileSync("reports/data-audit.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
