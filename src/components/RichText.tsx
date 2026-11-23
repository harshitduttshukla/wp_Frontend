"use client";
import { useEffect, useRef, useState } from "react";
import { Bold, Italic, List, ListOrdered, Quote, AlignLeft, AlignCenter, AlignRight, Link2, Strikethrough, Minus, Undo2, Redo2, Image as ImageIcon } from "lucide-react";
import MediaPicker from "./MediaPicker";

export default function RichText({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [mode, setMode] = useState<"visual" | "code">("visual");
  const [picker, setPicker] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Sync external value into the editor only when it differs (avoids caret jumps while typing)
  useEffect(() => {
    if (mode === "visual" && ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value;
  }, [value, mode]);

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    onChange(ref.current?.innerHTML || "");
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
    [<Link2 size={16} />, "Insert link", () => { const u = prompt("URL"); if (u) exec("createLink", u); }],
    [<Minus size={16} />, "Horizontal line", () => exec("insertHorizontalRule")],
    [<Undo2 size={16} />, "Undo", () => exec("undo")],
    [<Redo2 size={16} />, "Redo", () => exec("redo")],
  ];

  return (
    <div>
      <div className="flex items-end justify-between">
        <button type="button" className="btn mb-1" onClick={() => setPicker(true)}><ImageIcon size={16} /> Add Media</button>
        <div className="flex">
          {(["visual", "code"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)}
              className={`border border-b-0 border-[#E8E8E8] px-3 py-1 text-sm capitalize ${mode === m ? "bg-[#FAFAF8]" : "bg-[#ebebeb] text-[#666666]"}`}>{m}</button>
          ))}
        </div>
      </div>
      <div className="border border-[#E8E8E8]">
        {mode === "visual" ? (
          <>
            <div className="flex flex-wrap items-center gap-1 border-b border-[#E8E8E8] bg-[#FAFAF8] p-1">
              <select className="mr-1 border border-[#E8E8E8] bg-white px-1 py-0.5 text-sm" onChange={(e) => exec("formatBlock", e.target.value)} defaultValue="p">
                <option value="p">Paragraph</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option><option value="h4">Heading 4</option><option value="pre">Preformatted</option>
              </select>
              {tools.map(([icon, title, fn]) => (
                <button key={title} type="button" title={title} onMouseDown={(e) => e.preventDefault()} onClick={fn}
                  className="rounded p-1.5 text-[#666666] hover:bg-white hover:text-wpdark">{icon}</button>
              ))}
            </div>
            <div ref={ref} contentEditable suppressContentEditableWarning onInput={(e) => onChange(e.currentTarget.innerHTML)}
              className="prose-sm min-h-[160px] bg-white p-3 focus:outline-none [&_blockquote]:border-l-4 [&_blockquote]:pl-3 [&_h2]:text-xl [&_h3]:text-lg [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_a]:text-accent [&_a]:underline" />
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
