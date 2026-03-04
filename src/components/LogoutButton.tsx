"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function LogoutButton() {
  const { logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition"
    >
      Logout
    </button>
  );
}