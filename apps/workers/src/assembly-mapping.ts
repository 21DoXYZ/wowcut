import type { StylePresetId, UnitFormat } from "@wowcut/ai";

export interface AssemblyMappingInput {
  stylePreset: StylePresetId;
  format: UnitFormat;
  imageUrl: string;
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

  if (input.stylePreset === "cgi_concept") {
    return {
      compositionId: "CgiReveal",
      kind: motion ? "video" : "still",
      inputProps: {
        imageUrl: input.imageUrl,
        productName: input.productName,
      },
    };
  }

  if (input.stylePreset === "fashion_campaign") {
    return {
      compositionId: "HeroShot",
      kind: motion ? "video" : "still",
      inputProps: {
        imageUrl: input.imageUrl,
        brandName: input.brandName,
        ctaText: input.ctaText,
        brandColor: input.brandColor,
      },
    };
  }

  if (input.stylePreset === "editorial_hero") {
    return {
      compositionId: "ProductDemo",
      kind: motion ? "video" : "still",
      inputProps: {
        imageUrl: input.imageUrl,
        productName: input.productName,
        caption: input.caption,
        brandColor: input.brandColor,
      },
    };
  }

  // social_style default
  return {
    compositionId: "LifestyleCut",
    kind: motion ? "video" : "still",
    inputProps: {
      imageUrl: input.imageUrl,
      quote: input.caption || input.productName,
    },
  };
}
