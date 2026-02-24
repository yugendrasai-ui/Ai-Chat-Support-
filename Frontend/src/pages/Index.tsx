import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import ChatSidebar from "@/components/ChatSidebar";
import ChatHeader from "@/components/ChatHeader";
import ChatArea from "@/components/ChatArea";
import { fetchSessions, fetchMessages, sendMessage, type Session, type Message } from "@/services/api";

const SESSION_KEY = "chat_session_id";

const getOrCreateSessionId = (): string => {
  const stored = localStorage.getItem(SESSION_KEY);
  if (stored) return stored;
  const newId = uuidv4();
  localStorage.setItem(SESSION_KEY, newId);
  return newId;
};

const Index = () => {
  const [sessionId, setSessionId] = useState(getOrCreateSessionId);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions().then((data) => {
      setSessions((prev) => {
        const ids = new Set(data.map((s) => s.id));
        // Ensure current session is always listed
        if (!ids.has(sessionId)) {
          return [{ id: sessionId, title: "New Chat" }, ...data];
        }
        return data;
      });
    });
  }, [sessionId]);

  // Fetch messages when session changes
  useEffect(() => {
    setMessages([]);
    setTokensUsed(0);
    fetchMessages(sessionId).then((data: any) => {
      if (!data) return;

      // Safety: Handle both { messages: [], totalTokens: 0 } and just []
      if (data.messages && Array.isArray(data.messages)) {
        setMessages(data.messages);
        setTokensUsed(data.totalTokens || 0);
      } else if (Array.isArray(data)) {
        setMessages(data);
        setTokensUsed(0);
      }
    });
  }, [sessionId]);

  const handleNewChat = useCallback(() => {
    const newId = uuidv4();
    localStorage.setItem(SESSION_KEY, newId);
    setSessionId(newId);
    setSessions((prev) => [{ id: newId, title: "New Chat" }, ...prev]);
  }, []);

  const handleSelectSession = useCallback((id: string) => {
    localStorage.setItem(SESSION_KEY, id);
    setSessionId(id);
  }, []);

  const handleSendMessage = useCallback(
    async (content: string) => {
      const userMsg: Message = { role: "user", content };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const response = await sendMessage(sessionId, content);
        const assistantMsg: Message = { role: "assistant", content: response.reply };
        setMessages((prev) => [...prev, assistantMsg]);
        setTokensUsed((prev) => prev + response.tokensUsed);
      } catch (error: any) {
        const errorMsg: Message = {
          role: "assistant",
          content: `${error.message}${error.details ? ` (${error.details})` : ""}` || "Sorry, something went wrong. Please try again.",
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId]
  );

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <ChatSidebar
        sessions={sessions}
        activeSessionId={sessionId}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader sessionId={sessionId} tokensUsed={tokensUsed} />
        <ChatArea
          messages={messages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
};

export default Index;
