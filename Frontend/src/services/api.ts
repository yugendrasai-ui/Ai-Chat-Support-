const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export interface Session {
  id: string;
  title?: string;
  createdAt?: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export interface ChatResponse {
  reply: string;
  tokensUsed: number;
}

export async function fetchSessions(): Promise<Session[]> {
  try {
    const res = await fetch(`${API_BASE}/sessions`);
    if (!res.ok) throw new Error("Failed to fetch sessions");
    return await res.json();
  } catch {
    // Return mock data for demo
    return [];
  }
}

export async function fetchMessages(sessionId: string): Promise<{ messages: Message[]; totalTokens: number }> {
  try {
    const res = await fetch(`${API_BASE}/conversations/${sessionId}`);
    if (!res.ok) throw new Error("Failed to fetch messages");
    return await res.json();
  } catch {
    return { messages: [], totalTokens: 0 };
  }
}

export async function sendMessage(
  sessionId: string,
  message: string
): Promise<ChatResponse> {
  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, message }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to send message");
    }

    return await res.json();
  } catch (error) {
    console.error("Chat API Error:", error);
    throw error;
  }
}
