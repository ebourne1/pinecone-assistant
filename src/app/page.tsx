'use client';

import { useState } from 'react';
import Home from './home';

export default function Page() {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const showAssistantFiles = false;
  const showCitations = true;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.toLowerCase().trim() === 'the board') {
      setAuthorized(true);
      setError('');
    } else {
      setError('Incorrect password.');
    }
  };

  if (authorized) {
    return <Home initialShowAssistantFiles={showAssistantFiles} showCitations={showCitations} />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50 text-center">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-indigo-900">
          Thank you for using the GLF workers comp AI bot.
        </h1>
        <p className="text-lg text-gray-700">
          This program was made available to attendees of the 2025 GLF seminar.
        </p>
        <p className="text-lg text-gray-700">
          A new and improved version 2 will be made available to attendees of the 2026 GLF seminar (April 30th).
        </p>
        <p className="text-lg text-gray-700">
          For inquiries about signing up for the seminar, and renewing access to this tool, please email{' '}
          <a
            href="mailto:jennifer.jarvis@jext.us"
            className="text-indigo-600 hover:underline"
          >
            elliot@bourne.law
          </a>
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-3">
          <label htmlFor="password" className="block text-sm font-medium text-gray-600">
            Enter password for legacy access
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
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Enter
            </button>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
      </div>
    </main>
  );
}
