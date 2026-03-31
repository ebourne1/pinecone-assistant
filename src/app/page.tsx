'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/chat');
      } else {
        setError('Incorrect password.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50 text-center">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-indigo-900">
          SBWC Workers Comp AI Assistant
        </h1>
        <p className="text-lg text-gray-700">
          This tool was made available to attendees of the GLF seminar.
        </p>
        <p className="text-lg text-gray-700">
          Version 2 is now available for attendees of the 2026 GLF seminar (April 30th).
        </p>
        <p className="text-lg text-gray-700">
          For inquiries about signing up for the seminar and accessing this tool, please email{' '}
          <a
            href="mailto:elliot@bourne.law"
            className="text-indigo-600 hover:underline"
          >
            elliot@bourne.law
          </a>
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-3">
          <label htmlFor="password" className="block text-sm font-medium text-gray-600">
            Enter access password
          </label>
          <div className="flex justify-center gap-2">
            <input
              id="password"
              type="password"
              autoComplete="off"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
              placeholder="Password"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Enter'}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
      </div>
    </main>
  );
}
