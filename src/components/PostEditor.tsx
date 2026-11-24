"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, Post } from "@/lib/api";
import MediaPicker from "./MediaPicker";
import RichText from "./RichText";
import SeoBox from "./SeoBox";

export default function PostEditor({ id }: { id?: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", slug: "", content: "", excerpt: "", featured_media_id: null as number | null, seo: {} as Record<string, string> });
  const [image, setImage] = useState<string | null>(null);
  const [status, setStatus] = useState<"draft" | "publish">("draft");
  const [picker, setPicker] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    api<Post>(`/api/posts/${id}`).then((p) => {
      setForm({ title: p.title, slug: p.slug, content: p.content, excerpt: p.excerpt, featured_media_id: p.featured_media_id, seo: p.seo || {} });
      setImage(p.featured_image_url || null);
      setStatus(p.status);
    }).catch((e) => setMsg({ ok: false, text: e.message }));
  }, [id]);

  async function save(newStatus: "draft" | "publish") {
    if (!form.title.trim()) return setMsg({ ok: false, text: "Title is required." });
    setSaving(true);
    try {
      const body = JSON.stringify({ ...form, status: newStatus });
      const p = id ? await api<Post>(`/api/posts/${id}`, { method: "PUT", body }) : await api<Post>("/api/posts", { method: "POST", body });
      setStatus(p.status); setForm((f) => ({ ...f, slug: p.slug }));
      setMsg({ ok: true, text: newStatus === "publish" ? "Post published." : "Draft saved." });
      if (!id) router.replace(`/posts/${p.id}`);
    } catch (e: any) { setMsg({ ok: false, text: e.message }); } finally { setSaving(false); }
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-normal">{id ? "Edit Post" : "Add New Post"}</h1>
      {msg && <div className={`mb-4 border-l-4 bg-white p-3 ${msg.ok ? "border-[#16a34a]" : "border-[#d63638]"}`}>{msg.text}</div>}
      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <input className="input !py-2 !text-xl" placeholder="Add title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <div className="text-sm text-[#666666]">Slug: <input className="input !inline-block !w-auto !py-0.5" value={form.slug} placeholder="auto" onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
          <div className="card p-3">
            <label className="label">Content</label>
            <RichText value={form.content} onChange={(v) => setForm((f) => ({ ...f, content: v }))} />
          </div>
          <SeoBox seo={form.seo} onChange={(seo) => setForm((f) => ({ ...f, seo }))} title={form.title} slug={form.slug}
            setSlug={(slug) => setForm((f) => ({ ...f, slug }))} fallbackDesc={form.excerpt} image={image} />
          <div className="card p-3">
            <label className="label">Excerpt</label>
            <textarea className="input" rows={3} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
          </div>
        </div>
        <div className="space-y-4">
          <div className="card">
            <h2 className="border-b p-3 font-semibold">Publish</h2>
            <div className="space-y-3 p-3 text-sm">
              <div>Status: <b>{status === "publish" ? "Published" : "Draft"}</b></div>
              <div className="flex justify-between gap-2">
                <button className="btn" disabled={saving} onClick={() => save("draft")}>{status === "publish" ? "Switch to Draft" : "Save Draft"}</button>
                <button className="btn-primary" disabled={saving} onClick={() => save("publish")}>{status === "publish" ? "Update" : "Publish"}</button>
              </div>
            </div>
          </div>
          <div className="card">
            <h2 className="border-b p-3 font-semibold">Featured image</h2>
            <div className="space-y-2 p-3 text-sm">
              {image && <img src={image} alt="" className="w-full border" />}
              <button className="link" onClick={() => setPicker(true)}>{image ? "Replace featured image" : "Set featured image"}</button>
              {image && <button className="link-danger block" onClick={() => { setImage(null); setForm({ ...form, featured_media_id: null }); }}>Remove featured image</button>}
            </div>
          </div>
        </div>
      </div>
      {picker && <MediaPicker onClose={() => setPicker(false)} onSelect={(m) => { setImage(m.url); setForm({ ...form, featured_media_id: m.id }); setPicker(false); }} />}
    </div>
  );
}
