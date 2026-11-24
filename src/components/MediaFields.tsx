import { Media } from "@/lib/api";

/** Alt text / title / caption / description inputs for a media item. */
export default function MediaFields({ m, onChange }: { m: Media; onChange: (m: Media) => void }) {
  const set = (k: "alt_text" | "title" | "caption" | "description", v: string) => onChange({ ...m, [k]: v });
  return (
    <>
      <div>
        <label className="label">Alt text</label>
        <textarea className="input" rows={2} value={m.alt_text || ""} onChange={(e) => set("alt_text", e.target.value)} />
        <p className="mt-1 text-xs text-[#666666]">Describe the image for search engines and screen readers. Leave empty if purely decorative.</p>
      </div>
      <div><label className="label">Title</label><input className="input" value={m.title || ""} onChange={(e) => set("title", e.target.value)} /></div>
      <div><label className="label">Caption</label><textarea className="input" rows={2} value={m.caption || ""} onChange={(e) => set("caption", e.target.value)} /></div>
      <div><label className="label">Description</label><textarea className="input" rows={3} value={m.description || ""} onChange={(e) => set("description", e.target.value)} /></div>
    </>
  );
}
