'use client';

import { useState } from 'react';
import type { AssistantFile } from '../types';

interface AssistantFilesProps {
  files: AssistantFile[];
}

export default function AssistantFiles({ files }: AssistantFilesProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="w-full mt-4 bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
      <button
        className="w-full flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-semibold text-gray-800 dark:text-gray-200">
          Assistant Files ({files.length})
        </span>
        <span className="text-xl text-gray-600 dark:text-gray-300">
          {isOpen ? '\u25B2' : '\u25BC'}
        </span>
      </button>
      {isOpen && (
        <div className="p-4">
          <div className="flex flex-wrap -mx-2">
            {files.map((file) => (
              <div key={file.id} className="w-full sm:w-1/2 md:w-1/3 px-2 mb-4">
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold truncate text-gray-800 dark:text-gray-200">
                    {file.name}
                  </h3>
                  {file.created_at && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Created: {new Date(file.created_at).toLocaleDateString()}
                    </p>
                  )}
                  {file.status && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Status: {file.status}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
