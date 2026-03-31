import ChatWindow from './_components/ChatWindow';

export default function ChatPage() {
  const showCitations = process.env.SHOW_CITATIONS !== 'false';
  const showFiles = process.env.SHOW_ASSISTANT_FILES === 'true';

  return <ChatWindow showCitations={showCitations} showFiles={showFiles} />;
}
