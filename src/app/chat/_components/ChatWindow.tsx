'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import DarkModeToggle from './DarkModeToggle';
import AssistantFiles from '../../components/AssistantFiles';
import type { AssistantFile, ChatMessage, Citation } from '../../types';

interface ChatWindowProps {
  showCitations: boolean;
  showFiles: boolean;
}

const STORAGE_KEY = 'sbwc-chat-messages';

export default function ChatWindow({ showCitations, showFiles }: ChatWindowProps) {
  const [assistantReady, setAssistantReady] = useState<boolean | null>(null);
  const [assistantName, setAssistantName] = useState('');
  const [files, setFiles] = useState<AssistantFile[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Restore messages from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      } catch {
        // Ignore invalid stored data
      }
    }
  }, []);

  // Persist messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

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

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;

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

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setInput('');
      setIsLoading(true);
      setError(null);

      try {
        // Send full conversation history for multi-turn context
        const history = [...messages, userMessage].map((m) => ({
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

          // Update the assistant message content (excluding citation payload)
          const displayContent = fullContent.split('\n__CITATIONS__:')[0];
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: displayContent,
            };
            return updated;
          });
        }

        // Parse citations from the final payload
        const citationMarker = '\n__CITATIONS__:';
        const citationIndex = fullContent.indexOf(citationMarker);
        let citations: Citation[] | undefined;

        if (citationIndex !== -1) {
          try {
            const citationJson = fullContent.slice(citationIndex + citationMarker.length);
            citations = JSON.parse(citationJson);
          } catch {
            // Ignore citation parse errors
          }
        }

        const cleanContent = fullContent.split(citationMarker)[0];

        // Final update with citations
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: cleanContent,
            citations,
          };
          return updated;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        // Remove the empty assistant message on error
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages]
  );

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

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
      <div className="w-full max-w-6xl xl:max-w-7xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
            SBWC Assistant: {assistantName} <span className="text-green-500">&#9679;</span>
          </h1>
          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              New Conversation
            </button>
          )}
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
