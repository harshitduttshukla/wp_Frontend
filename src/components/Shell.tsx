"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import { getToken, setToken } from "@/lib/api";

/** Dashboard chrome + login gate. /login renders bare; every other page needs a token. */
export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [ready, setReady] = useState(false);
  const isLogin = path === "/login";

  useEffect(() => {
    if (!isLogin && !getToken()) window.location.href = "/login";
    else setReady(true);
  }, [isLogin]);

  if (isLogin) return <>{children}</>;
  if (!ready) return null;

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-30 flex h-8 items-center justify-between border-b-2 border-brand bg-wpdark px-4 text-[13px] text-[#f0f0f1]">
        <span className="flex items-center gap-2 font-semibold"><span className="grid h-5 w-5 place-items-center rounded bg-brand text-[11px] font-extrabold text-wpdark">P</span>PAJASA Service Apartments</span>
        <span className="flex items-center gap-3">Howdy, admin
          <button className="text-brand hover:underline" onClick={() => { setToken(null); window.location.href = "/login"; }}>Log Out</button>
        </span>
      </div>
      <Sidebar />
      <main className="min-h-screen pl-0 pt-8 md:pl-40">
        <div className="p-5">{children}</div>
      </main>
    </>
  );
}
