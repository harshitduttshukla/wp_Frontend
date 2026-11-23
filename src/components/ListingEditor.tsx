"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { api, Listing, Media, STATUS_LABEL, TAXONOMIES } from "@/lib/api";
import RichText from "./RichText";
import MediaPicker from "./MediaPicker";
import TermBox from "./TermBox";
import Box from "./Box";

type Field = { key: string; label: string; type?: "text" | "number" | "textarea" | "select" | "time" | "email" | "tel" | "url"; options?: string[]; help?: string };

const DETAIL_TABS: { id: string; label: string; fields: Field[] }[] = [
  { id: "general", label: "Property General Details", fields: [
    { key: "guests", label: "Max Guests", type: "number" },
    { key: "bedrooms", label: "Bedrooms", type: "number" },
    { key: "beds", label: "Beds", type: "number" },
    { key: "bathrooms", label: "Bathrooms", type: "number" },
    { key: "size", label: "Property Size (sq ft)", type: "number" },
    { key: "floor", label: "Floor" },
    { key: "property_id", label: "Property Code / Reference" },
  ]},
  { id: "price", label: "Property Price", fields: [
    { key: "weekly_price", label: "Price per night (7+ nights)", type: "number" },
    { key: "monthly_price", label: "Price per night (30+ nights)", type: "number" },
    { key: "cleaning_fee", label: "Cleaning Fee", type: "number" },
    { key: "city_fee", label: "City Fee / Taxes", type: "number" },
    { key: "security_deposit", label: "Security Deposit", type: "number" },
    { key: "extra_guest_price", label: "Extra price per guest per night", type: "number" },
    { key: "min_days", label: "Minimum days of booking", type: "number" },
  ]},
  { id: "media", label: "Property Media", fields: [
    { key: "video_type", label: "Video from", type: "select", options: ["", "youtube", "vimeo"] },
    { key: "video_id", label: "Video ID / URL" },
    { key: "virtual_tour", label: "Virtual tour (embed URL)", type: "url" },
  ]},
  { id: "specific", label: "Property Specific Details", fields: [
    { key: "check_in", label: "Check-in hour", type: "time" },
    { key: "check_out", label: "Check-out hour", type: "time" },
    { key: "smoking", label: "Smoking allowed", type: "select", options: ["", "yes", "no"] },
    { key: "pets", label: "Pets allowed", type: "select", options: ["", "yes", "no"] },
    { key: "parties", label: "Party allowed", type: "select", options: ["", "yes", "no"] },
    { key: "children", label: "Children allowed", type: "select", options: ["", "yes", "no"] },
    { key: "house_rules", label: "Other rules", type: "textarea" },
    { key: "cancellation", label: "Cancellation policy", type: "textarea" },
  ]},
  { id: "map", label: "Map", fields: [
    { key: "address", label: "Address", type: "textarea" },
    { key: "zip", label: "Zip / Postal code" },
    { key: "country", label: "Country" },
    { key: "latitude", label: "Latitude", type: "number" },
    { key: "longitude", label: "Longitude", type: "number" },
    { key: "street_view", label: "Enable Google Street View", type: "select", options: ["no", "yes"] },
  ]},
  { id: "owner", label: "Owner", fields: [
    { key: "owner_name", label: "Owner name" },
    { key: "owner_phone", label: "Owner phone", type: "tel" },
    { key: "owner_email", label: "Owner email", type: "email" },
    { key: "owner_notes", label: "Private notes (not shown on site)", type: "textarea" },
  ]},
];

const APPEARANCE_TABS: { id: string; label: string; fields: Field[] }[] = [
  { id: "search", label: "Advanced Search", fields: [
    { key: "float_search", label: "Use Float Search Form?", type: "select", options: ["global", "yes", "no"] },
    { key: "show_filter_area", label: "Show filter area", type: "select", options: ["yes", "no"] },
  ]},
  { id: "sidebar", label: "Sidebar Settings", fields: [
    { key: "sidebar_position", label: "Where to show the sidebar", type: "select", options: ["global", "right", "left", "none"] },
  ]},
];

const BOX_ORDER = ["listing-category", "listing-type", "listing-city", "listing-area"];
const BOX_ORDER_AFTER_IMAGE = ["listing-features", "listing-status"];

