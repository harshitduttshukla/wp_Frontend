"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Gauge, Pin, Image as ImageIcon, Tags, Menu } from "lucide-react";
import { TAXONOMIES } from "@/lib/api";

const groups = [
  { label: "Dashboard", href: "/", icon: Gauge, children: [] as { label: string; href: string }[] },
  { label: "Posts", href: "/posts", icon: Pin, children: [{ label: "All Posts", href: "/posts" }, { label: "Add New Post", href: "/posts/new" }] },
  { label: "Media", href: "/media", icon: ImageIcon, children: [{ label: "Library", href: "/media" }] },
  { label: "Listings", href: "/listings", icon: Tags, children: [{ label: "All Listings", href: "/listings" }, { label: "Add Listing", href: "/listings/new" }, ...TAXONOMIES.map((t) => ({ label: t.label, href: `/taxonomy/${t.slug}` }))] },
];

export default function Sidebar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (g: (typeof groups)[number]) =>
    g.href === "/" ? path === "/" : g.label === "Listings" ? path.startsWith("/taxonomy") || path.startsWith("/listings") : path.startsWith(g.href);

  return (
    <>
      <button className="fixed left-2 top-10 z-40 rounded bg-wpdark p-1.5 text-white md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
        <Menu size={18} />
      </button>
      <aside className={`fixed bottom-0 left-0 top-8 z-30 w-40 overflow-y-auto bg-wpdark text-[#f0f0f1] transition-transform md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <nav className="py-2">
          {groups.map((g) => {
            const active = isActive(g);
            const Icon = g.icon;
            return (
              <div key={g.label}>
                <Link href={g.href} onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm ${active ? "bg-brand font-semibold text-wpdark" : "hover:bg-wpdark2 hover:text-brand"}`}>
                  <Icon size={18} /> {g.label}
                </Link>
                {active && g.children.length > 0 && (
                  <div className="bg-wpdark2 py-1">
                    {g.children.map((c) => (
                      <Link key={c.href} href={c.href} onClick={() => setOpen(false)}
                        className={`block px-4 py-1 text-[13px] ${path === c.href ? "font-semibold text-brand" : "text-[#c3c4c7] hover:text-brand"}`}>
                        {c.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
