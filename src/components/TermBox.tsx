"use client";
import { useEffect, useState } from "react";
import { api, TAXONOMIES, Term } from "@/lib/api";
import Box from "./Box";

type Tax = (typeof TAXONOMIES)[number];

export default function TermBox({ tax, selected, onChange }: { tax: Tax; selected: number[]; onChange: (ids: number[]) => void }) {
  const [terms, setTerms] = useState<Term[]>([]);
  const [filter, setFilter] = useState("");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");

  const load = () => api<Term[]>(`/api/taxonomies/${tax.slug}`).then(setTerms).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, [tax.slug]); // eslint-disable-line

  // order: parents first, each followed by its children (only for self-hierarchical taxonomies)
  const hier = tax.parentTax === tax.slug;
  const ordered: { t: Term; depth: number }[] = [];
  if (hier) {
    const walk = (pid: number | null, d: number) => terms.filter((t) => (t.parent_id ?? null) === pid).forEach((t) => { ordered.push({ t, depth: d }); walk(t.id, d + 1); });
    walk(null, 0);
    terms.forEach((t) => { if (!ordered.find((o) => o.t.id === t.id)) ordered.push({ t, depth: 0 }); });
  } else terms.forEach((t) => ordered.push({ t, depth: 0 }));
  const visible = ordered.filter((o) => o.t.name.toLowerCase().includes(filter.toLowerCase()));
  // show checked first so selected items are easy to see in long lists
  visible.sort((a, b) => Number(selected.includes(b.t.id)) - Number(selected.includes(a.t.id)));

  const toggle = (id: number) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  async function add() {
    if (!name.trim()) return;
    try {
      const t = await api<Term>(`/api/taxonomies/${tax.slug}`, { method: "POST", body: JSON.stringify({ name }) });
      setName(""); setAdding(false); setErr(""); await load(); onChange([...selected, t.id]);
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <Box title={tax.boxTitle || tax.label}>
      {terms.length > 8 && <input className="input mb-2" placeholder="Search…" value={filter} onChange={(e) => setFilter(e.target.value)} />}
      <div className="max-h-56 overflow-y-auto rounded border border-[#E8E8E8] p-2">
        {visible.length === 0 && <p className="text-sm text-[#666666]">Nothing here yet.</p>}
        {visible.map(({ t, depth }) => (
          <label key={t.id} className="flex cursor-pointer items-center gap-2 py-1 text-sm" style={{ paddingLeft: depth * 18 }}>
            <input type="checkbox" checked={selected.includes(t.id)} onChange={() => toggle(t.id)} />{t.name}
          </label>
        ))}
      </div>
      {err && <p className="mt-1 text-sm text-[#d63638]">{err}</p>}
      {adding ? (
        <div className="mt-2 flex gap-2">
          <input className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
          <button type="button" className="btn" onClick={add}>Add</button>
        </div>
      ) : (
        <button type="button" className="link mt-2 text-sm font-semibold" onClick={() => setAdding(true)}>
          + {tax.addTitle ? tax.addTitle.replace(/^Add new/, "Add new") : `Add New ${tax.singular}`}
        </button>
      )}
    </Box>
  );
}
