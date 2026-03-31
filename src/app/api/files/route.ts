import { NextResponse } from 'next/server';
import { getPinecone, getAssistantName } from '@/app/lib/pinecone';

export const maxDuration = 55;

export async function GET() {
  try {
    const assistantName = getAssistantName();
    const pc = getPinecone();
    const assistant = pc.assistant(assistantName);
    const filesResponse = await assistant.listFiles();

    const files = (filesResponse.files ?? []).map((file) => ({
      id: file.id,
      name: file.name,
      created_at: file.createdOn?.toISOString() ?? '',
      status: file.status,
    }));

    return NextResponse.json({
      status: 'success',
      files,
    });
  } catch (error) {
    console.error('Error listing files:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
        files: [],
      },
      { status: 500 }
    );
  }
}
