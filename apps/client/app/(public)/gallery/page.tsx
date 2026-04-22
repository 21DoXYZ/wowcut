import { MonoLabel, Card } from "@wowcut/ui/components";

export const metadata = { title: "Gallery — Wowcut" };

const GALLERY = [
  { id: "g1", style: "Editorial Hero", gradient: "bg-gradient-to-br from-[#1A1A1A] to-[#3E3E3E]" },
  { id: "g2", style: "Social Style", gradient: "bg-gradient-to-br from-[#86FF6B] to-[#FFE24B]" },
  { id: "g3", style: "CGI Concept", gradient: "bg-gradient-to-br from-[#7A3BFF] to-[#FF4BD4]" },
  { id: "g4", style: "Editorial Hero", gradient: "bg-gradient-to-br from-[#FFE24B] to-[#FF4BD4]" },
  { id: "g5", style: "Social Style", gradient: "bg-gradient-to-br from-[#86FF6B] to-[#7A3BFF]" },
  { id: "g6", style: "CGI Concept", gradient: "bg-gradient-to-br from-[#FF4BD4] to-[#FFE24B]" },
];

export default function GalleryPage() {
  return (
    <section className="max-w-[1280px] mx-auto px-6 lg:px-10 py-16 md:py-24">
      <MonoLabel>Gallery</MonoLabel>
      <h1 className="mt-4 brand-heading">Examples from brands like yours</h1>
      <div className="mt-12 grid gap-4 grid-cols-2 md:grid-cols-3">
        {GALLERY.map((g) => (
          <Card key={g.id} className="p-0 overflow-hidden">
            <div className={`aspect-square ${g.gradient}`} />
            <div className="p-4">
              <MonoLabel size="sm">{g.style}</MonoLabel>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
