export interface SafetyRating {
  category?: string;
  probability?: string;
  severity?: string;
}

export interface NormalizedSafety {
  nsfwScore: number; // 0-1, high = worse
  violentScore: number;
  blocked: boolean;
  reasons: string[];
}

const PROBABILITY_SCORE: Record<string, number> = {
  NEGLIGIBLE: 0.02,
  LOW: 0.15,
  MEDIUM: 0.5,
  HIGH: 0.85,
};

export function normalizeSafety(
  ratings: readonly SafetyRating[] | undefined | null,
): NormalizedSafety {
  const reasons: string[] = [];
  let nsfwScore = 0;
  let violentScore = 0;
  let blocked = false;

  if (!ratings || ratings.length === 0) {
    return { nsfwScore: 0, violentScore: 0, blocked: false, reasons: [] };
  }

  for (const r of ratings) {
    const cat = (r.category ?? "").toUpperCase();
    const probability = PROBABILITY_SCORE[r.probability ?? "NEGLIGIBLE"] ?? 0;
    const severity = PROBABILITY_SCORE[r.severity ?? "NEGLIGIBLE"] ?? 0;
    const score = Math.max(probability, severity);

    if (cat.includes("SEXUAL")) nsfwScore = Math.max(nsfwScore, score);
    if (cat.includes("VIOLENCE")) violentScore = Math.max(violentScore, score);

    if (r.probability === "HIGH" || r.severity === "HIGH") {
      blocked = true;
      reasons.push(`${cat}:${r.probability ?? r.severity}`);
    }
  }

  return { nsfwScore, violentScore, blocked, reasons };
}
