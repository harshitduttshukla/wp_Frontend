"use client";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { api, Media } from "@/lib/api";
import MediaFields from "./MediaFields";

export default function MediaPicker({ onSelect, onClose }: { onSelect: (m: Media) => void; onClose: () => void }) {
  const [items, setItems] = useState<Media[]>([]);
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState<Media | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const load = () => api<Media[]>("/api/media").then((m) => { const imgs = m.filter((x) => x.mime_type.startsWith("image/")); setItems(imgs); return imgs; });
  useEffect(() => { load(); }, []);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    setBusy(true);
    try { const up = await api<Media[]>("/api/media", { method: "POST", body: fd }); await load(); if (up[0]) setSel(up[0]); }
    catch (e: any) { alert(e.message); } finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  async function choose() {
    if (!sel) return;
    setSaving(true);
    try {
      const m = await api<Media>(`/api/media/${sel.id}`, { method: "PUT",
        body: JSON.stringify({ title: sel.title, alt_text: sel.alt_text, caption: sel.caption, description: sel.description }) });
      onSelect(m);
    } catch (e: any) { alert(e.message); } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-5xl flex-col bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b p-3">
          <h2 className="text-lg">Select Image</h2>
          <button onClick={onClose} aria-label="Close"><X /></button>
        </div>
        <div className="border-b p-3">
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
          <button className="btn" disabled={busy} onClick={() => fileRef.current?.click()}>{busy ? "Uploading…" : "Upload files"}</button>
        </div>
        <div className="flex min-h-0 flex-1">
          <div className="grid flex-1 auto-rows-min grid-cols-3 gap-2 overflow-y-auto p-3 sm:grid-cols-5">
            {items.length === 0 && <p className="col-span-full text-[#666666]">No images yet.</p>}
            {items.map((m) => (
              <button key={m.id} onClick={() => setSel(m)} onDoubleClick={() => onSelect(m)}
                className={`aspect-square overflow-hidden border hover:ring-2 hover:ring-brand ${sel?.id === m.id ? "ring-4 ring-brand" : ""}`}>
                <img src={m.url} alt={m.alt_text} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
          {sel && (
            <aside className="w-72 shrink-0 space-y-3 overflow-y-auto border-l bg-[#FAFAF8] p-3 text-sm">
              <b>Attachment details</b>
              <img src={sel.url} alt="" className="max-h-40 w-full object-contain" />
              <div className="text-xs text-[#666666]">{sel.original_name} · {(sel.size / 1024).toFixed(0)} KB</div>
              <MediaFields m={sel} onChange={setSel} />
            </aside>
          )}
        </div>
        <div className="flex justify-end border-t p-3">
          <button className="btn-primary" disabled={!sel || saving} onClick={choose}>{saving ? "Saving…" : "Use this image"}</button>
        </div>
      </div>
    </div>
  );
}
