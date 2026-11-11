"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Member = {
  id: string;
  display_name: string;
  role: string;
};

type Payment = {
  id: string;
  user_id: string;
  billing_month: string;
  amount: number;
  method: string;
  status: string;
  profiles: {
    display_name: string;
  };
};

export default function Home() {
  const router = useRouter();

  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [monthlyFee, setMonthlyFee] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (!profile || profile.role !== "admin") {
        setError("Admin access required.");
        setLoading(false);
        return;
      }

      const [settingsResult, membersResult, paymentsResult] =
        await Promise.all([
          supabase
            .from("settings")
            .select("monthly_fee")
            .eq("id", 1)
            .single(),

          supabase
            .from("profiles")
            .select("id, display_name, role")
            .order("created_at"),

          supabase
            .from("payments")
            .select(`
              id,
              user_id,
              billing_month,
              amount,
              method,
              status,
              profiles (
                display_name
              )
            `)
            .order("created_at", { ascending: false }),
        ]);

      if (
        settingsResult.error ||
        membersResult.error ||
        paymentsResult.error
      ) {
        setError(
          settingsResult.error?.message ||
          membersResult.error?.message ||
          paymentsResult.error?.message ||
          "Unable to load dashboard."
        );
      } else {
        setMonthlyFee(Number(settingsResult.data.monthly_fee));
        setMembers(membersResult.data || []);
        setPayments(
          (paymentsResult.data || []) as unknown as Payment[]
        );
      }

      setLoading(false);
    }

    loadDashboard();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const paidCount = payments.filter(
    (payment) => payment.status === "paid"
  ).length;

  const pendingCount = payments.filter(
    (payment) => payment.status === "pending"
  ).length;

  const totalCollected = payments
    .filter((payment) => payment.status === "paid")
    .reduce((total, payment) => total + Number(payment.amount), 0);

  return (
    <main className="min-h-screen bg-[#090909] text-white p-6">

      <nav className="max-w-4xl mx-auto flex justify-between items-center py-4 border-b border-[#252525]">
        <h1 className="text-xl font-bold">
          Ahyeon's Subscription
          <span className="text-[#1DB954]"> Management</span>
        </h1>

        <button
          onClick={handleLogout}
          className="text-xs text-[#999] hover:text-white"
        >
          Sign out
        </button>
      </nav>

      <section className="max-w-4xl mx-auto mt-12">

        <div className="mb-10">
          <p className="text-[#1DB954] text-xs font-bold uppercase tracking-[0.2em] mb-3">
            Dashboard
          </p>

          <h2 className="text-3xl font-bold">
            Overview
          </h2>

          <p className="text-[#777] text-sm mt-2">
            Manage your subscription and household expenses.
          </p>
        </div>

        {loading ? (
          <p className="text-[#777]">Loading dashboard...</p>
        ) : error ? (
          <p className="text-red-400">{error}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

              <StatCard
                label="Monthly Fee"
                value={`₱${monthlyFee.toFixed(2)}`}
              />

              <StatCard
                label="Registered Members"
                value={String(members.length)}
              />

              <StatCard
                label="Total Collected"
                value={`₱${totalCollected.toFixed(2)}`}
              />

              <StatCard
                label="Paid Payments"
                value={String(paidCount)}
              />

              <StatCard
                label="Pending Payments"
                value={String(pendingCount)}
              />

              <StatCard
                label="Total Payment Records"
                value={String(payments.length)}
              />

            </div>

            <div className="mt-8 bg-[#111] border border-[#252525]">

              <div className="p-6 border-b border-[#252525]">
                <h3 className="text-lg font-semibold">
                  Household Members
                </h3>
              </div>

              {members.length === 0 ? (
                <p className="p-8 text-center text-sm text-[#777]">
                  No members registered yet.
                </p>
              ) : (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="flex justify-between items-center px-6 py-4 border-b border-[#252525] last:border-0"
                  >
                    <span className="text-sm">
                      {member.display_name}
                    </span>

                    <span className="text-xs text-[#1DB954] uppercase">
                      {member.role}
                    </span>
                  </div>
                ))
              )}

            </div>

            <div className="mt-8 bg-[#111] border border-[#252525]">

              <div className="p-6 border-b border-[#252525]">
                <h3 className="text-lg font-semibold">
                  Payment History
                </h3>

                <p className="text-sm text-[#777] mt-1">
                  Recent payment records.
                </p>
              </div>

              {payments.length === 0 ? (
                <p className="p-8 text-center text-sm text-[#777]">
                  No payment records yet.
                </p>
              ) : (
                payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-6 border-b border-[#252525] last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {payment.profiles?.display_name || "Member"}
                      </p>

                      <p className="text-xs text-[#777] mt-1">
                        {payment.billing_month} · {payment.method.toUpperCase()}
                      </p>
                    </div>

                    <div className="sm:text-right">
                      <p className="text-sm font-semibold">
                        ₱{Number(payment.amount).toFixed(2)}
                      </p>

                      <span className={`text-xs uppercase ${
                        payment.status === "paid"
                          ? "text-[#1DB954]"
                          : "text-yellow-400"
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                  </div>
                ))
              )}

            </div>
          </>
        )}

      </section>

      <footer className="max-w-4xl mx-auto mt-16 pt-6 border-t border-[#252525]">
        <p className="text-center text-[10px] text-[#555] tracking-widest uppercase">
          Ahyeon's Subscription Management
        </p>
      </footer>

    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[#111] border border-[#252525] p-6">
      <p className="text-xs text-[#777] uppercase tracking-wider">
        {label}
      </p>

      <p className="text-2xl font-bold mt-3">
        {value}
      </p>
    </div>
  );
}
