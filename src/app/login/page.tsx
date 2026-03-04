"use client";

import React, { useEffect, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [user, loading, router]);

  async function submit() {
    setErr("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Login failed");
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center px-6">
      <div className="w-full max-w-lg bg-white border border-gray-300 shadow-sm p-8">

        {/* Header */}
        <div className="mb-6 border-b pb-4">
          <h1 className="text-xl font-semibold text-gray-800">
            System Login
          </h1>
          <p className="text-sm text-gray-500">
            Please sign in using your authorized credentials.
          </p>
        </div>

        {/* Error */}
        {err && (
          <div className="mb-4 p-3 border border-red-300 bg-red-50 text-red-700 text-sm">
            {err}
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@company.com"
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-600"
            />
          </div>

          <button
            onClick={submit}
            className="w-full mt-4 bg-gray-900 text-white py-2 text-sm font-semibold hover:bg-black transition"
          >
            Sign In
          </button>

        </div>

        {/* Footer */}
        <div className="mt-6 text-xs text-gray-500 text-center border-t pt-4">
          Authorized access only
        </div>

      </div>
    </main>
  );
}