function FieldInput({ f, value, onChange }: { f: Field; value: any; onChange: (v: string) => void }) {
  const v = value ?? (f.type === "select" ? f.options?.[0] ?? "" : "");
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold">{f.label}</label>
      {f.type === "textarea" ? <textarea className="input" rows={3} value={v} onChange={(e) => onChange(e.target.value)} />
        : f.type === "select" ? (
          <select className="input" value={v} onChange={(e) => onChange(e.target.value)}>
            {f.options!.map((o) => <option key={o} value={o}>{o || "—"}</option>)}
          </select>
        ) : <input className="input" type={f.type || "text"} value={v} onChange={(e) => onChange(e.target.value)} />}
      {f.help && <p className="mt-1 text-xs text-[#666666]">{f.help}</p>}
    </div>
  );
}

function Tabs({ tabs, active, setActive, children }: { tabs: { id: string; label: string }[]; active: string; setActive: (id: string) => void; children: React.ReactNode }) {
  return (
    <div className="grid md:grid-cols-[230px_1fr]">
      <nav className="flex gap-1 overflow-x-auto bg-wpdark p-3 md:flex-col md:rounded-bl-lg">
        {tabs.map((t) => (
          <button key={t.id} type="button" onClick={() => setActive(t.id)}
            className={`whitespace-nowrap rounded-md px-3 py-2.5 text-left text-sm ${active === t.id ? "bg-brand font-semibold text-wpdark" : "text-[#e5e5e5] hover:bg-wpdark2"}`}>{t.label}</button>
        ))}
      </nav>
      <div className="min-h-[280px] p-5">{children}</div>
    </div>
  );
}

function Meter({ len, min, max }: { len: number; min: number; max: number }) {
  const pct = Math.min(100, (len / max) * 100);
  const color = len === 0 ? "bg-[#E8E8E8]" : len < min ? "bg-brand" : len <= max ? "bg-[#16a34a]" : "bg-[#d63638]";
  return <div className="mt-1 h-1.5 rounded bg-[#E8E8E8]"><div className={`h-1.5 rounded ${color}`} style={{ width: `${pct}%` }} /></div>;
}

