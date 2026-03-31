'use client';

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const MAX_LENGTH = 4000;

export default function ChatInput({ input, isLoading, onInputChange, onSubmit }: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        onSubmit(e);
      }
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex gap-2 mb-4">
      <textarea
        value={input}
        onChange={(e) => onInputChange(e.target.value.slice(0, MAX_LENGTH))}
        onKeyDown={handleKeyDown}
        className="flex-grow p-2 text-black dark:text-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        placeholder="Type your message... (Shift+Enter for new line)"
        disabled={isLoading}
        rows={2}
      />
      <button
        type="submit"
        className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 self-end"
        disabled={isLoading || !input.trim()}
      >
        {isLoading ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
}
