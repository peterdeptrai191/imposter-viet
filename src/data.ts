import type { Pair } from "./types";
const files = import.meta.glob("./data/*.json", {
  eager: true,
  import: "default",
});
export const builtin = Object.values(files).flat() as Pair[];
export const topics = [...new Set(builtin.map((p) => p.topic))].sort((a, b) =>
  a.localeCompare(b, "vi"),
);
export const difficultyLabel = {
  easy: "Dễ",
  medium: "Vừa",
  hard: "Khó",
  mixed: "Trộn",
};
