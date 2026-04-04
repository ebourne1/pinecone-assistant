'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import DarkModeToggle from './DarkModeToggle';
import ThreadSidebar from './ThreadSidebar';
import AssistantFiles from '../../components/AssistantFiles';
import type { AssistantFile, ChatMessage, ChatThread, Citation } from '../../types';

interface ChatWindowProps {
  showCitations: boolean;
  showFiles: boolean;
}

const THREADS_KEY = 'sbwc-threads';
const ACTIVE_KEY = 'sbwc-active-thread';
const OLD_MESSAGES_KEY = 'sbwc-chat-messages';

function createThread(messages: ChatMessage[] = []): ChatThread {
  const now = new Date().toISOString();
  const firstUserMsg = messages.find((m) => m.role === 'user');
  return {
    id: crypto.randomUUID(),
    title: firstUserMsg ? firstUserMsg.content.slice(0, 50) : '',
    createdAt: now,
    updatedAt: now,
    messages,
  };
}

export default function ChatWindow({ showCitations, showFiles }: ChatWindowProps) {
  const [assistantReady, setAssistantReady] = useState<boolean | null>(null);
  const [assistantName, setAssistantName] = useState('');
  const [files, setFiles] = useState<AssistantFile[]>([]);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Derive active thread and messages
  const activeThread = threads.find((t) => t.id === activeThreadId) ?? null;
  const messages = useMemo(() => activeThread?.messages ?? [], [activeThread]);

  // Load threads from localStorage on mount (+ migrate old format)
  useEffect(() => {
    // Try loading new format
    const storedThreads = localStorage.getItem(THREADS_KEY);
    const storedActive = localStorage.getItem(ACTIVE_KEY);

    if (storedThreads) {
      try {
        const parsed = JSON.parse(storedThreads);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setThreads(parsed);
          setActiveThreadId(storedActive || parsed[0].id);
          return;
        }
      } catch {
        // Fall through to migration
      }
    }

    // Migrate old single-conversation format
    const oldMessages = localStorage.getItem(OLD_MESSAGES_KEY);
    if (oldMessages) {
      try {
        const parsed = JSON.parse(oldMessages);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const migrated = createThread(parsed);
          setThreads([migrated]);
          setActiveThreadId(migrated.id);
          localStorage.removeItem(OLD_MESSAGES_KEY);
        }
      } catch {
        // Ignore
      }
    }
  }, []);

  // Persist threads to localStorage
  useEffect(() => {
    if (threads.length > 0) {
      localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
    } else {
      localStorage.removeItem(THREADS_KEY);
    }
  }, [threads]);

  // Persist active thread ID
  useEffect(() => {
    if (activeThreadId) {
      localStorage.setItem(ACTIVE_KEY, activeThreadId);
    } else {
      localStorage.removeItem(ACTIVE_KEY);
    }
  }, [activeThreadId]);

  // Check assistant status on mount
  useEffect(() => {
    fetch('/api/assistants')
      .then((res) => res.json())
      .then((data) => {
        setAssistantReady(data.exists);
        setAssistantName(data.assistant_name || '');
      })
      .catch(() => setAssistantReady(false));
  }, []);

  // Fetch files if enabled
  useEffect(() => {
    if (!showFiles) return;
    fetch('/api/files')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success') setFiles(data.files);
      })
      .catch(() => {});
  }, [showFiles]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update messages within the active thread
  const updateActiveMessages = useCallback(
    (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThreadId
            ? { ...t, messages: updater(t.messages), updatedAt: new Date().toISOString() }
            : t
        )
      );
    },
    [activeThreadId]
  );

  // Set thread title from first user message
  const setThreadTitle = useCallback(
    (title: string) => {
      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThreadId && !t.title
            ? { ...t, title: title.slice(0, 50) }
            : t
        )
      );
    },
    [activeThreadId]
  );

  const handleNewThread = useCallback(() => {
    const thread = createThread();
    setThreads((prev) => [thread, ...prev]);
    setActiveThreadId(thread.id);
    setError(null);
  }, []);

  const handleSwitchThread = useCallback((id: string) => {
    setActiveThreadId(id);
    setError(null);
  }, []);

  const handleDeleteThread = useCallback(
    (id: string) => {
      setThreads((prev) => {
        const filtered = prev.filter((t) => t.id !== id);
        if (id === activeThreadId) {
          setActiveThreadId(filtered.length > 0 ? filtered[0].id : null);
        }
        return filtered;
      });
    },
    [activeThreadId]
  );

  const handleClearAll = useCallback(() => {
    setThreads([]);
    setActiveThreadId(null);
    localStorage.removeItem(THREADS_KEY);
    localStorage.removeItem(ACTIVE_KEY);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;

      // If no active thread, create one
      let currentThreadId = activeThreadId;
      if (!currentThreadId) {
        const thread = createThread();
        setThreads((prev) => [thread, ...prev]);
        setActiveThreadId(thread.id);
        currentThreadId = thread.id;
      }

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: input.trim(),
      };

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
      };

      // Set title from first user message
      const currentThread = threads.find((t) => t.id === currentThreadId);
      if (!currentThread || currentThread.messages.length === 0) {
        setThreads((prev) =>
          prev.map((t) =>
            t.id === currentThreadId
              ? {
                  ...t,
                  title: userMessage.content.slice(0, 50),
                  messages: [...t.messages, userMessage, assistantMessage],
                  updatedAt: new Date().toISOString(),
                }
              : t
          )
        );
      } else {
        setThreads((prev) =>
          prev.map((t) =>
            t.id === currentThreadId
              ? {
                  ...t,
                  messages: [...t.messages, userMessage, assistantMessage],
                  updatedAt: new Date().toISOString(),
                }
              : t
          )
        );
      }

      const currentMessages = currentThread?.messages ?? [];
      setInput('');
      setIsLoading(true);
      setError(null);

      try {
        const history = [...currentMessages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history }),
        });

        if (!res.ok) {
          throw new Error(`Chat request failed: ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          fullContent += text;

          const displayContent = fullContent.split('\n__CITATIONS__:')[0];
          setThreads((prev) =>
            prev.map((t) => {
              if (t.id !== currentThreadId) return t;
              const msgs = [...t.messages];
              msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: displayContent };
              return { ...t, messages: msgs };
            })
          );
        }

        const citationMarker = '\n__CITATIONS__:';
        const citationIndex = fullContent.indexOf(citationMarker);
        let citations: Citation[] | undefined;

        if (citationIndex !== -1) {
          try {
            citations = JSON.parse(fullContent.slice(citationIndex + citationMarker.length));
          } catch {
            // Ignore
          }
        }

        const cleanContent = fullContent.split(citationMarker)[0];

        setThreads((prev) =>
          prev.map((t) => {
            if (t.id !== currentThreadId) return t;
            const msgs = [...t.messages];
            msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: cleanContent, citations };
            return { ...t, messages: msgs, updatedAt: new Date().toISOString() };
          })
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        // Remove the empty assistant message on error
        setThreads((prev) =>
          prev.map((t) =>
            t.id === currentThreadId
              ? { ...t, messages: t.messages.slice(0, -1) }
              : t
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, activeThreadId, threads]
  );

  if (assistantReady === null) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <DarkModeToggle />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-900" />
        <p className="mt-4 text-gray-500 dark:text-gray-400">Connecting to assistant...</p>
      </main>
    );
  }

  if (!assistantReady) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
        <DarkModeToggle />
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md max-w-2xl">
          <p className="font-semibold">Unable to connect to the assistant.</p>
          <p className="mt-2">Please verify the assistant configuration and try again.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-gray-50 dark:bg-gray-900">
      <DarkModeToggle />
      <ThreadSidebar
        threads={threads}
        activeThreadId={activeThreadId}
        onNewThread={handleNewThread}
        onSwitchThread={handleSwitchThread}
        onDeleteThread={handleDeleteThread}
        onClearAll={handleClearAll}
      />
      <div className="w-full max-w-6xl xl:max-w-7xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100 pl-12">
            Georgia Workers' Comp Chat Bot <span className="text-green-500">&#9679;</span>
          </h1>
          <button
            onClick={handleNewThread}
            className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg mb-4 h-[calc(100vh-300px)] overflow-y-auto">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
              <p>Ask a question about workers compensation...</p>
            </div>
          )}
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              citations={message.citations}
              showCitations={showCitations}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <ChatInput
          input={input}
          isLoading={isLoading}
          onInputChange={setInput}
          onSubmit={handleSubmit}
        />

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-md shadow-md">
            <p className="font-semibold">Error</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {showFiles && files.length > 0 && <AssistantFiles files={files} />}
      </div>

      <footer className="mt-8 text-xs text-gray-400 dark:text-gray-500 text-center max-w-2xl">
        <p>
          This AI assistant provides general information only and does not constitute legal advice.
          Always verify responses with qualified legal professionals.
        </p>
      </footer>
    </main>
  );
}
