import { registerRoot } from "remotion";
import { Root } from "./Root";

registerRoot(Root);

export { Root };
export { SocialReel, SocialReelSchema, SOCIAL_REEL_CONFIG } from "./compositions/SocialReel";
export { EditorialShowcase, EditorialShowcaseSchema, EDITORIAL_SHOWCASE_CONFIG } from "./compositions/EditorialShowcase";
export { CgiReveal, CgiRevealSchema, CGI_REVEAL_CONFIG } from "./compositions/CgiReveal";
export { FashionCampaign, FashionCampaignSchema, FASHION_CAMPAIGN_CONFIG } from "./compositions/FashionCampaign";
export { AiconStitch, AiconStitchSchema, AICON_STITCH_CONFIG } from "./compositions/AiconStitch";

export type { SocialReelProps } from "./compositions/SocialReel";
export type { EditorialShowcaseProps } from "./compositions/EditorialShowcase";
export type { CgiRevealProps } from "./compositions/CgiReveal";
export type { FashionCampaignProps } from "./compositions/FashionCampaign";
export type { AiconStitchProps } from "./compositions/AiconStitch";
