import { NextResponse } from 'next/server';
import { getPinecone, getAssistantName } from '@/app/lib/pinecone';

export async function GET() {
  try {
    const assistantName = getAssistantName();
    const pc = getPinecone();
    const assistants = await pc.listAssistants();
    const exists = assistants.assistants?.some(
      (a) => a.name === assistantName
    ) ?? false;

    return NextResponse.json({
      status: 'success',
      exists,
      assistant_name: assistantName,
    });
  } catch (error) {
    console.error('Error checking assistant:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
        exists: false,
      },
      { status: 500 }
    );
  }
}
