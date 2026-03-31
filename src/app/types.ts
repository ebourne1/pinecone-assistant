export interface AssistantFile {
  id: string;
  name: string;
  created_at: string;
  status?: string;
}

export interface CitationReference {
  fileName: string;
  fileId: string;
  pages: number[];
  signedUrl?: string;
}

export interface Citation {
  position: number;
  references: CitationReference[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
}
