"use client";
import Box from "./Box";

function Meter({ len, min, max }: { len: number; min: number; max: number }) {
  const pct = Math.min(100, (len / max) * 100);
  const color = len === 0 ? "bg-[#E8E8E8]" : len < min ? "bg-brand" : len <= max ? "bg-[#16a34a]" : "bg-[#d63638]";
  return <div className="mt-1 h-1.5 rounded bg-[#E8E8E8]"><div className={`h-1.5 rounded ${color}`} style={{ width: `${pct}%` }} /></div>;
}

type Props = {
  seo: Record<string, string>; onChange: (s: Record<string, string>) => void;
  title: string; slug: string; setSlug: (s: string) => void; fallbackDesc?: string; image?: string | null;
};

/** Yoast-style SEO box: focus keyphrase, Google preview, SEO title, slug, meta description. */
export default function SeoBox({ seo, onChange, title, slug, setSlug, fallbackDesc, image }: Props) {
  const set = (k: string, v: string) => onChange({ ...seo, [k]: v });
  const seoTitle = seo.title || title || "Post title";
  const desc = seo.description || fallbackDesc || "Please provide a meta description by editing the snippet below. If you don't, Google will try to find a relevant part of your post to show in the search results.";
  const date = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const kp = (seo.keyphrase || "").trim().toLowerCase();
  const checks = kp ? [
    ["Keyphrase in SEO title", seoTitle.toLowerCase().includes(kp)],
    ["Keyphrase in meta description", (seo.description || "").toLowerCase().includes(kp)],
    ["Keyphrase in slug", slug.toLowerCase().includes(kp.replace(/\s+/g, "-"))],
  ] as const : [];

  return (
    <Box title="SEO">
      <div className="max-w-2xl space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold">Focus keyphrase</label>
          <input className="input" placeholder="Type here" value={seo.keyphrase || ""} onChange={(e) => set("keyphrase", e.target.value)} />
          <p className="mt-1 text-xs text-[#666666]">The main word or phrase you want this post to be found for.</p>
          {checks.length > 0 && (
            <ul className="mt-2 space-y-0.5 text-xs">
              {checks.map(([label, ok]) => <li key={label} className={ok ? "text-[#16a34a]" : "text-[#d63638]"}>{ok ? "●" : "○"} {label}</li>)}
            </ul>
          )}
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">Google preview</p>
          <div className="rounded-lg border border-[#E8E8E8] p-4 shadow-sm">
            <div className="text-sm">PAJASA Service Apartments</div>
            <div className="text-xs text-[#666666]">www.pajasaapartments.com › {slug || "post-url"}</div>
            <div className="mt-1 text-lg leading-snug text-[#1a0dab]">{seoTitle.length > 65 ? seoTitle.slice(0, 62) + "…" : seoTitle}</div>
            <div className="mt-1 flex gap-3">
              <p className="flex-1 text-sm text-[#4d5156]"><span className="text-[#70757a]">{date} - </span>{desc.length > 160 ? desc.slice(0, 157) + "…" : desc}</p>
              {image && <img src={image} alt="" className="h-20 w-20 shrink-0 rounded object-cover" />}
            </div>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">SEO title</label>
          <input className="input" placeholder={title} value={seo.title || ""} onChange={(e) => set("title", e.target.value)} />
          <Meter len={(seo.title || title).length} min={30} max={60} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">Slug</label>
          <input className="input" placeholder="auto from title" value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">Meta description</label>
          <textarea className="input" rows={3} value={seo.description || ""} onChange={(e) => set("description", e.target.value)} />
          <Meter len={(seo.description || "").length} min={120} max={156} />
        </div>
      </div>
    </Box>
  );
}
