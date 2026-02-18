const BASE = "/v1";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: number; name: string; message: string; details?: { field: string; message: string }[] };
}

interface PaginatedApiResponse<T> {
  success: boolean;
  data: T[];
  pagination: { offset: number; limit: number; total: number };
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const json = await res.json();
  if (!res.ok) throw json;
  return json;
}

export async function listConversations(offset = 0, limit = 20) {
  return request<PaginatedApiResponse<Conversation>>(
    `${BASE}/conversations?offset=${offset}&limit=${limit}`,
  );
}

export async function getConversation(id: string) {
  return request<ApiResponse<Conversation>>(`${BASE}/conversations/${id}`);
}

export async function getMessages(conversationId: string, offset = 0, limit = 20) {
  return request<PaginatedApiResponse<Message>>(
    `${BASE}/conversations/${conversationId}/messages?offset=${offset}&limit=${limit}`,
  );
}

export async function createConversation(title?: string) {
  return request<ApiResponse<Conversation>>(`${BASE}/conversations`, {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export async function sendMessage(conversationId: string, content: string) {
  return request<ApiResponse<{ userMessage: Message; assistantMessage: Message }>>(
    `${BASE}/conversations/${conversationId}/messages`,
    {
      method: "POST",
      body: JSON.stringify({ content }),
    },
  );
}

export async function renameConversation(id: string, title: string) {
  return request<ApiResponse<Conversation>>(`${BASE}/conversations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
}
