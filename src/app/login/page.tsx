"use client";
import { useState } from "react";
import { api, setToken } from "@/lib/api";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const r = await api<{ token: string }>("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
      setToken(r.token);
      window.location.href = "/";
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f0f0f1] p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-lg bg-white p-6 shadow">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <span className="grid h-7 w-7 place-items-center rounded bg-brand text-sm font-extrabold text-wpdark">P</span>
          PAJASA Dashboard
        </div>
        {err && <div className="border-l-4 border-[#d63638] bg-[#fcf0f1] p-2 text-sm">{err}</div>}
        <div>
          <label className="mb-1 block text-sm font-semibold">Username</label>
          <input className="input" autoFocus autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">Password</label>
          <input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn-primary w-full" disabled={busy || !username || !password}>{busy ? "Logging in…" : "Log In"}</button>
      </form>
    </div>
  );
}
