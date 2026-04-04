'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import CitationBadge from './CitationBadge';
import SourcesPanel from './SourcesPanel';
import type { Citation } from '../../types';

interface MessageBubbleProps {
  message: {
    id: string;
    role: string;
    content: string;
  };
  citations?: Citation[];
  showCitations: boolean;
}

/**
 * Insert citation badges into text at the positions indicated by the citations array.
 * Returns an array of React nodes (strings and CitationBadge elements).
 */
function insertCitationBadges(text: string, citations: Citation[]): React.ReactNode[] {
  if (citations.length === 0) return [text];

  // Sort citations by position descending so we can insert from back to front
  const sorted = [...citations]
    .map((c, idx) => ({ ...c, originalIndex: idx + 1 }))
    .sort((a, b) => a.position - b.position);

  const nodes: React.ReactNode[] = [];
  let lastPos = 0;

  for (const citation of sorted) {
    const pos = Math.min(citation.position, text.length);
    if (pos > lastPos) {
      nodes.push(text.slice(lastPos, pos));
    }
    nodes.push(
      <CitationBadge
        key={`cite-${citation.originalIndex}`}
        index={citation.originalIndex}
        references={citation.references}
      />
    );
    lastPos = pos;
  }

  if (lastPos < text.length) {
    nodes.push(text.slice(lastPos));
  }

  return nodes;
}

export default function MessageBubble({ message, citations, showCitations }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const hasCitations = showCitations && citations && citations.length > 0;

  return (
    <div className={`mb-3 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={isUser ? 'ml-2' : 'mr-2'}>
          {isUser ? (
            <span className="text-2xl" aria-label="User">&#128100;</span>
          ) : (
            <span className="text-2xl" aria-label="Assistant">&#9878;</span>
          )}
        </div>
        <div className={`inline-block rounded-lg ${
          isUser
            ? 'bg-indigo-500 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
        } max-w-[80%] break-words`}>
          <div className="p-3">
            {hasCitations ? (
              // Render with inline citation badges
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {insertCitationBadges(message.content, citations).map((node, i) =>
                  typeof node === 'string' ? (
                    <ReactMarkdown
                      key={i}
                      components={{
                        // Render inline to avoid extra <p> wrapping between badges
                        p: ({ children }) => <span>{children} </span>,
                        a: ({ children, ...props }) => (
                          <a {...props} className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {node}
                    </ReactMarkdown>
                  ) : (
                    node
                  )
                )}
              </div>
            ) : (
              <ReactMarkdown
                components={{
                  a: ({ children, ...props }) => (
                    <a {...props} className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
          {hasCitations && (
            <div className="px-3 pb-3">
              <SourcesPanel citations={citations} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
