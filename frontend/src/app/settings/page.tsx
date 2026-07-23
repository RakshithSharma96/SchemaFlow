"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Settings, Save, AlertCircle, RefreshCw, Key, User, LogOut, Database } from "lucide-react";
import { deleteAllQueryHistory } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Sidebar } from "@/components/layout/Sidebar";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setTimeout(() => {
      setLoading(false);
      setSuccess("Settings saved successfully.");
      setTimeout(() => setSuccess(""), 3000);
    }, 800);
  };


  return (
    <div className="flex h-dvh bg-[var(--background)]">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-10">
          
          <div className="flex items-center gap-2 mb-2">
            <Settings size={18} className="text-[var(--muted-foreground)]" />
            <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Workspace Settings
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mb-8">
            Settings
          </h1>

          <div className="grid grid-cols-1 gap-8">
            
            {/* Account Settings */}
            <div className="border border-[var(--border)] bg-[var(--card)] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--muted)]/50">
                <h2 className="font-semibold flex items-center gap-2 text-[var(--foreground)]">
                  <User size={16} /> Account
                </h2>
              </div>
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-[var(--foreground)]">Name</label>
                      <Input value={user?.name || "User"} readOnly className="bg-[var(--muted)]/50" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-[var(--foreground)]">Email</label>
                      <Input value={user?.email || "user@example.com"} readOnly className="bg-[var(--muted)]/50" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Session Management */}
            <div className="border border-[var(--border)] bg-[var(--card)] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--muted)]/50">
                <h2 className="font-semibold flex items-center gap-2 text-[var(--foreground)]">
                  <LogOut size={16} /> Session Management
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-[var(--foreground)] mb-1">Log Out</h3>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Securely end your current session and return to the login screen.
                    </p>
                  </div>
                  <Button 
                    variant="destructive" 
                    onClick={logout} 
                    className="w-full sm:w-auto"
                  >
                    Log Out
                  </Button>
                </div>
              </div>
            </div>

            {/* Data Management */}
            <div className="border border-[var(--border)] bg-[var(--card)] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--muted)]/50">
                <h2 className="font-semibold flex items-center gap-2 text-[var(--foreground)]">
                  <Database size={16} /> Data Management
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-[var(--foreground)] mb-1">Clear Query History</h3>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Permanently delete all recent queries shown on the Dashboard. This action cannot be undone.
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={async () => {
                      try {
                        setLoading(true);
                        await deleteAllQueryHistory();
                        setSuccess("Query history cleared successfully.");
                        setTimeout(() => setSuccess(""), 3000);
                      } catch (err: any) {
                        setError(err.message || "Failed to clear history");
                        setTimeout(() => setError(""), 3000);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="w-full sm:w-auto text-[var(--destructive)] hover:text-[var(--destructive)] hover:bg-[var(--destructive)]/10"
                    isLoading={loading}
                  >
                    Clear Dashboard Queries
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
