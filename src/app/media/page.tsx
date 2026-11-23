"use client";
import { useEffect, useRef, useState } from "react";
import { FileText, X } from "lucide-react";
import { api, Media } from "@/lib/api";

export default function MediaPage() {
  const [items, setItems] = useState<Media[]>([]);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Media | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => api<Media[]>(`/api/media?q=${encodeURIComponent(q)}`).then(setItems).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, [q]); // eslint-disable-line

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    setBusy(true); setErr("");
    try { await api("/api/media", { method: "POST", body: fd }); load(); }
    catch (e: any) { setErr(e.message); } finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  async function saveSel() {
    if (!sel) return;
    try { await api(`/api/media/${sel.id}`, { method: "PUT", body: JSON.stringify({ title: sel.title, alt_text: sel.alt_text }) }); load(); setSel(null); }
    catch (e: any) { setErr(e.message); }
  }

  async function remove() {
    if (!sel || !confirm("Delete this file permanently?")) return;
    await api(`/api/media/${sel.id}`, { method: "DELETE" }).catch((e) => setErr(e.message));
    setSel(null); load();
  }

  return (
    <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files); }}>
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-2xl font-normal">Media Library</h1>
        <input ref={fileRef} type="file" multiple hidden accept="image/*,video/mp4,video/webm,application/pdf" onChange={(e) => upload(e.target.files)} />
        <button className="btn" disabled={busy} onClick={() => fileRef.current?.click()}>{busy ? "Uploading…" : "Add New Media File"}</button>
      </div>
      {err && <div className="mb-4 border-l-4 border-[#d63638] bg-white p-3">{err}</div>}
      <div className="mb-3 flex justify-between gap-2">
        <p className="text-sm text-[#666666]">Drag files anywhere here to upload.</p>
        <input className="input max-w-xs" placeholder="Search media" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8">
        {items.length === 0 && <p className="col-span-full text-[#666666]">No media files found.</p>}
        {items.map((m) => (
          <button key={m.id} onClick={() => setSel(m)} className="aspect-square overflow-hidden border border-[#E8E8E8] bg-white hover:ring-2 hover:ring-brand">
            {m.mime_type.startsWith("image/") ? <img src={m.url} alt={m.alt_text} className="h-full w-full object-cover" />
              : <div className="flex h-full flex-col items-center justify-center p-1 text-xs"><FileText />{m.original_name}</div>}
          </button>
        ))}
      </div>

      {sel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSel(null)}>
          <div className="grid max-h-[90vh] w-full max-w-4xl overflow-y-auto bg-white md:grid-cols-[1fr_300px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-center bg-[#f0f0f1] p-4">
              {sel.mime_type.startsWith("image/") ? <img src={sel.url} alt="" className="max-h-[70vh]" />
                : sel.mime_type.startsWith("video/") ? <video src={sel.url} controls className="max-h-[70vh]" />
                : <a href={sel.url} target="_blank" className="link">Open file</a>}
            </div>
            <div className="space-y-3 p-4 text-sm">
              <div className="flex justify-between"><b>Attachment details</b><button onClick={() => setSel(null)} aria-label="Close"><X size={18} /></button></div>
              <div className="text-[#666666]">
                <div>{sel.original_name}</div><div>{new Date(sel.created_at).toLocaleDateString()}</div>
                <div>{(sel.size / 1024).toFixed(0)} KB · {sel.mime_type}</div>
              </div>
              <div><label className="label">Alt text</label><input className="input" value={sel.alt_text} onChange={(e) => setSel({ ...sel, alt_text: e.target.value })} /></div>
              <div><label className="label">Title</label><input className="input" value={sel.title} onChange={(e) => setSel({ ...sel, title: e.target.value })} /></div>
              <div><label className="label">File URL</label><input className="input" readOnly value={sel.url} onFocus={(e) => e.target.select()} /></div>
              <div className="flex items-center justify-between pt-2">
                <button className="link-danger" onClick={remove}>Delete permanently</button>
                <button className="btn-primary" onClick={saveSel}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
