'use client';

import { useState } from 'react';

export default function MigrateThemePage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [sql, setSql] = useState('');

  const runMigration = async () => {
    setStatus('loading');
    setMessage('Running migration...');

    try {
      const response = await fetch('/api/admin/migrate-theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage(data.message);
      } else {
        setStatus('error');
        setMessage(data.message || 'Migration failed');
        if (data.sql) {
          setSql(data.sql);
        }
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Failed to run migration');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-black mb-8">Theme Column Migration</h1>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <p className="text-white/60 mb-6">
            This will add the <code className="bg-white/10 px-2 py-1 rounded">theme</code> column to the <code className="bg-white/10 px-2 py-1 rounded">tv_menus</code> table.
          </p>

          <button
            onClick={runMigration}
            disabled={status === 'loading'}
            className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? 'Running...' : 'Run Migration'}
          </button>

          {message && (
            <div className={`mt-6 p-4 rounded-xl border ${
              status === 'success'
                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : status === 'error'
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
            }`}>
              <p className="font-medium">{message}</p>
            </div>
          )}

          {sql && (
            <div className="mt-6">
              <p className="text-white/60 mb-2 text-sm">Run this SQL in your Supabase dashboard:</p>
              <div className="bg-black border border-white/10 rounded-xl p-4 font-mono text-sm">
                <pre className="whitespace-pre-wrap text-green-400">{sql}</pre>
              </div>
              <div className="mt-4">
                <a
                  href="https://supabase.com/dashboard/project/uaednwpxursknmwdeejn/sql/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors"
                >
                  Open SQL Editor
                </a>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="mt-6">
              <a
                href="/vendor/tv-menus"
                className="inline-block px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-colors"
              >
                Go to TV Menus Dashboard
              </a>
            </div>
          )}
        </div>

        <div className="mt-8 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-yellow-400 mb-3">Manual Migration</h2>
          <p className="text-white/60 mb-4">
            If the automatic migration doesn't work, copy this SQL and run it manually in your Supabase SQL Editor:
          </p>
          <div className="bg-black border border-white/10 rounded-xl p-4 font-mono text-sm mb-4">
            <pre className="whitespace-pre-wrap text-green-400">
ALTER TABLE tv_menus ADD COLUMN IF NOT EXISTS theme VARCHAR(50) DEFAULT 'midnight-elegance';
            </pre>
          </div>
          <a
            href="https://supabase.com/dashboard/project/uaednwpxursknmwdeejn/sql/new"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-yellow-600 text-white font-bold rounded-xl hover:bg-yellow-700 transition-colors"
          >
            Open SQL Editor
          </a>
        </div>
      </div>
    </div>
  );
}
