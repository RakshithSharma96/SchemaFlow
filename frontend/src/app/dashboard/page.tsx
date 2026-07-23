"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, Database, Clock, LayoutDashboard, Activity, Zap, Timer } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { listSavedConnections, listQueryHistory } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { dbTypeLabel } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Sidebar } from "@/components/layout/Sidebar";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] p-3 rounded-lg shadow-subtle">
        <p className="text-xs font-semibold text-[var(--muted-foreground)] mb-1">{label}</p>
        <p className="text-sm font-bold text-[var(--foreground)]">{payload[0].value} queries</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [connData, histData] = await Promise.all([
          listSavedConnections(),
          listQueryHistory()
        ]);
        setConnections(connData.data || []);
        setHistory(histData.data || []);
      } catch (e: any) {
        console.warn("Failed to load dashboard data:", e?.message || e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const getChartData = () => {
    const data: Record<string, number> = {};
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      data[dateStr] = 0;
    }
    
    history.forEach(h => {
      const d = new Date(h.created_at);
      const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (data[dateStr] !== undefined) {
        data[dateStr]++;
      }
    });
    
    return Object.entries(data).map(([date, count]) => ({ date, count }));
  };

  const chartData = getChartData();
  const totalQueries = history.length;
  const activeConnections = connections.length;
  const avgExecutionTime = history.length > 0 
    ? Math.round(history.reduce((acc, h) => acc + (h.execution_time_ms || 0), 0) / history.length) 
    : 0;

  return (
    <div className="flex h-dvh bg-[var(--background)]">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="max-w-6xl mx-auto px-6 py-10">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <LayoutDashboard size={18} className="text-[var(--muted-foreground)]" />
                <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Overview
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
                Welcome back, {user?.name?.split(' ')[0] || "User"}
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <Link href="/chat">
                <Button size="sm" className="h-9">
                  <MessageSquare size={14} className="mr-2" />
                  Workspace
                </Button>
              </Link>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 flex items-center justify-between shadow-subtle hover:border-[var(--primary)]/50 transition-colors">
              <div>
                <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Total Queries</p>
                <p className="text-3xl font-bold text-[var(--foreground)]">{loading ? "-" : totalQueries}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                <Activity size={20} />
              </div>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 flex items-center justify-between shadow-subtle hover:border-[var(--primary)]/50 transition-colors">
              <div>
                <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Saved Connections</p>
                <p className="text-3xl font-bold text-[var(--foreground)]">{loading ? "-" : activeConnections}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                <Database size={20} />
              </div>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 flex items-center justify-between shadow-subtle hover:border-[var(--primary)]/50 transition-colors">
              <div>
                <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Avg Execution Time</p>
                <p className="text-3xl font-bold text-[var(--foreground)] flex items-baseline gap-1">
                  {loading ? "-" : avgExecutionTime} <span className="text-sm font-medium text-[var(--muted-foreground)]">ms</span>
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                <Timer size={20} />
              </div>
            </div>
          </div>

          {/* Activity Chart */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 mb-6 shadow-subtle">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
                <Zap size={16} />
                Activity (Last 7 Days)
              </div>
            </div>
            <div className="h-[200px] w-full">
              {loading ? (
                <div className="w-full h-full bg-[var(--muted)]/50 animate-pulse rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} 
                      dy={10}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="var(--primary)" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorCount)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Saved Connections Card */}
            <div className="lg:col-span-1 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-subtle">
              <div className="flex items-center gap-2 mb-5 font-semibold text-[var(--foreground)]">
                <Database size={16} />
                Connections
              </div>
              
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-md bg-[var(--muted)] animate-pulse" />)}
                </div>
              ) : connections.length === 0 ? (
                <div className="text-center py-8 rounded-md border border-dashed border-[var(--border)] bg-[var(--background)] flex flex-col items-center justify-center">
                  <Database size={24} className="text-[var(--muted-foreground)] mb-2 opacity-50" />
                  <p className="text-sm font-medium text-[var(--foreground)]">No saved connections</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1 mb-4">You have no saved database connections in your workspace.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {connections.map((conn) => (
                    <div 
                      key={conn.id} 
                      className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]/50 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-sm text-[var(--foreground)]">{conn.name}</div>
                        <div className="text-xs font-mono text-[var(--muted-foreground)] mt-0.5">{dbTypeLabel(conn.db_type)}</div>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2">
                    <Link href="/connect" className="block text-center text-xs font-medium text-[var(--primary)] hover:underline">
                      View all connections
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Queries Card */}
            <div className="lg:col-span-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-subtle">
              <div className="flex items-center gap-2 mb-5 font-semibold text-[var(--foreground)]">
                <Clock size={16} />
                Recent Queries
              </div>
              
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 rounded-md bg-[var(--muted)] animate-pulse" />)}
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12 rounded-md border border-dashed border-[var(--border)] bg-[var(--background)] flex flex-col items-center justify-center">
                  <Clock size={24} className="text-[var(--muted-foreground)] mb-2 opacity-50" />
                  <p className="text-sm font-medium text-[var(--foreground)]">No query history</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">Generate SQL in the workspace to see history.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-[var(--muted-foreground)] uppercase bg-[var(--muted)]/50">
                      <tr>
                        <th className="px-4 py-2 font-medium rounded-tl-md rounded-bl-md">Question</th>
                        <th className="px-4 py-2 font-medium">Database</th>
                        <th className="px-4 py-2 font-medium text-right rounded-tr-md rounded-br-md">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {history.slice(0, 8).map((hist) => (
                        <tr key={hist.id} className="hover:bg-[var(--muted)]/30 transition-colors">
                          <td className="px-4 py-3 font-medium text-[var(--foreground)] truncate max-w-[250px]" title={hist.question}>
                            {hist.question}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary" className="font-mono text-[10px]">{hist.database_name}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right flex flex-col items-end justify-center">
                            <span className="text-xs text-[var(--muted-foreground)]">
                              {new Date(hist.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                            {hist.execution_time_ms ? (
                              <span className={`text-[10px] font-mono mt-0.5 ${hist.execution_time_ms < 100 ? 'text-green-500' : 'text-amber-500'}`}>
                                {hist.execution_time_ms}ms
                              </span>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
