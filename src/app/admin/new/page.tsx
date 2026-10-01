"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Suggestion {
  name: string;
  description: string;
  tags: string[];
  category: string;
  suggestedPrice: number | null;
}

export default function NewProductPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiUsed, setAiUsed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setError(null);
    setFile(selected);
    setAiUsed(false);

    const dataUrl = await readFileAsDataUrl(selected);
    setPreviewUrl(dataUrl);

    setAnalyzing(true);
    try {
      const res = await fetch("/api/admin/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI analysis failed");

      const suggestion: Suggestion = data.suggestion;
      setName(suggestion.name);
      setDescription(suggestion.description);
      setTags(suggestion.tags.join(", "));
      setCategory(suggestion.category);
      if (suggestion.suggestedPrice != null) setPrice(String(suggestion.suggestedPrice));
      setAiUsed(true);
    } catch (err: any) {
      setError(err.message || "AI analysis failed. You can still fill the form manually.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please choose a product photo first.");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const form = new FormData();
      form.set("image", file);
      form.set("name", name);
      form.set("description", description);
      form.set("tags", tags);
      form.set("category", category);
      form.set("price", price || "0");
      form.set("stock", stock || "0");
      form.set("aiGenerated", String(aiUsed));

      const res = await fetch("/api/admin/products", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save product");

      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <p className="mb-6 text-sm text-slate-500">
        Upload a product photo. AI will automatically write the name, description, tags, and
        category — review and edit before saving.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Product photo</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-brand-600 file:px-3 file:py-2 file:text-white hover:file:bg-brand-700"
          />
        </div>

        {previewUrl && (
          <div className="relative h-56 w-56 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            <Image src={previewUrl} alt="Preview" fill className="object-cover" />
            {analyzing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm text-white">
                ✨ AI analyzing image…
              </div>
            )}
          </div>
        )}

        {aiUsed && !analyzing && (
          <p className="text-sm text-brand-600">✨ Fields auto-filled by AI — feel free to edit.</p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <Field label="Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Tags (comma separated)">
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Price (USD)">
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Stock">
            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
        </div>

        <button
          type="submit"
          disabled={saving || analyzing}
          className="mt-2 rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save product"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