export default function ListingEditor({ id }: { id?: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [status, setStatus] = useState<Listing["status"]>("draft");
  const [savedStatus, setSavedStatus] = useState<Listing["status"] | null>(null);
  const [featured, setFeatured] = useState(false);
  const [price, setPrice] = useState("");
  const [priceLabel, setPriceLabel] = useState("night");
  const [details, setDetails] = useState<Record<string, any>>({});
  const [seo, setSeo] = useState<Record<string, string>>({});
  const [appearance, setAppearance] = useState<Record<string, string>>({});
  const [termIds, setTermIds] = useState<number[]>([]);
  const [image, setImage] = useState<{ id: number; url: string } | null>(null);
  const [gallery, setGallery] = useState<{ id: number; url: string }[]>([]);
  const [picker, setPicker] = useState<"featured" | "gallery" | null>(null);
  const [detailTab, setDetailTab] = useState("general");
  const [appTab, setAppTab] = useState("search");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (!id) return;
    api<Listing>(`/api/listings/${id}`).then((l) => {
      setTitle(l.title); setSlug(l.slug); setContent(l.content); setExcerpt(l.excerpt); setStatus(l.status); setSavedStatus(l.status);
      setFeatured(l.featured); setPrice(l.price ?? ""); setPriceLabel(l.price_label || "night");
      setDetails(l.details || {}); setSeo(l.seo || {}); setAppearance(l.appearance || {}); setTermIds(l.term_ids || []);
      setImage(l.featured_media_id && l.featured_image_url ? { id: l.featured_media_id, url: l.featured_image_url } : null);
      setGallery(l.gallery_media || []);
    }).catch((e) => setMsg({ ok: false, text: e.message })).finally(() => setLoading(false));
  }, [id]);

  async function save(nextStatus: Listing["status"]) {
    setSaving(true); setMsg(null);
    const body = {
      title, slug, content, excerpt, status: nextStatus, featured, price, price_label: priceLabel,
      featured_media_id: image?.id ?? null, term_ids: termIds, seo, appearance,
      details: { ...details, gallery: gallery.map((g) => g.id) },
    };
    try {
      const r = id ? await api<{ id: number }>(`/api/listings/${id}`, { method: "PUT", body: JSON.stringify(body) })
                   : await api<{ id: number }>("/api/listings", { method: "POST", body: JSON.stringify(body) });
      setStatus(nextStatus); setSavedStatus(nextStatus);
      setMsg({ ok: true, text: nextStatus === "publish" ? "Listing published." : nextStatus === "pending" ? "Listing submitted for review." : "Draft saved." });
      if (!id) router.replace(`/listings/${r.id}`);
      else api<Listing>(`/api/listings/${id}`).then((l) => setSlug(l.slug)).catch(() => {});
    } catch (e: any) { setMsg({ ok: false, text: e.message }); } finally { setSaving(false); }
  }

  async function remove() {
    if (!id || !confirm("Delete this listing permanently?")) return;
    try { await api(`/api/listings/${id}`, { method: "DELETE" }); router.push("/listings"); }
    catch (e: any) { setMsg({ ok: false, text: e.message }); }
  }

  function onPick(m: Media) {
    if (picker === "featured") setImage({ id: m.id, url: m.url });
    else if (!gallery.some((g) => g.id === m.id)) setGallery([...gallery, { id: m.id, url: m.url }]);
    setPicker(null);
  }

  const taxBySlug = (s: string) => TAXONOMIES.find((t) => t.slug === s)!;
  const seoTitle = seo.title || title || "Listing title";
  const metaDesc = seo.description || excerpt || "Please provide a meta description by editing the snippet below. If you don't, Google will try to find a relevant part of your post to show in the search results.";
  const tab = DETAIL_TABS.find((t) => t.id === detailTab)!;
  const atab = APPEARANCE_TABS.find((t) => t.id === appTab)!;
  const lat = Number(details.latitude), lng = Number(details.longitude);

  if (loading) return <p className="text-[#666666]">Loading…</p>;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-normal">{id ? "Edit Listing" : "Add Listing"}</h1>
      {msg && <div className={`mb-4 flex justify-between border-l-4 bg-white p-3 shadow-sm ${msg.ok ? "border-[#16a34a]" : "border-[#d63638]"}`}>{msg.text}<button onClick={() => setMsg(null)}>✕</button></div>}

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        {/* ---------- main column ---------- */}
        <div className="min-w-0 space-y-5">
          <input className="input !py-3 !text-2xl" placeholder="Add title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="card p-3">
            <RichText value={content} onChange={setContent} />
            <p className="mt-1 text-xs text-[#666666]">Word count: {content.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length}</p>
          </div>

          <Box title="SEO">
            <div className="max-w-2xl space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold">Focus keyphrase</label>
                <input className="input" placeholder="Type here" value={seo.keyphrase || ""} onChange={(e) => setSeo({ ...seo, keyphrase: e.target.value })} />
                <p className="mt-1 text-xs text-[#666666]">The main word or phrase you want this listing to be found for.</p>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold">Google preview</p>
                <div className="rounded-lg border border-[#E8E8E8] p-4 shadow-sm">
                  <div className="text-xs text-[#666666]">PAJASA Service Apartments › {slug || "listing-url"}</div>
                  <div className="mt-1 text-lg text-[#1a0dab]">{seoTitle}</div>
                  <div className="mt-1 text-sm text-[#4d5156]">{metaDesc.slice(0, 160)}</div>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">SEO title</label>
                <input className="input" placeholder={title} value={seo.title || ""} onChange={(e) => setSeo({ ...seo, title: e.target.value })} />
                <Meter len={(seo.title || title).length} min={30} max={60} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Slug</label>
                <input className="input" placeholder="auto from title" value={slug} onChange={(e) => setSlug(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Meta description</label>
                <textarea className="input" rows={3} value={seo.description || ""} onChange={(e) => setSeo({ ...seo, description: e.target.value })} />
                <Meter len={(seo.description || "").length} min={120} max={156} />
              </div>
            </div>
          </Box>

          <Box title="Excerpt">
            <textarea className="input" rows={3} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
            <p className="mt-1 text-xs text-[#666666]">Excerpts are optional hand-crafted summaries of your content that can be used in your theme.</p>
          </Box>

          <Box title="Property Details" noPad>
            <Tabs tabs={DETAIL_TABS} active={detailTab} setActive={setDetailTab}>
              <h3 className="mb-4 text-lg font-bold">{tab.label}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {detailTab === "price" && <>
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Price (₹)</label>
                    <input className="input" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Price label</label>
                    <select className="input" value={priceLabel} onChange={(e) => setPriceLabel(e.target.value)}>
                      {["night", "day", "week", "month"].map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </>}
                {tab.fields.map((f) => (
                  <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                    <FieldInput f={f} value={details[f.key]} onChange={(v) => setDetails({ ...details, [f.key]: v })} />
                  </div>
                ))}
              </div>
              {detailTab === "media" && (
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold">Gallery images</span>
                    <button type="button" className="btn" onClick={() => setPicker("gallery")}>Add images</button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {gallery.length === 0 && <p className="col-span-full text-sm text-[#666666]">No gallery images yet.</p>}
                    {gallery.map((g, i) => (
                      <div key={g.id} className="group relative aspect-square overflow-hidden rounded border border-[#E8E8E8]">
                        <img src={g.url} alt="" className="h-full w-full object-cover" />
                        <button type="button" onClick={() => setGallery(gallery.filter((x) => x.id !== g.id))} aria-label="Remove image"
                          className="absolute right-1 top-1 rounded-full bg-white/90 p-0.5 shadow"><X size={14} /></button>
                        {i > 0 && <button type="button" onClick={() => { const n = [...gallery]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; setGallery(n); }}
                          className="absolute bottom-1 left-1 rounded bg-white/90 px-1 text-xs shadow">◀</button>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {detailTab === "map" && Number.isFinite(lat) && Number.isFinite(lng) && details.latitude && details.longitude && (
                <iframe title="Map preview" className="mt-5 h-64 w-full rounded border border-[#E8E8E8]" loading="lazy"
                  src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`} />
              )}
            </Tabs>
          </Box>

          <Box title="Appearance Options" noPad>
            <Tabs tabs={APPEARANCE_TABS} active={appTab} setActive={setAppTab}>
              <div className="grid max-w-md gap-4">
                {atab.fields.map((f) => <FieldInput key={f.key} f={f} value={appearance[f.key]} onChange={(v) => setAppearance({ ...appearance, [f.key]: v })} />)}
              </div>
            </Tabs>
          </Box>
        </div>

        {/* ---------- sidebar ---------- */}
        <div className="space-y-5">
          <Box title="Publish">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-2">
                <button className="btn" disabled={saving} onClick={() => save("draft")}>
                  {status === "publish" ? "Switch to Draft" : "Save Draft"}
                </button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Status: <b>{savedStatus ? STATUS_LABEL[savedStatus] : "Not saved"}</b></span>
                <select className="input !w-32" value={status} onChange={(e) => setStatus(e.target.value as Listing["status"])}>
                  <option value="draft">Draft</option><option value="pending">Pending</option><option value="publish">Published</option>
                </select>
              </div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />Make this listing featured</label>
              <div className="flex items-center justify-between border-t border-[#E8E8E8] pt-3">
                {id ? <button className="link-danger" onClick={remove}>Delete</button> : <span />}
                <button className="btn-primary" disabled={saving} onClick={() => save(status === "draft" && savedStatus !== "publish" ? "publish" : status)}>
                  {saving ? "Saving…" : savedStatus === "publish" ? "Update" : status === "pending" ? "Submit for Review" : "Publish"}
                </button>
              </div>
            </div>
          </Box>

          {BOX_ORDER.map((s) => <TermBox key={s} tax={taxBySlug(s)} selected={termIds} onChange={setTermIds} />)}

          <Box title="Featured image">
            {image ? (
              <div className="space-y-2 text-sm">
                <img src={image.url} alt="" className="w-full rounded border border-[#E8E8E8]" />
                <button className="link block" onClick={() => setPicker("featured")}>Replace featured image</button>
                <button className="link-danger block" onClick={() => setImage(null)}>Remove featured image</button>
              </div>
            ) : <button className="link text-sm" onClick={() => setPicker("featured")}>Set featured image</button>}
          </Box>

          {BOX_ORDER_AFTER_IMAGE.map((s) => <TermBox key={s} tax={taxBySlug(s)} selected={termIds} onChange={setTermIds} />)}
        </div>
      </div>
      {picker && <MediaPicker onClose={() => setPicker(null)} onSelect={onPick} />}
    </div>
  );
}
