"use client";
import { useEffect, useRef, useState } from "react";
import {
  Bold, Italic, List, ListOrdered, Quote, AlignLeft, AlignCenter, AlignRight, Link2, Strikethrough, Minus,
  Undo2, Redo2, Image as ImageIcon, Palette, ExternalLink, Unlink, Check, X,
} from "lucide-react";
import MediaPicker from "./MediaPicker";

const SWATCHES = [
  "#000000", "#444444", "#666666", "#999999", "#CF2E2E", "#FF6900", "#FCB900", "#00D084",
  "#0693E3", "#2271B1", "#9B51E0", "#F78DA7", "#8B5A2B", "#1E3A5F", "#0F766E", "#FFFFFF",
];

type LinkPop = { top: number; left: number; url: string; anchor: HTMLAnchorElement | null };

export default function RichText({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [mode, setMode] = useState<"visual" | "code">("visual");
  const [picker, setPicker] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [customColor, setCustomColor] = useState("#2271B1");
  const [linkPop, setLinkPop] = useState<LinkPop | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);

  // Sync external value into the editor only when it differs (avoids caret jumps while typing)
  useEffect(() => {
    if (mode === "visual" && ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value;
  }, [value, mode]);

  // Remember the last selection inside the editor so popovers (color, link) can act on it
  useEffect(() => {
    const onSel = () => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount && ref.current?.contains(sel.anchorNode)) savedRange.current = sel.getRangeAt(0).cloneRange();
    };
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, []);

  // Close popovers when clicking outside the editor
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) { setColorOpen(false); setLinkPop(null); }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const restoreSelection = () => {
    ref.current?.focus();
    const sel = window.getSelection();
    if (sel && savedRange.current) { sel.removeAllRanges(); sel.addRange(savedRange.current); }
  };

  const sync = () => onChange(ref.current?.innerHTML || "");

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    sync();
  };

  const applyColor = (color: string | null) => {
    restoreSelection();
    document.execCommand("styleWithCSS", false, "true");
    if (color) document.execCommand("foreColor", false, color);
    else document.execCommand("removeFormat");
    document.execCommand("styleWithCSS", false, "false");
    sync();
    setColorOpen(false);
  };

  // Position a popover under a DOM rect, relative to the editor wrapper
  const posFrom = (rect: DOMRect) => {
    const w = wrapRef.current!.getBoundingClientRect();
    return { top: rect.bottom - w.top + 6, left: Math.max(0, Math.min(rect.left - w.left, w.width - 320)) };
  };

  const openLinkPopover = (anchor: HTMLAnchorElement | null) => {
    let rect: DOMRect | undefined;
    if (anchor) rect = anchor.getBoundingClientRect();
    else if (savedRange.current) rect = savedRange.current.getBoundingClientRect();
    if (!rect || (!rect.width && !rect.height)) rect = ref.current!.getBoundingClientRect();
    setColorOpen(false);
    setLinkPop({ ...posFrom(rect), url: anchor?.getAttribute("href") || "", anchor });
  };

  const insertLinkClick = () => {
    const sel = window.getSelection();
    const node = sel?.anchorNode;
    const el = node ? (node.nodeType === 1 ? (node as Element) : node.parentElement) : null;
    const existing = el?.closest("a") as HTMLAnchorElement | null;
    openLinkPopover(existing && ref.current?.contains(existing) ? existing : null);
  };

  const normalizeUrl = (u: string) => {
    const t = u.trim();
    if (!t) return "";
    if (/^(https?:|mailto:|tel:|\/|#)/i.test(t)) return t;
    return `https://${t}`;
  };

  const saveLink = () => {
    if (!linkPop) return;
    const url = normalizeUrl(linkPop.url);
    if (!url) { removeLink(); return; }
    if (linkPop.anchor) {
      linkPop.anchor.setAttribute("href", url);
      sync();
    } else {
      restoreSelection();
      const sel = window.getSelection();
      if (sel && sel.isCollapsed) {
        // No text selected: insert the URL itself as the link text
        const safe = url.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
        document.execCommand("insertHTML", false, `<a href="${safe}">${safe}</a>`);
      } else {
        document.execCommand("createLink", false, url);
      }
      sync();
    }
    setLinkPop(null);
  };

  const removeLink = () => {
    const a = linkPop?.anchor;
    if (a && a.parentNode) {
      const parent = a.parentNode;
      while (a.firstChild) parent.insertBefore(a.firstChild, a);
      parent.removeChild(a);
      sync();
    }
    setLinkPop(null);
  };

  const onEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = (e.target as HTMLElement).closest("a") as HTMLAnchorElement | null;
    if (a && ref.current?.contains(a)) { e.preventDefault(); openLinkPopover(a); }
    else setLinkPop(null);
  };

  const tools: [React.ReactNode, string, () => void][] = [
    [<Bold size={16} />, "Bold", () => exec("bold")],
    [<Italic size={16} />, "Italic", () => exec("italic")],
    [<Strikethrough size={16} />, "Strikethrough", () => exec("strikeThrough")],
    [<List size={16} />, "Bulleted list", () => exec("insertUnorderedList")],
    [<ListOrdered size={16} />, "Numbered list", () => exec("insertOrderedList")],
    [<Quote size={16} />, "Blockquote", () => exec("formatBlock", "blockquote")],
    [<AlignLeft size={16} />, "Align left", () => exec("justifyLeft")],
    [<AlignCenter size={16} />, "Align center", () => exec("justifyCenter")],
    [<AlignRight size={16} />, "Align right", () => exec("justifyRight")],
    [<Link2 size={16} />, "Insert / edit link", insertLinkClick],
    [<Minus size={16} />, "Horizontal line", () => exec("insertHorizontalRule")],
    [<Undo2 size={16} />, "Undo", () => exec("undo")],
    [<Redo2 size={16} />, "Redo", () => exec("redo")],
  ];

  const btn = "rounded p-1.5 text-[#666666] hover:bg-white hover:text-wpdark";

  return (
    <div>
      <div className="flex items-end justify-between">
        <button type="button" className="btn mb-1" onClick={() => setPicker(true)}><ImageIcon size={16} /> Add Media</button>
        <div className="flex">
          {(["visual", "code"] as const).map((m) => (
            <button key={m} type="button" onClick={() => { setMode(m); setColorOpen(false); setLinkPop(null); }}
              className={`border border-b-0 border-[#E8E8E8] px-3 py-1 text-sm capitalize ${mode === m ? "bg-[#FAFAF8]" : "bg-[#ebebeb] text-[#666666]"}`}>{m}</button>
          ))}
        </div>
      </div>
      <div ref={wrapRef} className="relative border border-[#E8E8E8]">
        {mode === "visual" ? (
          <>
            <div className="sticky top-8 z-10flex flex-wrap items-center gap-1 border-b border-[#E8E8E8] bg-[#FAFAF8] p-1">
              <select className="mr-1 border border-[#E8E8E8] bg-white px-1 py-0.5 text-sm" onChange={(e) => exec("formatBlock", e.target.value)} defaultValue="p">
                <option value="p">Paragraph</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option><option value="h4">Heading 4</option><option value="pre">Preformatted</option>
              </select>
              {tools.slice(0, 3).map(([icon, title, fn]) => (
                <button key={title} type="button" title={title} onMouseDown={(e) => e.preventDefault()} onClick={fn} className={btn}>{icon}</button>
              ))}

              {/* Font color */}
              <div className="relative">
                <button type="button" title="Text color" onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { setLinkPop(null); setColorOpen((o) => !o); }} className={`${btn} ${colorOpen ? "bg-white text-wpdark" : ""}`}>
                  <Palette size={16} />
                </button>
                {colorOpen && (
                  <div className="absolute left-0 top-full z-20 mt-1 w-[184px] rounded border border-[#E8E8E8] bg-white p-2 shadow-lg" onMouseDown={(e) => { if ((e.target as HTMLElement).tagName !== "INPUT") e.preventDefault(); }}>
                    <div className="grid grid-cols-8 gap-1">
                      {SWATCHES.map((c) => (
                        <button key={c} type="button" title={c} onClick={() => applyColor(c)}
                          className="h-5 w-5 rounded-sm border border-[#d0d0d0] hover:scale-110" style={{ background: c }} />
                      ))}
                    </div>
                    <div className="mt-2 flex items-center gap-1">
                      <input type="color" value={customColor} onChange={(e) => setCustomColor(e.target.value)} className="h-7 w-8 cursor-pointer border border-[#E8E8E8] p-0" />
                      <button type="button" className="flex-1 rounded border border-[#E8E8E8] px-2 py-1 text-xs hover:bg-[#FAFAF8]" onClick={() => applyColor(customColor)}>Apply</button>
                    </div>
                    <button type="button" className="mt-1 w-full rounded px-2 py-1 text-left text-xs text-[#666666] hover:bg-[#FAFAF8]" onClick={() => applyColor(null)}>Clear formatting</button>
                  </div>
                )}
              </div>

              {tools.slice(3).map(([icon, title, fn]) => (
                <button key={title} type="button" title={title} onMouseDown={(e) => e.preventDefault()} onClick={fn} className={btn}>{icon}</button>
              ))}
            </div>
            <div ref={ref} contentEditable suppressContentEditableWarning onInput={(e) => onChange(e.currentTarget.innerHTML)} onClick={onEditorClick}
              className="prose-sm min-h-[160px] bg-white p-3 focus:outline-none [&_blockquote]:border-l-4 [&_blockquote]:pl-3 [&_h2]:text-xl [&_h3]:text-lg [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_a]:cursor-pointer [&_a]:text-accent [&_a]:underline" />

            {/* Link popover: insert, edit, open or remove */}
            {linkPop && (
              <div className="absolute z-20 w-[320px] rounded border border-[#E8E8E8] bg-white p-2 shadow-lg" style={{ top: linkPop.top, left: linkPop.left }}>
                <div className="flex items-center gap-1">
                  <input autoFocus value={linkPop.url} placeholder="Paste or type a URL"
                    onChange={(e) => setLinkPop({ ...linkPop, url: e.target.value })}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveLink(); } if (e.key === "Escape") setLinkPop(null); }}
                    className="min-w-0 flex-1 border border-[#E8E8E8] px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-accent" />
                  <button type="button" title={linkPop.anchor ? "Update link" : "Insert link"} onClick={saveLink} className={btn}><Check size={16} /></button>
                  {linkPop.anchor && <>
                    <a href={linkPop.anchor.getAttribute("href") || "#"} target="_blank" rel="noopener noreferrer" title="Open link in new tab" className={btn}><ExternalLink size={16} /></a>
                    <button type="button" title="Remove link" onClick={removeLink} className={btn}><Unlink size={16} /></button>
                  </>}
                  <button type="button" title="Close" onClick={() => setLinkPop(null)} className={btn}><X size={16} /></button>
                </div>
              </div>
            )}
          </>
        ) : (
          <textarea className="block min-h-[200px] w-full bg-white p-3 font-mono text-sm focus:outline-none" value={value} onChange={(e) => onChange(e.target.value)} />
        )}
      </div>
      {picker && <MediaPicker onClose={() => setPicker(false)} onSelect={(m) => {
        setPicker(false);
        const tag = `<img src="${m.url}" alt="${m.alt_text.replace(/"/g, "&quot;")}" />`;
        if (mode === "code") onChange(value + tag); else exec("insertHTML", tag);
      }} />}
    </div>
  );
}
