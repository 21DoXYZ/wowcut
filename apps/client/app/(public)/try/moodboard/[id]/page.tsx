import { MoodboardView } from "./_view";

export const metadata = { title: "Your moodboard — Wowcut" };

export default function MoodboardPage({ params }: { params: { id: string } }) {
  return <MoodboardView previewId={params.id} />;
}
