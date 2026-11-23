"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, TAXONOMIES } from "@/lib/api";

type Stats = { posts: number; listings: number; media: number; terms: Record<string, number> };

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { api<Stats>("/api/stats").then(setStats).catch((e) => setErr(e.message)); }, []);

  const tiles = [
    { label: "Listings", count: stats?.listings, href: "/listings" },
    { label: "Posts", count: stats?.posts, href: "/posts" },
    { label: "Media", count: stats?.media, href: "/media" },
    ...TAXONOMIES.map((t) => ({ label: t.label, count: stats?.terms[t.slug] ?? 0, href: `/taxonomy/${t.slug}` })),
  ];

  return (
    <div>
      <h1 className="mb-4 text-2xl font-normal">Dashboard</h1>
      {err && <div className="mb-4 border-l-4 border-[#d63638] bg-white p-3">Cannot reach the API: {err}</div>}
      <div className="card p-4">
        <h2 className="mb-3 font-semibold">At a Glance</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((t) => (
            <Link key={t.label} href={t.href} className="rounded border border-[#E8E8E8] p-3 hover:border-brand">
              <div className="text-2xl font-extrabold text-charcoal">{stats ? t.count : "–"}</div>
              <div className="text-sm text-[#666666]">{t.label}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
