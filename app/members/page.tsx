"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Member = {
  id: string;
  display_name: string;
  role: string;
  created_at: string;
};

export default function MembersPage() {
  const router = useRouter();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMembers() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profileError || profile?.role !== "admin") {
        setError("You do not have permission to access this page.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, role, created_at")
        .order("created_at", { ascending: true });

      if (error) {
        setError(error.message);
      } else {
        setMembers(data || []);
      }

      setLoading(false);
    }

    loadMembers();
  }, [router]);

  return (
    <main className="min-h-screen bg-[#090909] text-white p-6">

      <div className="max-w-4xl mx-auto">

        <nav className="flex justify-between items-center py-4 border-b border-[#252525]">
          <h1 className="text-xl font-bold">
            Ahyeon's Subscription
            <span className="text-[#1DB954]"> Management</span>
          </h1>

          <button
            onClick={() => router.push("/")}
            className="text-sm text-[#999] hover:text-white"
          >
            Dashboard
          </button>
        </nav>

        <section className="mt-12">

          <p className="text-[#1DB954] text-xs font-bold uppercase tracking-[0.2em] mb-3">
            Administration
          </p>

          <h2 className="text-3xl font-bold">
            Members
          </h2>

          <p className="text-sm text-[#777] mt-2">
            Manage eligible household member accounts.
          </p>

          <div className="mt-8 bg-[#111] border border-[#252525]">

            <div className="flex justify-between items-center p-6 border-b border-[#252525]">
              <div>
                <h3 className="font-semibold">
                  Registered Members
                </h3>
                <p className="text-xs text-[#777] mt-1">
                  {members.length} registered account(s)
                </p>
              </div>
            </div>

            {loading ? (
              <p className="p-8 text-center text-sm text-[#777]">
                Loading members...
              </p>
            ) : error ? (
              <p className="p-8 text-center text-sm text-red-400">
                {error}
              </p>
            ) : members.length === 0 ? (
              <p className="p-8 text-center text-sm text-[#777]">
                No registered members found.
              </p>
            ) : (
              <div className="divide-y divide-[#252525]">

                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex justify-between items-center p-6"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {member.display_name}
                      </p>

                      <p className="text-xs text-[#666] mt-1">
                        Joined {new Date(member.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <span className={`text-xs font-semibold uppercase ${
                      member.role === "admin"
                        ? "text-[#1DB954]"
                        : "text-[#999]"
                    }`}>
                      {member.role}
                    </span>
                  </div>
                ))}

              </div>
            )}

          </div>

        </section>

      </div>

    </main>
  );
}
