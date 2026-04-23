import type { StylePresetId, UnitFormat } from "@wowcut/ai";

export interface AssemblyMappingInput {
  stylePreset: StylePresetId;
  format: UnitFormat;
  /** All generated image URLs for this style/unit (montage input) */
  images: string[];
  brandName: string;
  brandColor: string;
  productName: string;
  caption: string;
  ctaText: string;
}

export interface AssemblyMappingOutput {
  compositionId: string;
  kind: "still" | "video";
  inputProps: Record<string, unknown>;
}

export function mapUnitToComposition(input: AssemblyMappingInput): AssemblyMappingOutput {
  const motion = input.format !== "static";
  const images = input.images.length > 0 ? input.images : [""];

  if (input.stylePreset === "cgi_concept") {
    return {
      compositionId: "CgiReveal",
      kind: motion ? "video" : "still",
      inputProps: {
        imageUrl: images[0],
        productName: input.productName,
      },
    };
  }

  if (input.stylePreset === "fashion_campaign") {
    return {
      compositionId: "FashionCampaign",
      kind: motion ? "video" : "still",
      inputProps: {
        images,
        brandName: input.brandName,
        ctaText: input.ctaText,
        brandColor: input.brandColor,
      },
    };
  }

  if (input.stylePreset === "editorial_hero") {
    return {
      compositionId: "EditorialShowcase",
      kind: motion ? "video" : "still",
      inputProps: {
        images,
        productName: input.productName,
        caption: input.caption,
        brandColor: input.brandColor,
      },
    };
  }

  // social_style
  return {
    compositionId: "SocialReel",
    kind: motion ? "video" : "still",
    inputProps: {
      images,
      caption: input.caption || input.productName,
      brandColor: input.brandColor,
      brandName: input.brandName,
    },
  };
}
