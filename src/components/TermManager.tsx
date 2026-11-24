"use client";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { api, Paged, Term, TAXONOMIES } from "@/lib/api";
import MediaPicker from "./MediaPicker";
import RichText from "./RichText";
import TermPreview from "./TermPreview";

type Tax = (typeof TAXONOMIES)[number];
type SortKey = "name" | "description" | "slug" | "count" | "id";
const PER_PAGE = 20;
const empty = { name: "", slug: "", description: "", custom_uri: "", parent_id: "", image_id: null as number | null, image_url: null as string | null };
const stripHtml = (h: string) => h.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

export default function TermManager({ tax }: { tax: Tax }) {
  const [terms, setTerms] = useState<Term[]>([]);
  const [parents, setParents] = useState<Term[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ by: SortKey; order: "asc" | "desc" }>({ by: "name", order: "asc" });
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [bulk, setBulk] = useState("");
  const [quick, setQuick] = useState<{ id: number; name: string; slug: string } | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [picker, setPicker] = useState(false);
  const [preview, setPreview] = useState<Term | null>(null);
  const [saving, setSaving] = useState(false);

  const singularLower = tax.singular.toLowerCase();
  const parentLabel = tax.parentLabel || (tax.parentTax === "listing-city" ? "City" : `Parent ${tax.singular}`);

  const load = () =>
    api<Paged<Term>>(`/api/taxonomies/${tax.slug}?q=${encodeURIComponent(q)}&orderby=${sort.by}&order=${sort.order}&page=${page}&per_page=${PER_PAGE}`)
      .then((r) => {
        if (r.page > r.pages) return setPage(r.pages); // e.g. after deleting the last item on the last page
        setTerms(r.items); setMeta({ total: r.total, pages: r.pages }); setPageInput(String(r.page)); setChecked(new Set());
      })
      .catch((e) => setMsg({ ok: false, text: e.message }));

  useEffect(() => { load(); }, [q, sort, page]); // eslint-disable-line
  useEffect(() => {
    if (tax.parentTax) api<Term[]>(`/api/taxonomies/${tax.parentTax}`).then(setParents).catch(() => {});
  }, [tax.parentTax, terms]);

  const flash = (ok: boolean, text: string) => setMsg({ ok, text });
  function reset() { setForm(empty); setEditId(null); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = JSON.stringify({ ...form, parent_id: form.parent_id || null });
      if (editId) await api(`/api/taxonomies/${tax.slug}/${editId}`, { method: "PUT", body });
      else await api(`/api/taxonomies/${tax.slug}`, { method: "POST", body });
      flash(true, `${tax.singular} ${editId ? "updated" : "added"}.`);
      reset(); load();
    } catch (e: any) { flash(false, e.message); } finally { setSaving(false); }
  }

  async function remove(t: Term) {
    if (!confirm(`You are about to permanently delete "${t.name}".`)) return;
    try { await api(`/api/taxonomies/${tax.slug}/${t.id}`, { method: "DELETE" }); if (editId === t.id) reset(); flash(true, `${tax.singular} deleted.`); load(); }
    catch (e: any) { flash(false, e.message); }
  }

  async function applyBulk() {
    if (bulk !== "delete" || checked.size === 0) return;
    if (!confirm(`Delete ${checked.size} selected item(s)?`)) return;
    try {
      const r = await api<{ deleted: number }>(`/api/taxonomies/${tax.slug}/bulk-delete`, { method: "POST", body: JSON.stringify({ ids: Array.from(checked) }) });
      if (editId && checked.has(editId)) reset();
      flash(true, `${r.deleted} item(s) deleted.`); setBulk(""); load();
    } catch (e: any) { flash(false, e.message); }
  }

  async function saveQuick() {
    if (!quick) return;
    const t = terms.find((x) => x.id === quick.id)!;
    try {
      await api(`/api/taxonomies/${tax.slug}/${t.id}`, { method: "PUT", body: JSON.stringify({ ...t, name: quick.name, slug: quick.slug }) });
      setQuick(null); flash(true, `${tax.singular} updated.`); load();
    } catch (e: any) { flash(false, e.message); }
  }

  function edit(t: Term) {
    setEditId(t.id); setQuick(null);
    setForm({ name: t.name, slug: t.slug, description: t.description, custom_uri: t.custom_uri || "", parent_id: t.parent_id ? String(t.parent_id) : "", image_id: t.image_id, image_url: t.image_url });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const toggleSort = (by: SortKey) => { setPage(1); setSort((s) => ({ by, order: s.by === by && s.order === "asc" ? "desc" : "asc" })); };
  const SortHead = ({ k, label, className = "" }: { k: SortKey; label: string; className?: string }) => (
    <th className={`p-2 font-normal ${className}`}>
      <button type="button" onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 text-accent hover:underline">
        {label}
        {sort.by === k ? (sort.order === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : <ChevronsUpDown size={14} className="text-[#a7aaad]" />}
      </button>
    </th>
  );

  const allChecked = terms.length > 0 && checked.size === terms.length;
  const cols = 5 + (tax.hideIdColumn ? 0 : 1) + (tax.hideDescriptionColumn ? 0 : 1) + (tax.parentTax && !tax.hideParentColumn ? 1 : 0) + (tax.customUri && !tax.hidePermalinkColumn ? 1 : 0);

  const headRow = (
<tr>
                  <th className="w-8 p-2"><input type="checkbox" checked={allChecked} onChange={() => setChecked(allChecked ? new Set() : new Set(terms.map((t) => t.id)))} /></th>
                  <th className="w-14 p-2 font-normal">Image</th>
                  <SortHead k="name" label="Name" />
                  {!tax.hideDescriptionColumn && <SortHead k="description" label="Description" />}
                  {tax.parentTax && !tax.hideParentColumn && <th className="p-2 font-normal">{tax.parentTax === "listing-city" ? "City" : "Parent"}</th>}
                  <SortHead k="slug" label="Slug" />
                  <SortHead k="count" label={tax.countLabel || "Count"} className="text-center" />
                  {!tax.hideIdColumn && <SortHead k="id" label="ID" />}
                  {tax.customUri && !tax.hidePermalinkColumn && <th className="p-2 font-normal">Custom permalink</th>}
                </tr>
  );

  const BulkBar = () => (
    <div className="flex flex-wrap items-center justify-between gap-2 py-2">
      <div className="flex gap-2">
        <select className="input !w-44" value={bulk} onChange={(e) => setBulk(e.target.value)}>
          <option value="">Bulk actions</option><option value="delete">Delete</option>
        </select>
        <button className="btn" onClick={applyBulk} disabled={!bulk || checked.size === 0}>Apply</button>
      </div>
      <div className="flex items-center gap-1 text-sm text-[#666666]">
        <span className="mr-2">{meta.total} item{meta.total === 1 ? "" : "s"}</span>
        {meta.pages > 1 && (
          <>
            <button className="btn !px-2" disabled={page <= 1} onClick={() => setPage(1)} aria-label="First page">«</button>
            <button className="btn !px-2" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Previous page">‹</button>
            <input className="input !w-12 text-center" value={pageInput} onChange={(e) => setPageInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { const n = Math.min(Math.max(parseInt(pageInput) || 1, 1), meta.pages); setPage(n); setPageInput(String(n)); } }} />
            <span className="mx-1">of {meta.pages}</span>
            <button className="btn !px-2" disabled={page >= meta.pages} onClick={() => setPage(page + 1)} aria-label="Next page">›</button>
            <button className="btn !px-2" disabled={page >= meta.pages} onClick={() => setPage(meta.pages)} aria-label="Last page">»</button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-normal">{tax.label}</h1>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setPage(1); setQ(search); }}>
          <input className="input !w-56" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn">{tax.searchLabel || `Search ${tax.label.replace("Listing ", "")}`}</button>
        </form>
      </div>
      {msg && (
        <div className={`mb-4 flex justify-between border-l-4 bg-white p-3 shadow-sm ${msg.ok ? "border-[#16a34a]" : "border-[#d63638]"}`}>
          {msg.text}<button onClick={() => setMsg(null)} className="text-[#787c82]">✕</button>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(300px,420px)_1fr]">
        {/* Left: add / edit form */}
        <form onSubmit={save} className="space-y-5">
          <h2 className="text-lg font-semibold">{editId ? `Edit ${tax.singular}` : tax.addTitle || `Add New ${tax.singular}`}</h2>
          <div>
            <label className="mb-1 block text-sm">Name</label>
            <input className="input !py-2" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <p className="mt-1 text-[13px] text-[#666666]">The name is how it appears on your site.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm">Slug</label>
            <input className="input !py-2" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            <p className="mt-1 text-[13px] text-[#666666]">The “slug” is the URL-friendly version of the name. It is usually all lowercase and contains only letters, numbers, and hyphens.</p>
          </div>
          {tax.parentTax && (
            <div>
              <label className="mb-1 block text-sm">{parentLabel}</label>
              <select className="input !py-2" value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}>
                <option value="">None</option>
                {parents.filter((p) => p.id !== editId).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <p className="mt-1 text-[13px] text-[#666666]">
                {tax.parentTax === "listing-city" ? "Choose the city this area belongs to." : "Assign a parent term to create a hierarchy. The term Jazz, for example, would be the parent of Bebop and Big Band."}
              </p>
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm">Description</label>
            <RichText value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} />
            <p className="mt-1 text-[13px] text-[#666666]">The description is not prominent by default; however, some themes may show it.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm">Image</label>
            {form.image_url && <img src={form.image_url} alt="" className="mb-2 h-24 w-24 border object-cover" />}
            <div className="flex gap-3">
              <button type="button" className="btn" onClick={() => setPicker(true)}>{form.image_url ? "Change" : "Select"} image</button>
              {form.image_url && <button type="button" className="link-danger text-sm" onClick={() => setForm({ ...form, image_id: null, image_url: null })}>Remove</button>}
            </div>
          </div>
          {tax.infoBox && <div className="rounded border border-[#F9C77A] bg-[#FEF3E2] p-5 text-sm leading-6">{tax.infoBox}</div>}
          {tax.customUri && (
            <div>
              <label className="mb-1 block text-sm">Custom URI</label>
              <input className="input !py-2" value={form.custom_uri} placeholder="e.g. in/ahmedabad" onChange={(e) => setForm({ ...form, custom_uri: e.target.value })} />
              <p className="mt-1 text-[13px] text-[#666666]">Clear/leave the field empty to use the default permalink.</p>
            </div>
          )}
          <div className="flex gap-2">
            <button className="btn-primary" disabled={saving}>{editId ? "Update" : `Add New ${tax.singular}`}</button>
            {editId && <button type="button" className="btn" onClick={reset}>Cancel</button>}
          </div>
        </form>

        {/* Right: list table */}
        <div className="min-w-0">
          <BulkBar />
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#E8E8E8]">{headRow}</thead>
              <tbody>
                {terms.length === 0 && <tr><td colSpan={cols} className="p-3 text-[#666666]">No {tax.label.toLowerCase()} found.</td></tr>}
                {terms.map((t, i) =>
                  quick?.id === t.id ? (
                    <tr key={t.id} className="bg-[#FAFAF8]">
                      <td colSpan={cols} className="p-3">
                        <div className="mb-2 text-xs font-semibold uppercase text-[#666666]">Quick Edit</div>
                        <div className="grid max-w-xl gap-2 sm:grid-cols-2">
                          <label className="text-sm">Name<input className="input mt-1" value={quick.name} onChange={(e) => setQuick({ ...quick, name: e.target.value })} /></label>
                          <label className="text-sm">Slug<input className="input mt-1" value={quick.slug} onChange={(e) => setQuick({ ...quick, slug: e.target.value })} /></label>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button className="btn-primary" onClick={saveQuick}>Update {tax.singular}</button>
                          <button className="btn" onClick={() => setQuick(null)}>Cancel</button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={t.id} className={`group align-top ${i % 2 ? "" : "bg-[#FAFAF8]"}`}>
                      <td className="p-2"><input type="checkbox" checked={checked.has(t.id)} onChange={() => {
                        const n = new Set(checked); n.has(t.id) ? n.delete(t.id) : n.add(t.id); setChecked(n);
                      }} /></td>
                      <td className="p-2">{t.image_url ? <img src={t.image_url} alt="" className="h-10 w-10 object-cover" /> : <div className="h-10 w-10 bg-[#dcdcde]" />}</td>
                      <td className="p-2">
                        <button className="text-left font-semibold text-accent hover:underline" onClick={() => edit(t)}>
                          {t.parent_id && tax.parentTax === tax.slug ? "— " : ""}{t.name}
                        </button>
                        <div className="mt-1 flex flex-wrap gap-1 text-[13px] md:invisible md:group-hover:visible">
                          <button className="link" onClick={() => edit(t)}>Edit</button><span className="text-[#a7aaad]">|</span>
                          <button className="link" onClick={() => setQuick({ id: t.id, name: t.name, slug: t.slug })}>Quick Edit</button><span className="text-[#a7aaad]">|</span>
                          <button className="link" onClick={() => setPreview(t)}>Preview</button><span className="text-[#a7aaad]">|</span>
                          <button className="link-danger" onClick={() => remove(t)}>Delete</button>
                        </div>
                      </td>
                      {!tax.hideDescriptionColumn && <td className="max-w-[220px] p-2 text-[#666666]">{stripHtml(t.description).slice(0, 120) || "—"}</td>}
                      {tax.parentTax && !tax.hideParentColumn && <td className="p-2">{t.parent_name || "—"}</td>}
                      <td className="p-2 text-[#666666]">{t.slug}</td>
                      <td className="p-2 text-center text-accent">{t.count}</td>
                      {!tax.hideIdColumn && <td className="p-2 text-[#666666]">{t.id}</td>}
                      {tax.customUri && !tax.hidePermalinkColumn && <td className="p-2 text-[#666666]">{t.custom_uri || t.slug}</td>}
                    </tr>
                  )
                )}
              </tbody>
              <tfoot className="border-t border-[#E8E8E8]">{headRow}</tfoot>
            </table>
          </div>
          <BulkBar />
        </div>
      </div>
      {preview && <TermPreview term={preview} tax={tax} onClose={() => setPreview(null)} />}
      {picker && <MediaPicker onClose={() => setPicker(false)} onSelect={(m) => { setForm({ ...form, image_id: m.id, image_url: m.url }); setPicker(false); }} />}
    </div>
  );
}
