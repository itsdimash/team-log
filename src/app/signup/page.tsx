"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, mode, teamName, inviteCode }),
    });
    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error || "Something went wrong.");
      return;
    }

    const signInRes = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (!signInRes?.error) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError("Account created — please sign in.");
      router.push("/login");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-paper rounded p-9 rise-in">
        <h1 className="font-display text-3xl font-semibold text-textdark mb-1">The Log</h1>
        <p className="text-textmuted text-sm mb-6">Create your account</p>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setMode("create")}
            className={`flex-1 py-2 rounded text-sm font-medium border transition-colors ${
              mode === "create" ? "bg-textdark text-paper border-textdark" : "border-rule text-textmuted"
            }`}
          >
            Start a new team
          </button>
          <button
            type="button"
            onClick={() => setMode("join")}
            className={`flex-1 py-2 rounded text-sm font-medium border transition-colors ${
              mode === "join" ? "bg-textdark text-paper border-textdark" : "border-rule text-textmuted"
            }`}
          >
            Join a team
          </button>
        </div>

        {error && <p className="text-sm text-urgent mb-3">{error}</p>}

        <input
          required
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full box-border px-3 py-2.5 mb-3 border border-rule rounded bg-white text-sm"
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full box-border px-3 py-2.5 mb-3 border border-rule rounded bg-white text-sm"
        />
        <input
          required
          type="password"
          minLength={8}
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full box-border px-3 py-2.5 mb-3 border border-rule rounded bg-white text-sm"
        />

        {mode === "create" ? (
          <input
            required
            placeholder="Team name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="w-full box-border px-3 py-2.5 mb-4 border border-rule rounded bg-white text-sm"
          />
        ) : (
          <input
            required
            placeholder="Invite code"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            className="w-full box-border px-3 py-2.5 mb-4 border border-rule rounded bg-white text-sm uppercase"
          />
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded text-sm font-medium text-paper disabled:opacity-60"
          style={{ background: "#3E5E52" }}
        >
          {loading ? "Creating…" : mode === "create" ? "Create team & account" : "Join team"}
        </button>

        <p className="text-xs text-textmuted mt-4 text-center">
          {mode === "create"
            ? "You'll become the team's director and get an invite code to share."
            : "Ask your director for the invite code."}
        </p>
        <p className="text-xs text-textmuted mt-2 text-center">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
