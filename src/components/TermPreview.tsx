"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { api, formatPrice, ListingRow, Paged, Term, TAXONOMIES } from "@/lib/api";

type Tax = (typeof TAXONOMIES)[number];
const FILTER: Record<string, string> = { "listing-features": "feature" };

/** Preview of a taxonomy term page (city, area, category…) with the published listings in it. */
export default function TermPreview({ term, tax, onClose }: { term: Term; tax: Tax; onClose: () => void }) {
  const key = tax.filterKey || FILTER[tax.slug];
  const [listings, setListings] = useState<ListingRow[] | null>(key ? null : []);

  useEffect(() => {
    if (key) api<Paged<ListingRow>>(`/api/listings?${key}=${term.id}&status=publish&per_page=12`)
      .then((r) => setListings(r.items)).catch(() => setListings([]));
  }, [key, term.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60">
      <div className="flex items-center justify-between bg-wpdark px-4 py-2 text-sm text-white">
        <span>Preview · {tax.singular}</span>
        <button type="button" title="Close preview (Esc)" onClick={onClose} className="rounded p-1.5 hover:bg-white/10"><X size={18} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4" onClick={onClose}>
        <article onClick={(e) => e.stopPropagation()} className="mx-auto max-w-5xl bg-white shadow-xl">
          <div className="relative">
            {term.image_url ? <img src={term.image_url} alt="" className="aspect-[3/1] w-full object-cover" />
              : <div className="aspect-[3/1] w-full bg-[#f0f0f0]" />}
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-6 text-white">
              {term.parent_name && <div className="text-sm opacity-90">{term.parent_name}</div>}
              <h1 className="text-3xl font-semibold">{term.name}</h1>
              <div className="text-sm opacity-90">{term.count} listing{term.count === 1 ? "" : "s"}</div>
            </div>
          </div>
          <div className="p-8">
            {term.description && (
              <div className="mb-8 leading-relaxed [&_a]:text-accent [&_a]:underline [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6"
                dangerouslySetInnerHTML={{ __html: term.description }} />
            )}
            {key && <>
              <h2 className="mb-3 text-xl font-semibold">Listings in {term.name}</h2>
              {listings === null ? <p className="text-sm text-[#666666]">Loading…</p>
                : listings.length === 0 ? <p className="text-sm text-[#666666]">No published listings yet.</p>
                : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {listings.map((l) => (
                      <div key={l.id} className="overflow-hidden rounded border border-[#E8E8E8]">
                        {l.image_url ? <img src={l.image_url} alt="" className="aspect-[4/3] w-full object-cover" /> : <div className="aspect-[4/3] bg-[#f0f0f0]" />}
                        <div className="p-3">
                          <div className="font-semibold">{l.title}</div>
                          {l.price && <div className="text-sm text-accent">{formatPrice(l.price, l.price_label)}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </>}
          </div>
        </article>
      </div>
    </div>
  );
}
