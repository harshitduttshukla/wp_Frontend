"use client";
import { useEffect, useState } from "react";
import { X, Monitor, Smartphone } from "lucide-react";
import { formatPrice } from "@/lib/api";

type Props = {
  title: string; content: string; excerpt: string; price: string; priceLabel: string; featured: boolean;
  image: { url: string } | null; gallery: { url: string }[]; status: string; faqs?: { q: string; a: string }[]; onClose: () => void;
};

/** Live preview of the listing as it is in the editor right now (unsaved changes included). */
export default function ListingPreview(p: Props) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [active, setActive] = useState(0);
  const photos = [p.image, ...p.gallery].filter(Boolean) as { url: string }[];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && p.onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [p]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60">
      <div className="flex items-center justify-between bg-wpdark px-4 py-2 text-sm text-white">
        <span>Preview{p.status !== "publish" && <span className="ml-2 rounded bg-brand px-1.5 py-0.5 text-xs">Not published</span>}</span>
        <div className="flex items-center gap-1">
          {([["desktop", Monitor], ["mobile", Smartphone]] as const).map(([d, Icon]) => (
            <button key={d} type="button" title={d} onClick={() => setDevice(d)}
              className={`rounded p-1.5 ${device === d ? "bg-white/20" : "hover:bg-white/10"}`}><Icon size={16} /></button>
          ))}
          <button type="button" title="Close preview (Esc)" onClick={p.onClose} className="ml-3 rounded p-1.5 hover:bg-white/10"><X size={18} /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4" onClick={p.onClose}>
        <article onClick={(e) => e.stopPropagation()}
          className={`mx-auto bg-white shadow-xl transition-all ${device === "mobile" ? "max-w-[390px]" : "max-w-5xl"}`}>
          {photos.length > 0 ? (
            <div>
              <img src={photos[Math.min(active, photos.length - 1)].url} alt="" className="aspect-[16/9] w-full object-cover" />
              {photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto p-2">
                  {photos.map((ph, i) => (
                    <button key={i} type="button" onClick={() => setActive(i)}
                      className={`h-16 w-24 shrink-0 overflow-hidden rounded border-2 ${i === active ? "border-brand" : "border-transparent"}`}>
                      <img src={ph.url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : <div className="flex aspect-[16/9] items-center justify-center bg-[#f0f0f0] text-sm text-[#999]">No featured image</div>}
          <div className={device === "mobile" ? "p-4" : "p-8"}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className={`font-semibold ${device === "mobile" ? "text-2xl" : "text-3xl"}`}>
                {p.title || <span className="text-[#999]">(no title)</span>}
                {p.featured && <span className="ml-2 align-middle rounded bg-brand px-2 py-0.5 text-xs font-normal text-white">Featured</span>}
              </h1>
              {p.price !== "" && <div className="text-xl font-semibold text-accent">{formatPrice(p.price, p.priceLabel)}</div>}
            </div>
            {p.excerpt && <p className="mt-3 text-[#666666]">{p.excerpt}</p>}
            <div className="mt-6 leading-relaxed [&_a]:text-accent [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:pl-3 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:text-lg [&_h3]:font-semibold [&_img]:my-3 [&_img]:max-w-full [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6"
              dangerouslySetInnerHTML={{ __html: p.content || "<p style='color:#999'>No description yet.</p>" }} />
            {p.faqs && p.faqs.length > 0 && (
              <section className="mt-8">
                <h2 className="mb-3 text-xl font-semibold">Frequently Asked Questions</h2>
                <div className="divide-y divide-[#E8E8E8] rounded border border-[#E8E8E8]">
                  {p.faqs.map((f, i) => (
                    <details key={i} className="group p-4">
                      <summary className="cursor-pointer font-semibold">{f.q}</summary>
                      <p className="mt-2 whitespace-pre-line text-[#666666]">{f.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
