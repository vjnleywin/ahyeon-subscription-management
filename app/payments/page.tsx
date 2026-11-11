
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

type Member = {
  id: string;
  display_name: string;
};

type Payment = {
  id: string;
  user_id: string;
  billing_month: string;
  amount: 47;
  method: string;
  status: string;
  reference_note: string | null;
};

export default function PaymentsPage() {
  const router = useRouter();

  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [monthlyFee, setMonthlyFee] = useState(47);

  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("47");
  const [method, setMethod] = useState("gcash");
  const [reference, setReference] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadPayments() {
    const [membersResult, paymentsResult, settingsResult] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("id, display_name")
          .order("created_at"),

        supabase
          .from("payments")
          .select("*")
          .order("created_at", { ascending: false }),

        supabase
          .from("settings")
          .select("monthly_fee")
          .eq("id", 1)
          .single(),
      ]);

    if (
      membersResult.error ||
      paymentsResult.error ||
      settingsResult.error
    ) {
      setError(
        membersResult.error?.message ||
        paymentsResult.error?.message ||
        settingsResult.error?.message ||
        "Unable to load records."
      );
      return;
    }

    setMembers(membersResult.data || []);
    setPayments(paymentsResult.data || []);

    const fee = Number(settingsResult.data.monthly_fee);
    setMonthlyFee(fee);
    setAmount(String(fee));
  }

  useEffect(() => {
    async function initialize() {
      const { data: { session } } =
        await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profile?.role !== "admin") {
        setError("Admin access required.");
        setLoading(false);
        return;
      }

      await loadPayments();
      setLoading(false);
    }

    initialize();
  }, [router]);

  async function handleRecordPayment(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    const { error } = await supabase
      .from("payments")
      .insert({
        user_id: memberId,
        billing_month:
          `${new Date().getFullYear()}-${String(
            new Date().getMonth() + 1
          ).padStart(2, "0")}-01`,
        amount: 47,
        method,
        status: "pending",
        reference_note: reference || null,
      });

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Payment record created successfully.");

      setMemberId("");
      setReference("");

      await loadPayments();
    }

    setSaving(false);
  }

  async function handleVerifyPayment(id: string) {
    const confirmed = window.confirm(
      "Have you independently confirmed that this payment was received?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    const { error } = await supabase
      .from("payments")
      .update({ status: "paid" })
      .eq("id", id)
      .eq("status", "pending");

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Payment marked as verified.");
      await loadPayments();
    }
  }

  const paid = payments.filter(
    (p) => p.status === "paid"
  );

  const pending = payments.filter(
    (p) => p.status === "pending"
  );

  const collected = paid.reduce(
    (total, p) => total + Number(p.amount),
    0
  );

  function getMemberName(id: string) {
    return members.find((m) => m.id === id)?.display_name
      || "Unknown member";
  }

  return (
    <main className="min-h-screen bg-[#090909] text-white p-6">

      <div className="max-w-4xl mx-auto">
        <Navbar />

        <section className="mt-12">

          <p className="text-[#1DB954] text-xs font-bold uppercase tracking-[0.2em] mb-3">
            Administration
          </p>

          <h2 className="text-3xl font-bold">Payments</h2>

          <p className="text-sm text-[#777] mt-2">
            Manage household expense payment records.
          </p>

          {error && (
            <div className="mt-6 border border-red-900 bg-red-950/30 p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-6 border border-green-900 bg-green-950/20 p-4">
              <p className="text-sm text-green-400">{success}</p>
            </div>
          )}

          {loading ? (
            <p className="mt-8 text-sm text-[#777]">
              Loading payments...
            </p>
          ) : (
            <>
              {/* Statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">

                <Stat label="Monthly Fee" value={`₱${monthlyFee.toFixed(2)}`} />
                <Stat label="Confirmed" value={paid.length} />
                <Stat label="Pending" value={pending.length} />

              </div>

              <div className="bg-[#111] border border-[#252525] p-6 mt-4">
                <p className="text-xs text-[#777] uppercase tracking-wider">
                  Total Collected
                </p>

                <p className="text-3xl font-bold mt-3">
                  ₱{collected.toFixed(2)}
                </p>
              </div>

              {/* Record Payment */}
              <div className="bg-[#111] border border-[#252525] mt-8 p-6">

                <h3 className="font-semibold text-lg">
                  Record Payment
                </h3>

                <p className="text-xs text-[#777] mt-1 mb-6">
                  Create a household expense payment record.
                </p>

                <form
                  onSubmit={handleRecordPayment}
                  className="space-y-5"
                >

                  <div>
                    <label className="block text-xs text-[#aaa] mb-2">
                      Household Member
                    </label>

                    <select
                      value={memberId}
                      onChange={(e) => setMemberId(e.target.value)}
                      required
                      className="w-full bg-[#090909] border border-[#303030] p-3 text-sm outline-none focus:border-[#1DB954]"
                    >
                      <option value="">Select a member</option>

                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.display_name}
                        </option>
                      ))}
                    </select>
                  </div>

                    <div>

                        <label className="block text-xs text-[#aaa] mb-2">
                            Monthly Fee (Amount: PHP)
                        </label>

                        <div className="w-full rounded-lg border border-white/10 bg-[#151515] px-4 py-3 text-white">
                            ₱47.00
                        </div>
                    </div>

                  <div>
                    <label className="block text-xs text-[#aaa] mb-2">
                      Payment Method
                    </label>

                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      className="w-full bg-[#090909] border border-[#303030] p-3 text-sm outline-none focus:border-[#1DB954]"
                    >
                      <option value="gcash">GCash</option>
                      <option value="cash">Cash</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={saving || members.length === 0}
                    className="w-full bg-[#1DB954] text-black font-bold text-sm p-3 hover:bg-[#1ed760] disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Record Payment"}
                  </button>

                  <p className="text-xs text-[#777]">
                    New records are pending until payment is independently verified.
                  </p>

                </form>
              </div>

              {/* Payment History */}
              <div className="bg-[#111] border border-[#252525] mt-8">

                <div className="p-6 border-b border-[#252525]">
                  <h3 className="font-semibold">
                    Payment History
                  </h3>
                </div>

                {payments.length === 0 ? (
                  <p className="p-10 text-center text-sm text-[#777]">
                    No payment records yet.
                  </p>
                ) : (
                  payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-6 border-b border-[#252525] last:border-0"
                    >

                      <div>
                        <p className="text-sm font-medium">
                          {getMemberName(payment.user_id)}
                        </p>

                        <p className="text-xs text-[#777] mt-1">
                          {payment.billing_month} · {payment.method.toUpperCase()}
                        </p>

                        {payment.reference_note && (
                          <p className="text-xs text-[#666] mt-1">
                            Ref: {payment.reference_note}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between sm:gap-6">
                        <div className="sm:text-right">
                          <p className="text-sm font-semibold">
                            ₱{Number(payment.amount).toFixed(2)}
                          </p>

                          <p className={`text-xs uppercase mt-1 ${
                            payment.status === "paid"
                              ? "text-[#1DB954]"
                              : "text-yellow-400"
                          }`}>
                            {payment.status}
                          </p>
                        </div>

                        {payment.status === "pending" && (
                          <button
                            onClick={() => handleVerifyPayment(payment.id)}
                            className="text-xs font-semibold text-[#1DB954] border border-[#1DB954] px-3 py-2 hover:bg-[#1DB954] hover:text-black"
                          >
                            Verify
                          </button>
                        )}
                      </div>

                    </div>
                  ))
                )}

              </div>
            </>
          )}

        </section>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
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
