"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, Post } from "@/lib/api";

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");

  const load = () => api<Post[]>(`/api/posts?status=${status}&q=${encodeURIComponent(q)}`).then(setPosts).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, [status, q]); // eslint-disable-line

  async function remove(p: Post) {
    if (!confirm(`Delete "${p.title}"?`)) return;
    await api(`/api/posts/${p.id}`, { method: "DELETE" }).catch((e) => setErr(e.message));
    load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-2xl font-normal">Posts</h1>
        <Link href="/posts/new" className="btn">Add New Post</Link>
      </div>
      {err && <div className="mb-4 border-l-4 border-[#d63638] bg-white p-3">{err}</div>}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2 text-sm">
          {[["", "All"], ["publish", "Published"], ["draft", "Drafts"]].map(([v, l]) => (
            <button key={v} onClick={() => setStatus(v)} className={status === v ? "font-semibold" : "link"}>{l}</button>
          ))}
        </div>
        <input className="input max-w-xs" placeholder="Search Posts" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#E8E8E8]"><tr><th className="p-2">Title</th><th className="p-2">Status</th><th className="p-2">Last updated</th></tr></thead>
          <tbody>
            {posts.length === 0 && <tr><td colSpan={3} className="p-3 text-[#666666]">No posts found.</td></tr>}
            {posts.map((p, i) => (
              <tr key={p.id} className={`group ${i % 2 ? "" : "bg-[#FAFAF8]"}`}>
                <td className="p-2">
                  <Link href={`/posts/${p.id}`} className="font-semibold text-accent hover:underline">{p.title}</Link>
                  {p.status === "draft" && <span className="font-semibold text-[#666666]"> — Draft</span>}
                  <div className="mt-1 flex gap-2 text-xs md:opacity-0 md:group-hover:opacity-100">
                    <Link href={`/posts/${p.id}`} className="link">Edit</Link>|
                    <button className="link-danger" onClick={() => remove(p)}>Trash</button>
                  </div>
                </td>
                <td className="p-2">{p.status === "publish" ? "Published" : "Draft"}</td>
                <td className="p-2 text-[#666666]">{new Date(p.updated_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
