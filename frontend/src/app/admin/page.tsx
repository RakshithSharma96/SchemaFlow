"use client";

import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";

// Mock data for the dashboard
const latencyData = [
  { time: "10:00", PlannerAgent: 120, SchemaAgent: 450, SQLAgent: 800, ExecutionAgent: 15, AnalysisAgent: 1200 },
  { time: "10:05", PlannerAgent: 115, SchemaAgent: 420, SQLAgent: 750, ExecutionAgent: 12, AnalysisAgent: 1100 },
  { time: "10:10", PlannerAgent: 130, SchemaAgent: 480, SQLAgent: 820, ExecutionAgent: 18, AnalysisAgent: 1300 },
  { time: "10:15", PlannerAgent: 110, SchemaAgent: 410, SQLAgent: 720, ExecutionAgent: 14, AnalysisAgent: 1050 },
  { time: "10:20", PlannerAgent: 125, SchemaAgent: 460, SQLAgent: 780, ExecutionAgent: 16, AnalysisAgent: 1150 },
];

const errorData = [
  { agent: "PlannerAgent", errors: 2 },
  { agent: "SchemaAgent", errors: 5 },
  { agent: "SQLAgent", errors: 12 },
  { agent: "ValidationAgent", errors: 8 },
  { agent: "ExecutionAgent", errors: 3 },
  { agent: "AnalysisAgent", errors: 1 },
];

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
          Agent Metrics Dashboard
        </h1>
        <p className="text-gray-400 mt-2">Real-time observability into the multi-agent pipeline</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Latency Chart */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold mb-4 text-gray-200">Agent Latency (ms)</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  itemStyle={{ color: '#F3F4F6' }}
                />
                <Legend />
                <Line type="monotone" dataKey="PlannerAgent" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="SchemaAgent" stroke="#8B5CF6" strokeWidth={2} />
                <Line type="monotone" dataKey="SQLAgent" stroke="#F59E0B" strokeWidth={2} />
                <Line type="monotone" dataKey="AnalysisAgent" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Error Chart */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold mb-4 text-gray-200">Agent Error Rates</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={errorData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="agent" stroke="#9CA3AF" tick={{fontSize: 12}} />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  cursor={{fill: '#374151'}}
                />
                <Bar dataKey="errors" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4 text-gray-200">Recent Audit Logs</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400">
              <th className="p-3 font-medium">Timestamp</th>
              <th className="p-3 font-medium">Session ID</th>
              <th className="p-3 font-medium">Intent</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
              <td className="p-3 text-sm text-gray-300">2026-07-14 10:15:22</td>
              <td className="p-3 text-sm text-blue-400">sess_abc123</td>
              <td className="p-3 text-sm">sql_analysis</td>
              <td className="p-3 text-sm"><span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs font-semibold">SUCCESS</span></td>
              <td className="p-3 text-sm text-gray-400 truncate max-w-[200px]">SELECT * FROM sales...</td>
            </tr>
            <tr className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
              <td className="p-3 text-sm text-gray-300">2026-07-14 10:18:05</td>
              <td className="p-3 text-sm text-blue-400">sess_xyz987</td>
              <td className="p-3 text-sm">sql_analysis</td>
              <td className="p-3 text-sm"><span className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs font-semibold">FAILED</span></td>
              <td className="p-3 text-sm text-gray-400 truncate max-w-[200px]">Destructive operation 'DROP' is not permitted.</td>
            </tr>
            <tr className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
              <td className="p-3 text-sm text-gray-300">2026-07-14 10:21:44</td>
              <td className="p-3 text-sm text-blue-400">sess_def456</td>
              <td className="p-3 text-sm">explain_sql</td>
              <td className="p-3 text-sm"><span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs font-semibold">SUCCESS</span></td>
              <td className="p-3 text-sm text-gray-400 truncate max-w-[200px]">Agent explained nested subquery.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
