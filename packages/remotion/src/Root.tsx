import { Composition } from "remotion";
import { SocialReel, SocialReelSchema, SOCIAL_REEL_CONFIG } from "./compositions/SocialReel";
import { EditorialShowcase, EditorialShowcaseSchema, EDITORIAL_SHOWCASE_CONFIG } from "./compositions/EditorialShowcase";
import { CgiReveal, CgiRevealSchema, CGI_REVEAL_CONFIG } from "./compositions/CgiReveal";
import { FashionCampaign, FashionCampaignSchema, FASHION_CAMPAIGN_CONFIG } from "./compositions/FashionCampaign";

export function Root() {
  return (
    <>
      <Composition
        {...SOCIAL_REEL_CONFIG}
        component={SocialReel}
        schema={SocialReelSchema}
        defaultProps={{
          images: [
            "https://placehold.co/1080x1920/0F1710/86FF6B?text=Product+1",
            "https://placehold.co/1080x1920/1A2E1B/86FF6B?text=Product+2",
            "https://placehold.co/1080x1920/0B1A0C/86FF6B?text=Product+3",
          ],
          caption: "Your caption goes here",
          brandColor: "#86FF6B",
          brandName: "Brand",
        }}
      />

      <Composition
        {...EDITORIAL_SHOWCASE_CONFIG}
        component={EditorialShowcase}
        schema={EditorialShowcaseSchema}
        defaultProps={{
          images: [
            "https://placehold.co/1080x1080/F5F0EB/1A1612?text=Product",
            "https://placehold.co/1080x1080/EDE5D8/1A1612?text=Detail",
          ],
          productName: "Product Name",
          brandColor: "#000000",
          caption: "Editorial",
        }}
      />

      <Composition
        {...CGI_REVEAL_CONFIG}
        component={CgiReveal}
        schema={CgiRevealSchema}
        defaultProps={{
          imageUrl: "https://placehold.co/1080x1920/120830/C084FC?text=CGI+Product",
          productName: "Product Name",
        }}
      />

      <Composition
        {...FASHION_CAMPAIGN_CONFIG}
        component={FashionCampaign}
        schema={FashionCampaignSchema}
        defaultProps={{
          images: [
            "https://placehold.co/1080x1350/0a0a0a/ffffff?text=Campaign+1",
            "https://placehold.co/1080x1350/1a1a1a/ffffff?text=Campaign+2",
          ],
          brandName: "Brand",
          brandColor: "#ffffff",
          ctaText: "Shop now",
        }}
      />
    </>
  );
}
