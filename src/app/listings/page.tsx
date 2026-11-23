"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown, Star } from "lucide-react";
import { api, formatPrice, ListingRow, STATUS_LABEL, TAXONOMIES, Term } from "@/lib/api";

type Resp = { items: ListingRow[]; total: number; page: number; pages: number; counts: Record<string, number> };
type SortKey = "title" | "price" | "status" | "featured" | "id" | "date";
const FILTER_TAX = TAXONOMIES.filter((t) => t.filterKey);
const STATUS_COLOR = { publish: "bg-[#16a34a]", pending: "bg-[#7c3aed]", draft: "bg-brand" } as const;
const INFO_LABEL: Record<string, string> = { "listing-city": "City", "listing-area": "Area", "listing-type": "Action", "listing-category": "Category" };

export default function ListingsPage() {
  const [data, setData] = useState<Resp | null>(null);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [applied, setApplied] = useState<Record<string, string>>({});
  const [options, setOptions] = useState<Record<string, Term[]>>({});
  const [sort, setSort] = useState<{ by: SortKey; order: "asc" | "desc" }>({ by: "date", order: "desc" });
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [bulk, setBulk] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    FILTER_TAX.forEach((t) => api<Term[]>(`/api/taxonomies/${t.slug}`).then((rows) => setOptions((o) => ({ ...o, [t.filterKey!]: rows }))).catch(() => {}));
  }, []);

  const load = () => {
    const p = new URLSearchParams({ page: String(page), orderby: sort.by, order: sort.order, q, status, ...applied });
    api<Resp>(`/api/listings?${p}`).then((r) => {
      if (r.page > r.pages) return setPage(r.pages);
      setData(r); setPageInput(String(r.page)); setChecked(new Set());
    }).catch((e) => setMsg({ ok: false, text: e.message }));
  };
  useEffect(load, [page, sort, q, status, applied]); // eslint-disable-line

  const items = data?.items || [];
  const allChecked = items.length > 0 && checked.size === items.length;

  async function applyBulk() {
    if (!bulk || !checked.size) return;
    if (bulk === "delete" && !confirm(`Permanently delete ${checked.size} listing(s)?`)) return;
    try {
      const r = await api<{ affected: number }>("/api/listings/bulk", { method: "POST", body: JSON.stringify({ ids: Array.from(checked), action: bulk }) });
      setMsg({ ok: true, text: `${r.affected} listing(s) updated.` }); setBulk(""); load();
    } catch (e: any) { setMsg({ ok: false, text: e.message }); }
  }
  async function remove(l: ListingRow) {
    if (!confirm(`Permanently delete "${l.title || "(no title)"}"?`)) return;
    try { await api(`/api/listings/${l.id}`, { method: "DELETE" }); setMsg({ ok: true, text: "Listing deleted." }); load(); }
    catch (e: any) { setMsg({ ok: false, text: e.message }); }
  }
  async function clone(l: ListingRow) {
    try { await api(`/api/listings/${l.id}/clone`, { method: "POST" }); setMsg({ ok: true, text: "Listing cloned as a draft." }); load(); }
    catch (e: any) { setMsg({ ok: false, text: e.message }); }
  }
  async function toggleFeatured(l: ListingRow) {
    try { await api("/api/listings/bulk", { method: "POST", body: JSON.stringify({ ids: [l.id], action: l.featured ? "unfeature" : "feature" }) }); load(); }
    catch (e: any) { setMsg({ ok: false, text: e.message }); }
  }

  const toggleSort = (by: SortKey) => { setPage(1); setSort((s) => ({ by, order: s.by === by && s.order === "asc" ? "desc" : "asc" })); };
  const SortHead = ({ k, label }: { k: SortKey; label: string }) => (
    <th className="p-2 font-normal">
      <button onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 text-accent hover:underline">
        {label}{sort.by === k ? (sort.order === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : <ChevronsUpDown size={14} className="text-[#a7aaad]" />}
      </button>
    </th>
  );
  const headRow = (
    <tr>
      <th className="w-8 p-2"><input type="checkbox" checked={allChecked} onChange={() => setChecked(allChecked ? new Set() : new Set(items.map((i) => i.id)))} /></th>
      <th className="p-2 font-normal">Image</th>
      <SortHead k="title" label="Title" />
      <th className="p-2 font-normal">Info</th>
      <SortHead k="price" label="Price" />
      <SortHead k="status" label="Status" />
      <SortHead k="featured" label="Featured" />
      <SortHead k="date" label="Date" />
      <SortHead k="id" label="ID" />
    </tr>
  );
  const Pager = () => data && (
    <div className="flex items-center gap-1 text-sm text-[#666666]">
      <span className="mr-2">{data.total.toLocaleString()} item{data.total === 1 ? "" : "s"}</span>
      {data.pages > 1 && <>
        <button className="btn !px-2" disabled={page <= 1} onClick={() => setPage(1)}>«</button>
        <button className="btn !px-2" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
        <input className="input !w-12 text-center" value={pageInput} onChange={(e) => setPageInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") setPage(Math.min(Math.max(parseInt(pageInput) || 1, 1), data.pages)); }} />
        <span className="mx-1">of {data.pages}</span>
        <button className="btn !px-2" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>›</button>
        <button className="btn !px-2" disabled={page >= data.pages} onClick={() => setPage(data.pages)}>»</button>
      </>}
    </div>
  );
  const c = data?.counts || {};

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-2xl font-normal">Listings</h1>
        <Link href="/listings/new" className="btn">Add Listing</Link>
      </div>
      {msg && <div className={`mb-4 flex justify-between border-l-4 bg-white p-3 shadow-sm ${msg.ok ? "border-[#16a34a]" : "border-[#d63638]"}`}>{msg.text}<button onClick={() => setMsg(null)}>✕</button></div>}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 text-sm">
          {[["", "All", c.all], ["publish", "Published", c.publish], ["draft", "Drafts", c.draft], ["pending", "Pending", c.pending]].map(([v, l, n], i) => (
            <span key={v as string}>{i > 0 && <span className="mx-1 text-[#a7aaad]">|</span>}
              <button onClick={() => { setPage(1); setStatus(v as string); }} className={status === v ? "font-bold text-charcoal" : "link"}>{l as string}</button>
              <span className="text-[#666666]"> ({(n as number) ?? 0})</span></span>
          ))}
        </div>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setPage(1); setQ(search); }}>
          <input className="input !w-56" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn">Search Listings</button>
        </form>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <select className="input !w-44" value={bulk} onChange={(e) => setBulk(e.target.value)}>
          <option value="">Bulk actions</option><option value="publish">Publish</option><option value="pending">Mark Pending</option>
          <option value="draft">Move to Draft</option><option value="feature">Mark as Featured</option><option value="unfeature">Remove Featured</option>
          <option value="delete">Delete permanently</option>
        </select>
        <button className="btn" onClick={applyBulk} disabled={!bulk || !checked.size}>Apply</button>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {FILTER_TAX.map((t) => (
          <select key={t.filterKey} className="input !w-48" value={filters[t.filterKey!] || ""} onChange={(e) => setFilters({ ...filters, [t.filterKey!]: e.target.value })}>
            <option value="">{t.filterLabel}</option>
            {(options[t.filterKey!] || []).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        ))}
        <input className="input !w-24" placeholder="ID" value={filters.id || ""} onChange={(e) => setFilters({ ...filters, id: e.target.value.replace(/\D/g, "") })} />
        <button className="btn" onClick={() => { setPage(1); setApplied(Object.fromEntries(Object.entries(filters).filter(([, v]) => v))); }}>Filter</button>
        {Object.keys(applied).length > 0 && <button className="link text-sm" onClick={() => { setFilters({}); setApplied({}); }}>Clear filters</button>}
      </div>
      <div className="mb-2 flex justify-end"><Pager /></div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#E8E8E8]">{headRow}</thead>
          <tbody>
            {data && items.length === 0 && <tr><td colSpan={9} className="p-3 text-[#666666]">No listings found.</td></tr>}
            {items.map((l, i) => (
              <tr key={l.id} className={`group align-top ${i % 2 ? "" : "bg-[#FAFAF8]"}`}>
                <td className="p-2"><input type="checkbox" checked={checked.has(l.id)} onChange={() => { const n = new Set(checked); n.has(l.id) ? n.delete(l.id) : n.add(l.id); setChecked(n); }} /></td>
                <td className="p-2">{l.image_url ? <img src={l.image_url} alt="" className="h-16 w-24 rounded object-cover" /> : <div className="h-16 w-24 rounded bg-[#E8E8E8]" />}</td>
                <td className="max-w-[260px] p-2">
                  <Link href={`/listings/${l.id}`} className="font-semibold text-accent hover:underline">{l.title || "(no title)"}</Link>
                  {l.status !== "publish" && <span className="font-semibold text-[#666666]"> — {STATUS_LABEL[l.status]}</span>}
                  <div className="mt-1 flex flex-wrap gap-1 text-[13px] md:invisible md:group-hover:visible">
                    <Link href={`/listings/${l.id}`} className="link">Edit</Link><span className="text-[#a7aaad]">|</span>
                    <button className="link" onClick={() => clone(l)}>Clone</button><span className="text-[#a7aaad]">|</span>
                    <button className="link-danger" onClick={() => remove(l)}>Delete</button>
                  </div>
                </td>
                <td className="p-2 leading-6">
                  {["listing-city", "listing-area", "listing-type", "listing-category"].map((tax) => {
                    const ts = l.terms.filter((t) => t.taxonomy === tax);
                    return ts.length ? <div key={tax}>{INFO_LABEL[tax]}: <span className="text-accent">{ts.map((t) => t.name).join(", ")}</span></div> : null;
                  })}
                </td>
                <td className="whitespace-nowrap p-2 font-semibold">{formatPrice(l.price, l.price_label)}</td>
                <td className="p-2"><span className="inline-flex items-center gap-2"><span className={`h-4 w-4 rounded ${STATUS_COLOR[l.status]}`} />{STATUS_LABEL[l.status]}</span></td>
                <td className="p-2">
                  <button onClick={() => toggleFeatured(l)} title="Toggle featured" className="inline-flex items-center gap-1">
                    <Star size={16} className={l.featured ? "fill-brand text-brand" : "text-[#a7aaad]"} />{l.featured ? "Yes" : "No"}
                  </button>
                </td>
                <td className="p-2 text-[#666666]">{l.status === "publish" ? "Published" : "Last modified"}<br />{new Date(l.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</td>
                <td className="p-2 text-[#666666]">{l.id}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-[#E8E8E8]">{headRow}</tfoot>
        </table>
      </div>
      <div className="mt-2 flex justify-end"><Pager /></div>
    </div>
  );
}
