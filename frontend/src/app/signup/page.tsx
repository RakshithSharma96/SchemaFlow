"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AlertCircle, Zap, Database, Terminal, Activity, Server, ChevronRight } from "lucide-react";
import { register } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";

const TypingCode = () => {
  const [text, setText] = useState("");
  const fullText = "SELECT name, email FROM users\nWHERE active = true\nORDER BY created_at DESC;";
  
  useEffect(() => {
    let i = 0;
    let timer: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;

    const startTyping = () => {
      timer = setInterval(() => {
        if (i < fullText.length) {
          setText(fullText.slice(0, i + 1));
          i++;
        } else {
          clearInterval(timer);
          timeout = setTimeout(() => { 
            setText(""); 
            i = 0; 
            startTyping(); 
          }, 3000);
        }
      }, 50);
    };

    startTyping();

    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="font-mono text-[10px] sm:text-xs text-[#a1a1aa] whitespace-pre-wrap h-20">
      {text}<motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }}>|</motion.span>
    </div>
  );
};

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await register({ email, password, name: fullName });
      login(data.access_token, data.user);
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050508] overflow-hidden selection:bg-[var(--color-primary)] selection:text-white font-sans">
      
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-center items-center p-8 border-r border-[#1a1a24]/40 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#111119] via-[#050508] to-[#050508]">
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--color-primary)] rounded-full mix-blend-screen filter blur-[150px] opacity-10 animate-blob pointer-events-none" />

        <div className="w-full max-w-2xl relative z-10 flex flex-col gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 shadow-[0_0_20px_var(--color-primary-glow)]">
              <Zap size={24} className="text-[var(--color-primary)]" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tighter">
              SchemaFlow <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-400 to-zinc-600 font-light">Intelligence</span>
            </h2>
            <p className="text-zinc-400 text-lg max-w-md font-light">
              Connect databases. Ask questions in natural language. Get production-ready SQL instantly.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="col-span-2 sm:col-span-1 p-6 rounded-2xl bg-[#0a0a10]/60 border border-[#1a1a24] backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-[#2a2a35] transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Terminal size={64} />
              </div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
                <span className="text-xs font-mono text-zinc-300 uppercase tracking-wider">AI Translation</span>
              </div>
              <div className="bg-[#050508] p-4 rounded-xl border border-[#1a1a24] mb-2 font-mono text-xs text-zinc-400">
                "Get all active users"
              </div>
              <div className="flex justify-center my-2 text-zinc-600"><ChevronRight size={16} className="rotate-90 sm:rotate-0" /></div>
              <div className="bg-[#050508]/80 p-4 rounded-xl border border-[var(--color-primary)]/20 shadow-[0_0_15px_var(--color-primary-glow)]">
                <TypingCode />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.3 }} className="col-span-2 sm:col-span-1 p-6 rounded-2xl bg-[#0a0a10]/60 border border-[#1a1a24] backdrop-blur-xl shadow-2xl flex flex-col justify-between group hover:border-[#2a2a35] transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-zinc-300 uppercase tracking-wider">Latency</span>
                <Activity size={16} className="text-[var(--color-primary)]" />
              </div>
              <div className="flex-1 flex flex-col items-center justify-center relative">
                <div className="absolute inset-0 bg-[var(--color-primary)]/5 rounded-full blur-2xl animate-pulse" />
                <div className="relative z-10 flex flex-col items-center">
                  <span className="text-5xl font-light tracking-tighter text-white mb-1">87<span className="text-2xl text-zinc-500">ms</span></span>
                  <span className="text-xs text-zinc-500 font-mono">Avg Execution</span>
                </div>
                <svg className="w-full h-12 mt-4 opacity-50" viewBox="0 0 100 30" preserveAspectRatio="none">
                  <motion.path d="M0,25 C20,25 20,5 40,15 C60,25 60,10 80,5 C90,2 95,15 100,10" fill="none" stroke="var(--color-primary)" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }} />
                </svg>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.4 }} className="col-span-2 p-6 rounded-2xl bg-[#0a0a10]/60 border border-[#1a1a24] backdrop-blur-xl shadow-2xl group hover:border-[#2a2a35] transition-colors flex items-center justify-between overflow-hidden">
              <div className="z-10">
                <span className="text-xs font-mono text-zinc-300 uppercase tracking-wider block mb-2">Universal Connection</span>
                <h3 className="text-xl text-white font-medium">PostgreSQL, MySQL, SQLite</h3>
              </div>
              <div className="flex items-center gap-4 z-10 opacity-60 group-hover:opacity-100 transition-opacity">
                <motion.div animate={{ y: [-2, 2, -2] }} transition={{ repeat: Infinity, duration: 3 }} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center"><Database size={16} className="text-zinc-400" /></motion.div>
                <div className="h-px w-8 bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
                <motion.div animate={{ y: [2, -2, 2] }} transition={{ repeat: Infinity, duration: 4 }} className="w-12 h-12 rounded-full bg-indigo-950/50 border border-indigo-900/50 flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.2)]"><Server size={20} className="text-indigo-400" /></motion.div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>

      <div className="w-full lg:w-[45%] flex items-center justify-center p-8 sm:p-12 relative z-20">
        <div className="w-full max-w-[380px]">
          
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mb-12">
            <h1 className="text-3xl font-semibold tracking-tight text-white mb-3">Create account</h1>
            <p className="text-zinc-500 text-sm">Join SchemaFlow and empower your team.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: "auto", marginBottom: 24 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} className="overflow-hidden">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-red-950/30 border border-red-900/50 text-red-400 text-sm">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-2 group">
                <label className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 group-focus-within:text-[var(--color-primary)] transition-colors">Full Name</label>
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full h-11 bg-transparent border-0 border-b border-zinc-800 rounded-none px-0 focus:ring-0 focus:border-[var(--color-primary)] text-white placeholder:text-zinc-700 transition-colors shadow-none"
                />
              </div>

              <div className="space-y-2 group">
                <label className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 group-focus-within:text-[var(--color-primary)] transition-colors">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  autoComplete="email"
                  className="w-full h-11 bg-transparent border-0 border-b border-zinc-800 rounded-none px-0 focus:ring-0 focus:border-[var(--color-primary)] text-white placeholder:text-zinc-700 transition-colors shadow-none"
                />
              </div>
              
              <div className="space-y-2 group">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 group-focus-within:text-[var(--color-primary)] transition-colors">Password</label>
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full h-11 bg-transparent border-0 border-b border-zinc-800 rounded-none px-0 focus:ring-0 focus:border-[var(--color-primary)] text-white placeholder:text-zinc-700 transition-colors shadow-none"
                />
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="pt-6">
                <Button
                  type="submit"
                  disabled={loading}
                  isLoading={loading}
                  className="w-full h-12 bg-white hover:bg-zinc-200 text-black font-medium rounded-lg transition-colors"
                >
                  Sign Up
                </Button>
              </motion.div>
            </form>

            <div className="mt-10 text-center text-sm text-zinc-600">
              Already have an account?{" "}
              <Link href="/login" className="text-zinc-300 hover:text-white font-medium transition-colors">
                Log in
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
