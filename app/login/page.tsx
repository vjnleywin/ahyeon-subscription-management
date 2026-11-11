
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (!data.session) {
        throw new Error("Login succeeded but no session was created.");
      }

      router.push("/");
      router.refresh();

    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#090909] text-white flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-[420px]">

        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Ahyeon's Subscription
            <br />
            <span className="text-[#1DB954]">Management</span>
          </h1>
          <p className="text-[#777] text-sm mt-3">
            Ahyeon Please Marry Me
          </p>
        </div>

        <div className="bg-[#111] border border-[#252525] p-8 sm:p-10">

          <div className="mb-8">
            <p className="text-[#1DB954] text-[11px] font-bold uppercase tracking-[0.2em] mb-3">
              Welcome back
            </p>
            <h2 className="text-2xl font-semibold">
              Sign in to your account
            </h2>
            <p className="text-[#777] text-sm mt-2">
              Enter your credentials to continue.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">

            <div>
              <label className="block text-xs font-semibold text-[#aaa] mb-2 uppercase tracking-wider">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
                className="w-full h-12 bg-[#090909] border border-[#303030] px-4 text-sm outline-none focus:border-[#1DB954]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#aaa] mb-2 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="w-full h-12 bg-[#090909] border border-[#303030] px-4 text-sm outline-none focus:border-[#1DB954]"
              />
            </div>

            {error && (
              <div className="border border-red-900 bg-red-950/30 p-3">
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#1DB954] text-black text-sm font-bold uppercase tracking-wider hover:bg-[#1ed760] disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

          </form>

          <div className="mt-8 pt-6 border-t border-[#252525]">
            <p className="text-center text-xs text-[#666]">
              JOHN UMAMUSUME
            </p>
          </div>

        </div>

        <p className="text-center text-[11px] text-[#555] mt-8">
          TOM CLANCY
        </p>

      </div>
    </main>
  );
}
