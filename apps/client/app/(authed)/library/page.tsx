"use client";
import Image from "next/image";
import { useState } from "react";
import { Card, MonoLabel, Badge, Button, Input } from "@wowcut/ui/components";
import { trpc } from "@/lib/trpc";

export default function LibraryPage() {
  const [query, setQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [trendOnly, setTrendOnly] = useState(false);

  const list = trpc.library.list.useQuery({ query, favoritesOnly, trendOnly });
  const stats = trpc.library.stats.useQuery();
  const toggleFav = trpc.library.toggleFavorite.useMutation({
    onSuccess: () => list.refetch(),
  });

  return (
    <section className="p-12 max-w-[1400px]">
      <MonoLabel>Library</MonoLabel>
      <h1 className="mt-3 brand-subheading">Your asset archive</h1>
      {stats.data && (
        <p className="mt-2 text-body fw-330 text-ink/70">
          {stats.data.total} assets — {stats.data.favorites} favorites
        </p>
      )}

      <div className="mt-6 flex gap-3 flex-wrap items-center">
        <Input
          placeholder="Search tags, SKU…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-sm"
        />
        <Button
          variant={favoritesOnly ? "black" : "white"}
          onClick={() => setFavoritesOnly((v) => !v)}
        >
          Favorites
        </Button>
        <Button
          variant={trendOnly ? "black" : "white"}
          onClick={() => setTrendOnly((v) => !v)}
        >
          Trend drops
        </Button>
      </div>

      <div className="mt-8 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {list.data?.items.map((item) => (
          <Card key={item.id} className="p-0 overflow-hidden">
            <div className="aspect-square bg-ink/5 relative">
              {item.unit.chosenGeneration?.outputUrl && (
                <Image
                  src={item.unit.chosenGeneration.outputUrl}
                  alt={item.unit.sku?.name ?? ""}
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <div className="p-3 flex items-center justify-between">
              <Badge tone="neutral">{item.unit.stylePreset}</Badge>
              <button
                onClick={() => toggleFav.mutate({ libraryItemId: item.id })}
                className="text-[14px] fw-540"
              >
                {item.isFavorite ? "★" : "☆"}
              </button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
