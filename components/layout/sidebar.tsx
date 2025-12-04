"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Repeat,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuthSession } from "@/hooks/use-session";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/notebook", label: "Lab Notebook", icon: BookOpen },
  { href: "/protocols", label: "Protocols", icon: ClipboardList },
  { href: "/replications", label: "Replications", icon: Repeat },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, isAuthenticated } = useAuthSession();

  // Don't show sidebar on auth pages
  if (pathname === "/login" || pathname === "/signup") {
    return null;
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-md bg-white border border-gray-200 shadow-sm"
        >
          {isMobileOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white transition-transform",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-gray-200 px-6">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
                L
              </div>
              <span className="text-xl font-semibold text-gray-900">
                LabChain
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-4 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          {isAuthenticated && user && (
            <div className="border-t border-gray-200 p-4 space-y-2">
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name || "User"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email || "user@lab.edu"}</p>
                </div>
              </div>
              <Link
                href="/profile"
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "block text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-50",
                  pathname === "/profile" && "bg-blue-50 text-blue-700"
                )}
              >
                Profile Settings
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full text-left text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-50"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}

