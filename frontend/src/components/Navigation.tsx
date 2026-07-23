"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { LogOut, Zap, Database } from "lucide-react";

export default function Navigation() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();

  // Hide nav on pages that have their own sidebar layout
  if (loading || pathname === '/chat' || pathname === '/settings') return null;

  return (
    <nav className="sticky top-0 z-50 transition-all duration-300" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid var(--color-border)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 bg-[var(--foreground)]">
                <Database size={16} className="text-[var(--background)]" />
              </div>
              <span className="text-[17px] font-bold tracking-tight" style={{ color: 'var(--color-text-1)' }}>
                SchemaFlow
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <Link 
                  href="/dashboard" 
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${pathname === "/dashboard" ? "bg-[var(--color-surface-3)] text-white" : "text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)] hover:text-white"}`}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/chat" 
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${pathname === "/chat" ? "bg-[var(--color-surface-3)] text-white" : "text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)] hover:text-white"}`}
                >
                  Workspace
                </Link>
                <div className="w-px h-5 mx-2 bg-[var(--color-border)]"></div>
                <div className="flex items-center gap-3 pl-1">
                  <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-1)' }}>
                    <div className="w-6 h-6 rounded-full bg-[var(--color-primary-subtle)] border border-[var(--color-border)] flex items-center justify-center">
                      <span className="text-[10px] text-[var(--color-primary)]">{user.name?.charAt(0).toUpperCase()}</span>
                    </div>
                    {user.name?.split(' ')[0]}
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={logout}
                    className="p-1.5 rounded-lg text-[var(--color-text-3)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-glow)] transition-colors cursor-pointer"
                    title="Log out"
                  >
                    <LogOut size={16} />
                  </motion.button>
                </div>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-colors text-[var(--color-text-2)] hover:text-white hover:bg-[var(--color-surface-2)]"
                >
                  Log in
                </Link>
                <Link 
                  href="/signup" 
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-transform hover:scale-105 active:scale-95 bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                  style={{ boxShadow: '0 0 15px rgba(255,255,255,0.1)' }}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
