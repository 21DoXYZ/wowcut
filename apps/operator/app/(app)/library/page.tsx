"use client";
import Image from "next/image";
import { useState } from "react";
import { Card, MonoLabel, Badge, Button, Input, Label } from "@wowcut/ui/components";
import { trpc } from "@/lib/trpc";

export default function OperatorLibraryPage() {
  const faces = trpc.library.brandFaces.useQuery();
  const toggle = trpc.library.toggleBrandFace.useMutation({ onSuccess: () => faces.refetch() });
  const create = trpc.library.createBrandFace.useMutation({ onSuccess: () => { faces.refetch(); setShowForm(false); setForm({ name: "", referenceUrl: "", descriptors: "" }); } });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", referenceUrl: "", descriptors: "" });
  const [formError, setFormError] = useState<string | null>(null);

  function submit() {
    setFormError(null);
    let descriptors: Record<string, unknown> = {};
    if (form.descriptors.trim()) {
      try {
        descriptors = JSON.parse(form.descriptors) as Record<string, unknown>;
      } catch {
        setFormError("Descriptors must be valid JSON (e.g. {\"age\": \"25-35\"})");
        return;
      }
    }
    create.mutate({ name: form.name, referenceUrl: form.referenceUrl, descriptors });
  }

  return (
    <section className="p-10 max-w-[1100px]">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <MonoLabel>Global library</MonoLabel>
          <h1 className="mt-3 brand-heading">House assets</h1>
        </div>
        <Button variant="black" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "Add brand face"}
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 mb-8">
          <h3 className="brand-subheading mb-4">New brand face</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Model A — editorial"
              />
            </div>
            <div>
              <Label>Reference image URL</Label>
              <Input
                value={form.referenceUrl}
                onChange={(e) => setForm((f) => ({ ...f, referenceUrl: e.target.value }))}
                placeholder="https://cdn.wowcut.ai/faces/..."
              />
            </div>
            <div className="md:col-span-2">
              <Label>Descriptors (JSON)</Label>
              <Input
                value={form.descriptors}
                onChange={(e) => setForm((f) => ({ ...f, descriptors: e.target.value }))}
                placeholder='{"age": "25-35", "style": "editorial", "ethnicity": "..."}'
              />
              {formError && (
                <p className="mt-1 text-[12px] text-red-500">{formError}</p>
              )}
            </div>
          </div>
          <Button
            variant="black"
            className="mt-4"
            loading={create.isPending}
            onClick={submit}
          >
            Save brand face
          </Button>
        </Card>
      )}

      <div>
        <h3 className="text-[13px] fw-480 uppercase tracking-[0.6px] text-ink/40 mb-4">
          Brand faces ({faces.data?.length ?? 0})
        </h3>

        {faces.isLoading && (
          <div className="text-[14px] fw-330 text-ink/40">Loading...</div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {faces.data?.map((face) => (
            <Card key={face.id} className={`p-0 overflow-hidden ${!face.active ? "opacity-50" : ""}`}>
              <div className="aspect-[3/2] bg-ink/6 relative">
                {face.referenceUrl.startsWith("http") && (
                  <Image
                    src={face.referenceUrl}
                    alt={face.name}
                    fill
                    className="object-cover"
                    onError={() => {}}
                  />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[15px] fw-540 tracking-[-0.15px]">{face.name}</div>
                    <div className="mt-1 text-[12px] fw-330 text-ink/40">
                      {face.clientCount} client{face.clientCount !== 1 ? "s" : ""} using this
                    </div>
                  </div>
                  <Badge tone={face.active ? "ok" : "neutral"} size="sm">
                    {face.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {Object.keys(face.descriptors as Record<string, unknown>).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {Object.entries(face.descriptors as Record<string, string>)
                      .slice(0, 4)
                      .map(([k, v]) => (
                        <span
                          key={k}
                          className="text-[11px] fw-330 text-ink/50 bg-ink/6 rounded-[4px] px-2 py-0.5"
                        >
                          {k}: {v}
                        </span>
                      ))}
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    loading={toggle.isPending}
                    onClick={() => toggle.mutate({ id: face.id, active: !face.active })}
                  >
                    {face.active ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {!faces.isLoading && faces.data?.length === 0 && (
            <div className="text-[14px] fw-330 text-ink/40 col-span-3 py-8">
              No brand faces yet. Add one above.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
