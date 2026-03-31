'use client';

import { useState } from 'react';
import type { Citation } from '../../types';
import PdfModal from './PdfModal';

function formatPages(pages: number[]): string {
  if (pages.length === 0) return '';
  const sorted = [...new Set(pages)].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let end = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      start = sorted[i];
      end = sorted[i];
    }
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`);
  return `pp. ${ranges.join(', ')}`;
}

interface SourcesPanelProps {
  citations: Citation[];
}

interface MergedSource {
  fileName: string;
  fileId: string;
  pages: number[];
  signedUrl?: string;
}

export default function SourcesPanel({ citations }: SourcesPanelProps) {
  const [open, setOpen] = useState(false);
  const [modalSource, setModalSource] = useState<MergedSource | null>(null);

  // Merge citations by file, combining page numbers
  const sourceMap = new Map<string, MergedSource>();
  for (const citation of citations) {
    for (const ref of citation.references) {
      const existing = sourceMap.get(ref.fileId);
      if (existing) {
        existing.pages = [...new Set([...existing.pages, ...ref.pages])];
        if (!existing.signedUrl && ref.signedUrl) {
          existing.signedUrl = ref.signedUrl;
        }
      } else {
        sourceMap.set(ref.fileId, {
          fileName: ref.fileName,
          fileId: ref.fileId,
          pages: [...ref.pages],
          signedUrl: ref.signedUrl,
        });
      }
    }
  }

  const sources = Array.from(sourceMap.values());
  if (sources.length === 0) return null;

  return (
    <>
      <div className="mt-2 border-t border-gray-200 dark:border-gray-600 pt-2">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 18h12a2 2 0 002-2V6l-4-4H4a2 2 0 00-2 2v12a2 2 0 002 2zm8-14l4 4h-4V4z" />
          </svg>
          <span className="font-medium">
            {sources.length} source{sources.length !== 1 ? 's' : ''}
          </span>
          <svg
            className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && (
          <div className="mt-2 space-y-1">
            {sources.map((source) => (
              <button
                key={source.fileId}
                onClick={() => source.signedUrl && setModalSource(source)}
                className={`flex items-start gap-2 text-xs pl-1 w-full text-left ${
                  source.signedUrl
                    ? 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 cursor-pointer'
                    : 'text-gray-600 dark:text-gray-400 cursor-default'
                }`}
              >
                <svg className="w-3.5 h-3.5 mt-0.5 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 18h12a2 2 0 002-2V6l-4-4H4a2 2 0 00-2 2v12a2 2 0 002 2zm8-14l4 4h-4V4z" />
                </svg>
                <span>
                  <span className="font-medium underline-offset-2 hover:underline">
                    {source.fileName}
                  </span>
                  {source.pages.length > 0 && (
                    <span className="text-gray-500 dark:text-gray-400 ml-1 no-underline">
                      ({formatPages(source.pages)})
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {modalSource && (
        <PdfModal
          fileName={modalSource.fileName}
          signedUrl={modalSource.signedUrl!}
          page={modalSource.pages[0] || 1}
          onClose={() => setModalSource(null)}
        />
      )}
    </>
  );
}
