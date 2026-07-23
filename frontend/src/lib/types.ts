// Shared TypeScript types for the AI SQL Agent frontend


export type DatabaseType = 'sqlite' | 'postgresql' | 'mysql';

export interface ConnectionConfig {
  db_type: DatabaseType;
  // PostgreSQL / MySQL
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
}

export interface ConnectionInfo {
  session_id: string;
  db_type: string;
  database_name: string;
  message: string;
}


export interface ColumnInfo {
  name: string;
  data_type: string;
  nullable: boolean;
  primary_key: boolean;
  foreign_key: string | null;
}

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  row_count: number | null;
}

export interface SchemaInfo {
  database_name: string;
  db_type: string;
  tables: TableInfo[];
  table_count: number;
}


export interface GeneratedSQL {
  sql: string;
  question: string;
  model_used: string;
}

export interface QueryResult {
  columns: string[];
  rows: (string | number | boolean | null)[][];
  row_count: number;
  execution_time_ms: number;
  sql: string;
}

export interface FullQueryResponse {
  question: string;
  sql: string;
  model_used: string;
  columns: string[];
  rows: (string | number | boolean | null)[][];
  row_count: number;
  execution_time_ms: number;
}


export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  detail: string | null;
}


export type MessageRole = 'user' | 'assistant' | 'error';

export interface AIAnalysisResponse {
  executive_summary?: string;
  key_insights?: string[];
  patterns?: string[];
  limitations?: string;
  suggested_questions?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: Date;
  queryResponse?: FullQueryResponse;
  isLoading?: boolean;
  
  // Streaming state for intelligence
  isAnalyzing?: boolean;
  rawAnalysisText?: string; // The raw JSON string stream
  analysis?: AIAnalysisResponse; // The parsed JSON object
  confidenceScore?: 'High' | 'Medium' | 'Low';
  
  chartConfig?: ChartConfig | null;
  suggestions?: string[];
  
  isExplainingSql?: boolean;
  sqlExplanation?: string;
}


export interface AppSession {
  sessionId: string;
  dbType: string;
  databaseName: string;
  connectedAt: Date;
}

// Intelligence Layer Types
export interface ChartConfig {
  chart_type: 'bar' | 'line' | 'pie' | 'area' | 'table';
  x_axis?: string;
  y_axis?: string;
}

export interface SuggestionsResponse {
  suggestions: string[];
}

export interface SavedConnection {
  id: string;
  name: string;
  db_type: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  created_at: string;
}

export interface QueryHistoryItem {
  id: string;
  session_id: string;
  question: string;
  sql: string;
  database_name: string;
  db_type: string;
  execution_time_ms: number;
  created_at: string;
}
