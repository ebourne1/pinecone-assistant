'use client';

import { useState, useRef, useEffect } from 'react';
import type { CitationReference } from '../../types';
import PdfModal from './PdfModal';

function formatPages(pages: number[]): string {
  if (pages.length === 0) return '';
  const sorted = [...pages].sort((a, b) => a - b);
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
  return `Pages ${ranges.join(', ')}`;
}

interface CitationBadgeProps {
  index: number;
  references: CitationReference[];
}

export default function CitationBadge({ index, references }: CitationBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [modalRef, setModalRef] = useState<CitationReference | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLButtonElement>(null);
  const hideTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  // Close tooltip on outside click
  useEffect(() => {
    if (!showTooltip) return;
    const handleClick = (e: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node) &&
        badgeRef.current &&
        !badgeRef.current.contains(e.target as Node)
      ) {
        setShowTooltip(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showTooltip]);

  const handleMouseEnter = () => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    hideTimeout.current = setTimeout(() => setShowTooltip(false), 150);
  };

  const handleSourceClick = (ref: CitationReference) => {
    if (ref.signedUrl) {
      setShowTooltip(false);
      setModalRef(ref);
    }
  };

  // Single source: click badge opens PDF directly
  const handleBadgeClick = () => {
    if (references.length === 1 && references[0].signedUrl) {
      setModalRef(references[0]);
    } else {
      setShowTooltip(!showTooltip);
    }
  };

  return (
    <>
      <span
        className="relative inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          ref={badgeRef}
          onClick={handleBadgeClick}
          className="inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] text-[10px] font-bold rounded-full align-super ml-0.5 leading-none px-1 text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/40 hover:bg-indigo-200 dark:hover:bg-indigo-800/60 cursor-pointer"
          aria-label={`Citation ${index}`}
        >
          [{index}]
        </button>

        {/* Tooltip with clickable sources */}
        {showTooltip && (
          <div
            ref={tooltipRef}
            className="absolute z-40 bottom-6 left-1/2 -translate-x-1/2"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md px-2.5 py-2 shadow-lg whitespace-nowrap">
              {references.map((ref, i) => (
                <button
                  key={i}
                  onClick={() => handleSourceClick(ref)}
                  className={`block w-full text-left py-0.5 ${
                    ref.signedUrl
                      ? 'hover:text-indigo-300 cursor-pointer'
                      : 'cursor-default'
                  }`}
                >
                  <span className="font-medium">{ref.fileName}</span>
                  {ref.pages.length > 0 && (
                    <span className="text-gray-300 ml-1.5">{formatPages(ref.pages)}</span>
                  )}
                </button>
              ))}
            </div>
            {/* Arrow */}
            <div className="w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45 mx-auto -mt-1" />
          </div>
        )}
      </span>

      {/* PDF Modal */}
      {modalRef && (
        <PdfModal
          fileName={modalRef.fileName}
          signedUrl={modalRef.signedUrl!}
          page={modalRef.pages[0] || 1}
          onClose={() => setModalRef(null)}
        />
      )}
    </>
  );
}
