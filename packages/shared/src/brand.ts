export const BRAND = {
  name: "Wowcut",
  domain: "wowcut.ai",
  support: "hello@wowcut.ai",
} as const;

export type PlanId =
  | "week_pass"
  | "base"
  | "base_annual"
  | "premium"
  | "premium_annual";

export const PLAN_LIMITS = {
  week_pass: {
    priceCents: 4900,
    billingPeriod: "one_time",
    durationDays: 7,
    totalUnits: 5,
    monthlyUnits: 5,
    retryPerWeek: 0,
    maxCgiMotionPerMonth: 0,
    trendDropBonusUnits: 0,
    styles: ["social_style", "editorial_hero", "cgi_concept"] as const,
    motionAllowed: false,
    supportEnabled: false,
    calendarEnabled: false,
    insightsEnabled: false,
    libraryDurationDays: 7,
  },
  base: {
    priceCents: 25000,
    billingPeriod: "monthly",
    durationDays: null,
    totalUnits: null,
    monthlyUnits: 20,
    retryPerWeek: 1,
    maxCgiMotionPerMonth: 2,
    trendDropBonusUnits: 2,
    styles: ["social_style", "editorial_hero", "cgi_concept"] as const,
    motionAllowed: true,
    supportEnabled: true,
    calendarEnabled: true,
    insightsEnabled: true,
    libraryDurationDays: null,
  },
  base_annual: {
    priceCents: 255000,
    billingPeriod: "yearly",
    durationDays: null,
    totalUnits: null,
    monthlyUnits: 20,
    retryPerWeek: 1,
    maxCgiMotionPerMonth: 2,
    trendDropBonusUnits: 2,
    styles: ["social_style", "editorial_hero", "cgi_concept"] as const,
    motionAllowed: true,
    supportEnabled: true,
    calendarEnabled: true,
    insightsEnabled: true,
    libraryDurationDays: null,
  },
  premium: {
    priceCents: 50000,
    billingPeriod: "monthly",
    durationDays: null,
    totalUnits: null,
    monthlyUnits: 30,
    retryPerWeek: 2,
    maxCgiMotionPerMonth: 2,
    trendDropBonusUnits: 2,
    styles: ["social_style", "editorial_hero", "fashion_campaign", "cgi_concept"] as const,
    motionAllowed: true,
    supportEnabled: true,
    calendarEnabled: true,
    insightsEnabled: true,
    libraryDurationDays: null,
  },
  premium_annual: {
    priceCents: 510000,
    billingPeriod: "yearly",
    durationDays: null,
    totalUnits: null,
    monthlyUnits: 30,
    retryPerWeek: 2,
    maxCgiMotionPerMonth: 2,
    trendDropBonusUnits: 2,
    styles: ["social_style", "editorial_hero", "fashion_campaign", "cgi_concept"] as const,
    motionAllowed: true,
    supportEnabled: true,
    calendarEnabled: true,
    insightsEnabled: true,
    libraryDurationDays: null,
  },
} as const;

export const PREVIEW = {
  ratePerIpPerDay: 3,
  cacheTtlSeconds: 60 * 60 * 24,
  timeoutMs: 180_000,
  maxFailuresBeforeGallery: 3,
  watermarkText: "WOWCUT PREVIEW",
  stylesInMoodboard: ["social_style", "editorial_hero", "cgi_concept"] as const,
  scenesPerStyle: 3,
  seedsPerScene: 3,
  totalImagesInMoodboard: 9,
} as const;

export const PAUSE = {
  maxMonths: 2,
  minMonths: 1,
} as const;

export const QC_THRESHOLDS_DEFAULT = {
  hardFailNsfw: 0.5,
  hardFailBlurMin: 60,
  compositeAutoApprove: 92,
  compositePass: 75,
  confidenceSampleRate: 0.05,
  autoApproveFpAlertThreshold: 0.03,
  autoApproveFpHaltThreshold: 0.05,
} as const;

export const QC_METRIC_WEIGHTS = {
  productIdentity: 0.25,
  promptFidelity: 0.2,
  aestheticQuality: 0.2,
  brandColorMatch: 0.15,
  compositionQuality: 0.1,
  referenceAlignment: 0.1,
} as const;

export const QUEUE_PRIORITIES = {
  preview: 1,
  week_pass_production: 2,
  pilot_minimum: 2,
  pilot_full: 3,
  trend_drop: 4,
  weekly_batch: 5,
  retry: 10,
} as const;

export const QUEUE_NAMES = {
  preview: "preview",
  generation: "generation",
  qc: "qc",
  qcCalibration: "qc-calibration",
  assembly: "assembly",
  delivery: "delivery",
  trend: "trend-generation",
  onboardingCleanup: "onboarding-cleanup",
  weekPassExpiry: "week-pass-expiry",
  veoPoll: "veo-poll",
} as const;

// All costs in USD. Enum values map to Vertex AI models:
//   nano_banana_2       -> gemini-2.5-flash-image-preview  (~$0.039 / image)
//   nano_banana_2_hq    -> imagen-3.0-generate-002         (~$0.06 / image)
//   flux_pro            -> imagen-3.0-fast-generate-001    (~$0.02 / image)
//   kling_v2            -> veo-3.0-generate-001            (~$0.75 / sec of output)
//   seedance_v2_pro     -> veo-3.0-generate-001            (same)
//   runway_gen3         -> veo-2.0-generate-001            (~$0.35 / sec of output)
// Legacy enum values are kept until a Prisma migration is performed; provider
// router maps them to the new Vertex models.
export const MODEL_COSTS_USD = {
  nano_banana_2: 0.039,
  nano_banana_2_hq: 0.06,
  flux_pro: 0.02,
  kling_v2: 0.75,       // per output second
  seedance_v2_pro: 0.75, // per output second
  runway_gen3: 0.35,    // per output second
} as const;
