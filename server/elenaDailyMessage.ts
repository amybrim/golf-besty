export type ElenaDailyMessageInput = {
  dateLabel: string;
  gardenWishes: string[];
  hasSavedFramePhoto: boolean;
};

export function buildElenaDailyMessageSystemPrompt() {
  return [
    "You write Elena's short daily companion message inside a fictional privacy-safe product demo.",
    "Write exactly 2 or 3 warm, plainspoken sentences, maximum 70 words.",
    "Use only the details supplied by the user message. Do not invent messages, appointments, sports schedules, weather, health facts, or family activity.",
    "Do not offer medical, gardening, safety, financial, legal, or clinical advice.",
    "Do not call yourself an AI. Do not use bullets, headings, or quotations.",
    "The message should feel calm and present: it may acknowledge Elena's garden, stories, chosen words, or a saved private memory without pressuring her to return.",
  ].join(" ");
}

export function buildElenaDailyMessageUserPrompt(input: ElenaDailyMessageInput) {
  const wishes = input.gardenWishes.length ? input.gardenWishes.join("; ") : "none saved";
  return [
    `Today is ${input.dateLabel}.`,
    `Elena's saved garden wishes: ${wishes}.`,
    `A private Living Frame photo is ${input.hasSavedFramePhoto ? "saved on her device" : "not currently saved"}.`,
    "Write her daily message now.",
  ].join(" ");
}

export function getElenaDailyMessageFallback(input: ElenaDailyMessageInput) {
  const gardenLine = input.gardenWishes.length
    ? `Your garden wishes are still here, including ${input.gardenWishes[0]}.`
    : "Your garden, stories, and chosen words are here when you want them.";
  const frameLine = input.hasSavedFramePhoto
    ? "The memory you saved in your Living Frame is kept close on this device."
    : "You can add a small memory whenever something feels worth keeping.";
  return `Good morning, Elena. ${gardenLine} ${frameLine}`;
}
