'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Server, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { DatabaseType } from '@/lib/types';

type DbOption = { type: DatabaseType; label: string; icon: React.ReactNode; desc: string };

const DB_OPTIONS: DbOption[] = [
  {
    type: 'sqlite',
    label: 'SQLite',
    icon: <Database size={18} />,
    desc: 'Local file',
  },
  {
    type: 'postgresql',
    label: 'Postgres',
    icon: <Server size={18} />,
    desc: 'Remote host',
  },
  {
    type: 'mysql',
    label: 'MySQL',
    icon: <Server size={18} />,
    desc: 'Remote host',
  },
];

interface ConnectionFormProps {
  onConnectSQLite: (file: File) => Promise<void>;
  onConnectPostgreSQL: (params: {
    host: string; port: number; database: string; username: string; password: string;
  }) => Promise<void>;
  onConnectMySQL: (params: {
    host: string; port: number; database: string; username: string; password: string;
  }) => Promise<void>;
  isConnecting: boolean;
  error: string | null;
}

export function ConnectionForm({
  onConnectSQLite,
  onConnectPostgreSQL,
  onConnectMySQL,
  isConnecting,
  error,
}: ConnectionFormProps) {
  const [selectedType, setSelectedType] = useState<DatabaseType>('sqlite');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Remote DB form fields
  const [host, setHost] = useState('');
  const [port, setPort] = useState('5432');
  const [database, setDatabase] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleTypeChange = (type: DatabaseType) => {
    setSelectedType(type);
    setSelectedFile(null);
    setPort(type === 'mysql' ? '3306' : '5432');
  };

  const handleFileSelect = (file: File) => {
    const valid = /\.(db|sqlite|sqlite3)$/i.test(file.name);
    if (!valid) return;
    setSelectedFile(file);
  };

  const handleConnect = async () => {
    if (selectedType === 'sqlite') {
      if (!selectedFile) return;
      await onConnectSQLite(selectedFile);
    } else if (selectedType === 'postgresql') {
      await onConnectPostgreSQL({
        host, port: Number(port), database, username, password,
      });
    } else {
      await onConnectMySQL({
        host, port: Number(port), database, username, password,
      });
    }
  };

  const canSubmit =
    !isConnecting &&
    (selectedType === 'sqlite'
      ? !!selectedFile
      : host && database && username);

  return (
    <div className="w-full">
      {/* DB Type Selection */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {DB_OPTIONS.map((opt) => {
          const active = selectedType === opt.type;
          return (
            <button
              key={opt.type}
              onClick={() => handleTypeChange(opt.type)}
              className={`flex flex-col items-center justify-center gap-1 p-3 rounded-lg border text-center transition-all ${
                active 
                  ? 'border-[var(--foreground)] bg-[var(--muted)]/50 text-[var(--foreground)]' 
                  : 'border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]'
              }`}
            >
              {opt.icon}
              <div className="flex flex-col items-center">
                <span className={`text-xs font-semibold ${active ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}>
                  {opt.label}
                </span>
                <span className="text-[10px] hidden sm:block opacity-70">
                  {opt.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Form Body */}
      <div className="min-h-[200px]">
        {selectedType === 'sqlite' ? (
          <SQLiteUploadArea
            dragOver={dragOver}
            selectedFile={selectedFile}
            fileRef={fileRef}
            onDragOver={() => setDragOver(true)}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files[0];
              if (f) handleFileSelect(f);
            }}
            onFileChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileSelect(f);
            }}
            onBrowse={() => fileRef.current?.click()}
          />
        ) : (
          <RemoteDbForm
            host={host} setHost={setHost}
            port={port} setPort={setPort}
            database={database} setDatabase={setDatabase}
            username={username} setUsername={setUsername}
            password={password} setPassword={setPassword}
            dbType={selectedType}
          />
        )}
      </div>

      {/* Error & Submit */}
      {error && (
        <div className="mt-4 flex items-start gap-2 p-3 rounded-md bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 text-[var(--destructive)] text-sm">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <Button
        onClick={handleConnect}
        disabled={!canSubmit}
        isLoading={isConnecting}
        className="w-full mt-6"
      >
        {isConnecting ? 'Connecting...' : 'Connect Database'}
      </Button>
    </div>
  );
}

function SQLiteUploadArea({
  dragOver, selectedFile, fileRef,
  onDragOver, onDragLeave, onDrop, onFileChange, onBrowse,
}: {
  dragOver: boolean;
  selectedFile: File | null;
  fileRef: React.RefObject<HTMLInputElement | null>;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBrowse: () => void;
}) {
  return (
    <div
      className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
        selectedFile
          ? 'border-[var(--primary)] bg-[var(--primary)]/5'
          : dragOver
          ? 'border-[var(--foreground)] bg-[var(--muted)]'
          : 'border-[var(--border)] bg-[var(--background)] hover:bg-[var(--accent)]'
      }`}
      onDragOver={(e) => { e.preventDefault(); onDragOver(); }}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onBrowse}
    >
      <input
        ref={fileRef}
        type="file"
        accept=".db,.sqlite,.sqlite3"
        onChange={onFileChange}
        className="hidden"
        aria-label="Upload SQLite database file"
      />
      {selectedFile ? (
        <div className="flex flex-col items-center gap-2">
          <CheckCircle size={24} className="text-[var(--primary)]" />
          <p className="font-semibold text-sm text-[var(--foreground)]">
            {selectedFile.name}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {(selectedFile.size / 1024).toFixed(1)} KB
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-md bg-[var(--muted)] flex items-center justify-center mb-2">
            <Upload size={18} className="text-[var(--muted-foreground)]" />
          </div>
          <p className="font-semibold text-sm text-[var(--foreground)]">
            Drop .sqlite file here
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            or click to browse local files
          </p>
        </div>
      )}
    </div>
  );
}

function RemoteDbForm({
  host, setHost, port, setPort,
  database, setDatabase, username, setUsername,
  password, setPassword, dbType,
}: {
  host: string; setHost: (v: string) => void;
  port: string; setPort: (v: string) => void;
  database: string; setDatabase: (v: string) => void;
  username: string; setUsername: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  dbType: DatabaseType;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-3 space-y-1.5">
          <label className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider">Host</label>
          <Input
            placeholder="localhost"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            required
            autoComplete="off"
            className="w-full"
          />
        </div>
        <div className="col-span-1 space-y-1.5">
          <label className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider">Port</label>
          <Input
            type="number"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            required
            className="w-full"
          />
        </div>
      </div>
      
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider">Database</label>
        <Input
          placeholder={dbType === 'postgresql' ? 'postgres' : 'my_app_db'}
          value={database}
          onChange={(e) => setDatabase(e.target.value)}
          required
          className="w-full"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider">Username</label>
          <Input
            placeholder={dbType === 'postgresql' ? 'postgres' : 'root'}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            className="w-full"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider">Password</label>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
