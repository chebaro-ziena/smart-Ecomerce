"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <span className="rounded-lg bg-brand-600 px-2 py-1 text-white">AI</span>
          Smart Shop
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
          <Link href="/" className="hover:text-brand-600">
            Products
          </Link>

          {status === "authenticated" && session.user.role === "ADMIN" && (
            <Link href="/admin" className="hover:text-brand-600">
              Admin Dashboard
            </Link>
          )}

          {status === "authenticated" ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-slate-400 sm:inline">{session.user.email}</span>
              <Link
                href="/cart"
                className="relative rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cart
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700"
            >
               Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
