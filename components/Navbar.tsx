
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const links = [
  { name: "Dashboard", href: "/" },
  { name: "Members", href: "/members" },
  { name: "Payments", href: "/payments" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <nav className="max-w-4xl mx-auto py-5 border-b border-[#252525] flex flex-col sm:flex-row sm:items-center justify-between gap-5">

      <h1 className="text-lg font-bold tracking-tight">
        Ahyeon's Subscription
        <span className="text-[#1DB954]"> Management</span>
      </h1>

      <div className="flex items-center gap-5 flex-wrap">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-xs font-semibold transition-colors ${
              pathname === link.href
                ? "text-[#1DB954]"
                : "text-[#888] hover:text-white"
            }`}
          >
            {link.name}
          </Link>
        ))}

        <button
          onClick={handleLogout}
          className="text-xs text-[#888] hover:text-red-400"
        >
          Sign out
        </button>
      </div>

    </nav>
  );
}
