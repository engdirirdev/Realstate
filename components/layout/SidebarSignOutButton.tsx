"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { useState } from "react";

export default function SidebarSignOutButton() {
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await signOut({ callbackUrl: "/login", redirect: true });
    } catch (e) {
      console.error("Sign out error:", e);
      window.location.href = "/login";
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={signingOut}
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#F87171] hover:bg-[#EF4444]/20 hover:text-white transition-all w-full cursor-pointer disabled:opacity-50"
    >
      <LogOut className="h-3.5 w-3.5" />
      <span>{signingOut ? "Signing out..." : "Sign Out"}</span>
    </button>
  );
}
