import { Composition } from "remotion";
import { HeroShot, HeroShotSchema, heroShotDefaults } from "./compositions/HeroShot";
import { ProductDemo, ProductDemoSchema, productDemoDefaults } from "./compositions/ProductDemo";
import { LifestyleCut, LifestyleCutSchema, lifestyleDefaults } from "./compositions/LifestyleCut";
import { CatalogGrid, CatalogGridSchema, catalogDefaults } from "./compositions/CatalogGrid";
import { CgiReveal, CgiRevealSchema, cgiDefaults } from "./compositions/CgiReveal";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="HeroShot"
        component={HeroShot}
        schema={HeroShotSchema}
        defaultProps={heroShotDefaults}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="ProductDemo"
        component={ProductDemo}
        schema={ProductDemoSchema}
        defaultProps={productDemoDefaults}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="LifestyleCut"
        component={LifestyleCut}
        schema={LifestyleCutSchema}
        defaultProps={lifestyleDefaults}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="CatalogGrid"
        component={CatalogGrid}
        schema={CatalogGridSchema}
        defaultProps={catalogDefaults}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1350}
      />
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
