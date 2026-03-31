import { Pinecone } from '@pinecone-database/pinecone';

let pineconeClient: Pinecone | null = null;

export function getPinecone(): Pinecone {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }
  return pineconeClient;
}

export function getAssistantName(): string {
  const name = process.env.PINECONE_ASSISTANT_NAME;
  if (!name) {
    throw new Error('PINECONE_ASSISTANT_NAME environment variable is not set');
  }
  return name;
}
