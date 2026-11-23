"use client";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { api, Media } from "@/lib/api";

export default function MediaPicker({ onSelect, onClose }: { onSelect: (m: Media) => void; onClose: () => void }) {
  const [items, setItems] = useState<Media[]>([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const load = () => api<Media[]>("/api/media").then((m) => setItems(m.filter((x) => x.mime_type.startsWith("image/"))));
  useEffect(() => { load(); }, []);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    setBusy(true);
    try { await api("/api/media", { method: "POST", body: fd }); await load(); }
    catch (e: any) { alert(e.message); } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b p-3">
          <h2 className="text-lg">Select Image</h2>
          <button onClick={onClose} aria-label="Close"><X /></button>
        </div>
        <div className="border-b p-3">
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
          <button className="btn" disabled={busy} onClick={() => fileRef.current?.click()}>{busy ? "Uploading…" : "Upload files"}</button>
        </div>
        <div className="grid grid-cols-3 gap-2 overflow-y-auto p-3 sm:grid-cols-5">
          {items.length === 0 && <p className="col-span-full text-[#666666]">No images yet.</p>}
          {items.map((m) => (
            <button key={m.id} onClick={() => onSelect(m)} className="aspect-square overflow-hidden border hover:ring-2 hover:ring-brand">
              <img src={m.url} alt={m.alt_text} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
