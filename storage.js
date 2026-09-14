import { questions } from "./data.js";
export const STORAGE_KEY = "chiikawa-character-match:v1";
export function validateProgress(value) {
  if (
    !value ||
    value.version !== 1 ||
    !Array.isArray(value.answers) ||
    value.answers.length !== questions.length ||
    !Number.isInteger(value.currentQuestion) ||
    value.currentQuestion < 0 ||
    value.currentQuestion >= questions.length ||
    typeof value.startedAt !== "string" ||
    !Number.isFinite(Date.parse(value.startedAt))
  )
    return null;
  const answers = Array.from(value.answers);
  let gap = false;
  for (const answer of answers) {
    if (answer === null) gap = true;
    else if (gap || !Number.isInteger(answer) || answer < 0 || answer > 3)
      return null;
  }
  const first = answers.indexOf(null);
  if (first !== -1 && value.currentQuestion > first) return null;
  return {
    version: 1,
    currentQuestion: value.currentQuestion,
    answers,
    startedAt: value.startedAt,
  };
}
export function loadProgress(storage) {
  let raw;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return {
      data: null,
      error: "保存を利用できません。画面を閉じずに診断を続けてください。",
    };
  }
  if (!raw) return { data: null };
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      data: null,
      error: "保存データを読み込めませんでした。最初から診断できます。",
    };
  }
  const data = validateProgress(parsed);
  return {
    data,
    error: data
      ? null
      : "保存データを読み込めませんでした。最初から診断できます。",
  };
}
export function saveProgress(storage, data) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
export function clearProgress(storage) {
  try {
    storage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
