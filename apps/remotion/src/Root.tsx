import { Composition } from "remotion";
import { SocialReel, SocialReelSchema, socialReelDefaults } from "./compositions/SocialReel";
import { EditorialShowcase, EditorialShowcaseSchema, editorialDefaults } from "./compositions/EditorialShowcase";
import { FashionCampaign, FashionCampaignSchema, fashionDefaults } from "./compositions/FashionCampaign";
import { CgiReveal, CgiRevealSchema, cgiDefaults } from "./compositions/CgiReveal";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Social style — 9:16 vertical reel, fast cuts, brand accent */}
      <Composition
        id="SocialReel"
        component={SocialReel}
        schema={SocialReelSchema}
        defaultProps={socialReelDefaults}
        durationInFrames={socialReelDefaults.images.length * 60 + 12}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* Editorial hero — 1:1 square, minimal, product + number counter */}
      <Composition
        id="EditorialShowcase"
        component={EditorialShowcase}
        schema={EditorialShowcaseSchema}
        defaultProps={editorialDefaults}
        durationInFrames={editorialDefaults.images.length * 70 + 18}
        fps={30}
        width={1080}
        height={1080}
      />

      {/* Fashion campaign — 4:5 portrait, cinematic horizontal cuts + CTA */}
      <Composition
        id="FashionCampaign"
        component={FashionCampaign}
        schema={FashionCampaignSchema}
        defaultProps={fashionDefaults}
        durationInFrames={fashionDefaults.images.length * 65 + 20}
        fps={30}
        width={1080}
        height={1350}
      />

      {/* CGI concept — 9:16 vertical, spring scale reveal on gradient */}
      <Composition
        id="CgiReveal"
        component={CgiReveal}
        schema={CgiRevealSchema}
        defaultProps={cgiDefaults}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
