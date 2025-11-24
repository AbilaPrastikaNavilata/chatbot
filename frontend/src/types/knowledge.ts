export interface Knowledge {
  _id: string;
  title: string;
  content: string;
  source?: string;
  metadata?: {
    [key: string]: string | number | boolean | null | object;
  };
}

export interface CreateKnowledgeRequest {
  title: string;
  content: string;
  source?: string;
  metadata?: {
    [key: string]: string | number | boolean | null | object;
  };
}

export interface UpdateKnowledgeRequest {
  title?: string;
  content?: string;
  source?: string;
  metadata?: {
    [key: string]: string | number | boolean | null | object;
  };
}

export interface AddKnowledgeResponse {
  id: string;
  message: string;
}

export interface KnowledgeStats {
  wordCount: number;
  charCount: number;
  size: string;
}

export interface ChatHistoryItem {
  user: string;
  assistant: string;
}

export interface ChatRequest {
  message: string;
  history: ChatHistoryItem[];
}

export interface ChatSource {
  _id?: string; // Add ID field
  title: string;
  content: string;
  source: string;
  similarity_score?: number;
}

export interface ChatResponse {
  response: string;
  sources: ChatSource[];
}

// File Upload Interfaces
export interface FileUploadResponse {
  message: string;
  ids: string[];
  items_created: number;
}

export interface FileUploadError {
  detail: string;
}

export interface CustomMappingRequest {
  file: File;
  title_column: string;
  content_column: string;
}

export interface PaginatedKnowledgeResponse {
  items: Knowledge[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface KnowledgeListParams {
  page?: number;
  limit?: number;
  sort_order?: 'newest' | 'oldest';
}