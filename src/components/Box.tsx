"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function Box({ title, children, defaultOpen = true, noPad = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean; noPad?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between border-b border-[#E8E8E8] px-4 py-3 text-left font-bold">
        {title}{open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open && <div className={noPad ? "" : "p-4"}>{children}</div>}
    </div>
  );
}
