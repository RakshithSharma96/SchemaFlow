// Axios API client configured to communicate with the FastAPI backend.
// All endpoints are typed against the backend's ApiResponse<T> envelope.

import axios, { AxiosError } from 'axios';
import type {
  ApiResponse,
  ConnectionInfo,
  FullQueryResponse,
  GeneratedSQL,
  QueryResult,
  SchemaInfo,
} from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 90_000, // 90s — generous for LLM + query combined
  headers: { 'Content-Type': 'application/json' },
});

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  // Let the browser automatically send the HttpOnly refresh token cookie on requests
  config.withCredentials = true; 
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config;
    
    // Check if it's a 401 Unauthorized, not a retry, and NOT the refresh endpoint itself
    if (
      error.response?.status === 401 && 
      originalRequest && 
      !(originalRequest as any)._retry &&
      originalRequest.url !== '/api/v1/auth/refresh'
    ) {
      (originalRequest as any)._retry = true;
      try {
        // Attempt to refresh the token using the HttpOnly cookie
        // Use a separate axios instance or just raw axios to avoid interceptor loops,
        // but since we added the URL check above, using apiClient is now safe.
        const { data } = await apiClient.post('/api/v1/auth/refresh', {}, { withCredentials: true });
        
        // Update the access token in memory
        setAccessToken(data.access_token);
        
        // Retry the original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear token and reject
        setAccessToken(null);
        if (typeof window !== 'undefined') {
          // Fire a custom event to notify the AuthContext to log out
          window.dispatchEvent(new Event('auth_logout'));
        }
        return Promise.reject(refreshError);
      }
    }
    
    const serverMessage = error.response?.data?.detail ?? error.response?.data?.error ?? error.message;
    return Promise.reject(new Error(serverMessage));
  }
);


/** Upload a SQLite .db file and establish a session. */
export async function connectSQLite(
  file: File
): Promise<ApiResponse<ConnectionInfo>> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await apiClient.post<ApiResponse<ConnectionInfo>>(
    '/api/v1/connections/connect/sqlite',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return data;
}

/** Connect to a PostgreSQL database. */
export async function connectPostgreSQL(params: {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}): Promise<ApiResponse<ConnectionInfo>> {
  const { data } = await apiClient.post<ApiResponse<ConnectionInfo>>(
    '/api/v1/connections/connect/postgresql',
    params
  );
  return data;
}

/** Connect to a MySQL database. */
export async function connectMySQL(params: {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}): Promise<ApiResponse<ConnectionInfo>> {
  const { data } = await apiClient.post<ApiResponse<ConnectionInfo>>(
    '/api/v1/connections/connect/mysql',
    params
  );
  return data;
}

/** Disconnect a session and release server resources. */
export async function disconnect(
  sessionId: string
): Promise<ApiResponse<{ message: string }>> {
  const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(
    `/api/v1/connections/disconnect/${sessionId}`
  );
  return data;
}


/** Retrieve the schema for the connected database. */
export async function getSchema(
  sessionId: string
): Promise<ApiResponse<SchemaInfo>> {
  const { data } = await apiClient.get<ApiResponse<SchemaInfo>>(
    `/api/v1/connections/${sessionId}/schema`
  );
  return data;
}


/** Generate SQL from a natural-language question without executing it. */
export async function generateSQL(
  sessionId: string,
  question: string
): Promise<ApiResponse<GeneratedSQL>> {
  const { data } = await apiClient.post<ApiResponse<GeneratedSQL>>(
    '/api/v1/query/generate',
    { session_id: sessionId, question }
  );
  return data;
}

/** Execute a raw SQL string (will be validated server-side). */
export async function executeSQL(
  sessionId: string,
  sql: string
): Promise<ApiResponse<QueryResult>> {
  const { data } = await apiClient.post<ApiResponse<QueryResult>>(
    '/api/v1/query/execute',
    { session_id: sessionId, sql }
  );
  return data;
}

/** Full pipeline: NL question → generate SQL → execute → return results. */
export async function generateAndExecute(
  sessionId: string,
  question: string
): Promise<ApiResponse<FullQueryResponse>> {
  const { data } = await apiClient.post<ApiResponse<FullQueryResponse>>(
    '/api/v1/query/generate-execute',
    { session_id: sessionId, question }
  );
  return data;
}

/** Health check. */
export async function healthCheck(): Promise<boolean> {
  try {
    await apiClient.get('/api/v1/health');
    return true;
  } catch {
    return false;
  }
}

// -- Intelligence Endpoints ----------------------------------------------------

import type { ChartConfig, SuggestionsResponse, SavedConnection, QueryHistoryItem } from './types';

export async function suggestQuestions(
  question: string,
  sql: string,
  columns: string[],
  rows: any[][]
): Promise<ApiResponse<SuggestionsResponse>> {
  const { data } = await apiClient.post<ApiResponse<SuggestionsResponse>>(
    '/api/v1/intelligence/suggest',
    { question, sql, columns, rows }
  );
  return data;
}

export async function recommendChart(
  question: string,
  sql: string,
  columns: string[],
  rows: any[][]
): Promise<ApiResponse<ChartConfig>> {
  const { data } = await apiClient.post<ApiResponse<ChartConfig>>(
    '/api/v1/intelligence/chart',
    { question, sql, columns, rows }
  );
  return data;
}

// NOTE: Stream endpoints (/analyze, /explain-sql) are usually handled 
// natively with fetch or EventSource in components, not via Axios.

// -- Metadata Endpoints --------------------------------------------------------

export async function listSavedConnections(): Promise<ApiResponse<SavedConnection[]>> {
  const { data } = await apiClient.get<ApiResponse<SavedConnection[]>>('/api/v1/metadata/connections');
  return data;
}

export async function saveConnection(params: any): Promise<ApiResponse<SavedConnection>> {
  const { data } = await apiClient.post<ApiResponse<SavedConnection>>('/api/v1/metadata/connections', params);
  return data;
}

export async function deleteConnection(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
  const { data } = await apiClient.delete<ApiResponse<{ deleted: boolean }>>(`/api/v1/metadata/connections/` + id);
  return data;
}

export async function listQueryHistory(): Promise<ApiResponse<QueryHistoryItem[]>> {
  const { data } = await apiClient.get<ApiResponse<QueryHistoryItem[]>>('/api/v1/metadata/history');
  return data;
}

export async function deleteQueryHistory(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
  const { data } = await apiClient.delete<ApiResponse<{ deleted: boolean }>>(`/api/v1/metadata/history/` + id);
  return data;
}

export async function deleteAllQueryHistory(): Promise<ApiResponse<{ deleted: boolean }>> {
  const { data } = await apiClient.delete<ApiResponse<{ deleted: boolean }>>(`/api/v1/metadata/history`);
  return data;
}

// -- Auth Endpoints ------------------------------------------------------------

export async function login(params: any) {
  const { data } = await apiClient.post('/api/v1/auth/login', params);
  return data;
}

export async function register(params: any) {
  const { data } = await apiClient.post('/api/v1/auth/register', params);
  return data;
}

export async function logout() {
  const { data } = await apiClient.post('/api/v1/auth/logout');
  return data;
}

export async function getMe() {
  const { data } = await apiClient.get('/api/v1/auth/me');
  return data;
}
