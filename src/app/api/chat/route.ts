import { getPinecone, getAssistantName } from '@/app/lib/pinecone';

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const pc = getPinecone();
  const assistant = pc.assistant(getAssistantName());

  const chunks = await assistant.chatStream({
    messages,
    model: 'claude-sonnet-4-5',
  });

  const citations: Array<{
    position: number;
    references: Array<{ fileName: string; fileId: string; pages: number[]; signedUrl?: string }>;
  }> = [];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of chunks) {
          if (chunk.type === 'content_chunk') {
            controller.enqueue(encoder.encode(chunk.delta.content));
          } else if (chunk.type === 'citation') {
            citations.push({
              position: chunk.citation.position,
              references: chunk.citation.references.map((ref) => ({
                fileName: ref.file.name,
                fileId: ref.file.id,
                pages: ref.pages,
                signedUrl: ref.file.signedUrl ?? undefined,
              })),
            });
          }
        }
        // Send citations as a final payload after all content
        if (citations.length > 0) {
          controller.enqueue(encoder.encode(`\n__CITATIONS__:${JSON.stringify(citations)}`));
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  });
}
